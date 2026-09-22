import type { VisualScenario } from '../scenario.js'

/**
 * The identifiers every capture of the field-workflow scenario renders. They are
 * the ones the served page and the running application expose in every state, so
 * a capture whose screen did not render fails instead of reaching the
 * comparison, and they are the declared tolerance's identifier list.
 */
export const FIELD_WORKFLOW_IDENTIFIERS = [
  'field-screen',
  'field-list',
  'field-row',
  'field-select',
] as const

/**
 * The acceptance scenario of the Vue proof workflow. It is data, not code: it is
 * validated with the same contract as every other scenario and consumed by the
 * web runner and by the device harness. The ordered actions follow one record
 * from the queue to a saved change, and the interruption clears the status before
 * saving so the failure state the workflow must surface is what the last capture
 * records. Nothing here needs an account, a credential or a real service.
 */
export const fieldWorkflowScenario: VisualScenario = {
  name: 'field-workflow',
  route: '/field-work',
  dataStatus: 'ready',
  viewportWidth: 390,
  viewportHeight: 844,
  device: 'web-chrome-390x844',
  colourScheme: 'light',
  fontScale: 1,
  reducedMotion: false,
  actions: [],
  masks: [],
  motion: {
    interaction: 'select a record, change the status and save it',
    interruptible: true,
  },
  captures: [
    {
      key: 'rest',
      moment: 'rest',
    },
    {
      key: 'first-meaningful',
      moment: 'first-meaningful',
      actions: [{ press: 'field-select' }],
    },
    {
      key: 'midpoint',
      moment: 'midpoint',
      actions: [
        { press: 'field-select' },
        { press: 'field-status-toggle' },
        { press: 'field-notes-edit' },
        { press: 'field-attach' },
      ],
    },
    {
      key: 'settled',
      moment: 'settled',
      actions: [
        { press: 'field-select' },
        { press: 'field-status-toggle' },
        { press: 'field-notes-edit' },
        { press: 'field-attach' },
        { press: 'field-save' },
      ],
    },
    {
      key: 'interrupted',
      moment: 'interrupted',
      actions: [
        { press: 'field-select' },
        { press: 'field-status-clear' },
        { press: 'field-save' },
      ],
    },
  ],
  tolerance: {
    gridSize: 0.05,
    identifiers: [...FIELD_WORKFLOW_IDENTIFIERS],
  },
}
