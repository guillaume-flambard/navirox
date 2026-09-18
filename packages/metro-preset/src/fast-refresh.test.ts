import { transformSync } from '@babel/core'
import { describe, expect, it } from 'vitest'
import { VUE_FAST_REFRESH_PLUGIN_NAME, fastRefreshId, withVueFastRefresh } from './index'

/**
 * Runs the plugin over one module, with no preset in the way.
 *
 * The plugin is the only thing under test here: no Vue, no Metro, no upstream
 * transformer. Whitespace is collapsed and quotes are normalized so an assertion
 * is about the code that was generated and not about the printer's formatting.
 */
function emitted(code: string, filename: string): string {
  const result = transformSync(code, {
    filename,
    configFile: false,
    babelrc: false,
    compact: false,
    plugins: [withVueFastRefresh],
  })
  if (result?.code == null) {
    throw new Error('the transform produced no output')
  }
  return result.code.replace(/\s+/g, ' ').replaceAll("'", '"').trim()
}

/** The identifier the emitted module stamped, read back out of the code. */
function stampedId(output: string): string {
  const match = /__hmrId = "([^"]*)"/.exec(output)
  if (match?.[1] === undefined) {
    throw new Error(`no identifier in: ${output}`)
  }
  return match[1]
}

describe('the Vue Fast Refresh plugin', () => {
  it('has the name Babel reports for it', () => {
    expect(VUE_FAST_REFRESH_PLUGIN_NAME).toBe('navirox-vue-fast-refresh')
  })

  it('binds the component, stamps it, registers it, accepts the update and re-exports it', () => {
    const output = emitted(
      'const answer = 42\nexport default _defineComponent({ name: "App" })\n',
      '/app/App.vue.tsx',
    )

    expect(output).toMatch(
      /^const answer = 42; const (\w+) = _defineComponent\(\{ name: "App" \}\); \1\.__hmrId = "[^"]*\/app\/App\.vue"; if \(typeof __VUE_HMR_RUNTIME__ !== "undefined"\) \{ __VUE_HMR_RUNTIME__\.createRecord\("[^"]*\/app\/App\.vue", \1\); \} if \(typeof module !== "undefined" && module\.hot\) \{ module\.hot\.accept\(function \(\) \{ if \(typeof __VUE_HMR_RUNTIME__ !== "undefined"\) \{ __VUE_HMR_RUNTIME__\.reload\("[^"]*\/app\/App\.vue", \1\); \} \}\); \} export default \1;$/,
    )
    expect(stampedId(output)).toBe('/app/App.vue')
  })

  it('stamps a component that already has a name where it stands', () => {
    const output = emitted(
      'const __sfc__ = _defineComponent({ name: "App" })\nexport default __sfc__\n',
      '/app/App.vue.tsx',
    )

    expect(output).toContain('export default __sfc__;')
    expect(output).toContain('__sfc__.__hmrId = "/app/App.vue";')
    expect(output).toContain('__VUE_HMR_RUNTIME__.reload("/app/App.vue", __sfc__);')
  })

  it('derives the id from the file, so an edit keeps it and another file does not', () => {
    const first = emitted('export default _defineComponent({})\n', '/app/src/App.vue.tsx')
    const edited = emitted(
      'const extra = 1\nexport default _defineComponent({ name: "App" })\n',
      '/app/src/App.vue.tsx',
    )
    const other = emitted('export default _defineComponent({})\n', '/app/src/Other.vue.tsx')

    expect(stampedId(first)).toBe('/app/src/App.vue')
    expect(stampedId(edited)).toBe(stampedId(first))
    expect(stampedId(other)).toBe('/app/src/Other.vue')
  })

  it('names a path with the platform separator normalized away', () => {
    expect(fastRefreshId('C:\\app\\src\\App.vue.tsx')).toBe('C:/app/src/App.vue')
    expect(fastRefreshId('/app/src/App.vue.tsx')).toBe('/app/src/App.vue')
    expect(fastRefreshId('/app/src/App.vue')).toBe('/app/src/App.vue')
  })

  it('leaves a module that is not a compiled component alone', () => {
    const code = 'export default function App() { return null }\n'

    expect(emitted(code, '/app/App.tsx')).toBe('export default function App() { return null; }')
    expect(emitted(code, '/app/stores/counter.ts')).not.toContain('__hmrId')
  })

  it('leaves a compiled component with no default export alone', () => {
    const output = emitted('export const name = "App"\n', '/app/App.vue.tsx')

    expect(output).toBe('export const name = "App";')
  })

  it('carries no build-mode branch, only the two runtime guards', () => {
    const output = emitted('export default _defineComponent({})\n', '/app/App.vue.tsx')

    expect(output).not.toContain('process.env')
    expect(output).toContain('typeof __VUE_HMR_RUNTIME__ !== "undefined"')
    expect(output).toContain('typeof module !== "undefined" && module.hot')
  })
})
