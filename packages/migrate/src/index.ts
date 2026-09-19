/** Canonical npm name of this package. Kept in code so the import boundary
 *  checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@memolabs-apps/migrate'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'The migration engine: a versioned state file, a transform pipeline, and the writes it performs.'

export { MigrationError, runMigration } from './engine.js'
export type {
  MigrationOptions,
  MigrationReport,
  PlannedWrite,
  SkippedUnit,
  UnresolvedImport,
} from './engine.js'
export { migrationToJson, renderMigration } from './render.js'
export {
  MIGRATION_STATE_SCHEMA_VERSION,
  MigrationStateError,
  emptyState,
  fingerprintOf,
  parseState,
  serializeState,
} from './state.js'
export type { MigrationState, UnitMigrationState } from './state.js'
export { GENERIC_TRANSFORMS, TRANSFORM_FAMILIES, copyMovableUnit } from './transforms.js'
export type { Transform, TransformContext, TransformFamily, TransformWrite } from './transforms.js'
