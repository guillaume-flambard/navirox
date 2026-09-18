import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class RowsService {
  readonly rows = ['one', 'two', 'three']
}
