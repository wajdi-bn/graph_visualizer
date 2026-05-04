import type { GraphEdge, GraphNode, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import { adjacency, baseGraph, edgeKey, label } from '@lib/algorithms/graphAlgorithmUtils'

export type UndirectedEulerianMode = 'path' | 'circuit'

export function validateUndirectedEulerian(
  nodes: GraphNode[],
  edges: GraphEdge[],
  mode: UndirectedEulerianMode,
) {
  const degrees: Record<number, number> = {}
  for (const node of nodes) degrees[node.id] = 0
  for (const edge of edges) {
    degrees[edge.from] = (degrees[edge.from] ?? 0) + 1
    degrees[edge.to] = (degrees[edge.to] ?? 0) + 1
  }

  const nonIsolated = nodes.filter((node) => (degrees[node.id] ?? 0) > 0)
  if (nonIsolated.length === 0) {
    return { ok: false, start: null, reason: 'empty' as const, degrees }
  }

  const adj = adjacency(edges, false)
  const visited = new Set<number>()
  const stack = [nonIsolated[0].id]
  visited.add(nonIsolated[0].id)
  while (stack.length > 0) {
    const current = stack.pop()!
    for (const { node: neighbor } of adj[current] ?? []) {
      if (visited.has(neighbor)) continue
      visited.add(neighbor)
      stack.push(neighbor)
    }
  }

  const allConnected = nonIsolated.every((node) => visited.has(node.id))
  if (!allConnected) {
    return { ok: false, start: null, reason: 'disconnected' as const, degrees }
  }

  const oddNodes = nodes.filter((node) => (degrees[node.id] ?? 0) % 2 === 1)

  if (mode === 'circuit') {
    const balanced = oddNodes.length === 0
    return {
      ok: balanced,
      start: balanced ? nonIsolated[0].id : null,
      reason: balanced ? null : 'degree-circuit' as const,
      isCircuit: balanced,
      degrees,
    }
  }

  const hasPathDegrees = oddNodes.length === 2 || oddNodes.length === 0
  const start = oddNodes.length === 2 ? oddNodes[0].id : nonIsolated[0].id

  return {
    ok: hasPathDegrees,
    start: hasPathDegrees ? start : null,
    reason: hasPathDegrees ? null : 'degree-path' as const,
    isCircuit: oddNodes.length === 0,
    degrees,
  }
}

export function buildUndirectedEulerianSteps(
  locale: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  start: number,
  mode: UndirectedEulerianMode,
  resultNote?: string,
) {
  const steps: Step[] = []
  const used = new Array(edges.length).fill(false)
  const stack = [start]
  const path: number[] = []
  const visitedEdges: [number, number][] = []
  const adj: Record<number, number[]> = {}

  edges.forEach((edge, index) => {
    adj[edge.from] ??= []
    adj[edge.to] ??= []
    adj[edge.from].push(index)
    adj[edge.to].push(index)
  })

  steps.push({
    graph: baseGraph(nodes, edges, {
      directed: false,
      currentNode: start,
      stack: [...stack],
      order: [...path],
      phase: mode === 'circuit'
        ? d(locale, 'Undirected Eulerian circuit', 'Circuit eulerien non oriente')
        : d(locale, 'Undirected Eulerian path', 'Chemin eulerien non oriente'),
    }),
    description: d(
      locale,
      `Start Hierholzer's algorithm at ${label(nodes, start)}.`,
      `Demarrer l algorithme de Hierholzer en ${label(nodes, start)}.`,
    ),
    codeLine: 2,
    variables: { start: label(nodes, start) },
  })

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const edgeIndex = (adj[current] ?? []).find((index) => !used[index])

    if (edgeIndex != null) {
      const edge = edges[edgeIndex]
      used[edgeIndex] = true
      const next = edge.from === current ? edge.to : edge.from
      stack.push(next)
      visitedEdges.push([current, next])

      steps.push({
        graph: baseGraph(nodes, edges, {
          directed: false,
          visitedEdges: [...visitedEdges],
          selectedEdges: [...visitedEdges],
          edgeStates: { [edgeKey(edge.from, edge.to, false)]: 'selected' },
          currentNode: next,
          currentEdge: [current, next],
          stack: [...stack],
          order: [...path],
          phase: d(locale, 'Use an unused edge', 'Utiliser une arete non utilisee'),
        }),
        description: d(
          locale,
          `Use ${label(nodes, current)}-${label(nodes, next)} and move to ${label(nodes, next)}.`,
          `Utiliser ${label(nodes, current)}-${label(nodes, next)} et aller vers ${label(nodes, next)}.`,
        ),
        codeLine: 8,
        variables: { stack: stack.map((id) => label(nodes, id)).join(' -> ') },
      })
    } else {
      const done = stack.pop()!
      path.push(done)
      steps.push({
        graph: baseGraph(nodes, edges, {
          directed: false,
          visitedEdges: [...visitedEdges],
          selectedEdges: [...visitedEdges],
          currentNode: done,
          stack: [...stack],
          order: [...path].reverse(),
          phase: d(locale, 'Backtrack into final order', 'Retour arriere vers l ordre final'),
        }),
        description: d(
          locale,
          `${label(nodes, done)} has no unused edge; add it to the answer.`,
          `${label(nodes, done)} n a plus d arete inutilisee; on l ajoute a la reponse.`,
        ),
        codeLine: 12,
        variables: { result: [...path].reverse().map((id) => label(nodes, id)).join(' -> ') },
      })
    }
  }

  const finalPath = [...path].reverse()
  steps.push({
    graph: baseGraph(nodes, edges, {
      directed: false,
      visitedEdges: [...visitedEdges],
      selectedEdges: [...visitedEdges],
      currentNode: finalPath[finalPath.length - 1] ?? null,
      order: finalPath,
      resultPath: finalPath,
      resultNote,
      phase: mode === 'circuit'
        ? d(locale, 'Eulerian circuit complete', 'Circuit eulerien termine')
        : d(locale, 'Eulerian path complete', 'Chemin eulerien termine'),
    }),
    description: d(
      locale,
      `Final ${mode}: ${finalPath.map((id) => label(nodes, id)).join(' -> ')}.`,
      `Resultat final (${mode === 'circuit' ? 'circuit' : 'chemin'}) : ${finalPath.map((id) => label(nodes, id)).join(' -> ')}.`,
    ),
    variables: { result: finalPath.map((id) => label(nodes, id)).join(' -> ') },
  })

  return steps
}
