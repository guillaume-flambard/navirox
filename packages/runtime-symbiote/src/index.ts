import { PACKAGE_NAME as SEAM_PACKAGE_NAME } from '@navirox/runtime'

/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@navirox/runtime-symbiote'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'The Symbiote-backed implementation of the runtime seam. The only package allowed to import @symbiote-native/*.'

/** The package this one is built on. Every public Navirox package sits on the
 *  runtime seam rather than on a concrete runtime. */
export const BUILT_ON: string = SEAM_PACKAGE_NAME
