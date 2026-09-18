import { stripComments } from '@navirox/source'

/**
 * A component is found by what a module exports, not by its extension or its
 * name.
 *
 * The reading is textual, on source with the comments blanked, for the same
 * reason the React adapter reads it that way: the alternative is a parser, and a
 * component this adapter misses is a missing unit rather than a wrong one.
 *
 * Solid compiles its JSX away, so a component is still a function that returns
 * elements, but there are no hooks to look for. Four rules live in the
 * declaration instead: whether the module is a component, whether it returns
 * elements at all, and whether it declares a store.
 */

export const COMPONENT_EXTENSIONS: readonly string[] = ['.tsx', '.jsx']

const FUNCTION_COMPONENT =
  /(?:export\s+(?:default\s+)?function\s+[A-Z]|export\s+(?:default\s+)?(?:const|let)\s+[A-Z]\w*\s*=\s*(?:\(|async\s*\())/

const JSX = /<[a-zA-Z]|<>/

const STORE_LIBRARY = /['"]solid-js\/store['"]/

const STORE_FACTORY = /\b(?:createStore|createMutable)\s*\(/

export interface SolidDeclaration {
  readonly component: boolean
  readonly returnsElement: boolean
  readonly declaresStore: boolean
}

export function isComponentExtension(file: string): boolean {
  return COMPONENT_EXTENSIONS.some((extension) => file.endsWith(extension))
}

export function readDeclaration(text: string): SolidDeclaration {
  const source = stripComments(text)
  const returnsElement = JSX.test(source)

  return {
    component: FUNCTION_COMPONENT.test(source) && returnsElement,
    returnsElement,
    declaresStore: STORE_LIBRARY.test(source) && STORE_FACTORY.test(source),
  }
}
