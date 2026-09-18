import type {
  AppGraphFragment,
  CapabilityNode,
  DependencyNode,
  GraphEdge,
  NodeId,
  UnitNode,
} from '@navirox/graph'
import { nodeId } from '@navirox/graph'
import type { SourceInspection } from '@navirox/source'
import { ADAPTER_ID } from './detect.js'

/**
 * Turns a reading into graph nodes.
 *
 * This step adds nothing it did not read. There is no classification here, no
 * guess about what could move, and no route, because the inspection established
 * none. What it does add is shape: identifiers, the edges between a unit and the
 * capabilities it uses, and a stable order.
 *
 * It takes the graph context the contract passes and does not use it: the
 * inspection already carries the source locations. A function may ignore a
 * parameter it does not need, and taking it anyway would be a promise to read
 * the filesystem that this step does not keep.
 */

function identifier(file: string, kind: string, key: string): NodeId {
  return nodeId({ adapterId: ADAPTER_ID, path: file, kind, key })
}

export function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
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

  return Promise.resolve({
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
  })
}
