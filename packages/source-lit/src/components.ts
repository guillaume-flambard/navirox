import { stripComments } from '@navirox/source'

/**
 * A Lit component is a custom element: a class the browser registers under a tag name, with its
 * own shadow root and its own lifecycle. Lit is thin on purpose, so there is no compiler directive
 * to look for and no template dialect to parse. The reading is therefore the class and the
 * registration, because the documentation offers two registration forms and both are legitimate:
 * the `@customElement` decorator, and a direct `customElements.define` call for JavaScript or for
 * projects that do not use decorators.
 *
 * Reactive properties are read as a fact about the class, not as a unit: `@property` and `@state`
 * decorate a field of the element, and a `static properties` block declares one. Lit documents no
 * store module an application imports, so a field that belongs to an element is never reported as
 * shared state.
 */

export const COMPONENT_EXTENSIONS = ['.ts', '.js'] as const

export type LitRegistration = 'decorator' | 'define'

export interface LitDeclaration {
  readonly element: boolean
  readonly registration?: LitRegistration
  readonly tagName?: string
  readonly declaresProperty: boolean
}

const ELEMENT_BASE = /\bclass\s+[A-Za-z_$][\w$]*\s+extends\s+(?:LitElement|ReactiveElement)\b/
const DECORATOR = /@customElement\(\s*['"`]([^'"`]+)['"`]\s*\)/
const DEFINE_CALL = /customElements\.define\(\s*['"`]([^'"`]+)['"`]/
const PROPERTY_DECORATOR = /@(?:property|state)\s*\(/
const STATIC_PROPERTIES = /\bstatic\s+properties\s*=/

/** Type declarations never register an element, so they are not component files. */
export function isComponentExtension(file: string): boolean {
  if (file.endsWith('.d.ts')) {
    return false
  }

  return COMPONENT_EXTENSIONS.some((extension) => file.endsWith(extension))
}

export function readDeclaration(text: string): LitDeclaration {
  const source = stripComments(text)
  const element = ELEMENT_BASE.test(source)
  const decorator = DECORATOR.exec(source)
  const define = DEFINE_CALL.exec(source)
  const tagName = decorator?.[1] ?? define?.[1]
  const registration: LitRegistration | undefined =
    decorator !== null ? 'decorator' : define !== null ? 'define' : undefined

  return {
    element,
    ...(registration === undefined ? {} : { registration }),
    ...(tagName === undefined ? {} : { tagName }),
    declaresProperty: PROPERTY_DECORATOR.test(source) || STATIC_PROPERTIES.test(source),
  }
}
