import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const HERE = dirname(fileURLToPath(import.meta.url))
const MATRIX = join(HERE, '..', '..', '..', 'docs', 'READINESS-MATRIX.md')

const OUTCOMES = ['supported', 'simulated', 'deferred', 'excluded']

const CONDITIONS = [
  'network available',
  'network unavailable',
  'request failure',
  'request recovery',
  'authentication against a real instance',
  'offline queue and synchronization',
  'data residency, retention and audit',
  'crash or restart with unsaved input',
  'device storage for attachments',
  'desktop-only remainder',
  'text scaling',
  'semantic labels',
  'touch targets',
  'contrast',
  'focus and navigation',
]

interface Row {
  readonly condition: string
  readonly outcome: string
  readonly reason: string
}

function rowsOf(section: string): readonly Row[] {
  return section
    .split('\n')
    .filter(
      (line) =>
        line.startsWith('| ') && !line.startsWith('| ---') && !line.startsWith('| Condition'),
    )
    .map((line) => {
      const cells = line.split('|').map((cell) => cell.trim())

      return {
        condition: cells[1] ?? '',
        outcome: cells[2] ?? '',
        reason: cells[3] ?? '',
      }
    })
}

function sectionOf(document: string, heading: string): string {
  const start = document.indexOf(heading)
  const next = document.indexOf('\n## ', start + 1)

  return document.slice(start, next === -1 ? undefined : next)
}

describe('the readiness matrix', () => {
  const document = readFileSync(MATRIX, 'utf8')
  const journeys = [
    {
      name: 'Vue',
      rows: rowsOf(sectionOf(document, '## Vue journey: field record update')),
    },
    {
      name: 'Angular',
      rows: rowsOf(sectionOf(document, '## Angular journey: record update with attachment')),
    },
  ]

  it('declares the four outcomes', () => {
    for (const outcome of OUTCOMES) {
      expect(document).toContain(outcome)
    }
  })

  it('records every condition for both journeys with a valid outcome', () => {
    for (const journey of journeys) {
      expect(journey.rows.length).toBeGreaterThanOrEqual(CONDITIONS.length)

      for (const condition of CONDITIONS) {
        const row = journey.rows.find((entry) => entry.condition === condition)

        expect(row, `${journey.name} is missing the condition ${condition}`).toBeDefined()
        expect(OUTCOMES).toContain(row?.outcome)
      }
    }
  })

  it('cites a command or an artifact for every supported or simulated row', () => {
    for (const journey of journeys) {
      for (const row of journey.rows) {
        if (row.outcome !== 'supported' && row.outcome !== 'simulated') {
          continue
        }

        expect(row.reason, `${journey.name} ${row.condition} cites nothing`).toMatch(
          /docs\/evidence|`|the run report|the captures|the device run|harness|bundle check/i,
        )
      }
    }
  })

  it('names a manual review method for every deferred row', () => {
    for (const journey of journeys) {
      for (const row of journey.rows) {
        if (row.outcome !== 'deferred') {
          continue
        }

        expect(row.reason).toContain('Manual review')
      }
    }
  })

  it('never presents an excluded or deferred condition as supported', () => {
    expect(document).toContain(
      'Nothing deferred or excluded may be presented as a supported capability',
    )

    for (const journey of journeys) {
      for (const row of journey.rows) {
        if (row.outcome === 'supported') {
          expect(row.reason).not.toContain('Manual review')
        }
      }
    }
  })
})
