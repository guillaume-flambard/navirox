import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { compileVueTarget, serializeProvenanceManifest } from '@memolabs-apps/target-vue'
import { describe, expect, it } from 'vitest'
import { parseArguments } from './args.js'
import { ConversionError, runConversion, type ConvertTarget } from './convert.js'
import { readAngularTemplate } from './targets.js'

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
