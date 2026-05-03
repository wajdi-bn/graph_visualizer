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

export const traversalExampleOptions = [
  { id: 'branching', label: { en: 'Branching graph', fr: 'Graphe ramifie' } },
  { id: 'deep', label: { en: 'Deeper graph', fr: 'Graphe plus profond' } },
]

export const pathExampleOptions = [
  { id: 'shortest-chain', label: { en: 'Shortest chain', fr: 'Chaine la plus courte' } },
  { id: 'detour', label: { en: 'Graph with detour', fr: 'Graphe avec detour' } },
]

export const cycleExampleOptions = [
  { id: 'triangle-tail', label: { en: 'Triangle with tail', fr: 'Triangle avec queue' } },
  { id: 'acyclic', label: { en: 'Acyclic graph', fr: 'Graphe sans cycle' } },
]

export const bipartiteExampleOptions = [
  { id: 'bipartite', label: { en: 'Bipartite graph', fr: 'Graphe biparti' } },
  { id: 'odd-cycle', label: { en: 'Odd cycle graph', fr: 'Graphe avec cycle impair' } },
]

export const treeExampleOptions = [
  { id: 'tree', label: { en: 'Tree graph', fr: 'Graphe arbre' } },
  { id: 'non-tree', label: { en: 'Non-tree graph', fr: 'Graphe non arbre' } },
]

export const regularExampleOptions = [
  { id: 'regular', label: { en: 'Regular graph', fr: 'Graphe regulier' } },
  { id: 'irregular', label: { en: 'Irregular graph', fr: 'Graphe non regulier' } },
]

export const flowExampleOptions = [
  { id: 'standard-flow', label: { en: 'Capacity network', fr: 'Reseau de capacites' } },
  { id: 'bottleneck-flow', label: { en: 'Bottleneck network', fr: 'Reseau avec goulot' } },
]

export function getFlowDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'bottleneck-flow') {
    return {
      nodes: [
        { id: 0, label: 'S', x: 70, y: 170 },
        { id: 1, label: 'A', x: 185, y: 85 },
        { id: 2, label: 'B', x: 185, y: 250 },
        { id: 3, label: 'C', x: 320, y: 85 },
        { id: 4, label: 'D', x: 320, y: 250 },
        { id: 5, label: 'T', x: 450, y: 170 },
      ],
      edges: [
        { from: 0, to: 1, weight: 12, directed: true },
        { from: 0, to: 2, weight: 9, directed: true },
        { from: 1, to: 3, weight: 5, directed: true },
        { from: 1, to: 4, weight: 7, directed: true },
        { from: 2, to: 4, weight: 4, directed: true },
        { from: 3, to: 5, weight: 8, directed: true },
        { from: 4, to: 5, weight: 6, directed: true },
      ],
    }
  }

  return {
    nodes: [
      { id: 0, label: 'S', x: 70, y: 170 },
      { id: 1, label: 'A', x: 185, y: 85 },
      { id: 2, label: 'B', x: 185, y: 250 },
      { id: 3, label: 'C', x: 320, y: 85 },
      { id: 4, label: 'D', x: 320, y: 250 },
      { id: 5, label: 'T', x: 450, y: 170 },
    ],
    edges: [
      { from: 0, to: 1, weight: 10, directed: true },
      { from: 0, to: 2, weight: 8, directed: true },
      { from: 1, to: 3, weight: 5, directed: true },
      { from: 1, to: 2, weight: 2, directed: true },
      { from: 1, to: 4, weight: 4, directed: true },
      { from: 2, to: 4, weight: 10, directed: true },
      { from: 3, to: 5, weight: 7, directed: true },
      { from: 4, to: 5, weight: 10, directed: true },
    ],
  }
}

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

export function getTraversalDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'deep') {
    return {
      nodes: [
        { id: 0, label: 'A', x: 95, y: 80 },
        { id: 1, label: 'B', x: 205, y: 65 },
        { id: 2, label: 'C', x: 310, y: 85 },
        { id: 3, label: 'D', x: 155, y: 185 },
        { id: 4, label: 'E', x: 285, y: 200 },
        { id: 5, label: 'F', x: 405, y: 190 },
        { id: 6, label: 'G', x: 235, y: 300 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 0, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 4, to: 6 },
      ],
    }
  }

  return {
    nodes: [
      { id: 0, label: 'A', x: 95, y: 85 },
      { id: 1, label: 'B', x: 225, y: 60 },
      { id: 2, label: 'C', x: 335, y: 105 },
      { id: 3, label: 'D', x: 145, y: 195 },
      { id: 4, label: 'E', x: 260, y: 205 },
      { id: 5, label: 'F', x: 395, y: 175 },
      { id: 6, label: 'G', x: 300, y: 295 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 3 },
      { from: 1, to: 2 },
      { from: 1, to: 4 },
      { from: 2, to: 5 },
      { from: 4, to: 6 },
    ],
  }
}

export function getPathDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'detour') {
    return {
      nodes: [
        { id: 0, label: 'S', x: 70, y: 170 },
        { id: 1, label: 'A', x: 180, y: 90 },
        { id: 2, label: 'B', x: 185, y: 250 },
        { id: 3, label: 'C', x: 315, y: 90 },
        { id: 4, label: 'D', x: 335, y: 250 },
        { id: 5, label: 'T', x: 455, y: 165 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
        { from: 3, to: 5 },
        { from: 4, to: 5 },
      ],
    }
  }

  return {
    nodes: [
      { id: 0, label: 'S', x: 75, y: 170 },
      { id: 1, label: 'A', x: 185, y: 90 },
      { id: 2, label: 'B', x: 185, y: 250 },
      { id: 3, label: 'C', x: 315, y: 90 },
      { id: 4, label: 'D', x: 315, y: 250 },
      { id: 5, label: 'T', x: 450, y: 170 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 5 },
    ],
  }
}

export function getCycleDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'acyclic') {
    return {
      nodes: [
        { id: 0, label: 'A', x: 90, y: 100 },
        { id: 1, label: 'B', x: 210, y: 70 },
        { id: 2, label: 'C', x: 330, y: 120 },
        { id: 3, label: 'D', x: 150, y: 230 },
        { id: 4, label: 'E', x: 300, y: 250 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 3, to: 4 },
      ],
    }
  }

  return {
    nodes: [
      { id: 0, label: 'A', x: 100, y: 90 },
      { id: 1, label: 'B', x: 235, y: 55 },
      { id: 2, label: 'C', x: 355, y: 125 },
      { id: 3, label: 'D', x: 185, y: 225 },
      { id: 4, label: 'E', x: 330, y: 255 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 0 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
    ],
  }
}

export function getBipartiteDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'odd-cycle') {
    return {
      nodes: [
        { id: 0, label: 'A', x: 100, y: 90 },
        { id: 1, label: 'B', x: 240, y: 55 },
        { id: 2, label: 'C', x: 360, y: 115 },
        { id: 3, label: 'D', x: 185, y: 245 },
        { id: 4, label: 'E', x: 335, y: 260 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 0 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
      ],
    }
  }

  return {
    nodes: [
      { id: 0, label: 'A', x: 95, y: 90 },
      { id: 1, label: 'B', x: 220, y: 60 },
      { id: 2, label: 'C', x: 345, y: 90 },
      { id: 3, label: 'D', x: 95, y: 245 },
      { id: 4, label: 'E', x: 220, y: 280 },
      { id: 5, label: 'F', x: 345, y: 245 },
    ],
    edges: [
      { from: 0, to: 4 },
      { from: 0, to: 5 },
      { from: 1, to: 3 },
      { from: 1, to: 5 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
    ],
  }
}

export function getTreeDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'non-tree') {
    return {
      nodes: [
        { id: 0, label: 'A', x: 90, y: 100 },
        { id: 1, label: 'B', x: 220, y: 65 },
        { id: 2, label: 'C', x: 335, y: 110 },
        { id: 3, label: 'D', x: 155, y: 235 },
        { id: 4, label: 'E', x: 310, y: 250 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 0, to: 3 },
        { from: 3, to: 4 },
        { from: 2, to: 4 },
      ],
    }
  }

  return {
    nodes: [
      { id: 0, label: 'A', x: 100, y: 75 },
      { id: 1, label: 'B', x: 220, y: 55 },
      { id: 2, label: 'C', x: 340, y: 80 },
      { id: 3, label: 'D', x: 150, y: 205 },
      { id: 4, label: 'E', x: 290, y: 190 },
      { id: 5, label: 'F', x: 210, y: 295 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 0, to: 3 },
      { from: 1, to: 4 },
      { from: 3, to: 5 },
    ],
  }
}

export function getRegularDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'irregular') {
    return {
      nodes: [
        { id: 0, label: 'A', x: 100, y: 85 },
        { id: 1, label: 'B', x: 225, y: 55 },
        { id: 2, label: 'C', x: 350, y: 85 },
        { id: 3, label: 'D', x: 150, y: 235 },
        { id: 4, label: 'E', x: 300, y: 250 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
        { from: 0, to: 2 },
      ],
    }
  }

  return {
    nodes: [
      { id: 0, label: 'A', x: 100, y: 85 },
      { id: 1, label: 'B', x: 225, y: 55 },
      { id: 2, label: 'C', x: 350, y: 85 },
      { id: 3, label: 'D', x: 350, y: 235 },
      { id: 4, label: 'E', x: 225, y: 275 },
      { id: 5, label: 'F', x: 100, y: 235 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 0 },
    ],
  }
}

