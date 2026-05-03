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

export const dfs: Algorithm = {
  id: 'dfs',
  name: 'Depth-First Search',
  category: 'Traversal / Properties',
  difficulty: 'easy',
  visualization: 'graph',
  code: `function dfs(graph, start) {
  const visited = new Set();
  const stack = [start];

  while (stack.length > 0) {
    const u = stack.pop();
    if (visited.has(u)) continue;
    visited.add(u);
    for (const edge of graph[u].reverse()) {
      if (!visited.has(edge.to)) stack.push(edge.to);
    }
  }
}`,
  description: `Depth-First Search

Depth-First Search follows one branch as far as possible before backtracking. It is the classic traversal used in cycle detection and connectivity routines.

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
    const visited = new Set<number>()
    const stack = [source]
    const order: number[] = []
    const selectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const predecessors: Record<number, number | null> = {}
    const steps: Step[] = []

    for (const node of nodes) predecessors[node.id] = null

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed,
        sourceNodeId: source,
        currentNode: source,
        stack: [...stack],
        order: [...order],
        phase: d(locale, 'Initialize stack', 'Initialiser la pile'),
      }),
      description: d(
        locale,
        `Start DFS from ${label(nodes, source)} and go deep before backtracking.`,
        `Commencer DFS depuis ${label(nodes, source)} et descendre en profondeur avant de revenir en arriere.`,
      ),
      codeLine: 2,
      variables: { source: label(nodes, source) },
    })

    while (stack.length > 0) {
      const current = stack.pop()!
      if (visited.has(current)) continue
      visited.add(current)
      order.push(current)

      steps.push({
        graph: baseGraph(nodes, edges, {
          directed,
          sourceNodeId: source,
          currentNode: current,
          visitedNodes: [...visited],
          stack: [...stack],
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          order: [...order],
          predecessors: cloneRecord(predecessors),
          phase: d(locale, 'Visit vertex', 'Visiter un sommet'),
        }),
        description: d(
          locale,
          `Visit ${label(nodes, current)} and record it in DFS order.`,
          `Visiter ${label(nodes, current)} et l'enregistrer dans l'ordre DFS.`,
        ),
        codeLine: 7,
        variables: { vertex: label(nodes, current), order: order.map((id) => label(nodes, id)).join(', ') },
      })

      const neighbors = [...(adj[current] ?? [])].map((entry) => entry.node).reverse()
      for (const neighbor of neighbors) {
        if (visited.has(neighbor)) continue
        predecessors[neighbor] = current
        stack.push(neighbor)
        selectedEdges.push([current, neighbor])
        edgeStates[edgeKey(current, neighbor, directed)] = 'selected'

        steps.push({
          graph: baseGraph(nodes, edges, {
            directed,
            sourceNodeId: source,
            currentNode: current,
            currentEdge: [current, neighbor],
            visitedNodes: [...visited],
            stack: [...stack],
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            order: [...order],
            predecessors: cloneRecord(predecessors),
            phase: d(locale, 'Push neighbor', 'Empiler un voisin'),
          }),
          description: d(
            locale,
            `Push ${label(nodes, neighbor)} on the stack from ${label(nodes, current)}.`,
            `Empiler ${label(nodes, neighbor)} depuis ${label(nodes, current)}.`,
          ),
          codeLine: 9,
          variables: { neighbor: label(nodes, neighbor), stack: stack.map((id) => label(nodes, id)).join(', ') },
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
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Traversal complete', 'Parcours termine'),
      }),
      description: d(
        locale,
        `DFS finishes after exploring the vertices in this order: ${order.map((id) => label(nodes, id)).join(', ')}.`,
        `DFS se termine apres avoir explore les sommets dans cet ordre : ${order.map((id) => label(nodes, id)).join(', ')}.`,
      ),
      codeLine: 12,
      variables: { order: order.map((id) => label(nodes, id)).join(', ') },
    })

    return steps
  },
}
