import type { Algorithm, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  adjacency,
  baseGraph,
  cloneEdgeStates,
  cloneRecord,
  edgeKey,
  formatDistances,
  graphFromInput,
  incompatibilityStep,
  inf,
  label,
  requireNodes,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  getWeightedDemo,
  weightedExampleOptions,
} from '@lib/algorithms/graphAlgorithmExamples'

export const dijkstra: Algorithm = {
  id: 'dijkstra',
  name: 'Dijkstra',
  category: 'Shortest Paths',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function dijkstra(graph, source) {
  const dist = Array(graph.length).fill(Infinity);
  const parent = Array(graph.length).fill(null);
  const visited = new Set();
  dist[source] = 0;

  while (visited.size < graph.length) {
    const u = minUnvisitedVertex(dist, visited);
    visited.add(u);

    for (const edge of graph[u]) {
      const next = dist[u] + edge.weight;
      if (!visited.has(edge.to) && next < dist[edge.to]) {
        dist[edge.to] = next;
        parent[edge.to] = u;
      }
    }
  }

  return { dist, parent };
}`,
  description: `Dijkstra

Dijkstra finds shortest paths from one source in a weighted graph with non-negative edge weights.

Time Complexity: O((V + E) log V)
Space Complexity: O(V)`,
  examples: weightedExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = customGraph
      ? graphFromInput(customGraph, { defaultWeight: true })
      : { ...getWeightedDemo(exampleId), directed: false }
    const { nodes, edges, directed } = demo
    const incompatible = requireNodes(locale, nodes, edges, directed)
    if (incompatible) return incompatible
    const negativeEdge = edges.find((edge) => (edge.weight ?? 1) < 0)
    if (customGraph && negativeEdge) {
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        directed,
        'Dijkstra requires non-negative edge weights. Use Bellman-Ford for graphs with negative weights.',
        'Dijkstra exige des poids non negatifs. Utilisez Bellman-Ford pour les graphes avec poids negatifs.',
      )
    }
    const source = nodes[0].id
    const sourceLabel = label(nodes, source)
    const adj = adjacency(edges, directed)
    const distances: Record<number, number | string> = {}
    const predecessors: Record<number, number | null> = {}
    const visited = new Set<number>()
    const visitedNodes: number[] = []
    const selectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    for (const node of nodes) {
      distances[node.id] = node.id === source ? 0 : inf
      predecessors[node.id] = null
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed,
        currentNode: source,
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, `Initialize distances from ${sourceLabel}`, `Initialiser les distances depuis ${sourceLabel}`),
      }),
      description: d(
        locale,
        `Start at ${sourceLabel}. Its distance is 0; every other vertex is unknown.`,
        `On commence en ${sourceLabel}. Sa distance vaut 0; toutes les autres sont inconnues.`,
      ),
      codeLine: 5,
      variables: { source: sourceLabel, distances: formatDistances(nodes, distances) },
    })

    while (visited.size < nodes.length) {
      let current = -1
      let best = Infinity
      for (const node of nodes) {
        const value = distances[node.id]
        if (!visited.has(node.id) && typeof value === 'number' && value < best) {
          current = node.id
          best = value
        }
      }
      if (current === -1) break

      visited.add(current)
      visitedNodes.push(current)
      if (predecessors[current] != null) selectedEdges.push([predecessors[current]!, current])

      steps.push({
        graph: baseGraph(nodes, edges, {
          visitedNodes: [...visitedNodes],
          currentNode: current,
          currentEdge: null,
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          distances: cloneRecord(distances),
          predecessors: cloneRecord(predecessors),
          phase: d(locale, 'Choose smallest unvisited distance', 'Choisir la plus petite distance non visitee'),
        }),
        description: d(
          locale,
          `Select ${label(nodes, current)} because it has the smallest tentative distance (${best}).`,
          `On selectionne ${label(nodes, current)} car il a la plus petite distance temporaire (${best}).`,
        ),
        codeLine: 8,
        variables: { vertex: label(nodes, current), distance: best },
      })

      // Relaxation is the invariant that turns a tentative distance into a better known path.
      for (const { node: neighbor, weight } of adj[current] ?? []) {
        if (visited.has(neighbor)) continue
        const oldDistance = distances[neighbor]
        const nextDistance = (distances[current] as number) + weight
        const key = edgeKey(current, neighbor)
        const improved = oldDistance === inf || nextDistance < (oldDistance as number)
        edgeStates[key] = improved ? 'relaxed' : 'candidate'

        if (improved) {
          distances[neighbor] = nextDistance
          predecessors[neighbor] = current
        }

        steps.push({
          graph: baseGraph(nodes, edges, {
            visitedNodes: [...visitedNodes],
            currentNode: current,
            currentEdge: [current, neighbor],
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, 'Relax outgoing edges', 'Relacher les aretes sortantes'),
          }),
          description: improved
            ? d(
                locale,
                `Relax ${label(nodes, current)}-${label(nodes, neighbor)}: ${oldDistance} becomes ${nextDistance}.`,
                `Relachement ${label(nodes, current)}-${label(nodes, neighbor)} : ${oldDistance} devient ${nextDistance}.`,
              )
            : d(
                locale,
                `${label(nodes, current)}-${label(nodes, neighbor)} gives ${nextDistance}, so ${label(nodes, neighbor)} stays ${oldDistance}.`,
                `${label(nodes, current)}-${label(nodes, neighbor)} donne ${nextDistance}, donc ${label(nodes, neighbor)} reste a ${oldDistance}.`,
              ),
          codeLine: 13,
          variables: {
            edge: `${label(nodes, current)}-${label(nodes, neighbor)}`,
            candidate: nextDistance,
            distances: formatDistances(nodes, distances),
          },
        })
      }
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        visitedNodes: [...visitedNodes],
        currentNode: null,
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Shortest-path tree complete', 'Arbre des plus courts chemins termine'),
      }),
      description: d(
        locale,
        `Dijkstra is complete. Distances: ${formatDistances(nodes, distances)}.`,
        `Dijkstra est termine. Distances : ${formatDistances(nodes, distances)}.`,
      ),
      codeLine: 20,
      variables: { distances: formatDistances(nodes, distances) },
    })

    return steps
  },
}


