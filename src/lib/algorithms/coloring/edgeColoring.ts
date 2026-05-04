import type { Algorithm, GraphEdge, GraphNode, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  edgeInstanceKey,
  degreeMap,
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
    const degrees = degreeMap(nodes, edges, false)
    const maxDegree = Math.max(0, ...Object.values(degrees))
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
        `Order edges by how many other edges touch them. Maximum degree Delta = ${maxDegree}.`,
        `Ordonner les aretes selon le nombre d aretes adjacentes. Degre maximum Delta = ${maxDegree}.`,
      ),
      codeLine: 4,
      variables: {
        order: order.map((index) => edgeLabel(nodes, edges[index])).join(', '),
        delta: maxDegree,
      },
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

    const colorPlan =
      colorEdgesWithLimit(edges, order, Math.max(1, maxDegree)) ??
      colorEdgesWithLimit(edges, order, Math.max(1, maxDegree + 1))

    if (!colorPlan) {
      steps.push({
        graph: baseGraph(nodes, edges, {
          phase: d(locale, 'Coloring failed', 'Echec de coloration'),
        }),
        description: d(
          locale,
          'Unable to color edges with Δ or Δ + 1 colors. Please try a smaller graph.',
          'Impossible de colorier les aretes avec Δ ou Δ + 1 couleurs. Essayez un graphe plus petit.',
        ),
      })
      return steps
    }

    for (const edgeIndex of order) {
      const edge = edges[edgeIndex]
      const color = colorPlan.colors[edgeIndex]
      edgeColors[edgeInstanceKey(edge, edgeIndex, false)] = color

      steps.push({
        graph: baseGraph(nodes, edges, {
          currentEdge: [edge.from, edge.to],
          edgeColors: { ...edgeColors },
          phase: d(locale, 'Assign edge color', 'Assigner une couleur d arete'),
        }),
        description: d(
          locale,
          `${edgeLabel(nodes, edge)} receives ${colorName(color)} using at most Delta + 1 colors.`,
          `${edgeLabel(nodes, edge)} recoit ${colorName(color)} avec au plus Delta + 1 couleurs.`,
        ),
        codeLine: 6,
        variables: {
          edge: edgeLabel(nodes, edge),
          color: colorName(color),
        },
      })
    }

    const isValid = isValidEdgeColoring(edges, colorPlan.colors)

    steps.push({
      graph: baseGraph(nodes, edges, {
        edgeColors: { ...edgeColors },
        phase: d(locale, 'Edge coloring complete', 'Coloration des aretes terminee'),
      }),
      description: d(
        locale,
        `All ${edges.length} edges are colored${isValid ? '' : ', but a conflict was detected'}.`,
        `Les ${edges.length} aretes sont coloriees${isValid ? '' : ', mais un conflit a ete detecte'}.`,
      ),
      variables: {
        delta: maxDegree,
        colors: colorPlan.colorCount,
        valid: isValid,
      },
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

function buildColorPalette(limit: number) {
  const colors: string[] = []
  for (let i = 0; i < limit; i += 1) {
    if (i < palette.length) colors.push(palette[i])
    else colors.push(`hsl(${(i * 47) % 360} 84% 58%)`)
  }
  return colors
}

function colorEdgesWithLimit(edges: GraphEdge[], order: number[], limit: number) {
  const neighbors = edges.map((_, index) => adjacentEdgeIndexes(edges, index))
  const colors = new Array<string | null>(edges.length).fill(null)
  const paletteLimit = buildColorPalette(limit)

  const dfs = (pos: number): boolean => {
    if (pos >= order.length) return true
    const edgeIndex = order[pos]
    const forbidden = new Set(
      neighbors[edgeIndex]
        .map((neighborIndex) => colors[neighborIndex])
        .filter((color): color is string => Boolean(color)),
    )

    for (const color of paletteLimit) {
      if (forbidden.has(color)) continue
      colors[edgeIndex] = color
      if (dfs(pos + 1)) return true
      colors[edgeIndex] = null
    }

    return false
  }

  if (!dfs(0)) return null

  return {
    colors: colors.map((color) => color ?? paletteLimit[0]),
    colorCount: limit,
  }
}

function isValidEdgeColoring(edges: GraphEdge[], colors: (string | null)[]) {
  for (let i = 0; i < edges.length; i += 1) {
    for (const j of adjacentEdgeIndexes(edges, i)) {
      if (i === j) continue
      if (colors[i] && colors[i] === colors[j]) return false
    }
  }
  return true
}

function edgeLabel(nodes: GraphNode[], edge: GraphEdge) {
  return `${label(nodes, edge.from)}-${label(nodes, edge.to)}`
}

function colorName(color: string) {
  const index = palette.indexOf(color)
  return index >= 0 ? `C${index + 1}` : color
}
