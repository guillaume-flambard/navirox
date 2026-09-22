/**
 * The workflow rules the field screen follows, kept as plain functions so the
 * same rules can be exercised by a test and carried unchanged into a companion
 * application. The screen imports them; nothing here touches the DOM or a
 * framework, so a native screen can import them exactly as the web screen does.
 */

/** The value after `current` in `values`, wrapping at the end. */
export function nextIn(values: readonly string[], current: string): string {
  const index = values.indexOf(current)
  return values[(index + 1) % values.length] ?? ''
}

/** Whether a record may be saved with this status. */
export function canSave(status: string): boolean {
  return status.trim().length > 0
}

/** What the save reports for this status. */
export function saveOutcome(status: string): 'saved' | 'error' {
  return canSave(status) ? 'saved' : 'error'
}
