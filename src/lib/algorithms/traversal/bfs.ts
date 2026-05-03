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
  requireNodes,
  requireValidSource,
  resolveSourceNodeId,
} from '@lib/algorithms/graphAlgorithmUtils'
import { getTraversalDemo, traversalExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'

export const bfs: Algorithm = {
  id: 'bfs',
  name: 'Breadth-First Search',
  category: 'Traversal / Properties',
  difficulty: 'easy',
  visualization: 'graph',
  code: `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const parent = Array(graph.length).fill(null);

  while (queue.length > 0) {
    const u = queue.shift();
    for (const edge of graph[u]) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        parent[edge.to] = u;
        queue.push(edge.to);
      }
    }
  }

  return parent;
}`,
  description: `Breadth-First Search

Breadth-First Search explores a graph level by level from a source vertex. It is the standard traversal behind shortest paths in unweighted graphs.

Time Complexity: O(V + E)
Space Complexity: O(V)`,
  examples: traversalExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph, options?: AlgorithmRunOptions) {
    const demo = customGraph ? graphFromInput(customGraph) : { ...getTraversalDemo(exampleId), directed: false }
    const { nodes, edges, directed } = demo
    const incompatible = requireNodes(locale, nodes, edges, directed)
    if (incompatible) return incompatible

    const source = resolveSourceNodeId(nodes, customGraph, options)
    const sourceIssue = requireValidSource(locale, nodes, edges, directed, source)
    if (sourceIssue) return sourceIssue
    if (source == null) return []

    const adj = adjacency(edges, directed)
    const visited = new Set<number>([source])
    const queue = [source]
    const order: number[] = []
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
        currentNode: source,
        queue: [...queue],
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Initialize queue', 'Initialiser la file'),
      }),
      description: d(
        locale,
        `Start BFS from ${label(nodes, source)} and visit neighbors level by level.`,
        `Commencer BFS depuis ${label(nodes, source)} et visiter les voisins niveau par niveau.`,
      ),
      codeLine: 2,
      variables: { source: label(nodes, source) },
    })

    while (queue.length > 0) {
      const current = queue.shift()!
      order.push(current)

      steps.push({
        graph: baseGraph(nodes, edges, {
          directed,
          sourceNodeId: source,
          currentNode: current,
          visitedNodes: [...visited],
          queue: [...queue],
          stack: [...queue],
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          order: [...order],
          distances: cloneRecord(distances),
          predecessors: cloneRecord(predecessors),
          phase: d(locale, 'Dequeue vertex', 'Defiler un sommet'),
        }),
        description: d(
          locale,
          `Visit ${label(nodes, current)} and inspect its neighbors.`,
          `Visiter ${label(nodes, current)} et inspecter ses voisins.`,
        ),
        codeLine: 8,
        variables: { vertex: label(nodes, current), queue: queue.map((id) => label(nodes, id)).join(', ') },
      })

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
            currentNode: current,
            currentEdge: [current, neighbor],
            visitedNodes: [...visited],
            queue: [...queue],
            stack: [...queue],
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, 'Enqueue unseen neighbors', 'Enfiler les voisins non visites'),
          }),
          description: d(
            locale,
            `Discover ${label(nodes, neighbor)} from ${label(nodes, current)} and add it to the queue.`,
            `Decouvrir ${label(nodes, neighbor)} depuis ${label(nodes, current)} et l'ajouter a la file.`,
          ),
          codeLine: 12,
          variables: { neighbor: label(nodes, neighbor), distance: distances[neighbor] },
        })
      }
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed,
        sourceNodeId: source,
        visitedNodes: [...visited],
        currentNode: null,
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        edgeStates: cloneEdgeStates(edgeStates),
        order: [...order],
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Traversal complete', 'Parcours termine'),
      }),
      description: d(
        locale,
        `BFS finishes after exploring the vertices in this order: ${order.map((id) => label(nodes, id)).join(', ')}.`,
        `BFS se termine apres avoir explore les sommets dans cet ordre : ${order.map((id) => label(nodes, id)).join(', ')}.`,
      ),
      codeLine: 18,
      variables: { order: order.map((id) => label(nodes, id)).join(', ') },
    })

    return steps
  },
}
