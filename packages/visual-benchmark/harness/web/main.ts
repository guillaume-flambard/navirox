import { createApp } from 'vue'
import RecordsScreen from '../../../target-vue/fixtures/records/RecordsScreen.web.vue'

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

createApp(RecordsScreen).mount('#app')

for (const action of readActions(new URLSearchParams(window.location.search))) {
  press(action)
}
