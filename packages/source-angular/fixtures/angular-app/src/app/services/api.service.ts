import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class ApiService {
  async loadRows(): Promise<string[]> {
    const response = await fetch('/api/rows')
    return (await response.json()) as string[]
  }
}
