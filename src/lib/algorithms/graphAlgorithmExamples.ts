import type { GraphEdge, GraphNode } from '@lib/types'

export const weightedNodes: GraphNode[] = [
  { id: 0, label: 'A', x: 90, y: 80 },
  { id: 1, label: 'B', x: 250, y: 45 },
  { id: 2, label: 'C', x: 410, y: 90 },
  { id: 3, label: 'D', x: 135, y: 235 },
  { id: 4, label: 'E', x: 300, y: 210 },
  { id: 5, label: 'F', x: 420, y: 285 },
]

export const weightedEdges: GraphEdge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 3, weight: 2 },
  { from: 1, to: 2, weight: 6 },
  { from: 1, to: 3, weight: 1 },
  { from: 1, to: 4, weight: 5 },
  { from: 2, to: 4, weight: 2 },
  { from: 2, to: 5, weight: 3 },
  { from: 3, to: 4, weight: 8 },
  { from: 4, to: 5, weight: 4 },
]

export const weightedExampleOptions = [
  { id: 'standard', label: { en: 'Standard weighted graph', fr: 'Graphe pondere standard' } },
  { id: 'dense', label: { en: 'Denser graph', fr: 'Graphe plus dense' } },
]

export const negativeWeightedExampleOptions = [
  {
    id: 'negative-directed',
    label: { en: 'Graph with negative weights', fr: 'Graphe avec poids negatifs' },
  },
]

export const stronglyConnectedExampleOptions = [
  { id: 'directed-scc', label: { en: 'Directed SCC graph', fr: 'Graphe oriente CFC' } },
]

export const eulerianExampleOptions = [
  { id: 'eulerian-circuit', label: { en: 'Eulerian circuit', fr: 'Circuit eulerien' } },
]

export const coloringExampleOptions = [
  { id: 'coloring-dense', label: { en: 'Coloring graph', fr: 'Graphe de coloration' } },
]

export function getWeightedDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'dense') {
    return {
      nodes: [
        { id: 0, label: 'A', x: 70, y: 170 },
        { id: 1, label: 'B', x: 170, y: 70 },
        { id: 2, label: 'C', x: 315, y: 65 },
        { id: 3, label: 'D', x: 425, y: 165 },
        { id: 4, label: 'E', x: 185, y: 270 },
        { id: 5, label: 'F', x: 335, y: 275 },
      ],
      edges: [
        { from: 0, to: 1, weight: 2 },
        { from: 0, to: 4, weight: 6 },
        { from: 1, to: 2, weight: 3 },
        { from: 1, to: 4, weight: 4 },
        { from: 1, to: 5, weight: 7 },
        { from: 2, to: 3, weight: 5 },
        { from: 2, to: 5, weight: 1 },
        { from: 3, to: 5, weight: 2 },
        { from: 4, to: 5, weight: 3 },
      ],
    }
  }

  return { nodes: weightedNodes, edges: weightedEdges }
}

export const componentExampleOptions = [
  { id: 'three-components', label: { en: 'Three components', fr: 'Trois composantes' } },
  { id: 'isolated-pairs', label: { en: 'Isolated vertex and pairs', fr: 'Sommet isole et paires' } },
]

export function getComponentDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'isolated-pairs') {
    return {
      nodes: [
        { id: 0, label: 'A', x: 90, y: 90 },
        { id: 1, label: 'B', x: 205, y: 90 },
        { id: 2, label: 'C', x: 350, y: 80 },
        { id: 3, label: 'D', x: 445, y: 165 },
        { id: 4, label: 'E', x: 120, y: 260 },
        { id: 5, label: 'F', x: 285, y: 270 },
        { id: 6, label: 'G', x: 430, y: 275 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 2, to: 3 },
        { from: 5, to: 6 },
      ],
    }
  }

  return {
    nodes: [
      { id: 0, label: 'A', x: 90, y: 80 },
      { id: 1, label: 'B', x: 210, y: 70 },
      { id: 2, label: 'C', x: 150, y: 185 },
      { id: 3, label: 'D', x: 330, y: 85 },
      { id: 4, label: 'E', x: 430, y: 160 },
      { id: 5, label: 'F', x: 315, y: 245 },
      { id: 6, label: 'G', x: 105, y: 295 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 0, to: 2 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ],
  }
}

