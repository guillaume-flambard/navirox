import { Injectable, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class RecordService {
  readonly current = signal<Record<string, unknown> | undefined>(undefined)

  async load(id: string): Promise<void> {
    const response = await fetch(`/api/records/${id}`)

    this.current.set((await response.json()) as Record<string, unknown>)
  }
}
