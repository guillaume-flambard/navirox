import { fileURLToPath } from 'node:url'
import { createProjectFiles } from '@navirox/source'
import { describe, expect, it } from 'vitest'
import { inspect } from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function codes(findings: readonly { readonly code: string }[]): string[] {
  return findings.map((finding) => finding.code).sort()
}

describe('inspecting a Vue project', () => {
  it('reports every component exactly once', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-app')))
    const components = inspection.units.filter((unit) => unit.kind === 'component')
    const files = components.map((unit) => unit.source.file).sort()

    expect(files).toEqual([
      'src/App.vue',
      'src/components/Counter.vue',
      'src/components/List.vue',
      'src/components/NameInput.vue',
      'src/views/Profile.vue',
    ])
    expect(new Set(files).size).toBe(files.length)
  })

  it('keeps framework detail in adapter owned metadata', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-app')))
    const app = inspection.units.find((unit) => unit.source.file === 'src/App.vue')

    expect(app?.metadata).toEqual({ script: false, scriptSetup: true, template: true, styles: 1 })
  })

  it('reports a store declaration and not a module that only imports the library', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-app')))
    const stateModules = inspection.units
      .filter((unit) => unit.kind === 'state-module')
      .map((unit) => unit.source.file)

    expect(stateModules).toEqual(['src/stores/counter.ts'])
    expect(inspection.units.some((unit) => unit.source.file === 'src/lib/pinia.ts')).toBe(false)
  })

  it('reports capability use with its file and usage kind', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-app')))
    const uses = inspection.capabilities.map((capability) => ({
      file: capability.source.file,
      name: capability.capability,
      usage: capability.usage,
    }))

    expect(uses).toContainEqual({ file: 'src/App.vue', name: 'local-storage', usage: 'read' })
    expect(uses).toContainEqual({ file: 'src/App.vue', name: 'local-storage', usage: 'write' })
    expect(uses).toContainEqual({
      file: 'src/views/Profile.vue',
      name: 'geolocation',
      usage: 'invoke',
    })
  })

  it('reports a bare capability reference as unknown rather than guessing', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-app')))
    const uses = inspection.capabilities.filter(
      (capability) => capability.source.file === 'src/lib/storage.ts',
    )

    expect(uses).toHaveLength(1)
    expect(uses[0]?.capability).toBe('local-storage')
    expect(uses[0]?.usage).toBe('unknown')
  })

  it('links a capability to the unit it was found in', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-app')))
    const app = inspection.units.find((unit) => unit.source.file === 'src/App.vue')
    const inApp = inspection.capabilities.filter(
      (capability) => capability.source.file === 'src/App.vue',
    )

    expect(inApp.every((capability) => capability.unitKey === app?.key)).toBe(true)
  })

  it('lists production dependencies with their declared range and no verdict', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-app')))
    const listed = inspection.dependencies.map((dependency) => dependency.name)

    expect(listed).toEqual(['pinia', 'vue', 'vue-router'])
    expect(inspection.dependencies.find((d) => d.name === 'vue')?.version).toBe('^3.5.43')
    expect(inspection.dependencies.some((dependency) => dependency.name === 'vite')).toBe(false)
  })

  it('reports a router it does not extract routes from', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-app')))

    expect(codes(inspection.findings)).toContain('router-not-extracted')
    expect(inspection.routes).toEqual([])
  })

  it('claims no support for a version outside the tested range', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-app')))
    const untested = inspection.findings.find((finding) => finding.code === 'version-untested')

    expect(untested).toBeUndefined()
    expect(inspection.descriptor.frameworkVersion).toBe('^3.5.43')
  })
})

describe('inspecting a project the adapter cannot read', () => {
  it('completes and reports what it could not do', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-broken')))

    expect(codes(inspection.findings)).toEqual([
      'router-not-extracted',
      'sfc-parse-failed',
      'version-untested',
      'web-component',
    ])
  })

  it('still reports the components it could read', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-broken')))
    const files = inspection.units.map((unit) => unit.source.file)

    expect(files).toEqual(['src/views/Only.vue'])
  })

  it('names the file it could not parse', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-broken')))
    const failed = inspection.findings.find((finding) => finding.code === 'sfc-parse-failed')

    expect(failed?.source?.file).toBe('src/App.vue')
    expect(failed?.severity).toBe('error')
  })

  it('produces no route node for a views directory', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-broken')))

    expect(inspection.routes).toEqual([])
  })

  it('reports the untested major in the finding', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-broken')))
    const untested = inspection.findings.find((finding) => finding.code === 'version-untested')

    expect(untested?.severity).toBe('warning')
    expect(untested?.message).toContain('^2.7.0')
  })
})
