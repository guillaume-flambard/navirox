import { stripComments } from '@memolabs-apps/source'

/**
 * What a Qwik module declares, in the terms the framework itself uses.
 *
 * A Qwik component is not a plain function: it is wrapped in `component$`, which
 * is what makes it a lazy, serializable boundary rather than a call the renderer
 * makes. Reading the extension instead would call every `.tsx` file a component
 * and every helper a screen, so the boundary is what is looked for.
 *
 * The state a component uses is reported as a property of that component rather
 * than as a unit of its own. Qwik does not document a store module an
 * application imports: `useStore` and `useSignal` create state INSIDE a
 * component, so a module that calls them is a component, not a store. Calling
 * one a `state-module` would report a component-local object as shared state.
 */

export const COMPONENT_EXTENSIONS: readonly string[] = ['.tsx', '.jsx']

/** `export default component$(() => ...)`, the documented shape of a page. */
const DEFAULT_COMPONENT = /export\s+default\s+component\$\s*\(/

/** `export const Widget = component$(() => ...)`, the documented shape of a component. */
const NAMED_COMPONENT = /export\s+const\s+[A-Z]\w*\s*=\s*component\$\s*\(/

const STORE_CALL = /\buseStore\s*\(/

const SIGNAL_CALL = /\buseSignal\s*\(/

export interface QwikDeclaration {
  readonly component: boolean
  readonly declaresStore: boolean
  readonly usesSignal: boolean
}

export function isComponentExtension(file: string): boolean {
  return COMPONENT_EXTENSIONS.some((extension) => file.endsWith(extension))
}

export function readDeclaration(text: string): QwikDeclaration {
  const source = stripComments(text)
  const component = DEFAULT_COMPONENT.test(source) || NAMED_COMPONENT.test(source)

  return {
    component,
    declaresStore: STORE_CALL.test(source),
    usesSignal: SIGNAL_CALL.test(source),
  }
}
