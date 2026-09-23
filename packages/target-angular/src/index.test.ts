import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { compileAngularComponent, compileAngularTarget } from './index.js'

describe('compileAngularTarget', () => {
  it('translates the accepted Angular constructs to native equivalents', () => {
    const output = compileAngularTarget(`
      <main *ngIf="ready">
        <ul><li *ngFor="let item of items"><span>{{ item }}</span></li></ul>
        <button (click)="go()"><span>Go</span></button>
        <input [(ngModel)]="name" />
        <img [src]="photo" />
      </main>
    `)

    expect(output.report.findings).toEqual([])
    expect(output.code).toContain('v-if="ready"')
    expect(output.code).toContain('v-for="item in items"')
    expect(output.code).toContain('@press="go()"')
    expect(output.code).toContain('v-model="name"')
    expect(output.code).toContain(':src="photo"')
    expect(output.code).toContain('<view')
    expect(output.code).toContain('<text-input')
  })

  it('routes an input value read to the native value event', () => {
    const output = compileAngularTarget('<input [value]="field" (click)="onField($event)" />')

    expect(output.report.findings).toEqual([])
    expect(output.code).toContain('@value-change="onField($event)"')
    expect(output.code).not.toContain('@press="onField($event)"')
  })

  it('refuses a structural directive it does not implement', () => {
    const output = compileAngularTarget('<div *ngSwitch="x"><span>Hi</span></div>')

    expect(output.code).toBeUndefined()
    expect(output.report.findings.map((finding) => finding.code)).toEqual(['unsupported-directive'])
  })

  it('refuses an Angular binding with no native equivalent', () => {
    const output = compileAngularTarget('<div [ngClass]="c"><span>Hi</span></div>')

    expect(output.code).toBeUndefined()
    expect(output.report.findings.map((finding) => finding.code)).toEqual(['unsupported-directive'])
  })

  it('refuses a custom element', () => {
    const output = compileAngularTarget('<app-widget></app-widget>')

    expect(output.code).toBeUndefined()
    expect(output.report.findings.map((finding) => finding.code)).toEqual(['unsupported-element'])
  })

  it('refuses text directly inside a non-text primitive', () => {
    const output = compileAngularTarget('<button>Save</button>')

    expect(output.code).toBeUndefined()
    expect(output.report.findings.map((finding) => finding.code)).toEqual(['unsupported-text'])
  })

  it('emits a deterministic provenance manifest for a supported template', () => {
    const source = '<main><span>Hi</span></main>'
    const first = compileAngularTarget(source, 'App.html', 'generated/App.native.vue')
    const second = compileAngularTarget(source, 'App.html', 'generated/App.native.vue')

    expect(first.code).toBeDefined()
    expect(first.manifest.input.path).toBe('App.html')
    expect(first.manifest.outputPath).toBe('generated/App.native.vue')
    expect(typeof first.manifest.compilerVersion).toBe('string')
    expect(second.manifest).toEqual(first.manifest)
  })

  it('records template and component provenance for a whole component', () => {
    const script = [
      '@Component({ template: `<main><span>Hi</span></main>` })',
      'export class A {',
      '  count = 1',
      '}',
    ].join('\n')
    const template = '<main><span>Hi</span></main>'
    const output = compileAngularComponent({
      template,
      script,
      filename: 'a.component.ts',
      outputPath: 'generated/a.component.native.vue',
    })

    expect(output.code).toBeDefined()
    expect(output.manifest.input.path).toBe('a.component.ts')
    expect(output.manifest.component?.path).toBe('a.component.ts')
    expect(output.manifest.component?.sha256).toBe(
      createHash('sha256').update(script, 'utf8').digest('hex'),
    )
    expect(output.manifest.outputPath).toBe('generated/a.component.native.vue')
  })

  it('refuses the Angular block and pipe syntax rather than emitting it as text', () => {
    const block = compileAngularTarget('@switch (state) { @case ("a") { <span>Hi</span> } }')

    expect(block.code).toBeUndefined()
    expect(block.report.findings.map((finding) => finding.code)).toContain(
      'unsupported-control-flow',
    )

    const pipe = compileAngularTarget('<main><span>{{ price | currency }}</span></main>')

    expect(pipe.code).toBeUndefined()
    expect(pipe.report.findings.map((finding) => finding.code)).toContain('unsupported-pipe')
  })

  it('translates class, style and attribute bindings to their Vue forms', () => {
    const output = compileAngularTarget(
      '<ul [class.expanded]="isExpanded" [attr.role]="listRole"><li><span>Hi</span></li></ul>',
    )

    expect(output.report.findings).toEqual([])
    expect(output.code).toContain(`:class="{ 'expanded': isExpanded }"`)
    expect(output.code).toContain(':role="listRole"')
  })

  it('refuses an attribute that interpolates, which Vue does not', () => {
    const output = compileAngularTarget('<img alt="Photo of {{ name }}" />')

    expect(output.code).toBeUndefined()
    expect(output.report.findings.map((finding) => finding.code)).toContain(
      'unsupported-interpolation',
    )
  })

  it('renders a grouping element as a native fragment', () => {
    const output = compileAngularTarget('<ng-container><main><span>Hi</span></main></ng-container>')

    expect(output.report.findings).toEqual([])
    expect(output.code).toContain('<template><view><text>Hi</text></view></template>')
  })

  it('translates the control-flow blocks to the native directives', () => {
    const conditional = compileAngularTarget(
      '@if (ready) { <main><span>Hi</span></main> } @else { <main><span>Bye</span></main> }',
    )

    expect(conditional.report.findings).toEqual([])
    expect(conditional.code).toContain('<template v-if="ready">')
    expect(conditional.code).toContain('<template v-else>')

    const loop = compileAngularTarget(
      '@for (item of items; track item.id) { <main><span>{{ item }}</span></main> }',
    )

    expect(loop.report.findings).toEqual([])
    expect(loop.code).toContain('<template v-for="item in items" :key="item.id">')
  })

  it('refuses an @empty block, which has no native equivalent yet', () => {
    const output = compileAngularTarget(
      '@for (item of items; track item.id) { <main><span>{{ item }}</span></main> } @empty { <main><span>none</span></main> }',
    )

    expect(output.code).toBeUndefined()
    expect(output.report.findings.map((finding) => finding.code)).toContain(
      'unsupported-control-flow',
    )
  })

  describe('compileAngularComponent', () => {
    const component = (body: string): string =>
      ['@Component({ selector: "app-a" })', 'export class A {', body, '}'].join('\n')

    it('translates the bounded state and reads a signal plainly in the template', () => {
      const output = compileAngularComponent({
        script: component(
          [
            "  title = 'Records'",
            '  theme = signal("dark")',
            '  count = 0',
            '  label = computed(() => this.title + String(this.count))',
            '  increment() { this.count += 1 }',
          ].join('\n'),
        ),
        template:
          '<main><span>{{ title }}</span><span>{{ theme() }}</span><button (click)="increment()"><span>+</span></button></main>',
      })

      expect(output.report.findings).toEqual([])
      expect(output.code).toContain("const title = ref('Records')")
      expect(output.code).toContain('const theme = ref("dark")')
      expect(output.code).toContain('const count = ref(0)')
      expect(output.code).toContain(
        'const label = computed(() => title.value + String(count.value))',
      )
      expect(output.code).toContain('function increment() {')
      expect(output.code).toContain('count.value += 1')
      expect(output.code).toContain('{{ theme }}')
      expect(output.code).not.toContain('{{ theme() }}')
    })

    it('refuses a component whose class it cannot translate, with no source', () => {
      const withConstructor = compileAngularComponent({
        script: component('  constructor(private readonly http: HttpClient) {}'),
        template: '<main><span>Hi</span></main>',
      })

      expect(withConstructor.code).toBeUndefined()
      expect(withConstructor.report.findings.length).toBeGreaterThan(0)

      const withInput = compileAngularComponent({
        script: component(['  @Input() name = ""', '  count = 0'].join('\n')),
        template: '<main><span>{{ name }}</span></main>',
      })

      expect(withInput.code).toBeUndefined()
      expect(withInput.report.findings.length).toBeGreaterThan(0)
    })

    it('refuses a component with no translatable state', () => {
      const output = compileAngularComponent({
        script: component(''),
        template: '<main><span>Hi</span></main>',
      })

      expect(output.code).toBeUndefined()
      expect(output.report.findings.map((finding) => finding.code)).toContain(
        'unsupported-directive',
      )
    })

    it('refuses the whole component when the template has a finding', () => {
      const output = compileAngularComponent({
        script: component('  count = 0'),
        template: '<main><span>{{ count | number }}</span></main>',
      })

      expect(output.code).toBeUndefined()
      expect(output.report.findings.map((finding) => finding.code)).toContain('unsupported-pipe')
    })

    describe('a bounded inject field', () => {
      const service = [
        '@Injectable({ providedIn: "root" })',
        'export class RecordWorkflowService {',
        '  readonly records = signal([])',
        '  readonly status = signal("")',
        '  select(item: string): void { this.records.set([item]) }',
        '  cycleStatus(): void { this.status.update((current) => current + "!") }',
        '}',
      ].join('\n')

      const withInject = (body: string): string =>
        [
          '@Component({ selector: "app-a" })',
          'export class A {',
          '  readonly workflow = inject(RecordWorkflowService)',
          body,
          '}',
        ].join('\n')

      it('declares the inject object and reports no finding', () => {
        const output = compileAngularComponent({
          script: withInject(''),
          injectables: { RecordWorkflowService: service },
          template:
            '<main><span>{{ workflow.records() }}</span><button (click)="workflow.select(item)"><span>Pick</span></button></main>',
        })

        expect(output.report.findings).toEqual([])
        expect(output.code).toContain('const workflow = reactive({')
        expect(output.code).toContain('records: ref([])')
        expect(output.code).toContain('status: ref("")')
        expect(output.code).toContain('select(item: string)')
        expect(output.code).toContain('this.records = [item]')
        expect(output.code).toContain("import { reactive, ref } from 'vue'")
      })

      it('re-emits library imports the translated setup still references', () => {
        const output = compileAngularComponent({
          script: [
            "import { RECORD_WORKFLOW_ATTACHMENT } from './record-workflow.data'",
            '@Component({ selector: "app-a" })',
            'export class A {',
            '  readonly workflow = inject(RecordWorkflowService)',
            '  attachmentLabel(): string {',
            '    return this.workflow.attachment.length > 0',
            '      ? RECORD_WORKFLOW_ATTACHMENT.label',
            "      : 'No attachment'",
            '  }',
            '}',
          ].join('\n'),
          injectables: {
            RecordWorkflowService: [
              "import { Injectable, signal } from '@angular/core'",
              "import { RECORD_WORKFLOW_STATUSES, nextIn, type RecordWorkflowRecord } from './record-workflow.data'",
              '@Injectable({ providedIn: "root" })',
              'export class RecordWorkflowService {',
              '  readonly attachment = signal("")',
              '  readonly status = signal("")',
              '  cycleStatus(): void { this.status.set(nextIn(RECORD_WORKFLOW_STATUSES, this.status())) }',
              '  select(record: RecordWorkflowRecord): void { this.attachment.set(record.field) }',
              '}',
            ].join('\n'),
          },
          template:
            '<main><span>{{ attachmentLabel() }}</span><button (click)="workflow.cycleStatus()"><span>Go</span></button></main>',
        })

        expect(output.report.findings).toEqual([])
        expect(output.code).toContain("import { reactive, ref } from 'vue'")
        expect(output.code).toContain("from './record-workflow.data'")
        expect(output.code).toContain('RECORD_WORKFLOW_ATTACHMENT')
        expect(output.code).toContain('RECORD_WORKFLOW_STATUSES')
        expect(output.code).toContain('nextIn')
        expect(output.code).toContain('type RecordWorkflowRecord')
        expect(output.code).not.toContain('@angular/core')
        expect(output.code).not.toContain('import { computed')
      })

      it('rewrites signal reads on the inject target and keeps method calls', () => {
        const output = compileAngularComponent({
          script: withInject(''),
          injectables: { RecordWorkflowService: service },
          template:
            '<main><span>{{ workflow.status() }}</span><button (click)="workflow.cycleStatus()"><span>Go</span></button></main>',
        })

        expect(output.report.findings).toEqual([])
        expect(output.code).toContain('{{ workflow.status }}')
        expect(output.code).not.toContain('{{ workflow.status() }}')
        expect(output.code).toContain('@press="workflow.cycleStatus()"')
        expect(output.code).toContain('cycleStatus()')
      })

      it('rewrites component methods that read through the inject target', () => {
        const output = compileAngularComponent({
          script: withInject(
            ['  label(): string {', '    return this.workflow.status()', '  }'].join('\n'),
          ),
          injectables: { RecordWorkflowService: service },
          template: '<main><span>{{ label() }}</span></main>',
        })

        expect(output.report.findings).toEqual([])
        expect(output.code).toContain('function label()')
        expect(output.code).toContain('return workflow.status')
        expect(output.code).not.toContain('workflow.value')
        expect(output.code).toContain('{{ label() }}')
      })

      it('reads an input value from the native value event payload', () => {
        const output = compileAngularComponent({
          script: [
            '@Component({ selector: "app-a" })',
            'export class A {',
            '  field = ""',
            '  onField(event: Event): void {',
            '    this.field = (event.target as HTMLInputElement).value',
            '  }',
            '}',
          ].join('\n'),
          template: '<main><input [value]="field" (click)="onField($event)" /></main>',
        })

        expect(output.report.findings).toEqual([])
        expect(output.code).toContain('@value-change="onField($event)"')
        expect(output.code).toContain('event.text')
        expect(output.code).not.toContain('event.target.value')
      })

      it('refuses when the injectable source is missing', () => {
        const output = compileAngularComponent({
          script: withInject(''),
          template: '<main><span>Hi</span></main>',
        })

        expect(output.code).toBeUndefined()
        expect(output.report.findings.length).toBeGreaterThan(0)
        expect(output.report.findings[0]?.message).toContain('injectable source')
      })

      it('still refuses a leftover inject form that is not the bounded field', () => {
        const output = compileAngularComponent({
          script: [
            '@Component({ selector: "app-a" })',
            'export class A {',
            '  count = 0',
            '  setup() { inject(RecordWorkflowService) }',
            '}',
          ].join('\n'),
          injectables: { RecordWorkflowService: service },
          template: '<main><span>{{ count }}</span></main>',
        })

        expect(output.code).toBeUndefined()
        expect(output.report.findings.map((finding) => finding.message)).toEqual(
          expect.arrayContaining([expect.stringContaining('dependency injection')]),
        )
      })

      it('refuses when the injectable class uses a constructor or a decorator', () => {
        const withConstructor = compileAngularComponent({
          script: withInject(''),
          injectables: {
            RecordWorkflowService: 'export class RecordWorkflowService { constructor() {} }',
          },
          template: '<main><span>Hi</span></main>',
        })

        expect(withConstructor.code).toBeUndefined()
        expect(withConstructor.report.findings.length).toBeGreaterThan(0)

        const withInput = compileAngularComponent({
          script: withInject(''),
          injectables: {
            RecordWorkflowService: [
              '@Input() name = ""',
              'export class RecordWorkflowService { name = "" }',
            ].join('\n'),
          },
          template: '<main><span>Hi</span></main>',
        })

        expect(withInput.code).toBeUndefined()
        expect(withInput.report.findings.length).toBeGreaterThan(0)
      })
    })
  })
})
