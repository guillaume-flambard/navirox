import type { SourceAdapter } from '@memolabs-apps/source'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph } from './graph.js'
import { inspect } from './inspect.js'

export const PACKAGE_NAME = '@memolabs-apps/source-vanilla'
export const PACKAGE_ROLE =
  'The vanilla HTML/CSS/JS source adapter: documents as routes, modules as units, and the absences of a framework reported as absences.'

/**
 * `experimental`, for the reasons every adapter gives plus one of its own: this is the adapter
 * that claims a project by what it does not declare, so its reading is the narrowest of the
 * twelve and says so. It reads documents, modules and capabilities, and it reports the two
 * kinds of code it cannot read rather than inferring a component model, a store or a router the
 * platform does not have.
 */
export function createVanillaAdapter(): SourceAdapter {
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

export {
  ADAPTER_ID,
  DISPLAY_NAME,
  DOCUMENT_EXTENSIONS,
  FRAMEWORK,
  TESTED_VERSIONS,
  isDocument,
  detect,
} from './detect.js'
export { documentPattern, readDocuments, resolveDocumentModule } from './documents.js'
export type { DocumentReading, DocumentScript, FindingDraft } from './documents.js'
export { buildGraph } from './graph.js'
export { inspect } from './inspect.js'
