import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  SYMBIOTE_SOURCE_EXTENSIONS,
  SYMBIOTE_VUE_TRANSFORMER,
  symbioteVueTransformerPath,
} from './build-integration'

describe('@navirox/runtime-symbiote build integration', () => {
  it('names the Vue transformer as a bare module specifier', () => {
    expect(SYMBIOTE_VUE_TRANSFORMER).toBe('@symbiote-native/vue/metro-vue-transformer')
  })

  it('lists the six extensions the transformer accepts, in order', () => {
    expect([...SYMBIOTE_SOURCE_EXTENSIONS]).toEqual(['vue', 'css', 'scss', 'sass', 'less', 'styl'])
  })

  it('resolves the transformer to a file that exists', () => {
    const resolved = symbioteVueTransformerPath()
    expect(resolved.startsWith('/')).toBe(true)
    expect(resolved.endsWith('metro-vue-transformer.cjs')).toBe(true)
    // Resolving a specifier is a claim; the file being there is the proof.
    expect(existsSync(resolved)).toBe(true)
  })
})
