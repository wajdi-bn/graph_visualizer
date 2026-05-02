import type { Algorithm, GraphEdge, GraphNode, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  adjacency,
  baseGraph,
  cloneRecord,
  graphFromInput,
  isDirectedGraph,
  label,
  palette,
  requireDirectedCustom,
  requireNodes,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  stronglyConnectedExampleOptions,
} from '@lib/algorithms/graphAlgorithmExamples'

export const kosaraju: Algorithm = {
  id: 'kosaraju',
  name: 'Kosaraju',
  category: 'Connectivity',
  difficulty: 'advanced',
  visualization: 'graph',
  code: `function kosaraju(graph) {
  const visited = new Set();
  const order = [];

  for (const vertex of graph.vertices) {
    if (!visited.has(vertex)) dfs1(vertex, visited, order);
  }

  const reversed = reverseEdges(graph);
  visited.clear();
  const components = [];

  while (order.length > 0) {
    const vertex = order.pop();
    if (!visited.has(vertex)) {
      const component = [];
      dfs2(reversed, vertex, visited, component);
      components.push(component);
    }
  }

  return components;
}`,
  description: `Kosaraju

Kosaraju finds strongly connected components in a directed graph with two DFS passes: one for finishing order, and one on the reversed graph.

Time Complexity: O(V + E)
Space Complexity: O(V)`,
  examples: stronglyConnectedExampleOptions,
  generateSteps(locale = 'en', _exampleId, customGraph) {
    let nodes: GraphNode[] = [
      { id: 0, label: 'A', x: 95, y: 85 },
      { id: 1, label: 'B', x: 235, y: 65 },
      { id: 2, label: 'C', x: 175, y: 205 },
      { id: 3, label: 'D', x: 340, y: 130 },
      { id: 4, label: 'E', x: 435, y: 245 },
      { id: 5, label: 'F', x: 280, y: 280 },
    ]
    let edges: GraphEdge[] = [
      { from: 0, to: 1, directed: true },
      { from: 1, to: 2, directed: true },
      { from: 2, to: 0, directed: true },
      { from: 1, to: 3, directed: true },
      { from: 3, to: 4, directed: true },
      { from: 4, to: 5, directed: true },
      { from: 5, to: 3, directed: true },
    ]
    if (customGraph) {
      const custom = graphFromInput(customGraph, { directed: isDirectedGraph(customGraph) })
      const incompatible =
        requireNodes(locale, custom.nodes, custom.edges, custom.directed) ??
        requireDirectedCustom(
          locale,
          customGraph,
          custom.nodes,
          custom.edges,
          'Kosaraju needs a directed graph. Turn on Directed graph in the editor.',
          'Kosaraju exige un graphe oriente. Activez Graphe oriente dans l editeur.',
        )
      if (incompatible) return incompatible
      nodes = custom.nodes
      edges = custom.edges.map((edge) => ({ ...edge, directed: true }))
    }
    const reversedEdges = edges.map((edge) => ({ from: edge.to, to: edge.from, directed: true }))
    const adj = adjacency(edges, true)
    const revAdj = adjacency(reversedEdges, true)
    const visited = new Set<number>()
    const order: number[] = []
    const nodeColors: Record<number, string> = {}
    const steps: Step[] = []

    // First pass records vertices by finish time; the second pass consumes that order on reversed edges.
    const dfs1 = (node: number) => {
      visited.add(node)
      steps.push({
        graph: baseGraph(nodes, edges, {
          directed: true,
          visitedNodes: [...visited],
          currentNode: node,
          order: [...order],
          phase: d(locale, 'First DFS: finishing order', 'Premier DFS : ordre de fin'),
        }),
        description: d(
          locale,
          `First pass visits ${label(nodes, node)}.`,
          `Le premier passage visite ${label(nodes, node)}.`,
        ),
        codeLine: 6,
        variables: { vertex: label(nodes, node), order: order.map((id) => label(nodes, id)).join(', ') },
      })

      for (const { node: neighbor } of adj[node] ?? []) {
        if (!visited.has(neighbor)) dfs1(neighbor)
      }

      order.push(node)
      steps.push({
        graph: baseGraph(nodes, edges, {
          directed: true,
          visitedNodes: [...visited],
          currentNode: node,
          order: [...order],
          phase: d(locale, 'Push after DFS finish', 'Empiler apres la fin du DFS'),
        }),
        description: d(
          locale,
          `${label(nodes, node)} is finished; push it to the order stack.`,
          `${label(nodes, node)} est termine; on l'empile dans l ordre.`,
        ),
        codeLine: 6,
        variables: { pushed: label(nodes, node), order: order.map((id) => label(nodes, id)).join(', ') },
      })
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) dfs1(node.id)
    }

    visited.clear()
    const secondOrder = [...order].reverse()
    const components: number[][] = []

    for (const start of secondOrder) {
      if (visited.has(start)) continue
      const color = palette[components.length % palette.length]
      const stack = [start]
      const component: number[] = []
      visited.add(start)
      nodeColors[start] = color

      while (stack.length > 0) {
        const current = stack.pop()!
        component.push(current)
        for (const { node: neighbor } of revAdj[current] ?? []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            stack.push(neighbor)
            nodeColors[neighbor] = color
          }
        }

        steps.push({
          graph: baseGraph(nodes, reversedEdges, {
            directed: true,
            visitedNodes: [...visited],
            currentNode: current,
            nodeColors: cloneRecord(nodeColors),
            stack: [...stack],
            order: [...secondOrder],
            phase: d(locale, 'Second DFS on reversed graph', 'Second DFS sur le graphe inverse'),
          }),
          description: d(
            locale,
            `On the reversed graph, ${label(nodes, current)} joins SCC ${components.length + 1}.`,
            `Sur le graphe inverse, ${label(nodes, current)} rejoint la CFC ${components.length + 1}.`,
          ),
          codeLine: 16,
          variables: { component: component.map((id) => label(nodes, id)).join(', ') },
        })
      }
      components.push(component)
    }

    return steps
  },
}


