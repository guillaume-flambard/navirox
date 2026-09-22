import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { compileVueTarget, hashProvenanceManifest, serializeProvenanceManifest } from './index.js'

const OWN_VERSION = (
  JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    readonly version: string
  }
).version

describe('compileVueTarget', () => {
  it('maps the safe Vue template subset to native primitives', () => {
    const output = compileVueTarget(`
      <script setup lang="ts">const count = 1</script>
      <template><main><h1>Count {{ count }}</h1><button @click="count += 1"><span>Add</span></button></main></template>
    `)

    expect(output.report.findings).toEqual([])
    expect(output.report.nodes).toEqual([
      {
        primitive: 'view',
        sourceTag: 'main',
        line: 1,
        column: 1,
        children: [
          { primitive: 'text', sourceTag: 'h1', line: 1, column: 7, children: [] },
          {
            primitive: 'pressable',
            sourceTag: 'button',
            line: 1,
            column: 33,
            children: [{ primitive: 'text', sourceTag: 'span', line: 1, column: 61, children: [] }],
          },
        ],
      },
    ])
    expect(output.code).toContain(
      '<view><text>Count {{ count }}</text><pressable @press="count += 1"><text>Add</text></pressable></view>',
    )
  })

  it('renames data-testid to the native testID prop', () => {
    const output = compileVueTarget(`
      <template><main data-testid="records-screen"><h1>Records</h1></main></template>
    `)

    expect(output.report.findings).toEqual([])
    expect(output.code).toContain('<view testID="records-screen">')
    expect(output.code).not.toContain('data-testid')
  })

  it('refuses to emit a plausible native screen for unsupported navigation and CSS', () => {
    const output = compileVueTarget(`
      <template><RouterLink to="/products">Products</RouterLink></template>
      <style>.link { transition: 0.4s }</style>
    `)

    expect(output.code).toBeUndefined()
    expect(output.report.findings.map((finding) => finding.code)).toEqual([
      'unsupported-element',
      'unsupported-style',
    ])
  })

  it('retains a safe class-only style block for the native CSS compiler', () => {
    const output = compileVueTarget(`
      <template><main class="screen"><h1 class="title">Products</h1></main></template>
      <style scoped>
      .screen { flex: 1; padding: 16; background-color: #0b1020; }
      .title { font-size: 22; font-weight: 700; color: #ffffff; }
      </style>
    `)

    expect(output.report.findings).toEqual([])
    expect(output.code).toContain('<style scoped>')
    expect(output.code).toContain('.screen { flex: 1; padding: 16; background-color: #0b1020; }')
  })

  it('emits a deterministic provenance manifest for a supported screen', () => {
    const source = `<template><main><h1>Products</h1></main></template>`
    const first = compileVueTarget(source, 'Products.vue', 'generated/Products.vue')
    const second = compileVueTarget(source, 'Products.vue', 'generated/Products.vue')

    expect(first.code).toBeDefined()
    expect(first.manifest.schemaVersion).toBe(1)
    expect(first.manifest.input.path).toBe('Products.vue')
    expect(first.manifest.input.sha256).toBe(
      createHash('sha256').update(source, 'utf8').digest('hex'),
    )
    expect(first.manifest.outputPath).toBe('generated/Products.vue')
    expect(first.manifest.compilerVersion).toBe(OWN_VERSION)
    expect(first.manifest.nodes).toEqual(first.report.nodes)
    expect(first.manifest.findings).toEqual([])
    expect(serializeProvenanceManifest(second.manifest)).toBe(
      serializeProvenanceManifest(first.manifest),
    )
    expect(hashProvenanceManifest(second.manifest)).toBe(hashProvenanceManifest(first.manifest))
  })

  it('emits no generated path for an unsupported screen', () => {
    const output = compileVueTarget(
      `<template><RouterLink to="/products">Products</RouterLink></template>`,
      'Products.vue',
      'generated/Products.vue',
    )

    expect(output.code).toBeUndefined()
    expect(output.report.findings.length).toBeGreaterThan(0)
    expect(output.manifest.outputPath).toBeUndefined()
    expect(output.manifest.findings).toEqual(output.report.findings)
  })

  it('stays fail-closed for an unsupported directive', () => {
    const output = compileVueTarget(`<template><main><input v-model="query" /></main></template>`)

    expect(output.code).toBeUndefined()
    expect(output.report.findings.map((finding) => finding.code)).toContain('unsupported-directive')
  })

  it('stays fail-closed for a descendant selector', () => {
    const output = compileVueTarget(
      `<template><main class="screen"><h1 class="title">Products</h1></main></template>
      <style>.screen .title { color: #ffffff; }</style>`,
    )

    expect(output.code).toBeUndefined()
    expect(output.report.findings.map((finding) => finding.code)).toContain('unsupported-style')
  })

  it('stays fail-closed for an unsupported CSS property', () => {
    const output = compileVueTarget(
      `<template><main class="screen"><h1>Products</h1></main></template>
      <style>.screen { display: grid; }</style>`,
    )

    expect(output.code).toBeUndefined()
    expect(output.report.findings.map((finding) => finding.code)).toContain('unsupported-style')
  })

  it('refuses text native cannot render directly inside a non text element', () => {
    const label = compileVueTarget(`<template><button @click="select()">Alpha</button></template>`)
    const interpolation = compileVueTarget(`<template><div class="row">{{ name }}</div></template>`)

    expect(label.code).toBeUndefined()
    expect(label.report.findings.map((finding) => finding.code)).toEqual(['unsupported-text'])
    expect(interpolation.code).toBeUndefined()
    expect(interpolation.report.findings.map((finding) => finding.code)).toEqual([
      'unsupported-text',
    ])
  })

  it('accepts text inside a text element and whitespace between elements', () => {
    const labelled = compileVueTarget(
      `<template><div class="row"><span class="label">Alpha</span></div></template>`,
    )
    const spaced = compileVueTarget(`
      <template>
        <div class="row">
          <span class="label">Alpha</span>
        </div>
      </template>
    `)

    expect(labelled.report.findings).toEqual([])
    expect(labelled.code).toContain('<text class="label">Alpha</text>')
    expect(spaced.report.findings).toEqual([])
    expect(spaced.code).toBeDefined()
  })

  it('accepts a nested element inside a container', () => {
    const output = compileVueTarget(
      `<template><div class="row"><span class="label">Alpha</span><button @click="select()"><span class="label">Beta</span></button></div></template>`,
    )

    expect(output.report.findings).toEqual([])
    expect(output.code).toBeDefined()
  })
})
