import type { Algorithm, GraphEdge, GraphNode, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  edgeInstanceKey,
  graphFromInput,
  label,
  palette,
  requireNodes,
  requireUndirectedCustom,
} from '@lib/algorithms/graphAlgorithmUtils'
import { coloringExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'

export const edgeColoring: Algorithm = {
  id: 'edge-coloring',
  name: 'Edge Coloring',
  category: 'Coloring',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function edgeColoring(graph) {
  const color = {};

  for (const edge of graph.edges) {
    const forbidden = colorsOnAdjacentEdges(edge, color);
    color[edge] = firstAvailableColor(forbidden);
  }

  return color;
}`,
  description: `Edge Coloring

Edge coloring assigns colors to edges so that two edges sharing a vertex do not use the same color.

Time Complexity: O(E^2)
Space Complexity: O(E)`,
  examples: coloringExampleOptions,
  generateSteps(locale = 'en', _exampleId, customGraph) {
    let nodes: GraphNode[] = [
      { id: 0, label: 'A', x: 110, y: 85 },
      { id: 1, label: 'B', x: 250, y: 55 },
      { id: 2, label: 'C', x: 390, y: 85 },
      { id: 3, label: 'D', x: 140, y: 250 },
      { id: 4, label: 'E', x: 250, y: 205 },
      { id: 5, label: 'F', x: 360, y: 250 },
    ]
    let edges: GraphEdge[] = [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 0, to: 3 },
      { from: 1, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 0, to: 4 },
      { from: 2, to: 4 },
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
          'Edge coloring is implemented here for undirected graphs. Turn off Directed graph in the editor.',
          'La coloration des aretes est implementee ici pour les graphes non orientes. Desactivez Graphe oriente dans l editeur.',
        )
      if (incompatible) return incompatible
      nodes = custom.nodes
      edges = custom.edges
    }

    const steps: Step[] = []
    const edgeColors: Record<string, string> = {}
    const order = edges
      .map((edge, index) => ({ index, degree: adjacentEdgeIndexes(edges, index).length, edge }))
      .sort((a, b) => b.degree - a.degree || a.index - b.index)
      .map(({ index }) => index)

    steps.push({
      graph: baseGraph(nodes, edges, {
        phase: d(locale, 'Order edges by conflicts', 'Ordonner les aretes par conflits'),
      }),
      description: d(
        locale,
        `Order edges by how many other edges touch them: ${order.map((index) => edgeLabel(nodes, edges[index])).join(', ')}.`,
        `Ordonner les aretes selon le nombre d aretes qui les touchent : ${order.map((index) => edgeLabel(nodes, edges[index])).join(', ')}.`,
      ),
      codeLine: 4,
      variables: { order: order.map((index) => edgeLabel(nodes, edges[index])).join(', ') },
    })

    if (edges.length === 0) {
      steps.push({
        graph: baseGraph(nodes, edges, {
          edgeColors: { ...edgeColors },
          phase: d(locale, 'No edge to color', 'Aucune arete a colorer'),
        }),
        description: d(locale, 'There are no edges to color.', 'Il n y a aucune arete a colorer.'),
      })
      return steps
    }

    for (const edgeIndex of order) {
      const edge = edges[edgeIndex]
      const adjacent = adjacentEdgeIndexes(edges, edgeIndex)
      const forbidden = new Set(
        adjacent
          .map((index) => edgeColors[edgeInstanceKey(edges[index], index, false)])
          .filter((color): color is string => Boolean(color)),
      )
      const color = firstAvailableColor(forbidden)
      edgeColors[edgeInstanceKey(edge, edgeIndex, false)] = color

      steps.push({
        graph: baseGraph(nodes, edges, {
          currentEdge: [edge.from, edge.to],
          edgeColors: { ...edgeColors },
          phase: d(locale, 'Assign edge color', 'Assigner une couleur d arete'),
        }),
        description: d(
          locale,
          `${edgeLabel(nodes, edge)} cannot reuse ${forbidden.size} adjacent color(s), so it receives the first available color.`,
          `${edgeLabel(nodes, edge)} ne peut pas reutiliser ${forbidden.size} couleur(s) adjacente(s), donc elle recoit la premiere couleur disponible.`,
        ),
        codeLine: 6,
        variables: {
          edge: edgeLabel(nodes, edge),
          forbidden: forbidden.size,
          color: colorName(color),
        },
      })
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        edgeColors: { ...edgeColors },
        phase: d(locale, 'Edge coloring complete', 'Coloration des aretes terminee'),
      }),
      description: d(
        locale,
        `All ${edges.length} edges are colored without adjacent conflicts.`,
        `Les ${edges.length} aretes sont coloriees sans conflit adjacent.`,
      ),
      variables: { colors: new Set(Object.values(edgeColors)).size },
    })

    return steps
  },
}

function adjacentEdgeIndexes(edges: GraphEdge[], edgeIndex: number) {
  const edge = edges[edgeIndex]
  if (!edge) return []
  return edges
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate, index }) =>
      index !== edgeIndex &&
      (candidate.from === edge.from ||
        candidate.from === edge.to ||
        candidate.to === edge.from ||
        candidate.to === edge.to),
    )
    .map(({ index }) => index)
}

function firstAvailableColor(forbidden: Set<string>) {
  const color = palette.find((candidate) => !forbidden.has(candidate))
  if (color) return color
  return `hsl(${(forbidden.size * 47) % 360} 84% 58%)`
}

function edgeLabel(nodes: GraphNode[], edge: GraphEdge) {
  return `${label(nodes, edge.from)}-${label(nodes, edge.to)}`
}

function colorName(color: string) {
  const index = palette.indexOf(color)
  return index >= 0 ? `C${index + 1}` : color
}
