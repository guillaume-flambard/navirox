import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileVueTarget, serializeProvenanceManifest } from '@memolabs-apps/target-vue'
import { describe, expect, it } from 'vitest'
import { parseArguments } from './args.js'
import { ConversionError, runConversion, type ConvertTarget } from './convert.js'
import { readAngularInjectables, readAngularTemplate, targetFor } from './targets.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE_APP = join(
  HERE,
  '..',
  '..',
  'source-angular',
  'fixtures',
  'record-workflow',
  'src',
  'app',
)

function output(): string {
  return mkdtempSync(join(tmpdir(), 'navirox-convert-'))
}

const vueTarget: ConvertTarget = {
  id: 'vue',
  compile: (input, filename, outputPath) => {
    const result = compileVueTarget(input.source, filename, outputPath)

    return {
      findings: result.report.findings,
      ...(result.code === undefined ? {} : { code: result.code }),
      manifest: serializeProvenanceManifest(result.manifest),
    }
  },
}

const supported = '<template><main><p>Hello</p></main></template>\n'
const unsupported = '<template><main><marquee>Hi</marquee></main></template>\n'

describe('parsing the convert command', () => {
  it('accepts --out and --write for convert and refuses them elsewhere', () => {
    const parsed = parseArguments(['convert', '--out', 'native', '--write'])

    expect(parsed.command).toBe('convert')
    expect(parsed.out).toBe('native')
    expect(parsed.write).toBe(true)
    expect(() => parseArguments(['plan', '--out', 'native'])).toThrow()
    expect(() => parseArguments(['convert', '--write'])).toThrow(/needs --out/)
  })
})

describe('converting screens', () => {
  it('reports a supported screen and writes nothing in a dry run', () => {
    const root = output()
    const report = runConversion({
      screens: [{ unit: 'vue:App.vue:component:default', file: 'src/App.vue' }],
      outputRoot: root,
      write: false,
      readText: (path) => (path === 'src/App.vue' ? supported : undefined),
      target: vueTarget,
    })

    expect(report.dryRun).toBe(true)
    expect(report.converted).toHaveLength(1)
    expect(report.converted[0]?.to).toBe('src/App.native.vue')
    expect(report.converted[0]?.code).toContain('<view>')
    expect(existsSync(join(root, 'src/App.native.vue'))).toBe(false)
  })

  it('writes the screen and its provenance when asked', () => {
    const root = output()
    runConversion({
      screens: [{ unit: 'vue:App.vue:component:default', file: 'src/App.vue' }],
      outputRoot: root,
      write: true,
      readText: (path) => (path === 'src/App.vue' ? supported : undefined),
      target: vueTarget,
    })

    expect(readFileSync(join(root, 'src/App.native.vue'), 'utf8')).toContain('<view>')

    const manifest = JSON.parse(
      readFileSync(join(root, 'src/App.native.vue.provenance.json'), 'utf8'),
    ) as { readonly input: { readonly path: string }; readonly compilerVersion: string }

    expect(manifest.input.path).toBe('src/App.vue')
    expect(typeof manifest.compilerVersion).toBe('string')
  })

  it('refuses a screen the provider cannot fully compile and writes nothing for it', () => {
    const root = output()
    const report = runConversion({
      screens: [{ unit: 'vue:App.vue:component:default', file: 'src/App.vue' }],
      outputRoot: root,
      write: true,
      readText: () => unsupported,
      target: vueTarget,
    })

    expect(report.converted).toEqual([])
    expect(report.refused).toHaveLength(1)
    expect(report.refused[0]?.findings.length).toBeGreaterThan(0)
    expect(existsSync(join(root, 'src/App.native.vue'))).toBe(false)
  })

  it('refuses a screen whose source cannot be read', () => {
    const root = output()
    const report = runConversion({
      screens: [
        {
          unit: 'angular:src/app/a.component.ts:component:default',
          file: 'src/app/a.component.ts',
        },
      ],
      outputRoot: root,
      write: true,
      readText: () => undefined,
      target: vueTarget,
    })

    expect(report.converted).toEqual([])
    expect(report.refused[0]?.findings[0]?.code).toBe('source-unreadable')
  })

  it('refuses a screen whose output would escape the output directory', () => {
    const root = output()

    expect(() =>
      runConversion({
        screens: [{ unit: 'vue:escape.vue:component:default', file: '../escape.vue' }],
        outputRoot: root,
        write: true,
        readText: () => supported,
        target: vueTarget,
      }),
    ).toThrow(ConversionError)

    expect(existsSync(join(root, '..', 'escape.native.vue'))).toBe(false)
  })
})

describe('reading an Angular template', () => {
  it('reads an inline template', () => {
    const template = readAngularTemplate(
      () => '@Component({ template: `<main><span>Hi</span></main>` })\nexport class A {}',
      'src/app/a.component.ts',
    )

    expect(template).toBe('<main><span>Hi</span></main>')
  })

  it('reads an external template relative to the component', () => {
    const template = readAngularTemplate((path) => {
      if (path === 'src/app/a.component.html') return '<main><span>Hi</span></main>'
      if (path === 'src/app/a.component.ts') return "templateUrl: './a.component.html'"
      return undefined
    }, 'src/app/a.component.ts')

    expect(template).toBe('<main><span>Hi</span></main>')
  })

  it('returns undefined when no template can be read', () => {
    expect(readAngularTemplate(() => 'export class A {}', 'src/app/a.component.ts')).toBeUndefined()
  })
})

describe('passing Angular injectable sources', () => {
  const componentScript = [
    "import { RecordWorkflowService } from './record-workflow.service'",
    '@Component({ template: `<main><span>{{ workflow.records() }}</span></main>` })',
    'export class A {',
    '  readonly workflow = inject(RecordWorkflowService)',
    '}',
  ].join('\n')

  const serviceSource = [
    'import { signal } from ' + '"@angular/core"',
    '@Injectable({ providedIn: "root" })',
    'export class RecordWorkflowService {',
    '  readonly records = signal([])',
    '  pick(item: string): void {}',
    '}',
  ].join('\n')

  const template = '<main><span>{{ workflow.records() }}</span></main>'

  function readDisk(path: string): string | undefined {
    try {
      return readFileSync(path, 'utf8')
    } catch {
      return undefined
    }
  }

  it('converts when the imported injectable module is readable', async () => {
    const root = output()
    const target = await targetFor('angular')
    const report = runConversion({
      screens: [
        {
          unit: 'angular:src/app/a.component.ts:component:default',
          file: 'src/app/a.component.ts',
        },
      ],
      outputRoot: root,
      write: true,
      readText: (path) => (path === 'src/app/a.component.ts' ? template : undefined),
      readScript: (path) => (path === 'src/app/a.component.ts' ? componentScript : undefined),
      readInjectables: (path, script) =>
        readAngularInjectables(
          (candidate) =>
            candidate === 'src/app/record-workflow.service.ts' ? serviceSource : undefined,
          path,
          script,
        ),
      target,
    })

    expect(report.refused).toEqual([])
    expect(report.converted).toHaveLength(1)
    expect(report.converted[0]?.code).toContain('const workflow = reactive({')
    expect(report.converted[0]?.code).toContain('records: ref([])')
    expect(existsSync(join(root, 'src/app/a.component.native.vue'))).toBe(true)
  })

  it('refuses and writes nothing when the injectable module is unreadable', async () => {
    const root = output()
    const target = await targetFor('angular')
    const report = runConversion({
      screens: [
        {
          unit: 'angular:src/app/a.component.ts:component:default',
          file: 'src/app/a.component.ts',
        },
      ],
      outputRoot: root,
      write: true,
      readText: (path) => (path === 'src/app/a.component.ts' ? template : undefined),
      readScript: (path) => (path === 'src/app/a.component.ts' ? componentScript : undefined),
      readInjectables: (path, script) => readAngularInjectables(() => undefined, path, script),
      target,
    })

    expect(report.converted).toEqual([])
    expect(report.refused).toHaveLength(1)
    expect(report.refused[0]?.findings.map((finding) => finding.message)).toEqual(
      expect.arrayContaining([expect.stringContaining('injectable source')]),
    )
    expect(existsSync(join(root, 'src/app/a.component.native.vue'))).toBe(false)
  })

  it('maps a relative inject import next to the real record-workflow component', () => {
    const componentFile = join(FIXTURE_APP, 'record-workflow.component.ts')
    const script = readDisk(componentFile)

    expect(script).toBeDefined()

    const injectables = readAngularInjectables(readDisk, componentFile, script ?? '')

    expect(Object.keys(injectables)).toContain('RecordWorkflowService')
    expect(injectables['RecordWorkflowService']).toContain('export class RecordWorkflowService')
  })

  it('converts the pinned record-workflow fixture, declares every binding, and records provenance', async () => {
    // The fixture is the SuiteCRM-shaped record workflow justified against the
    // pinned public revision in docs/evidence/workflow-suitecrm-record-workflow.md
    // (SuiteCRM 2cd77380bc838b8bd6c80f9fbe25855d73ef860c); the component itself
    // is original to this project and is not copied from that repository.
    const relativeFile = 'src/app/record-workflow.component.ts'
    const relativeService = 'src/app/record-workflow.service.ts'

    function readRelative(path: string): string | undefined {
      if (path === relativeFile) return readDisk(join(FIXTURE_APP, 'record-workflow.component.ts'))
      if (path === relativeService) return readDisk(join(FIXTURE_APP, 'record-workflow.service.ts'))
      return undefined
    }

    const script = readRelative(relativeFile)

    expect(script).toBeDefined()

    const template = readAngularTemplate(readRelative, relativeFile)

    expect(template).toBeDefined()
    if (template === undefined) throw new Error('expected an inline template')

    const injectables = readAngularInjectables(readRelative, relativeFile, script ?? '')
    const root = output()
    const target = await targetFor('angular')
    const report = runConversion({
      screens: [
        {
          unit: 'angular:src/app/record-workflow.component.ts:component:default',
          file: relativeFile,
        },
      ],
      outputRoot: root,
      write: true,
      // The convert command reads the Angular template for `source` and the
      // component file for `script`; the full TypeScript file is never the
      // template half.
      readText: (path) => (path === relativeFile ? template : readRelative(path)),
      readScript: () => script,
      readInjectables: () => injectables,
      target,
    })

    expect(report.refused).toEqual([])
    expect(report.converted).toHaveLength(1)

    const code = report.converted[0]?.code ?? ''

    for (const binding of [
      'workflow.records',
      'workflow.select',
      'workflow.field',
      'workflow.cycleStatus',
      'workflow.save',
      'workflow.status',
      'workflow.saveState',
      'workflow.attachment',
      'workflow.selected',
      'attachmentLabel',
      'onField',
      'onFile',
    ]) {
      expect(code).toContain(binding)
    }

    expect(code).not.toContain('workflow.records()')
    expect(code).toContain('@press="workflow.cycleStatus()"')
    expect(code).toContain('@press="workflow.save()"')
    expect(code).toContain('@press="workflow.select(record)"')

    // Free identifiers the method bodies keep (seed data, helpers, types) must
    // stay importable in the emitted single-file component or the screen cannot run.
    expect(code).toContain("from './record-workflow.data'")
    expect(code).toContain('RECORD_WORKFLOW_RECORDS')
    expect(code).toContain('RECORD_WORKFLOW_STATUSES')
    expect(code).toContain('RECORD_WORKFLOW_ATTACHMENT')
    expect(code).toContain('nextIn')
    expect(code).toContain('saveOutcome')
    expect(code).toContain('type RecordWorkflowRecord')
    expect(code).not.toContain('@angular/core')

    // Every root identifier the emitted template binds must be declared in the
    // script half (or be a v-for / special local), so the screen is runnable.
    const scriptHalf = code.slice(0, code.indexOf('</script>'))
    const templateHalf = code.slice(code.indexOf('</script>'))
    const declared = new Set<string>()

    for (const match of scriptHalf.matchAll(/\b(?:const|function|let|var)\s+([A-Za-z_$][\w$]*)/g)) {
      if (match[1] !== undefined) declared.add(match[1])
    }

    const boundLocals = new Set<string>()

    for (const match of templateHalf.matchAll(/v-for="([A-Za-z_$][\w$]*)\s+in\s+[^"]+"/g)) {
      if (match[1] !== undefined) boundLocals.add(match[1])
    }

    const roots = new Set<string>()

    for (const match of templateHalf.matchAll(
      /\{\{([^}]+)\}\}|v-(?:if|else-if|else|for)="([^"]+)"|@[a-z-]+="([^"]+)"|:[\w.-]+="([^"]+)"|v-model="([^"]+)"/g,
    )) {
      const expressions = match.slice(1).filter((value): value is string => value !== undefined)

      for (const expression of expressions) {
        const trimmed = expression.trim()
        const forBody = /^([A-Za-z_$][\w$]*)\s+in\s+(.+)$/.exec(trimmed)
        const source = forBody?.[2] ?? trimmed
        const root = /^[A-Za-z_$][\w$]*/.exec(source.trim())?.[0]

        if (root !== undefined && root !== '$event') roots.add(root)
      }
    }

    expect(roots.size).toBeGreaterThan(0)

    for (const root of roots) {
      if (boundLocals.has(root)) continue
      expect(
        declared.has(root),
        `binding root "${root}" is used in the emitted template but never declared in setup`,
      ).toBe(true)
    }

    const manifestPath = join(root, 'src/app/record-workflow.component.native.vue.provenance.json')

    expect(existsSync(manifestPath)).toBe(true)

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      readonly input: { readonly path: string; readonly sha256: string }
      readonly component?: { readonly path: string; readonly sha256: string }
      readonly outputPath?: string
      readonly compilerVersion: string
    }

    expect(manifest.input.path).toBe(relativeFile)
    expect(manifest.component?.path).toBe(relativeFile)
    expect(manifest.component?.sha256).toBe(
      createHash('sha256')
        .update(script ?? '', 'utf8')
        .digest('hex'),
    )
    expect(manifest.outputPath).toBe('src/app/record-workflow.component.native.vue')
    expect(typeof manifest.compilerVersion).toBe('string')
  })
})
