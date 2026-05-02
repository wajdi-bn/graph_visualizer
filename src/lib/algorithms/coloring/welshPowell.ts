import type { Algorithm, GraphEdge, GraphNode, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  adjacency,
  baseGraph,
  cloneRecord,
  graphFromInput,
  label,
  palette,
  requireNodes,
  requireUndirectedCustom,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  coloringExampleOptions,
} from '@lib/algorithms/graphAlgorithmExamples'

export const welshPowell: Algorithm = {
  id: 'welsh-powell',
  name: 'Welsh-Powell',
  category: 'Coloring',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function welshPowell(graph) {
  const order = verticesByDescendingDegree(graph);
  const color = {};
  let colorId = 0;

  for (const vertex of order) {
    if (color[vertex]) continue;
    color[vertex] = colorId;
    for (const candidate of order) {
      if (!color[candidate] && isSafe(candidate, colorId, graph, color)) {
        color[candidate] = colorId;
      }
    }
    colorId++;
  }

  return color;
}`,
  description: `Welsh-Powell

Welsh-Powell greedily colors vertices in decreasing degree order, assigning the same color to as many non-adjacent vertices as possible.

Time Complexity: O(V^2)
Space Complexity: O(V)`,
  examples: coloringExampleOptions,
  generateSteps(locale = 'en', _exampleId, customGraph) {
    let nodes: GraphNode[] = [
      { id: 0, label: 'A', x: 110, y: 65 },
      { id: 1, label: 'B', x: 260, y: 55 },
      { id: 2, label: 'C', x: 405, y: 100 },
      { id: 3, label: 'D', x: 95, y: 230 },
      { id: 4, label: 'E', x: 260, y: 190 },
      { id: 5, label: 'F', x: 405, y: 265 },
    ]
    let edges: GraphEdge[] = [
      { from: 0, to: 1 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 1, to: 2 },
      { from: 1, to: 4 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ]
    if (customGraph) {
      const custom = graphFromInput(customGraph, { directed: false })
      const incompatible =
        requireNodes(locale, custom.nodes, custom.edges, false) ??
        requireUndirectedCustom(
          locale,
          customGraph,
          custom.nodes,
          custom.edges,
          'Welsh-Powell coloring is implemented here for undirected graphs. Turn off Directed graph in the editor.',
          'La coloration Welsh-Powell est implementee ici pour les graphes non orientes. Desactivez Graphe oriente dans l editeur.',
        )
      if (incompatible) return incompatible
      nodes = custom.nodes
      edges = custom.edges
    }
    const adj = adjacency(edges)
    const order = [...nodes]
      .sort((a, b) => (adj[b.id]?.length ?? 0) - (adj[a.id]?.length ?? 0))
      .map((node) => node.id)
    const colors: Record<number, string> = {}
    const steps: Step[] = []

    steps.push({
      graph: baseGraph(nodes, edges, {
        order: [...order],
        phase: d(locale, 'Order by decreasing degree', 'Ordonner par degre decroissant'),
      }),
      description: d(
        locale,
        `Order vertices by decreasing degree: ${order.map((id) => label(nodes, id)).join(', ')}.`,
        `Ordonner les sommets par degre decroissant : ${order.map((id) => label(nodes, id)).join(', ')}.`,
      ),
      codeLine: 2,
      variables: { order: order.map((id) => label(nodes, id)).join(', ') },
    })

    let colorIndex = 0
    for (const start of order) {
      if (colors[start]) continue
      const color = palette[colorIndex % palette.length]
      colors[start] = color
      steps.push({
        graph: baseGraph(nodes, edges, {
          currentNode: start,
          nodeColors: cloneRecord(colors),
          order: [...order],
          phase: d(locale, `Color ${colorIndex + 1}`, `Couleur ${colorIndex + 1}`),
        }),
        description: d(
          locale,
          `Assign a new color to ${label(nodes, start)}.`,
          `Assigner une nouvelle couleur a ${label(nodes, start)}.`,
        ),
        codeLine: 7,
        variables: { vertex: label(nodes, start), color: colorIndex + 1 },
      })

      for (const candidate of order) {
        if (colors[candidate]) continue
        const neighbors = new Set((adj[candidate] ?? []).map((entry) => entry.node))
        const safe = Object.entries(colors)
          .filter(([, assigned]) => assigned === color)
          .every(([id]) => !neighbors.has(Number(id)))

        if (safe) colors[candidate] = color

        steps.push({
          graph: baseGraph(nodes, edges, {
            currentNode: candidate,
            nodeColors: cloneRecord(colors),
            order: [...order],
            phase: d(locale, `Color ${colorIndex + 1}`, `Couleur ${colorIndex + 1}`),
          }),
          description: safe
            ? d(
                locale,
                `${label(nodes, candidate)} is not adjacent to this color group, so it gets the same color.`,
                `${label(nodes, candidate)} n est pas adjacent au groupe de cette couleur, donc il recoit la meme couleur.`,
              )
            : d(
                locale,
                `${label(nodes, candidate)} touches this color group, so it must wait for another color.`,
                `${label(nodes, candidate)} touche ce groupe de couleur, donc il attend une autre couleur.`,
              ),
          codeLine: 10,
          variables: { candidate: label(nodes, candidate), safe },
        })
      }
      colorIndex++
    }

    return steps
  },
}


