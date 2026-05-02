import type { Algorithm, GraphEdge, GraphNode, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  cloneEdgeStates,
  cloneRecord,
  edgeKey,
  formatDistances,
  graphFromInput,
  inf,
  isDirectedGraph,
  label,
  requireDirectedCustom,
  requireNodes,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  negativeWeightedExampleOptions,
} from '@lib/algorithms/graphAlgorithmExamples'

export const bellmanFord: Algorithm = {
  id: 'bellman-ford',
  name: 'Bellman-Ford',
  category: 'Shortest Paths',
  difficulty: 'advanced',
  visualization: 'graph',
  code: `function bellmanFord(edges, vertexCount, source) {
  const dist = Array(vertexCount).fill(Infinity);
  const parent = Array(vertexCount).fill(null);
  dist[source] = 0;

  for (let pass = 1; pass < vertexCount; pass++) {
    for (const { from, to, weight } of edges) {
      if (dist[from] + weight < dist[to]) {
        dist[to] = dist[from] + weight;
        parent[to] = from;
      }
    }
  }

  return { dist, parent };
}`,
  description: `Bellman-Ford

Bellman-Ford finds shortest paths from a source even when directed edges have negative weights, as long as there is no negative cycle reachable from the source.

Time Complexity: O(VE)
Space Complexity: O(V)`,
  examples: negativeWeightedExampleOptions,
  generateSteps(locale = 'en', _exampleId, customGraph) {
    let nodes: GraphNode[] = [
      { id: 0, label: 'S', x: 70, y: 165 },
      { id: 1, label: 'A', x: 210, y: 65 },
      { id: 2, label: 'B', x: 210, y: 265 },
      { id: 3, label: 'C', x: 370, y: 80 },
      { id: 4, label: 'D', x: 390, y: 250 },
    ]
    let edges: GraphEdge[] = [
      { from: 0, to: 1, weight: 6, directed: true },
      { from: 0, to: 2, weight: 7, directed: true },
      { from: 1, to: 2, weight: 8, directed: true },
      { from: 1, to: 3, weight: 5, directed: true },
      { from: 1, to: 4, weight: -4, directed: true },
      { from: 2, to: 3, weight: -3, directed: true },
      { from: 2, to: 4, weight: 9, directed: true },
      { from: 3, to: 1, weight: -2, directed: true },
      { from: 4, to: 3, weight: 7, directed: true },
    ]
    if (customGraph) {
      const custom = graphFromInput(customGraph, {
        directed: isDirectedGraph(customGraph),
        defaultWeight: true,
      })
      const incompatible = requireDirectedCustom(
        locale,
        customGraph,
        custom.nodes,
        custom.edges,
        'Bellman-Ford needs a directed graph. Turn on Directed graph in the editor.',
        'Bellman-Ford exige un graphe oriente. Activez Graphe oriente dans l editeur.',
      )
      if (incompatible) return incompatible
      nodes = custom.nodes
      edges = custom.edges.map((edge) => ({ ...edge, directed: true }))
    }
    const source = nodes[0]?.id
    if (source == null) return requireNodes(locale, nodes, edges, true)!
    const sourceLabel = label(nodes, source)
    const distances: Record<number, number | string> = {}
    const predecessors: Record<number, number | null> = {}
    const selectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    for (const node of nodes) {
      distances[node.id] = node.id === source ? 0 : inf
      predecessors[node.id] = null
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed: true,
        currentNode: source,
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Initialization', 'Initialisation'),
      }),
      description: d(
        locale,
        `Initialize Bellman-Ford from source ${sourceLabel}.`,
        `Initialiser Bellman-Ford depuis la source ${sourceLabel}.`,
      ),
      codeLine: 4,
      variables: { source: sourceLabel, distances: formatDistances(nodes, distances) },
    })

    // Bellman-Ford repeats full edge scans so improvements can propagate across paths up to V - 1 edges long.
    for (let pass = 1; pass < nodes.length; pass++) {
      let changed = false
      for (const edge of edges) {
        const fromDistance = distances[edge.from]
        const candidate = fromDistance === inf ? inf : (fromDistance as number) + (edge.weight ?? 1)
        const oldDistance = distances[edge.to]
        const improved = candidate !== inf && (oldDistance === inf || (candidate as number) < (oldDistance as number))
        edgeStates[edgeKey(edge.from, edge.to, true)] = improved ? 'relaxed' : 'candidate'

        if (improved) {
          distances[edge.to] = candidate
          predecessors[edge.to] = edge.from
          changed = true
        }

        const selected = Object.entries(predecessors)
          .filter(([, pred]) => pred != null)
          .map(([to, pred]) => [pred as number, Number(to)] as [number, number])
        selectedEdges.splice(0, selectedEdges.length, ...selected)

        steps.push({
          graph: baseGraph(nodes, edges, {
            directed: true,
            currentNode: edge.from,
            currentEdge: [edge.from, edge.to],
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, `Pass ${pass}`, `Passage ${pass}`),
          }),
          description: improved
            ? d(
                locale,
                `Pass ${pass}: ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} improves ${oldDistance} to ${candidate}.`,
                `Passage ${pass} : ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} ameliore ${oldDistance} en ${candidate}.`,
              )
            : d(
                locale,
                `Pass ${pass}: ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} gives ${candidate}; no update.`,
                `Passage ${pass} : ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} donne ${candidate}; pas de mise a jour.`,
              ),
          codeLine: 8,
          variables: {
            pass,
            edge: `${label(nodes, edge.from)}->${label(nodes, edge.to)}`,
            candidate: String(candidate),
            distances: formatDistances(nodes, distances),
          },
        })
      }

      if (!changed) {
        steps.push({
          graph: baseGraph(nodes, edges, {
            directed: true,
            currentNode: null,
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, 'No updates', 'Aucune mise a jour'),
          }),
          description: d(
            locale,
            'No edge relaxed during this pass, so the distances are already stable.',
            'Aucune arete relachee pendant ce passage; les distances sont stables.',
          ),
          codeLine: 14,
          variables: { pass, distances: formatDistances(nodes, distances) },
        })
        break
      }
    }

    return steps
  },
}


