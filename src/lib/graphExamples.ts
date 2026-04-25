import type { GraphEdge, GraphNode } from '@lib/types'
import type { Locale } from '@i18n/translations'

type LocalizedText = Record<Locale, string>

export interface GraphExamplePreview {
  nodes: Pick<GraphNode, 'id' | 'label' | 'x' | 'y'>[]
  edges: Pick<GraphEdge, 'from' | 'to' | 'weight' | 'directed'>[]
}

export interface GraphExampleCatalogItem {
  id: string
  label: LocalizedText
  description: LocalizedText
  preview: GraphExamplePreview
  exampleIds: Partial<Record<string, string>>
}

export const graphExampleCatalog: GraphExampleCatalogItem[] = [
  {
    id: 'weighted-positive',
    label: {
      en: 'Positive weighted graph',
      fr: 'Graphe pondere positif',
    },
    description: {
      en: 'Undirected weighted graph with non-negative costs.',
      fr: 'Graphe non oriente avec poids non negatifs.',
    },
    exampleIds: {
      dijkstra: 'standard',
      kruskal: 'standard',
      prim: 'standard',
    },
    preview: {
      nodes: [
        { id: 0, label: 'A', x: 14, y: 14 },
        { id: 1, label: 'B', x: 48, y: 10 },
        { id: 2, label: 'C', x: 84, y: 22 },
        { id: 3, label: 'D', x: 28, y: 50 },
        { id: 4, label: 'E', x: 66, y: 48 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4 },
        { from: 0, to: 3, weight: 2 },
        { from: 1, to: 2, weight: 6 },
        { from: 1, to: 4, weight: 5 },
        { from: 3, to: 4, weight: 8 },
        { from: 2, to: 4, weight: 2 },
      ],
    },
  },
  {
    id: 'weighted-dense',
    label: {
      en: 'Dense graph',
      fr: 'Graphe dense',
    },
    description: {
      en: 'More connected weighted graph for path and tree algorithms.',
      fr: 'Graphe pondere plus connecte pour chemins et arbres.',
    },
    exampleIds: {
      dijkstra: 'dense',
      kruskal: 'dense',
      prim: 'dense',
    },
    preview: {
      nodes: [
        { id: 0, label: 'A', x: 12, y: 34 },
        { id: 1, label: 'B', x: 32, y: 12 },
        { id: 2, label: 'C', x: 62, y: 12 },
        { id: 3, label: 'D', x: 86, y: 34 },
        { id: 4, label: 'E', x: 34, y: 54 },
        { id: 5, label: 'F', x: 68, y: 54 },
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
    },
  },
  {
    id: 'weighted-negative',
    label: {
      en: 'Graph with negative weights',
      fr: 'Graphe avec poids negatifs',
    },
    description: {
      en: 'Directed graph containing negative costs.',
      fr: 'Graphe oriente contenant des couts negatifs.',
    },
    exampleIds: {
      'bellman-ford': 'negative-directed',
      bellman: 'negative-directed',
    },
    preview: {
      nodes: [
        { id: 0, label: 'S', x: 12, y: 32 },
        { id: 1, label: 'A', x: 40, y: 12 },
        { id: 2, label: 'B', x: 42, y: 52 },
        { id: 3, label: 'C', x: 74, y: 18 },
        { id: 4, label: 'D', x: 78, y: 50 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 7, directed: true },
        { from: 1, to: 4, weight: -4, directed: true },
        { from: 2, to: 3, weight: -3, directed: true },
        { from: 3, to: 1, weight: -2, directed: true },
        { from: 4, to: 3, weight: 7, directed: true },
      ],
    },
  },
  {
    id: 'disconnected',
    label: {
      en: 'Disconnected graph',
      fr: 'Graphe non connexe',
    },
    description: {
      en: 'Undirected graph split into several components.',
      fr: 'Graphe non oriente separe en plusieurs composantes.',
    },
    exampleIds: {
      'connected-components': 'three-components',
    },
    preview: {
      nodes: [
        { id: 0, label: 'A', x: 14, y: 16 },
        { id: 1, label: 'B', x: 38, y: 14 },
        { id: 2, label: 'C', x: 28, y: 38 },
        { id: 3, label: 'D', x: 70, y: 18 },
        { id: 4, label: 'E', x: 88, y: 38 },
        { id: 5, label: 'F', x: 58, y: 52 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 0, to: 2 },
        { from: 3, to: 4 },
      ],
    },
  },
  {
    id: 'isolated-pairs',
    label: {
      en: 'Isolated vertex and pairs',
      fr: 'Sommet isole et paires',
    },
    description: {
      en: 'Sparse graph with a single isolated vertex.',
      fr: 'Graphe clairseme avec un sommet isole.',
    },
    exampleIds: {
      'connected-components': 'isolated-pairs',
    },
    preview: {
      nodes: [
        { id: 0, label: 'A', x: 12, y: 16 },
        { id: 1, label: 'B', x: 34, y: 16 },
        { id: 2, label: 'C', x: 58, y: 18 },
        { id: 3, label: 'D', x: 84, y: 28 },
        { id: 4, label: 'E', x: 24, y: 52 },
        { id: 5, label: 'F', x: 68, y: 52 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 2, to: 3 },
        { from: 4, to: 5 },
      ],
    },
  },
  {
    id: 'directed-scc',
    label: {
      en: 'Directed SCC graph',
      fr: 'Graphe oriente CFC',
    },
    description: {
      en: 'Directed graph with strongly connected groups.',
      fr: 'Graphe oriente avec groupes fortement connexes.',
    },
    exampleIds: {
      kosaraju: 'directed-scc',
    },
    preview: {
      nodes: [
        { id: 0, label: 'A', x: 18, y: 16 },
        { id: 1, label: 'B', x: 46, y: 12 },
        { id: 2, label: 'C', x: 32, y: 42 },
        { id: 3, label: 'D', x: 70, y: 26 },
        { id: 4, label: 'E', x: 88, y: 50 },
        { id: 5, label: 'F', x: 58, y: 54 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 1, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 5, directed: true },
        { from: 5, to: 3, directed: true },
      ],
    },
  },
  {
    id: 'eulerian-circuit',
    label: {
      en: 'Eulerian circuit',
      fr: 'Circuit eulerien',
    },
    description: {
      en: 'Every edge can be used exactly once.',
      fr: 'Chaque arete peut etre utilisee exactement une fois.',
    },
    exampleIds: {
      'eulerian-path': 'eulerian-circuit',
    },
    preview: {
      nodes: [
        { id: 0, label: 'A', x: 18, y: 18 },
        { id: 1, label: 'B', x: 48, y: 12 },
        { id: 2, label: 'C', x: 34, y: 36 },
        { id: 3, label: 'D', x: 64, y: 34 },
        { id: 4, label: 'E', x: 84, y: 54 },
        { id: 5, label: 'F', x: 48, y: 56 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 0 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 2 },
      ],
    },
  },
  {
    id: 'coloring-dense',
    label: {
      en: 'Coloring graph',
      fr: 'Graphe de coloration',
    },
    description: {
      en: 'Graph shaped for Welsh-Powell coloring.',
      fr: 'Graphe adapte a la coloration Welsh-Powell.',
    },
    exampleIds: {
      'welsh-powell': 'coloring-dense',
    },
    preview: {
      nodes: [
        { id: 0, label: 'A', x: 18, y: 12 },
        { id: 1, label: 'B', x: 50, y: 10 },
        { id: 2, label: 'C', x: 82, y: 20 },
        { id: 3, label: 'D', x: 16, y: 50 },
        { id: 4, label: 'E', x: 50, y: 40 },
        { id: 5, label: 'F', x: 82, y: 54 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 3 },
        { from: 0, to: 4 },
        { from: 1, to: 2 },
        { from: 1, to: 4 },
        { from: 2, to: 4 },
        { from: 2, to: 5 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
      ],
    },
  },
  {
    id: 'union-cycle-checks',
    label: {
      en: 'Cycle checks',
      fr: 'Tests de cycle',
    },
    description: {
      en: 'Union operations that end with cycle detection.',
      fr: 'Operations union finissant par une detection de cycle.',
    },
    exampleIds: {
      'union-find': 'cycle-checks',
    },
    preview: {
      nodes: [
        { id: 0, label: '0', x: 12, y: 20 },
        { id: 1, label: '1', x: 34, y: 14 },
        { id: 2, label: '2', x: 58, y: 20 },
        { id: 3, label: '3', x: 82, y: 28 },
        { id: 4, label: '4', x: 24, y: 52 },
        { id: 5, label: '5', x: 56, y: 54 },
        { id: 6, label: '6', x: 82, y: 54 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 2, to: 3 },
        { from: 4, to: 5 },
        { from: 1, to: 2 },
        { from: 5, to: 6 },
        { from: 0, to: 3 },
        { from: 3, to: 6 },
      ],
    },
  },
  {
    id: 'union-two-clusters',
    label: {
      en: 'Two clusters',
      fr: 'Deux groupes',
    },
    description: {
      en: 'Union operations joining two separate groups.',
      fr: 'Operations union reliant deux groupes separes.',
    },
    exampleIds: {
      'union-find': 'two-clusters',
    },
    preview: {
      nodes: [
        { id: 0, label: '0', x: 12, y: 18 },
        { id: 1, label: '1', x: 34, y: 14 },
        { id: 2, label: '2', x: 58, y: 18 },
        { id: 3, label: '3', x: 82, y: 28 },
        { id: 4, label: '4', x: 26, y: 52 },
        { id: 5, label: '5', x: 58, y: 54 },
        { id: 6, label: '6', x: 84, y: 52 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 4, to: 5 },
        { from: 5, to: 6 },
        { from: 0, to: 3 },
        { from: 3, to: 6 },
      ],
    },
  },
]

const incompatibilityReasons: Record<string, LocalizedText> = {
  dijkstra: {
    en: 'Dijkstra requires non-negative weighted graphs.',
    fr: 'Dijkstra exige des graphes ponderes sans poids negatifs.',
  },
  'bellman-ford': {
    en: 'Bellman-Ford uses directed weighted graphs.',
    fr: 'Bellman-Ford utilise des graphes orientes ponderes.',
  },
  bellman: {
    en: 'Bellman uses directed weighted graphs.',
    fr: 'Bellman utilise des graphes orientes ponderes.',
  },
  kruskal: {
    en: 'Kruskal requires undirected weighted graphs.',
    fr: 'Kruskal exige des graphes non orientes ponderes.',
  },
  prim: {
    en: 'Prim requires undirected weighted graphs.',
    fr: 'Prim exige des graphes non orientes ponderes.',
  },
  'connected-components': {
    en: 'Connected components uses undirected connectivity examples.',
    fr: 'Les composantes connexes utilisent des graphes non orientes.',
  },
  kosaraju: {
    en: 'Kosaraju requires directed graph examples.',
    fr: 'Kosaraju exige des graphes orientes.',
  },
  'eulerian-path': {
    en: 'Eulerian Path requires an Eulerian graph.',
    fr: 'Le chemin eulerien exige un graphe eulerien.',
  },
  'welsh-powell': {
    en: 'Welsh-Powell uses graph-coloring examples.',
    fr: 'Welsh-Powell utilise des graphes de coloration.',
  },
  'union-find': {
    en: 'Union-Find uses union-operation examples.',
    fr: 'Union-Find utilise des exemples d operations union.',
  },
}

export function getExampleIdForAlgorithm(item: GraphExampleCatalogItem, algorithmId: string) {
  return item.exampleIds[algorithmId] ?? null
}

export function getIncompatibilityReason(algorithmId: string, locale: Locale) {
  return (
    incompatibilityReasons[algorithmId]?.[locale] ??
    (locale === 'fr'
      ? 'Ce graphe n est pas compatible avec cet algorithme.'
      : 'This graph is not compatible with this algorithm.')
  )
}
