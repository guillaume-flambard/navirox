import { Injectable } from '@angular/core'
import { loadRemoteModule } from '@angular-architects/module-federation'

@Injectable({ providedIn: 'root' })
export class PortalExtensionService {
  async load(): Promise<unknown> {
    return loadRemoteModule({
      type: 'module',
      remoteEntry: '/portal/remoteEntry.js',
      exposedModule: './Module',
    })
  }
}
