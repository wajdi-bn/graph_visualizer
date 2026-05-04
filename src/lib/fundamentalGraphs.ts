import type { Locale } from '@i18n/translations'
import type { GraphEdge, GraphNode } from '@lib/types'
import type { SessionGraphDraft } from '@lib/sessionGraphs'

export type FundamentalGraphKind = 'complete' | 'cycle' | 'path' | 'complete-bipartite'

export const fundamentalGraphOptions: Array<{
  kind: FundamentalGraphKind
  label: Record<Locale, string>
  description: Record<Locale, string>
}> = [
  {
    kind: 'complete',
    label: { en: 'Complete graph', fr: 'Graphe complet' },
    description: { en: 'Build K_n', fr: 'Construire K_n' },
  },
  {
    kind: 'cycle',
    label: { en: 'Cycle graph', fr: 'Graphe cyclique' },
    description: { en: 'Build C_n', fr: 'Construire C_n' },
  },
  {
    kind: 'path',
    label: { en: 'Path graph', fr: 'Graphe chemin' },
    description: { en: 'Build P_n', fr: 'Construire P_n' },
  },
  {
    kind: 'complete-bipartite',
    label: { en: 'Complete bipartite graph', fr: 'Graphe biparti complet' },
    description: { en: 'Build K_n,n', fr: 'Construire K_n,n' },
  },
]

export function buildFundamentalGraphTemplate(
  kind: FundamentalGraphKind,
  nInput = 3,
  locale: Locale = 'en',
): SessionGraphDraft {
  const n = Math.max(3, Math.floor(Number.isFinite(nInput) ? nInput : 3))

  switch (kind) {
    case 'complete':
      return toSessionGraphDraft(
        kind,
        n,
        locale,
        buildCompleteGraph(n),
        false,
        locale === 'fr' ? `Graphe complet K${n}` : `Complete graph K${n}`,
        locale === 'fr'
          ? `Graphe complet non oriente K${n}, editable dans l'éditeur.`
          : `Undirected complete graph K${n}, editable in the editor.`,
      )
    case 'cycle':
      return toSessionGraphDraft(
        kind,
        n,
        locale,
        buildCycleGraph(n),
        false,
        locale === 'fr' ? `Graphe cyclique C${n}` : `Cycle graph C${n}`,
        locale === 'fr'
          ? `Cycle simple C${n}, editable dans l'éditeur.`
          : `Simple cycle C${n}, editable in the editor.`,
      )
    case 'path':
      return toSessionGraphDraft(
        kind,
        n,
        locale,
        buildPathGraph(n),
        false,
        locale === 'fr' ? `Chemin P${n}` : `Path graph P${n}`,
        locale === 'fr'
          ? `Chemin simple P${n}, editable dans l'éditeur.`
          : `Simple path P${n}, editable in the editor.`,
      )
    case 'complete-bipartite':
      return toSessionGraphDraft(
        kind,
        n,
        locale,
        buildCompleteBipartiteGraph(n),
        false,
        locale === 'fr' ? `Biparti complet K${n},${n}` : `Complete bipartite graph K${n},${n}`,
        locale === 'fr'
          ? `Graphe biparti complet K${n},${n}, editable dans l'éditeur.`
          : `Complete bipartite graph K${n},${n}, editable in the editor.`,
      )
  }
}

function toSessionGraphDraft(
  kind: FundamentalGraphKind,
  n: number,
  locale: Locale,
  graph: { nodes: GraphNode[]; edges: GraphEdge[] },
  directed: boolean,
  name: string,
  description: string,
): SessionGraphDraft {
  return {
    name,
    description,
    directed,
    weighted: false,
    nodes: graph.nodes,
    edges: graph.edges,
  }
}

function buildCompleteGraph(n: number) {
  const nodes = buildCircularNodes(n, 175, 170, 110)
  const edges: GraphEdge[] = []
  for (let from = 0; from < n; from++) {
    for (let to = from + 1; to < n; to++) {
      edges.push({ from, to, directed: false })
    }
  }
  return { nodes, edges }
}

function buildCycleGraph(n: number) {
  const nodes = buildCircularNodes(n, 175, 170, 110)
  const edges: GraphEdge[] = []
  for (let index = 0; index < n; index++) {
    edges.push({ from: index, to: (index + 1) % n, directed: false })
  }
  return { nodes, edges }
}

function buildPathGraph(n: number) {
  const nodes = buildLinearNodes(n, 80, 170, 120)
  const edges: GraphEdge[] = []
  for (let index = 0; index < n - 1; index++) {
    edges.push({ from: index, to: index + 1, directed: false })
  }
  return { nodes, edges }
}

function buildCompleteBipartiteGraph(n: number) {
  const left = buildLinearNodes(n, 80, 95, 150, 'L')
  const right = buildLinearNodes(n, 80, 245, 150, 'R')
  const nodes = [...left, ...right].map((node, index) => ({
    ...node,
    id: index,
  }))
  const edges: GraphEdge[] = []
  for (let from = 0; from < n; from++) {
    for (let to = n; to < 2 * n; to++) {
      edges.push({ from, to, directed: false })
    }
  }
  return { nodes, edges }
}

function buildCircularNodes(n: number, centerX: number, centerY: number, radius: number): GraphNode[] {
  return Array.from({ length: n }, (_, index) => {
    const angle = (2 * Math.PI * index) / n - Math.PI / 2
    return {
      id: index,
      label: String.fromCharCode(65 + index),
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    }
  })
}

function buildLinearNodes(
  n: number,
  x: number,
  y: number,
  spacing: number,
  prefix = '',
): GraphNode[] {
  return Array.from({ length: n }, (_, index) => ({
    id: index,
    label: prefix ? `${prefix}${index + 1}` : String.fromCharCode(65 + index),
    x: x + spacing * index,
    y,
  }))
}
