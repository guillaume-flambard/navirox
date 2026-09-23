/**
 * The device-only scenario for the Angular proof companion.
 *
 * The journey has no served web page, so this is not a `VisualScenario`: there
 * is no route, no viewport and no cross-platform comparison to make. The screen
 * itself is emitted by the Angular target compiler. This is the action sequence
 * the device harness drives, and its presses are the identifiers the workflow
 * record declares.
 */
import type { ScenarioCapture } from '../scenario.js'

/** The identifiers every state of the workflow screen renders. */
export const ANGULAR_COMPANION_IDENTIFIERS = [
  'record-workflow-screen',
  'record-workflow-queue',
  'record-workflow-row',
  'record-workflow-select',
] as const

export interface DeviceScenario {
  readonly name: string
  readonly captures: readonly ScenarioCapture[]
}

export const angularCompanionScenario: DeviceScenario = {
  name: 'angular-companion',
  captures: [
    { key: 'rest', moment: 'rest' },
    {
      key: 'first-meaningful',
      moment: 'first-meaningful',
      actions: [{ press: 'record-workflow-select' }],
    },
    {
      key: 'midpoint',
      moment: 'midpoint',
      actions: [
        { press: 'record-workflow-select' },
        { press: 'record-workflow-field' },
        { press: 'record-workflow-status' },
        { press: 'record-workflow-attach' },
      ],
    },
    {
      key: 'settled',
      moment: 'settled',
      actions: [
        { press: 'record-workflow-select' },
        { press: 'record-workflow-field' },
        { press: 'record-workflow-status' },
        { press: 'record-workflow-attach' },
        { press: 'record-workflow-save' },
      ],
    },
    {
      key: 'interrupted',
      moment: 'interrupted',
      actions: [{ press: 'record-workflow-select' }, { press: 'record-workflow-select', nth: 1 }],
    },
  ],
}
