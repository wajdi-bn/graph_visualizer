import type { Algorithm, AlgorithmRunOptions, GraphEdge, GraphNode, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  buildShortestPathResults,
  cloneEdgeStates,
  cloneRecord,
  edgeKey,
  formatDistances,
  graphFromInput,
  hasNegativeWeightCycle,
  inf,
  isDirectedGraph,
  label,
  requireNodes,
  requireValidSource,
  requireWeightedGraph,
  resolveSourceNodeId,
  incompatibilityStep,
} from '@lib/algorithms/graphAlgorithmUtils'
import { negativeWeightedExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'

type RelaxEdge = Pick<GraphEdge, 'from' | 'to' | 'weight'> & {
  originalFrom: number
  originalTo: number
}

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

  if (canRelaxAgain(edges, dist)) {
    throw new Error('Negative weight cycle');
  }

  return { dist, parent };
}`,
  description: `Bellman-Ford

Bellman-Ford finds shortest paths from a chosen source. Directed graphs may contain positive or negative weights, but no negative-weight cycle. Undirected graphs are accepted only with strictly positive weights.

Time Complexity: O(VE)
Space Complexity: O(V)`,
  examples: negativeWeightedExampleOptions,
  generateSteps(locale = 'en', _exampleId, customGraph, options?: AlgorithmRunOptions) {
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
    let directed = true

    if (customGraph) {
      directed = isDirectedGraph(customGraph)
      const custom = graphFromInput(customGraph, { directed })
      nodes = custom.nodes
      edges = custom.edges.map((edge) => ({ ...edge, directed }))
    }

    const incompatible =
      requireNodes(locale, nodes, edges, directed) ??
      requireWeightedGraph(locale, nodes, edges, directed)
    if (incompatible) return incompatible

    if (!directed) {
      const negativeEdge = edges.find((edge) => (edge.weight ?? 0) < 0)
      if (negativeEdge) {
        return incompatibilityStep(
          locale,
          nodes,
          edges,
          false,
          'Undirected Bellman-Ford does not accept negative weights. Remove negative weights or switch to a directed graph.',
          'Bellman-Ford non oriente n accepte pas les poids negatifs. Retirez les poids negatifs ou passez en graphe oriente.',
        )
      }
    }

    const relaxEdges = buildRelaxEdges(edges, directed)
    if (directed && hasNegativeWeightCycle(nodes, relaxEdges)) {
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        true,
        'Bellman-Ford cannot run on a graph with a negative-weight cycle.',
        'Bellman-Ford ne peut pas s executer sur un graphe avec circuit absorbant.',
      )
    }

    const source = resolveSourceNodeId(nodes, customGraph, options)
    const sourceIssue = requireValidSource(locale, nodes, edges, directed, source)
    if (sourceIssue) return sourceIssue
    if (source == null) return []

    const sourceLabel = label(nodes, source)
    const distances: Record<number, number | string> = {}
    const predecessors: Record<number, number | null> = {}
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    for (const node of nodes) {
      distances[node.id] = node.id === source ? 0 : inf
      predecessors[node.id] = null
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed,
        sourceNodeId: source,
        currentNode: source,
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Initialize distances', 'Initialiser les distances'),
      }),
      description: d(
        locale,
        `Start from source ${sourceLabel}. Bellman-Ford will scan every edge up to V - 1 times.`,
        `On part de la source ${sourceLabel}. Bellman-Ford parcourt toutes les aretes jusqu a V - 1 fois.`,
      ),
      codeLine: 4,
      variables: { source: sourceLabel, distances: formatDistances(nodes, distances) },
    })

    // Each full pass allows shortest paths with one more edge to propagate through the table.
    for (let pass = 1; pass < nodes.length; pass += 1) {
      let changed = false
      for (const edge of relaxEdges) {
        const fromDistance = distances[edge.from]
        const candidate = fromDistance === inf ? inf : (fromDistance as number) + (edge.weight ?? 0)
        const oldDistance = distances[edge.to]
        const improved = candidate !== inf && (oldDistance === inf || (candidate as number) < (oldDistance as number))
        edgeStates[edgeKey(edge.originalFrom, edge.originalTo, directed)] = improved ? 'relaxed' : 'candidate'

        if (improved) {
          distances[edge.to] = candidate
          predecessors[edge.to] = edge.from
          changed = true
        }

        const selectedEdges = predecessorEdges(predecessors)
        steps.push({
          graph: baseGraph(nodes, edges, {
            directed,
            sourceNodeId: source,
            currentNode: edge.from,
            currentEdge: [edge.from, edge.to],
            visitedEdges: selectedEdges,
            selectedEdges,
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
            directed,
            sourceNodeId: source,
            currentNode: null,
            visitedEdges: predecessorEdges(predecessors),
            selectedEdges: predecessorEdges(predecessors),
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

    const pathResults = buildShortestPathResults(nodes, predecessors, distances, source)

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed,
        sourceNodeId: source,
        currentNode: null,
        visitedEdges: predecessorEdges(predecessors),
        selectedEdges: predecessorEdges(predecessors),
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        pathResults,
        phase: d(locale, 'Shortest paths complete', 'Plus courts chemins termines'),
      }),
      description: d(
        locale,
        `Bellman-Ford is complete from ${sourceLabel}. Distances: ${formatDistances(nodes, distances)}.`,
        `Bellman-Ford est termine depuis ${sourceLabel}. Distances : ${formatDistances(nodes, distances)}.`,
      ),
      variables: { source: sourceLabel, distances: formatDistances(nodes, distances) },
    })

    return steps
  },
}

function buildRelaxEdges(edges: GraphEdge[], directed: boolean): RelaxEdge[] {
  return edges.flatMap((edge) => {
    const forward = { ...edge, originalFrom: edge.from, originalTo: edge.to }
    if (directed) return [forward]
    return [
      forward,
      { from: edge.to, to: edge.from, weight: edge.weight, originalFrom: edge.from, originalTo: edge.to },
    ]
  })
}

function predecessorEdges(predecessors: Record<number, number | null>) {
  return Object.entries(predecessors)
    .filter(([, pred]) => pred != null)
    .map(([to, pred]) => [pred as number, Number(to)] as [number, number])
}
