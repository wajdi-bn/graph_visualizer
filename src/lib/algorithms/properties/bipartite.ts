import type { Algorithm, GraphEdge, GraphNode, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  adjacency,
  baseGraph,
  cloneRecord,
  edgeKey,
  graphFromInput,
  label,
  requireNodes,
  requireUndirectedCustom,
} from '@lib/algorithms/graphAlgorithmUtils'
import { bipartiteExampleOptions, getBipartiteDemo } from '@lib/algorithms/graphAlgorithmExamples'

export const bipartite: Algorithm = {
  id: 'bipartite-check',
  name: 'Bipartite Check',
  category: 'Traversal / Properties',
  difficulty: 'easy',
  visualization: 'graph',
  code: `function isBipartite(graph) {
  const color = Array(graph.length).fill(null);
  const queue = [];

  for (const start of graph.vertices) {
    if (color[start] != null) continue;
    color[start] = 0;
    queue.push(start);
    while (queue.length > 0) {
      const u = queue.shift();
      for (const edge of graph[u]) {
        if (color[edge.to] == null) color[edge.to] = 1 - color[u];
        else if (color[edge.to] === color[u]) return false;
      }
    }
  }

  return true;
}`,
  description: `Bipartite Check

This treatment colors a graph with two colors using BFS. If an edge ever joins two vertices of the same color, the graph is not bipartite.

Time Complexity: O(V + E)
Space Complexity: O(V)`,
  examples: bipartiteExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = customGraph
      ? graphFromInput(customGraph, { directed: false })
      : { ...getBipartiteDemo(exampleId), directed: false }
    const { nodes, edges } = demo
    const incompatible =
      requireNodes(locale, nodes, edges, false) ??
      requireUndirectedCustom(
        locale,
        customGraph,
        nodes,
        edges,
        'Bipartite checking is implemented here for undirected graphs. Turn off Directed graph in the editor.',
        'Le test de bipartition est implemente ici pour les graphes non orientes. Desactivez Graphe oriente dans l editeur.',
      )
    if (incompatible) return incompatible

    const adj = adjacency(edges)
    const color: Record<number, 0 | 1 | null> = {}
    const nodeColors: Record<number, string> = {}
    const queue: number[] = []
    const steps: Step[] = []

    for (const node of nodes) color[node.id] = null
    const paletteColors = ['#38bdf8', '#fbbf24']

    for (const start of nodes) {
      if (color[start.id] != null) continue
      color[start.id] = 0
      nodeColors[start.id] = paletteColors[0]
      queue.push(start.id)

      steps.push({
        graph: baseGraph(nodes, edges, {
          currentNode: start.id,
          queue: [...queue],
          nodeColors: cloneRecord(nodeColors),
          phase: d(locale, 'Start a new color component', 'Demarrer une nouvelle composante de couleurs'),
        }),
        description: d(
          locale,
          `Color ${label(nodes, start.id)} with the first color and begin BFS.`,
          `Colorer ${label(nodes, start.id)} avec la premiere couleur et commencer BFS.`,
        ),
        codeLine: 4,
        variables: { vertex: label(nodes, start.id) },
      })

      while (queue.length > 0) {
        const current = queue.shift()!
        for (const { node: neighbor } of adj[current] ?? []) {
          if (color[neighbor] == null) {
            color[neighbor] = color[current] === 0 ? 1 : 0
            nodeColors[neighbor] = paletteColors[color[neighbor] ?? 0]
            queue.push(neighbor)

            steps.push({
              graph: baseGraph(nodes, edges, {
                currentNode: current,
                currentEdge: [current, neighbor],
                queue: [...queue],
                nodeColors: cloneRecord(nodeColors),
                edgeStates: { [edgeKey(current, neighbor)]: 'selected' },
                phase: d(locale, 'Assign opposite color', 'Attribuer la couleur opposee'),
              }),
              description: d(
                locale,
                `Assign ${label(nodes, neighbor)} the opposite color of ${label(nodes, current)}.`,
                `Attribuer a ${label(nodes, neighbor)} la couleur opposee a celle de ${label(nodes, current)}.`,
              ),
              codeLine: 10,
              variables: { vertex: label(nodes, neighbor) },
            })
          } else if (color[neighbor] === color[current]) {
            steps.push({
              graph: baseGraph(nodes, edges, {
                currentNode: current,
                currentEdge: [current, neighbor],
                queue: [...queue],
                nodeColors: cloneRecord(nodeColors),
                edgeStates: { [edgeKey(current, neighbor)]: 'rejected' },
                phase: d(locale, 'Conflict detected', 'Conflit detecte'),
              }),
              description: d(
                locale,
                `Edge ${label(nodes, current)}-${label(nodes, neighbor)} connects two vertices of the same color, so the graph is not bipartite.`,
                `L'arete ${label(nodes, current)}-${label(nodes, neighbor)} relie deux sommets de la meme couleur, donc le graphe n'est pas biparti.`,
              ),
              codeLine: 11,
              variables: { bipartite: false },
            })
            return steps
          }
        }
      }
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        nodeColors: cloneRecord(nodeColors),
        phase: d(locale, 'Graph is bipartite', 'Le graphe est biparti'),
      }),
      description: d(locale, 'The graph can be colored with two colors.', 'Le graphe peut etre colore avec deux couleurs.'),
      codeLine: 14,
      variables: { bipartite: true },
    })

    return steps
  },
}