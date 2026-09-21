import { describe, expect, it } from 'vitest'
import { compileVueTarget } from './index.js'

describe('compileVueTarget', () => {
  it('maps the safe Vue template subset to native primitives', () => {
    const output = compileVueTarget(`
      <script setup lang="ts">const count = 1</script>
      <template><main><h1>Count {{ count }}</h1><button @click="count += 1">Add</button></main></template>
    `)

    expect(output.report.findings).toEqual([])
    expect(output.report.nodes).toEqual([
      {
        primitive: 'view',
        sourceTag: 'main',
        line: 1,
        children: [
          { primitive: 'text', sourceTag: 'h1', line: 1, children: [] },
          { primitive: 'pressable', sourceTag: 'button', line: 1, children: [] },
        ],
      },
    ])
    expect(output.code).toContain(
      '<view><text>Count {{ count }}</text><pressable @press="count += 1">Add</pressable></view>',
    )
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
})
