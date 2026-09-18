import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly namespace = 'fixture'

  storage(): Storage {
    return localStorage
  }
}
