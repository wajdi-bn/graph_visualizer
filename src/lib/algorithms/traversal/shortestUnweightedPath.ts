import type { Algorithm, AlgorithmRunOptions, GraphEdge, GraphNode, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  adjacency,
  baseGraph,
  cloneEdgeStates,
  cloneRecord,
  edgeKey,
  graphFromInput,
  label,
  reconstructPath,
  requireNodes,
  requireValidSink,
  requireValidSource,
  resolveSinkNodeId,
  resolveSourceNodeId,
} from '@lib/algorithms/graphAlgorithmUtils'
import { getPathDemo, pathExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'

export const shortestUnweightedPath: Algorithm = {
  id: 'shortest-unweighted-path',
  name: 'Shortest Unweighted Path',
  category: 'Traversal / Properties',
  difficulty: 'easy',
  visualization: 'graph',
  code: `function shortestUnweightedPath(graph, source, target) {
  const dist = Array(graph.length).fill(Infinity);
  const parent = Array(graph.length).fill(null);
  const queue = [source];
  dist[source] = 0;

  while (queue.length > 0) {
    const u = queue.shift();
    for (const edge of graph[u]) {
      if (dist[edge.to] === Infinity) {
        dist[edge.to] = dist[u] + 1;
        parent[edge.to] = u;
        queue.push(edge.to);
      }
    }
  }

  return parent;
}`,
  description: `Shortest Unweighted Path

This BFS-based treatment reconstructs the shortest chain between a source and a target in an unweighted graph.

Time Complexity: O(V + E)
Space Complexity: O(V)`,
  examples: pathExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph, options?: AlgorithmRunOptions) {
    const demo = customGraph ? graphFromInput(customGraph) : { ...getPathDemo(exampleId), directed: false }
    const { nodes, edges, directed } = demo
    const incompatible = requireNodes(locale, nodes, edges, directed)
    if (incompatible) return incompatible

    const source = resolveSourceNodeId(nodes, customGraph, options)
    const sourceIssue = requireValidSource(locale, nodes, edges, directed, source)
    if (sourceIssue) return sourceIssue
    const target = resolveSinkNodeId(nodes, source, customGraph, options)
    const targetIssue = requireValidSink(locale, nodes, edges, directed, target)
    if (targetIssue) return targetIssue
    if (source == null || target == null) return []

    const adj = adjacency(edges, directed)
    const visited = new Set<number>([source])
    const queue = [source]
    const predecessors: Record<number, number | null> = {}
    const distances: Record<number, number | string> = {}
    const selectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    for (const node of nodes) {
      predecessors[node.id] = null
      distances[node.id] = node.id === source ? 0 : 'inf'
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed,
        sourceNodeId: source,
        sinkNodeId: target,
        currentNode: source,
        queue: [...queue],
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Search shortest chain', 'Chercher la chaine la plus courte'),
      }),
      description: d(
        locale,
        `Search a shortest path from ${label(nodes, source)} to ${label(nodes, target)} with BFS.`,
        `Chercher un plus court chemin de ${label(nodes, source)} a ${label(nodes, target)} avec BFS.`,
      ),
      codeLine: 2,
      variables: { source: label(nodes, source), target: label(nodes, target) },
    })

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === target) break

      for (const { node: neighbor } of adj[current] ?? []) {
        if (visited.has(neighbor)) continue
        visited.add(neighbor)
        queue.push(neighbor)
        predecessors[neighbor] = current
        distances[neighbor] = (distances[current] as number) + 1
        selectedEdges.push([current, neighbor])
        edgeStates[edgeKey(current, neighbor, directed)] = 'selected'

        steps.push({
          graph: baseGraph(nodes, edges, {
            directed,
            sourceNodeId: source,
            sinkNodeId: target,
            currentNode: current,
            currentEdge: [current, neighbor],
            visitedNodes: [...visited],
            queue: [...queue],
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, 'Discover frontier', 'Decouverte de la frontiere'),
          }),
          description: d(
            locale,
            `Reach ${label(nodes, neighbor)} from ${label(nodes, current)} and remember its parent.`,
            `Atteindre ${label(nodes, neighbor)} depuis ${label(nodes, current)} et garder son parent.`,
          ),
          codeLine: 11,
          variables: { vertex: label(nodes, neighbor), distance: distances[neighbor] },
        })
      }
    }

    const path = reconstructPath(predecessors, source, target)
    steps.push({
      graph: baseGraph(nodes, edges, {
        directed,
        sourceNodeId: source,
        sinkNodeId: target,
        visitedNodes: [...visited],
        currentNode: target,
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        edgeStates: cloneEdgeStates(edgeStates),
        order: path,
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Path reconstruction', 'Reconstruction du chemin'),
      }),
      description: path.length > 0
        ? d(
            locale,
            `Shortest path found: ${path.map((id) => label(nodes, id)).join(' -> ')}.`,
            `Chemin le plus court trouve : ${path.map((id) => label(nodes, id)).join(' -> ')}.`,
          )
        : d(
            locale,
            `No path exists between ${label(nodes, source)} and ${label(nodes, target)}.`,
            `Aucun chemin n'existe entre ${label(nodes, source)} et ${label(nodes, target)}.`,
          ),
      codeLine: 18,
      variables: { path: path.map((id) => label(nodes, id)).join(' -> ') || '-', distance: distances[target] },
    })

    return steps
  },
}
