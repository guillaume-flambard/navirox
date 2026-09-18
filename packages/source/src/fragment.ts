import type {
  AppGraphFragment,
  CapabilityNode,
  DependencyNode,
  GraphEdge,
  NodeId,
  UnitNode,
} from '@navirox/graph'
import { nodeId } from '@navirox/graph'
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

  const unitIdByFile = new Map<string, NodeId>()

  for (const unit of inspection.units) {
    unitIdByFile.set(unit.source.file, identifier(unit.source.file, unit.kind, unit.key))
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
    const from = unitIdByFile.get(capability.source.file)
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

  return {
    routes: inspection.routes
      .map((route) => ({
        id: identifier(route.source.file, 'route', route.key),
        pathPattern: route.pathPattern,
        ...(route.params === undefined ? {} : { params: route.params }),
        source: route.source,
      }))
      .sort(byId),
    screens: [],
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
