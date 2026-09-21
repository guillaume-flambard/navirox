import type {
  AppGraphFragment,
  CapabilityNode,
  DependencyNode,
  GraphEdge,
  NodeId,
  ScreenNode,
  UnitNode,
} from '@memolabs-apps/graph'
import { nodeId } from '@memolabs-apps/graph'
import type { SourceInspection } from './types.js'

/**
 * The reading, mapped to graph nodes.
 *
 * This is neutral: it turns what any adapter discovered into the shared model,
 * and it is where the identifier shape lives. It moved here from the adapters at
 * the third adapter, which is the point at which a second and third copy of a
 * fully generic mapping became evidence that the mapping belonged to the core
 * rather than to a framework.
 *
 * What stays in an adapter is discovery: what a component is, which files are
 * units, how a store is declared. Those differ per framework. Turning a reading
 * into nodes does not.
 *
 * Nothing is added that was not read. There is no classification here, no route
 * the adapter did not establish, and no guess.
 */
export function buildFragment(inspection: SourceInspection, adapterId: string): AppGraphFragment {
  const identifier = (file: string, kind: string, key: string): NodeId =>
    nodeId({ adapterId, path: file, kind, key })

  const unitIdBySourceKey = new Map<string, NodeId>()
  const unitSourceBySourceKey = new Map<string, (typeof inspection.units)[number]['source']>()

  for (const unit of inspection.units) {
    const key = `${unit.source.file}::${unit.key}`
    unitIdBySourceKey.set(key, identifier(unit.source.file, unit.kind, unit.key))
    unitSourceBySourceKey.set(key, unit.source)
  }

  const capabilities: CapabilityNode[] = inspection.capabilities.map((capability) => ({
    id: identifier(capability.source.file, 'capability', capability.key),
    capability: capability.capability,
    usage: capability.usage,
    source: capability.source,
  }))

  const capabilityIdByUse = new Map<string, NodeId>()

  inspection.capabilities.forEach((capability, index) => {
    const node = capabilities[index]

    if (node !== undefined) {
      capabilityIdByUse.set(`${capability.source.file}::${capability.key}`, node.id)
    }
  })

  const edges: GraphEdge[] = []

  for (const capability of inspection.capabilities) {
    const from = unitIdBySourceKey.get(`${capability.source.file}::${capability.unitKey}`)
    const to = capabilityIdByUse.get(`${capability.source.file}::${capability.key}`)

    if (from !== undefined && to !== undefined && capability.unitKey !== undefined) {
      edges.push({ from, to, kind: 'uses' })
    }
  }

  const units: UnitNode[] = inspection.units.map((unit) => {
    const id = identifier(unit.source.file, unit.kind, unit.key)

    return {
      id,
      kind: unit.kind,
      source: unit.source,
      dependencies: edges.filter((edge) => edge.from === id).map((edge) => edge.to),
      ...(unit.metadata === undefined ? {} : { metadata: unit.metadata }),
    }
  })

  const dependencies: DependencyNode[] = inspection.dependencies.map((dependency) => {
    const file = dependency.source?.file ?? 'package.json'

    return {
      id: identifier(file, 'dependency', dependency.key),
      name: dependency.name,
      ...(dependency.version === undefined ? {} : { version: dependency.version }),
      ...(dependency.source === undefined ? {} : { source: dependency.source }),
    }
  })

  const byId = <T extends { readonly id: NodeId }>(left: T, right: T): number =>
    left.id.localeCompare(right.id)

  const routeScreen = new Map<
    string,
    {
      readonly id: NodeId
      readonly unitId: NodeId
      readonly source: (typeof inspection.units)[number]['source']
    }
  >()

  for (const route of inspection.routes) {
    const unitFile = route.unitFile ?? route.source.file
    const unitKey = route.unitKey ?? 'default'
    const unitSourceKey = `${unitFile}::${unitKey}`
    const unitId = unitIdBySourceKey.get(unitSourceKey)
    const source = unitSourceBySourceKey.get(unitSourceKey)

    if (unitId === undefined || source === undefined) {
      continue
    }

    const screenId = identifier(unitFile, 'screen', unitKey)
    routeScreen.set(route.key, { id: screenId, unitId, source })
  }

  const screens = new Map<NodeId, ScreenNode>()

  for (const route of inspection.routes) {
    const screen = routeScreen.get(route.key)

    if (screen === undefined) {
      continue
    }

    const routeId = identifier(route.source.file, 'route', route.key)
    const existing = screens.get(screen.id)

    screens.set(screen.id, {
      id: screen.id,
      unitId: screen.unitId,
      routeIds: [...(existing?.routeIds ?? []), routeId].sort(),
      source: screen.source,
    })
  }

  return {
    routes: inspection.routes
      .map((route) => {
        const screen = routeScreen.get(route.key)

        return {
          id: identifier(route.source.file, 'route', route.key),
          pathPattern: route.pathPattern,
          ...(screen === undefined ? {} : { screenId: screen.id }),
          ...(route.params === undefined ? {} : { params: route.params }),
          source: route.source,
        }
      })
      .sort(byId),
    screens: [...screens.values()].sort(byId),
    units: units.sort(byId),
    actions: [],
    data: [],
    capabilities: capabilities.sort(byId),
    dependencies: dependencies.sort(byId),
    edges: edges.sort(
      (left, right) => left.from.localeCompare(right.from) || left.to.localeCompare(right.to),
    ),
    findings: [...inspection.findings].sort((left, right) => left.id.localeCompare(right.id)),
  }
}
