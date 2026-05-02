import type { Algorithm, GraphEdge, GraphNode, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
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

export const bellman: Algorithm = {
  id: 'bellman',
  name: 'Bellman',
  category: 'Shortest Paths',
  difficulty: 'advanced',
  visualization: 'graph',
  code: `function bellman(edges, vertexCount, source) {
  let previous = Array(vertexCount).fill(Infinity);
  previous[source] = 0;

  for (let k = 1; k < vertexCount; k++) {
    const current = previous.slice();
    for (const { from, to, weight } of edges) {
      current[to] = Math.min(current[to], previous[from] + weight);
    }
    previous = current;
  }

  return previous;
}`,
  description: `Bellman

Bellman's dynamic-programming shortest-path recurrence computes the best distance using at most k edges, then increases k until every simple shortest path is covered.

Time Complexity: O(VE)
Space Complexity: O(V)`,
  examples: negativeWeightedExampleOptions,
  generateSteps(locale = 'en', _exampleId, customGraph) {
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
      const custom = graphFromInput(customGraph, {
        directed: isDirectedGraph(customGraph),
        defaultWeight: true,
      })
      const incompatible = requireDirectedCustom(
        locale,
        customGraph,
        custom.nodes,
        custom.edges,
        'Bellman needs a directed graph. Turn on Directed graph in the editor.',
        'Bellman exige un graphe oriente. Activez Graphe oriente dans l editeur.',
      )
      if (incompatible) return incompatible
      nodes = custom.nodes
      edges = custom.edges.map((edge) => ({ ...edge, directed: true }))
    }
    const source = nodes[0]?.id
    if (source == null) return requireNodes(locale, nodes, edges, true)!
    const sourceLabel = label(nodes, source)
    let previous: Record<number, number | string> = {}
    const predecessors: Record<number, number | null> = {}
    const steps: Step[] = []

    for (const node of nodes) {
      previous[node.id] = node.id === source ? 0 : inf
      predecessors[node.id] = null
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed: true,
        currentNode: source,
        distances: cloneRecord(previous),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'k = 0 edges', 'k = 0 arete'),
      }),
      description: d(
        locale,
        `With at most 0 edges, only the source ${sourceLabel} has distance 0.`,
        `Avec au plus 0 arete, seule la source ${sourceLabel} a une distance de 0.`,
      ),
      codeLine: 3,
      variables: { k: 0, distances: formatDistances(nodes, previous) },
    })

    for (let k = 1; k < nodes.length; k++) {
      const current = { ...previous }
      let changed = false

      for (const edge of edges) {
        const fromValue = previous[edge.from]
        const candidate = fromValue === inf ? inf : (fromValue as number) + (edge.weight ?? 1)
        const oldValue = current[edge.to]
        const improved = candidate !== inf && (oldValue === inf || (candidate as number) < (oldValue as number))

        if (improved) {
          current[edge.to] = candidate
          predecessors[edge.to] = edge.from
          changed = true
        }

        steps.push({
          graph: baseGraph(nodes, edges, {
            directed: true,
            currentNode: edge.from,
            currentEdge: [edge.from, edge.to],
            visitedEdges: Object.entries(predecessors)
              .filter(([, pred]) => pred != null)
              .map(([to, pred]) => [pred as number, Number(to)] as [number, number]),
            selectedEdges: Object.entries(predecessors)
              .filter(([, pred]) => pred != null)
              .map(([to, pred]) => [pred as number, Number(to)] as [number, number]),
            edgeStates: {
              [edgeKey(edge.from, edge.to, true)]: improved ? 'relaxed' : 'candidate',
            },
            distances: cloneRecord(current),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, `k = ${k} edges`, `k = ${k} aretes`),
          }),
          description: improved
            ? d(
                locale,
                `Using at most ${k} edges, ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} improves ${label(nodes, edge.to)} to ${candidate}.`,
                `Avec au plus ${k} aretes, ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} ameliore ${label(nodes, edge.to)} a ${candidate}.`,
              )
            : d(
                locale,
                `${label(nodes, edge.from)} -> ${label(nodes, edge.to)} does not improve the k=${k} row.`,
                `${label(nodes, edge.from)} -> ${label(nodes, edge.to)} n'ameliore pas la ligne k=${k}.`,
              ),
          codeLine: 8,
          variables: { k, candidate: String(candidate), distances: formatDistances(nodes, current) },
        })
      }

      previous = current
      if (!changed) break
    }

    return steps
  },
}


