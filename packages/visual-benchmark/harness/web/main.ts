import { createApp } from 'vue'
import FieldWorkflowScreen from '../../../target-vue/fixtures/field-workflow/FieldWorkflowScreen.web.vue'
import RecordsScreen from '../../../target-vue/fixtures/records/RecordsScreen.web.vue'

// The harness serves more than one fixture, so the path decides which screen is
// mounted and the actions query parameter stays the one description of what runs
// before a capture.
const SCREENS: Record<string, object> = {
  '/records': RecordsScreen,
  '/field-work': FieldWorkflowScreen,
}

type RecordedAction = {
  press: string
  nth?: number
}

const readActions = (query: URLSearchParams): RecordedAction[] => {
  const raw = query.get('actions')
  if (raw === null) {
    return []
  }
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('the actions query parameter must be a JSON array')
  }
  return parsed as RecordedAction[]
}

const press = (action: RecordedAction): void => {
  const matches = document.querySelectorAll(`[data-testid="${action.press}"]`)
  const index = action.nth ?? 0
  const target = matches[index]
  if (!(target instanceof HTMLElement)) {
    throw new Error(`action press "${action.press}" found no element at index ${index}`)
  }
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

const screen = SCREENS[window.location.pathname]

if (screen === undefined) {
  throw new Error(`the harness has no fixture for the path ${window.location.pathname}`)
}

createApp(screen).mount('#app')

for (const action of readActions(new URLSearchParams(window.location.search))) {
  press(action)
}
