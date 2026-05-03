import type { GraphEdge, GraphNode, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import { baseGraph, edgeKey, graphFromInput, isDirectedGraph, label } from '@lib/algorithms/graphAlgorithmUtils'

export type EulerianMode = 'path' | 'circuit'

export function getDirectedEulerianDemo(exampleId?: string) {
  const nodes: GraphNode[] = [
    { id: 0, label: 'A', x: 95, y: 90 },
    { id: 1, label: 'B', x: 250, y: 55 },
    { id: 2, label: 'C', x: 190, y: 190 },
    { id: 3, label: 'D', x: 335, y: 180 },
    { id: 4, label: 'E', x: 420, y: 285 },
    { id: 5, label: 'F', x: 260, y: 300 },
  ]

  if (exampleId === 'directed-path') {
    return {
      nodes,
      edges: [
        { from: 2, to: 0, directed: true },
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 5, directed: true },
      ],
    }
  }

  return {
    nodes,
    edges: [
      { from: 0, to: 1, directed: true },
      { from: 1, to: 2, directed: true },
      { from: 2, to: 0, directed: true },
      { from: 2, to: 3, directed: true },
      { from: 3, to: 4, directed: true },
      { from: 4, to: 5, directed: true },
      { from: 5, to: 2, directed: true },
    ],
  }
}

export function directedEulerianInput(customGraph: Parameters<typeof graphFromInput>[0] | undefined, exampleId?: string) {
  if (!customGraph) return { ...getDirectedEulerianDemo(exampleId), directed: true }
  const custom = graphFromInput(customGraph, { directed: isDirectedGraph(customGraph) })
  return {
    nodes: custom.nodes,
    edges: custom.edges.map((edge) => ({ ...edge, directed: custom.directed })),
    directed: custom.directed,
  }
}

export function validateDirectedEulerian(nodes: GraphNode[], edges: GraphEdge[], mode: EulerianMode) {
  const inDegree: Record<number, number> = {}
  const outDegree: Record<number, number> = {}
  for (const node of nodes) {
    inDegree[node.id] = 0
    outDegree[node.id] = 0
  }
  for (const edge of edges) {
    outDegree[edge.from] = (outDegree[edge.from] ?? 0) + 1
    inDegree[edge.to] = (inDegree[edge.to] ?? 0) + 1
  }

  const nonIsolated = nodes.filter((node) => (inDegree[node.id] ?? 0) + (outDegree[node.id] ?? 0) > 0)
  if (nonIsolated.length === 0) {
    return { ok: false, start: null, reason: 'empty' as const, inDegree, outDegree }
  }
  if (!weaklyConnected(nodes, edges, nonIsolated[0].id, nonIsolated.map((node) => node.id))) {
    return { ok: false, start: null, reason: 'disconnected' as const, inDegree, outDegree }
  }

  if (mode === 'circuit') {
    // Directed circuits must enter and leave every non-isolated vertex the same number of times.
    const balanced = nodes.every((node) => inDegree[node.id] === outDegree[node.id])
    return {
      ok: balanced,
      start: balanced ? nonIsolated[0].id : null,
      reason: balanced ? null : 'degree-circuit' as const,
      inDegree,
      outDegree,
    }
  }

  const starts = nodes.filter((node) => (outDegree[node.id] ?? 0) - (inDegree[node.id] ?? 0) === 1)
  const ends = nodes.filter((node) => (inDegree[node.id] ?? 0) - (outDegree[node.id] ?? 0) === 1)
  const balanced = nodes.filter((node) => inDegree[node.id] === outDegree[node.id])
  // A directed path either has one start/end imbalance pair or is actually a circuit.
  const hasPathDegrees = starts.length === 1 && ends.length === 1 && balanced.length === nodes.length - 2
  const hasCircuitDegrees = starts.length === 0 && ends.length === 0 && balanced.length === nodes.length

  return {
    ok: hasPathDegrees || hasCircuitDegrees,
    start: hasPathDegrees ? starts[0].id : hasCircuitDegrees ? nonIsolated[0].id : null,
    reason: hasPathDegrees || hasCircuitDegrees ? null : 'degree-path' as const,
    inDegree,
    outDegree,
  }
}

export function buildDirectedEulerianSteps(
  locale: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  start: number,
  mode: EulerianMode,
) {
  const steps: Step[] = []
  const used = new Set<number>()
  const stack = [start]
  const path: number[] = []
  const visitedEdges: [number, number][] = []
  const adj: Record<number, number[]> = {}
  edges.forEach((edge, index) => {
    adj[edge.from] ??= []
    adj[edge.from].push(index)
  })

  steps.push({
    graph: baseGraph(nodes, edges, {
      directed: true,
      currentNode: start,
      stack: [...stack],
      order: [...path],
      phase: mode === 'circuit'
        ? d(locale, 'Directed Eulerian circuit', 'Circuit eulerien oriente')
        : d(locale, 'Directed Eulerian path', 'Chemin eulerien oriente'),
    }),
    description: d(
      locale,
      `Start Hierholzer's algorithm at ${label(nodes, start)}.`,
      `Demarrer l algorithme de Hierholzer en ${label(nodes, start)}.`,
    ),
    codeLine: 2,
    variables: { start: label(nodes, start) },
  })

  // Hierholzer consumes each directed edge once, then backtracks vertices into the final order.
  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const edgeIndex = (adj[current] ?? []).find((index) => !used.has(index))

    if (edgeIndex != null) {
      const edge = edges[edgeIndex]
      used.add(edgeIndex)
      stack.push(edge.to)
      visitedEdges.push([edge.from, edge.to])
      steps.push({
        graph: baseGraph(nodes, edges, {
          directed: true,
          visitedEdges: [...visitedEdges],
          selectedEdges: [...visitedEdges],
          edgeStates: { [edgeKey(edge.from, edge.to, true)]: 'selected' },
          currentNode: edge.to,
          currentEdge: [edge.from, edge.to],
          stack: [...stack],
          order: [...path],
          phase: d(locale, 'Use an unused outgoing edge', 'Utiliser une arete sortante non utilisee'),
        }),
        description: d(
          locale,
          `Use ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} and move to ${label(nodes, edge.to)}.`,
          `Utiliser ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} et aller vers ${label(nodes, edge.to)}.`,
        ),
        codeLine: 8,
        variables: { stack: stack.map((id) => label(nodes, id)).join(' -> ') },
      })
    } else {
      const done = stack.pop()!
      path.push(done)
      steps.push({
        graph: baseGraph(nodes, edges, {
          directed: true,
          visitedEdges: [...visitedEdges],
          selectedEdges: [...visitedEdges],
          currentNode: done,
          stack: [...stack],
          order: [...path].reverse(),
          phase: d(locale, 'Backtrack into final order', 'Retour arriere vers l ordre final'),
        }),
        description: d(
          locale,
          `${label(nodes, done)} has no unused outgoing edge; add it to the answer.`,
          `${label(nodes, done)} n a plus d arete sortante inutilisee; on l ajoute a la reponse.`,
        ),
        codeLine: 12,
        variables: { result: [...path].reverse().map((id) => label(nodes, id)).join(' -> ') },
      })
    }
  }

  return steps
}

function weaklyConnected(nodes: GraphNode[], edges: GraphEdge[], start: number, requiredIds: number[]) {
  const adj: Record<number, number[]> = {}
  for (const node of nodes) adj[node.id] = []
  for (const edge of edges) {
    adj[edge.from]?.push(edge.to)
    adj[edge.to]?.push(edge.from)
  }

  const required = new Set(requiredIds)
  const visited = new Set<number>([start])
  const stack = [start]
  while (stack.length > 0) {
    const current = stack.pop()!
    for (const next of adj[current] ?? []) {
      if (visited.has(next)) continue
      visited.add(next)
      stack.push(next)
    }
  }

  return [...required].every((id) => visited.has(id))
}
