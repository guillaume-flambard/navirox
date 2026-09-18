import { stripComments } from '@navirox/source'

/**
 * What a module exports.
 *
 * A component is found by what a module exports rather than by its extension or its
 * name. A file named `Button.tsx` that exports a constant is not a component, and a
 * component that lives in `widgets/` is one. The reading is textual over
 * comment-stripped source, which is what the Svelte and Angular adapters do for the
 * same reason: a missed component is a missing unit rather than a wrong one.
 */

/** Extensions a component can be written in. */
export const COMPONENT_EXTENSIONS: readonly string[] = ['.tsx', '.jsx']

const FUNCTION_COMPONENT =
  /export\s+(?:default\s+)?(?:async\s+)?function\s+[A-Z][\w]*\s*[(<]|export\s+(?:default\s+)?const\s+[A-Z][\w]*\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*(?::[^=]+)?=>/
const JSX = /<[A-Za-z][\w.]*[\s/>]|<>/
const CLASS_COMPONENT = /extends\s+(?:React\.)?(?:Pure)?Component\b/
const STORE_LIBRARY =
  /from\s+['"](redux|zustand|@reduxjs\/toolkit|jotai|valtio|mobx|mobx-react|recoil|@tanstack\/store)['"]/
// The generic argument is allowed because `create<State>(…)` is how the current
// state libraries are called, and a reading that missed it would report every store
// as a utility.
const STORE_DECLARATION =
  /\b(createStore|configureStore|create|atom|proxy|observable)\s*(?:<[^>]*>)?\s*\(/
const HOOK_USE = /\buse(State|Reducer|Effect|Ref|Memo|Callback|Context|SyncExternalStore)\s*[(<]/

export interface ReactDeclaration {
  readonly component: boolean
  readonly classComponent: boolean
  readonly returnsElement: boolean
  readonly declaresStore: boolean
  readonly usesHooks: boolean
}

export function isComponentExtension(file: string): boolean {
  return COMPONENT_EXTENSIONS.some((extension) => file.endsWith(extension))
}

export function readDeclaration(text: string): ReactDeclaration {
  const code = stripComments(text)
  const returnsElement = JSX.test(code)
  const functionLike = FUNCTION_COMPONENT.test(code)

  return {
    component: functionLike && returnsElement,
    classComponent: CLASS_COMPONENT.test(code),
    returnsElement,
    declaresStore: STORE_LIBRARY.test(code) && STORE_DECLARATION.test(code),
    usesHooks: HOOK_USE.test(code),
  }
}
