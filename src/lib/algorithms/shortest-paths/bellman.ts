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
  const pred = graph.predecessors; // list of incoming edges per node
  const succ = graph.successors;   // list of outgoing neighbors per node
  const remaining = graph.indegree.slice();
  const dist = Array(graph.vertexCount).fill(Infinity);
  const parent = Array(graph.vertexCount).fill(null);
  const queue = graph.vertices.filter(v => remaining[v] === 0);

  while (queue.length > 0) {
    const v = queue.shift();

    // Compute d(v) once, when all predecessors are processed
    if (v === source) dist[v] = 0;
    else {
      let best = Infinity;
      let bestPred = null;
      for (const { from, weight } of pred[v]) {
        const cand = dist[from] + weight;
        if (cand < best) { best = cand; bestPred = from; }
      }
      dist[v] = best;
      parent[v] = bestPred;
    }

    for (const u of succ[v]) {
      remaining[u] -= 1;
      if (remaining[u] === 0) queue.push(u);
    }
  }

  return { dist, parent };
}`,
  description: `Bellman for DAGs

This version computes shortest paths in a directed acyclic graph by relaxing edges in a topological order.

Algorithm sketch (DAG, no cycles):
1. Let X be the set of all vertices, and S the set of processed vertices (S starts empty).
2. Repeatedly choose a vertex whose predecessors are all already in S.
3. For that vertex, take the minimum distance computed from its processed predecessors.
4. Add the vertex to S and continue until X = S.

At every step, only a vertex whose predecessors are already processed is handled.

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

    const displayDistances = (finalized: Set<number>) => {
      const snapshot: Record<number, number | string> = {}
      for (const node of nodes) {
        snapshot[node.id] = finalized.has(node.id) ? distances[node.id] : inf
      }
      return snapshot
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

    const predecessorsList: Record<number, { from: number; weight: number }[]> = {}
    const successorsList: Record<number, number[]> = {}
    const remainingPredCount: Record<number, number> = {}

    for (const node of nodes) {
      predecessorsList[node.id] = []
      successorsList[node.id] = []
      remainingPredCount[node.id] = 0
    }

    for (const edge of edges) {
      predecessorsList[edge.to].push({ from: edge.from, weight: edge.weight ?? 0 })
      successorsList[edge.from].push(edge.to)
      remainingPredCount[edge.to] += 1
    }

    const processed = new Set<number>()
    const queue = nodes.filter((node) => remainingPredCount[node.id] === 0).map((node) => node.id)
    if (queue.includes(source)) {
      queue.splice(queue.indexOf(source), 1)
      queue.unshift(source)
    }
    let iteration = 0

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed: true,
        sourceNodeId: source,
        currentNode: queue[0] ?? null,
        visitedNodes: [...processed],
        queue: [...queue],
        order,
        distances: displayDistances(processed),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Choose a ready vertex', 'Choisir un sommet pret'),
      }),
      description: d(
        locale,
        'Process only vertices whose predecessors are already in S (processed set).',
        'On traite uniquement les sommets dont les predecesseurs sont deja dans S (ensemble traite).',
      ),
      codeLine: 6,
      variables: {
        iteration,
        choice: queue.map((id) => label(nodes, id)).join(', '),
        S: [...processed].map((id) => label(nodes, id)).join(', '),
      },
    })

    while (queue.length > 0) {
      const current = queue.shift()!
      processed.add(current)
      iteration += 1

      let bestValue: number | string = inf
      let bestPred: number | null = null
      if (current === source) {
        bestValue = 0
      } else {
        for (const pred of predecessorsList[current]) {
          if (!processed.has(pred.from)) continue
          const predDist = distances[pred.from]
          if (predDist === inf) continue
          const candidate = (predDist as number) + pred.weight
          if (bestValue === inf || candidate < (bestValue as number)) {
            bestValue = candidate
            bestPred = pred.from
          }
        }
      }

      distances[current] = bestValue
      predecessors[current] = bestPred

      const currentEdge = bestPred == null ? null : [bestPred, current]
      const selectedEdges = predecessorEdges(predecessors)

      steps.push({
        graph: baseGraph(nodes, edges, {
          directed: true,
          sourceNodeId: source,
          currentNode: current,
          currentEdge,
          visitedNodes: [...processed],
          visitedEdges: selectedEdges,
          selectedEdges,
          edgeStates: currentEdge
            ? { [edgeKey(currentEdge[0], currentEdge[1], true)]: 'relaxed' }
            : {},
          queue: [...queue],
          order,
          distances: displayDistances(processed),
          predecessors: cloneRecord(predecessors),
          phase: d(locale, 'Finalize vertex distance', 'Finaliser la distance du sommet'),
        }),
        description: d(
          locale,
          bestPred == null
            ? `${label(nodes, current)} is finalized with distance ${bestValue}.`
            : `${label(nodes, current)} takes the minimum from processed predecessors; best is ${label(nodes, bestPred)} -> ${label(nodes, current)} with ${bestValue}.`,
          bestPred == null
            ? `${label(nodes, current)} est finalise avec la distance ${bestValue}.`
            : `${label(nodes, current)} prend le minimum depuis ses predecesseurs traites ; meilleur est ${label(nodes, bestPred)} -> ${label(nodes, current)} avec ${bestValue}.`,
        ),
        codeLine: 12,
        variables: {
          iteration,
          choice: queue.map((id) => label(nodes, id)).join(', '),
          S: [...processed].map((id) => label(nodes, id)).join(', '),
          current: label(nodes, current),
          [`d(${label(nodes, current)})`]: bestValue,
        },
      })

      for (const next of successorsList[current]) {
        remainingPredCount[next] -= 1
        if (remainingPredCount[next] === 0) queue.push(next)
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
        distances: displayDistances(processed),
        predecessors: cloneRecord(predecessors),
        pathResults: buildShortestPathResults(nodes, predecessors, distances, source),
        phase: d(locale, 'DAG shortest paths complete', 'Plus courts chemins DAG termines'),
      }),
      description: d(
        locale,
        `Shortest paths from ${label(nodes, source)} are complete. Distances: ${formatDistances(nodes, distances)}.`,
        `Les plus courts chemins depuis ${label(nodes, source)} sont termines. Distances : ${formatDistances(nodes, distances)}.`,
      ),
      variables: {
        iteration,
        choice: '',
        S: [...processed].map((id) => label(nodes, id)).join(', '),
      },
    })

    return steps
  },
}

function predecessorEdges(predecessors: Record<number, number | null>) {
  return Object.entries(predecessors)
    .filter(([, pred]) => pred != null)
    .map(([to, pred]) => [pred as number, Number(to)] as [number, number])
}
