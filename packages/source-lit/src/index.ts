import type { SourceAdapter } from '@memolabs-apps/source'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph } from './graph.js'
import { inspect } from './inspect.js'

export const PACKAGE_NAME = '@memolabs-apps/source-lit'
export const PACKAGE_ROLE =
  'The Lit source adapter: custom elements, reactive properties, and the routes a project declares in code.'

/**
 * `experimental` for the reasons every adapter gives, plus one of its own: Lit has no router of its
 * own, so the route reading is the narrowest of the eleven and it says so.
 */
export function createLitAdapter(): SourceAdapter {
  return {
    id: ADAPTER_ID,
    displayName: DISPLAY_NAME,
    supportLevel: 'experimental',
    testedVersions: [{ framework: FRAMEWORK, versions: TESTED_VERSIONS }],
    detect,
    inspect,
    buildGraph,
  }
}

export { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
export { COMPONENT_EXTENSIONS, isComponentExtension, readDeclaration } from './components.js'
export type { LitDeclaration, LitRegistration } from './components.js'
export { configuresRouter, readRoutes, routePattern } from './routes.js'
export type { FindingDraft, RouteReading } from './routes.js'
export { buildGraph } from './graph.js'
export { inspect } from './inspect.js'
