import { runInspection } from '@memolabs-apps/inspect'
import { SourceAdapterRegistry } from '@memolabs-apps/source'
import { createVueAdapter, createVueLowering } from '@memolabs-apps/source-vue'
import { createNativeTarget } from '@memolabs-apps/target-native'
import type { TransformDeps } from './transform.js'
import { createVueWorkspaceScaffold } from './vue-workspace.js'

export function createDefaultTransformDeps(): TransformDeps {
  const registry = new SourceAdapterRegistry()
  registry.register(createVueAdapter())

  return {
    inspectPlan: async ({ root }) => {
      const outcome = await runInspection({ rootDir: root, registry })

      if (!outcome.ok) {
        throw new Error(`${outcome.reason}: ${outcome.message}`)
      }

      return {
        adapterId: outcome.report.source.adapterId,
        graph: outcome.report.graph,
        plan: { decisions: [] },
      }
    },
    lower: createVueLowering(),
    emit: createNativeTarget(),
    scaffold: createVueWorkspaceScaffold(),
  }
}
