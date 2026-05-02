import type { Algorithm, GraphEdge, GraphNode, GraphVisualState, Step } from '@lib/types'
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
} from '@lib/algorithms/graphAlgorithmUtils'
import { cycleExampleOptions, getCycleDemo } from '@lib/algorithms/graphAlgorithmExamples'

export const cycleDetection: Algorithm = {
  id: 'cycle-detection',
  name: 'Cycle Detection',
  category: 'Traversal / Properties',
  difficulty: 'easy',
  visualization: 'graph',
  code: `function hasCycle(graph) {
  const visited = new Set();
  const inStack = new Set();

  function dfs(u, parent) {
    visited.add(u);
    inStack.add(u);
    for (const edge of graph[u]) {
      if (!visited.has(edge.to) && dfs(edge.to, u)) return true;
      if (edge.to !== parent && inStack.has(edge.to)) return true;
    }
    inStack.delete(u);
    return false;
  }
}`,
  description: `Cycle Detection

This treatment detects whether the graph contains a cycle. It works on both directed and undirected graphs by tracking the current DFS path.

Time Complexity: O(V + E)
Space Complexity: O(V)`,
  examples: cycleExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = customGraph ? graphFromInput(customGraph) : { ...getCycleDemo(exampleId), directed: false }
    const { nodes, edges, directed } = demo
    const incompatible = requireNodes(locale, nodes, edges, directed)
    if (incompatible) return incompatible

    const adj = adjacency(edges, directed)
    const visited = new Set<number>()
    const inStack = new Set<number>()
    const stack: number[] = []
    const parent: Record<number, number | null> = {}
    const edgeStates: Record<string, GraphVisualState> = {}
    const selectedEdges: [number, number][] = []
    const steps: Step[] = []

    for (const node of nodes) parent[node.id] = null

    const buildCycle = (start: number, current: number) => {
      const cycle: number[] = [start]
      let cursor: number | null = current
      while (cursor != null && cursor !== start) {
        cycle.push(cursor)
        cursor = parent[cursor]
      }
      cycle.push(start)
      return cycle.reverse()
    }

    const dfs = (current: number, previous: number | null): number[] | null => {
      visited.add(current)
      inStack.add(current)
      stack.push(current)

      steps.push({
        graph: baseGraph(nodes, edges, {
          directed,
          currentNode: current,
          visitedNodes: [...visited],
          stack: [...stack],
          order: [...stack],
          edgeStates: cloneEdgeStates(edgeStates),
          selectedEdges: [...selectedEdges],
          phase: d(locale, 'DFS exploration', 'Exploration DFS'),
        }),
        description: d(
          locale,
          `Explore ${label(nodes, current)} while building the DFS path.`,
          `Explorer ${label(nodes, current)} tout en construisant le chemin DFS.`,
        ),
        codeLine: 6,
        variables: { vertex: label(nodes, current) },
      })

      for (const { node: neighbor } of adj[current] ?? []) {
        if (!visited.has(neighbor)) {
          parent[neighbor] = current
          selectedEdges.push([current, neighbor])
          edgeStates[edgeKey(current, neighbor, directed)] = 'selected'
          const found = dfs(neighbor, current)
          if (found) return found
        } else if (directed ? inStack.has(neighbor) : neighbor !== previous && inStack.has(neighbor)) {
          const cycle = buildCycle(neighbor, current)
          selectedEdges.push([current, neighbor])
          edgeStates[edgeKey(current, neighbor, directed)] = 'rejected'
          return cycle
        }
      }

      inStack.delete(current)
      stack.pop()
      return null
    }

    for (const node of nodes) {
      if (visited.has(node.id)) continue
      const cycle = dfs(node.id, null)
      if (cycle) {
        steps.push({
          graph: baseGraph(nodes, edges, {
            directed,
            visitedNodes: [...visited],
            currentNode: cycle[0],
            stack: [...cycle],
            order: [...cycle],
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            labels: { cycle: cycle.map((id) => label(nodes, id)).join(' -> ') },
            phase: d(locale, 'Cycle detected', 'Cycle detecte'),
          }),
          description: d(
            locale,
            `A cycle is found: ${cycle.map((id) => label(nodes, id)).join(' -> ')}.`,
            `Un cycle est detecte : ${cycle.map((id) => label(nodes, id)).join(' -> ')}.`,
          ),
          codeLine: 10,
          variables: { cycle: cycle.map((id) => label(nodes, id)).join(' -> ') },
        })
        return steps
      }
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed,
        visitedNodes: [...visited],
        currentNode: null,
        stack: [],
        order: [...visited],
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        edgeStates: cloneEdgeStates(edgeStates),
        phase: d(locale, 'No cycle found', 'Aucun cycle trouve'),
      }),
      description: d(locale, 'The graph is acyclic.', 'Le graphe est sans cycle.'),
      codeLine: 12,
      variables: { acyclic: true },
    })

    return steps
  },
}