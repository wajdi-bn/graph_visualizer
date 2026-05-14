import type { Algorithm, AlgorithmRunOptions, GraphEdge, GraphNode, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  buildShortestPathResults,
  cloneRecord,
  edgeKey,
  formatDistances,
  graphFromInput,
  hasNegativeWeightCycle,
  incompatibilityStep,
  inf,
  isDirectedGraph,
  label,
  requireNodes,
  requireValidSource,
  requireWeightedGraph,
  resolveSourceNodeId,
  topologicalOrder,
} from '@lib/algorithms/graphAlgorithmUtils'
import { negativeWeightedExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'

export const bellman: Algorithm = {
  id: 'bellman',
  name: 'Bellman',
  category: 'Shortest Paths',
  difficulty: 'advanced',
  visualization: 'graph',
  code: `function dagShortestPaths(graph, source) {
  const order = topologicalSort(graph);
  const dist = Array(graph.vertexCount).fill(Infinity);
  const parent = Array(graph.vertexCount).fill(null);
  dist[source] = 0;

  for (const u of order) {
    for (const edge of graph.outgoing[u]) {
      if (dist[u] + edge.weight < dist[edge.to]) {
        dist[edge.to] = dist[u] + edge.weight;
        parent[edge.to] = u;
      }
    }
  }

  return { dist, parent };
}`,
  description: `Bellman for DAGs

This version computes shortest paths in a directed acyclic graph by relaxing edges in topological order.

Time Complexity: O(V + E)
Space Complexity: O(V)`,
  examples: negativeWeightedExampleOptions,
  generateSteps(locale = 'en', _exampleId, customGraph, options?: AlgorithmRunOptions) {
    let nodes: GraphNode[] = [
      { id: 0, label: 'S', x: 55, y: 170 },
      { id: 1, label: 'A', x: 170, y: 80 },
      { id: 2, label: 'B', x: 185, y: 260 },
      { id: 3, label: 'C', x: 330, y: 165 },
      { id: 4, label: 'T', x: 455, y: 170 },
    ]
    let edges: GraphEdge[] = [
      { from: 0, to: 1, weight: 3, directed: true },
      { from: 0, to: 2, weight: 8, directed: true },
      { from: 1, to: 2, weight: 2, directed: true },
      { from: 1, to: 3, weight: 5, directed: true },
      { from: 1, to: 4, weight: 10, directed: true },
      { from: 2, to: 3, weight: -4, directed: true },
      { from: 2, to: 4, weight: 12, directed: true },
      { from: 3, to: 4, weight: 6, directed: true },
    ]

    if (customGraph) {
      const directedCustom = isDirectedGraph(customGraph)
      const custom = graphFromInput(customGraph, { directed: directedCustom })
      if (!directedCustom) {
        return incompatibilityStep(
          locale,
          custom.nodes,
          custom.edges,
          false,
          'Bellman (DAG) requires a directed graph. Use Bellman-Ford or Dijkstra for undirected graphs.',
          'Bellman (DAG) exige un graphe orienté. Utilisez Bellman-Ford ou Dijkstra pour les graphes non orientés.',
        )
      }

      nodes = custom.nodes
      edges = custom.edges.map((edge) => ({ ...edge, directed: true }))
    }

    const incompatible =
      requireNodes(locale, nodes, edges, true) ??
      requireWeightedGraph(locale, nodes, edges, true)
    if (incompatible) return incompatible

    if (hasNegativeWeightCycle(nodes, edges)) {
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        true,
        'Bellman requires a directed graph with no negative-weight cycle.',
        'Bellman exige un graphe oriente sans circuit absorbant.',
      )
    }

    const order = topologicalOrder(nodes, edges)
    if (!order) {
      // A cycle exists → Bellman DAG is invalid. Block execution with a pedagogical error.
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        true,
        `The graph contains a cycle. The Bellman algorithm used here requires a directed acyclic graph (DAG).

In a DAG, edges are relaxed in topological order — every predecessor is guaranteed to be processed before its successors, making a single pass sufficient and correct.

When a cycle exists, no topological order can be defined, so this algorithm cannot run.

→ To find shortest paths in graphs with cycles:
  • Use Bellman-Ford if the graph may have negative weights.
  • Use Dijkstra if all weights are non-negative.`,
        `Le graphe contient un cycle. L'algorithme Bellman utilisé ici nécessite un graphe acyclique orienté (DAG).

Dans un DAG, les arêtes sont relaxées dans l'ordre topologique — chaque prédécesseur est traité avant ses successeurs, ce qui rend un seul passage suffisant et correct.

Lorsqu'un cycle existe, aucun ordre topologique ne peut être défini, donc cet algorithme ne peut pas s'exécuter.

→ Pour trouver les plus courts chemins dans des graphes avec cycles :
  • Utilisez Bellman-Ford si le graphe peut contenir des poids négatifs.
  • Utilisez Dijkstra si tous les poids sont non négatifs.`,
      )
    }

    const source = resolveSourceNodeId(nodes, customGraph, options)
    const sourceIssue = requireValidSource(locale, nodes, edges, true, source)
    if (sourceIssue) return sourceIssue
    if (source == null) return []

    const distances: Record<number, number | string> = {}
    const predecessors: Record<number, number | null> = {}
    const steps: Step[] = []
    for (const node of nodes) {
      distances[node.id] = node.id === source ? 0 : inf
      predecessors[node.id] = null
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed: true,
        sourceNodeId: source,
        currentNode: source,
        order,
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Topological order', 'Ordre topologique'),
      }),
      description: d(
        locale,
        `The graph is acyclic. Relax vertices in topological order: ${order.map((id) => label(nodes, id)).join(', ')}.`,
        `Le graphe est sans cycle. On relache les sommets dans l ordre topologique : ${order.map((id) => label(nodes, id)).join(', ')}.`,
      ),
      codeLine: 2,
      variables: { source: label(nodes, source), order: order.map((id) => label(nodes, id)).join(', ') },
    })

    // In a DAG, one pass in topological order is enough because every predecessor is processed first.
    for (const current of order) {
      for (const edge of edges.filter((candidate) => candidate.from === current)) {
        const fromValue = distances[edge.from]
        const candidate = fromValue === inf ? inf : (fromValue as number) + (edge.weight ?? 0)
        const oldValue = distances[edge.to]
        const improved = candidate !== inf && (oldValue === inf || (candidate as number) < (oldValue as number))

        if (improved) {
          distances[edge.to] = candidate
          predecessors[edge.to] = edge.from
        }

        const selectedEdges = predecessorEdges(predecessors)
        steps.push({
          graph: baseGraph(nodes, edges, {
            directed: true,
            sourceNodeId: source,
            currentNode: current,
            currentEdge: [edge.from, edge.to],
            visitedEdges: selectedEdges,
            selectedEdges,
            edgeStates: {
              [edgeKey(edge.from, edge.to, true)]: improved ? 'relaxed' : 'candidate',
            },
            order,
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, 'Relax in topological order', 'Relacher dans l ordre topologique'),
          }),
          description: improved
            ? d(
                locale,
                `${label(nodes, edge.from)} -> ${label(nodes, edge.to)} improves ${label(nodes, edge.to)} from ${oldValue} to ${candidate}.`,
                `${label(nodes, edge.from)} -> ${label(nodes, edge.to)} ameliore ${label(nodes, edge.to)} de ${oldValue} a ${candidate}.`,
              )
            : d(
                locale,
                `${label(nodes, edge.from)} -> ${label(nodes, edge.to)} does not improve the current distance.`,
                `${label(nodes, edge.from)} -> ${label(nodes, edge.to)} n ameliore pas la distance courante.`,
              ),
          codeLine: 8,
          variables: { edge: `${label(nodes, edge.from)}->${label(nodes, edge.to)}`, distances: formatDistances(nodes, distances) },
        })
      }
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed: true,
        sourceNodeId: source,
        currentNode: null,
        visitedEdges: predecessorEdges(predecessors),
        selectedEdges: predecessorEdges(predecessors),
        order,
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        pathResults: buildShortestPathResults(nodes, predecessors, distances, source),
        phase: d(locale, 'DAG shortest paths complete', 'Plus courts chemins DAG termines'),
      }),
      description: d(
        locale,
        `Shortest paths from ${label(nodes, source)} are complete. Distances: ${formatDistances(nodes, distances)}.`,
        `Les plus courts chemins depuis ${label(nodes, source)} sont termines. Distances : ${formatDistances(nodes, distances)}.`,
      ),
      variables: { distances: formatDistances(nodes, distances) },
    })

    return steps
  },
}

function predecessorEdges(predecessors: Record<number, number | null>) {
  return Object.entries(predecessors)
    .filter(([, pred]) => pred != null)
    .map(([to, pred]) => [pred as number, Number(to)] as [number, number])
}
