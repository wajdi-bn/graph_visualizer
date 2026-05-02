import type { Algorithm, GraphEdge, GraphNode, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  adjacency,
  baseGraph,
  edgeKey,
  graphFromInput,
  incompatibilityStep,
  label,
  requireNodes,
  requireUndirectedCustom,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  eulerianExampleOptions,
} from '@lib/algorithms/graphAlgorithmExamples'

export const eulerianPath: Algorithm = {
  id: 'eulerian-path',
  name: 'Eulerian Path',
  category: 'Traversal / Properties',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function eulerianPath(graph, start) {
  const stack = [start];
  const path = [];

  while (stack.length > 0) {
    const u = stack[stack.length - 1];
    const edge = firstUnusedEdge(u);
    if (edge) {
      markUsed(edge);
      stack.push(edge.to);
    } else {
      path.push(stack.pop());
    }
  }

  return path.reverse();
}`,
  description: `Eulerian Path

An Eulerian path uses every edge exactly once. This visualization uses Hierholzer's algorithm on a graph where every vertex has even degree, so the result is an Eulerian circuit.

Time Complexity: O(V + E)
Space Complexity: O(E)`,
  examples: eulerianExampleOptions,
  generateSteps(locale = 'en', _exampleId, customGraph) {
    let nodes: GraphNode[] = [
      { id: 0, label: 'A', x: 95, y: 90 },
      { id: 1, label: 'B', x: 250, y: 55 },
      { id: 2, label: 'C', x: 190, y: 190 },
      { id: 3, label: 'D', x: 335, y: 180 },
      { id: 4, label: 'E', x: 420, y: 285 },
      { id: 5, label: 'F', x: 260, y: 300 },
    ]
    let edges: GraphEdge[] = [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 0 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 2 },
    ]
    if (customGraph) {
      const custom = graphFromInput(customGraph, { directed: false })
      const incompatible =
        requireNodes(locale, custom.nodes, custom.edges, false) ??
        requireUndirectedCustom(
          locale,
          customGraph,
          custom.nodes,
          custom.edges,
          'Eulerian path is implemented here for undirected graphs. Turn off Directed graph in the editor.',
          'Le chemin eulerien est implemente ici pour les graphes non orientes. Desactivez Graphe oriente dans l editeur.',
        )
      if (incompatible) return incompatible
      nodes = custom.nodes
      edges = custom.edges
    }
    const degree: Record<number, number> = {}
    for (const node of nodes) degree[node.id] = 0
    for (const edge of edges) {
      degree[edge.from] = (degree[edge.from] ?? 0) + 1
      degree[edge.to] = (degree[edge.to] ?? 0) + 1
    }
    const oddNodes = nodes.filter((node) => degree[node.id] % 2 === 1)
    const nonIsolatedNodes = nodes.filter((node) => degree[node.id] > 0)
    if (customGraph && oddNodes.length !== 0 && oddNodes.length !== 2) {
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        false,
        'An undirected graph has an Eulerian path only when it has exactly 0 or 2 odd-degree vertices.',
        'Un graphe non oriente a un chemin eulerien seulement avec exactement 0 ou 2 sommets de degre impair.',
      )
    }
    if (customGraph && nonIsolatedNodes.length > 0) {
      const adj = adjacency(edges)
      const reachable = new Set<number>()
      const stack = [nonIsolatedNodes[0].id]
      reachable.add(nonIsolatedNodes[0].id)
      while (stack.length > 0) {
        const current = stack.pop()!
        for (const { node: neighbor } of adj[current] ?? []) {
          if (!reachable.has(neighbor)) {
            reachable.add(neighbor)
            stack.push(neighbor)
          }
        }
      }
      if (nonIsolatedNodes.some((node) => !reachable.has(node.id))) {
        return incompatibilityStep(
          locale,
          nodes,
          edges,
          false,
          'All non-isolated vertices must be connected for an Eulerian path.',
          'Tous les sommets non isoles doivent etre connectes pour un chemin eulerien.',
        )
      }
    }
    const source = oddNodes[0]?.id ?? nonIsolatedNodes[0]?.id ?? nodes[0].id
    const sourceLabel = label(nodes, source)
    const used = new Set<string>()
    const stack = [source]
    const path: number[] = []
    const visitedEdges: [number, number][] = []
    const steps: Step[] = []

    const incident = (node: number) =>
      edges.find((edge) => !used.has(edgeKey(edge.from, edge.to)) && (edge.from === node || edge.to === node))

    steps.push({
      graph: baseGraph(nodes, edges, {
        currentNode: source,
        stack: [...stack],
        order: [...path],
        phase:
          oddNodes.length === 2
            ? d(locale, 'Two odd-degree vertices', 'Deux sommets de degre impair')
            : d(locale, 'All degrees are even', 'Tous les degres sont pairs'),
      }),
      description: d(
        locale,
        oddNodes.length === 2
          ? `Exactly two vertices have odd degree, so an Eulerian path exists. Start at ${sourceLabel}.`
          : `Every non-isolated vertex has even degree, so an Eulerian circuit exists. Start at ${sourceLabel}.`,
        oddNodes.length === 2
          ? `Exactement deux sommets ont un degre impair, donc un chemin eulerien existe. On commence en ${sourceLabel}.`
          : `Chaque sommet non isole a un degre pair, donc un circuit eulerien existe. On commence en ${sourceLabel}.`,
      ),
      codeLine: 2,
      variables: { start: sourceLabel },
    })

    // Hierholzer walks unused edges first, then backtracks vertices into the final circuit/path.
    while (stack.length > 0) {
      const current = stack[stack.length - 1]
      const edge = incident(current)
      if (edge) {
        used.add(edgeKey(edge.from, edge.to))
        const next = edge.from === current ? edge.to : edge.from
        stack.push(next)
        visitedEdges.push([edge.from, edge.to])
        steps.push({
          graph: baseGraph(nodes, edges, {
            visitedEdges: [...visitedEdges],
            selectedEdges: [...visitedEdges],
            currentNode: next,
            currentEdge: [edge.from, edge.to],
            stack: [...stack],
            order: [...path],
            phase: d(locale, 'Walk through unused edges', 'Parcourir les aretes non utilisees'),
          }),
          description: d(
            locale,
            `Use edge ${label(nodes, edge.from)}-${label(nodes, edge.to)} and move to ${label(nodes, next)}.`,
            `Utiliser l arete ${label(nodes, edge.from)}-${label(nodes, edge.to)} et aller vers ${label(nodes, next)}.`,
          ),
          codeLine: 8,
          variables: { stack: stack.map((id) => label(nodes, id)).join(' -> ') },
        })
      } else {
        const done = stack.pop()!
        path.push(done)
        steps.push({
          graph: baseGraph(nodes, edges, {
            visitedEdges: [...visitedEdges],
            selectedEdges: [...visitedEdges],
            currentNode: done,
            stack: [...stack],
            order: [...path],
            phase: d(locale, 'Backtrack into final circuit', 'Retour arriere vers le circuit final'),
          }),
          description: d(
            locale,
            `${label(nodes, done)} has no unused edge left; add it to the circuit.`,
            `${label(nodes, done)} n a plus d arete inutilisee; on l ajoute au circuit.`,
          ),
          codeLine: 12,
          variables: { circuit: [...path].reverse().map((id) => label(nodes, id)).join(' -> ') },
        })
      }
    }

    return steps
  },
}


