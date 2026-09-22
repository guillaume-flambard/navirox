/**
 * The fixed synthetic record set for the field workflow fixture.
 *
 * Everything here was invented for this project: no benchmark record, no copied
 * interface, no customer data, no real instance. The set is fixed on purpose, so
 * a test can assert the fixture used exactly this data and nothing else.
 */

export interface FieldRecord {
  readonly id: number
  readonly title: string
  readonly status: string
  readonly notes: string
}

export const FIELD_RECORDS: readonly FieldRecord[] = [
  { id: 1, title: 'North pump station', status: 'new', notes: 'Filter change due' },
  { id: 2, title: 'River meter', status: 'in progress', notes: 'Seal replaced' },
]

export const FIELD_STATUSES: readonly string[] = ['new', 'in progress', 'done']

export const FIELD_NOTES: readonly string[] = [
  'Filter change due',
  'Filter replaced',
  'Site secure',
]

/**
 * The one attachment the workflow can add. The asset beside this module was
 * drawn for this project and contains no reference to an outside source.
 */
export const FIELD_ATTACHMENT = {
  name: 'site-photo.svg',
  label: 'Photo attached',
} as const
