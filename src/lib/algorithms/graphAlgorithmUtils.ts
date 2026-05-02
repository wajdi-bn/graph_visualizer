import type {
  AlgorithmGraphInput,
  GraphEdge,
  GraphNode,
  GraphState,
  GraphVisualState,
  Step,
} from '@lib/types'
import { d } from '@lib/algorithms/shared'

export const palette = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22c55e']

export const inf = 'inf'

export function isDirectedGraph(graph: AlgorithmGraphInput) {
  return Boolean(graph.directed || graph.edges.some((edge) => edge.directed))
}

// Custom graphs can omit edge weights or direction; normalize once before algorithm-specific logic runs.
export function graphFromInput(
  graph: AlgorithmGraphInput,
  options: { directed?: boolean; defaultWeight?: boolean } = {},
): { nodes: GraphNode[]; edges: GraphEdge[]; directed: boolean } {
  const directed = options.directed ?? isDirectedGraph(graph)
  const nodes = graph.nodes.map((node) => ({ ...node }))
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = graph.edges
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to)
    .map((edge) => ({
      ...edge,
      weight: edge.weight ?? (options.defaultWeight ? 1 : undefined),
      directed,
    }))

  return { nodes, edges, directed }
}

export function label(nodes: GraphNode[], id: number) {
  return nodes.find((node) => node.id === id)?.label ?? String(id)
}

export function edgeKey(from: number, to: number, directed = false) {
  return directed || from <= to ? `${from}-${to}` : `${to}-${from}`
}

export function adjacency(edges: GraphEdge[], directed = false) {
  const adj: Record<number, { node: number; weight: number }[]> = {}
  for (const edge of edges) {
    adj[edge.from] ??= []
    adj[edge.to] ??= []
    adj[edge.from].push({ node: edge.to, weight: edge.weight ?? 1 })
    if (!directed && !edge.directed) adj[edge.to].push({ node: edge.from, weight: edge.weight ?? 1 })
  }
  return adj
}

export function baseGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  extra: Partial<GraphState> = {},
): GraphState {
  return {
    nodes,
    edges,
    directed: edges.some((edge) => edge.directed) || extra.directed,
    visitedNodes: [],
    currentNode: null,
    visitedEdges: [],
    currentEdge: null,
    ...extra,
  }
}

export function incompatibilityStep(
  locale: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  directed: boolean,
  messageEn: string,
  messageFr: string,
): Step[] {
  return [
    {
      graph: baseGraph(nodes, edges, {
        directed,
        phase: d(locale, 'Graph is not compatible', 'Graphe incompatible'),
      }),
      description: d(locale, messageEn, messageFr),
      variables: {
        nodes: nodes.length,
        edges: edges.length,
        directed,
      },
    },
  ]
}

export function requireNodes(locale: string, nodes: GraphNode[], edges: GraphEdge[], directed = false) {
  if (nodes.length > 0) return null
  return incompatibilityStep(
    locale,
    nodes,
    edges,
    directed,
    'Add at least one vertex before running this algorithm.',
    'Ajoutez au moins un sommet avant de lancer cet algorithme.',
  )
}

export function requireUndirectedCustom(
  locale: string,
  graph: AlgorithmGraphInput | undefined,
  nodes: GraphNode[],
  edges: GraphEdge[],
  messageEn: string,
  messageFr: string,
) {
  if (!graph || !isDirectedGraph(graph)) return null
  return incompatibilityStep(locale, nodes, edges, true, messageEn, messageFr)
}

export function requireDirectedCustom(
  locale: string,
  graph: AlgorithmGraphInput | undefined,
  nodes: GraphNode[],
  edges: GraphEdge[],
  messageEn: string,
  messageFr: string,
) {
  if (!graph || isDirectedGraph(graph)) return null
  return incompatibilityStep(locale, nodes, edges, false, messageEn, messageFr)
}

export function formatDistances(nodes: GraphNode[], distances: Record<number, number | string>) {
  return nodes.map((node) => `${node.label}:${distances[node.id]}`).join(', ')
}

export function formatPredecessors(nodes: GraphNode[], predecessors: Record<number, number | string | null>) {
  return nodes
    .map((node) => {
      const pred = predecessors[node.id]
      return `${node.label}:${pred == null ? '-' : typeof pred === 'number' ? label(nodes, pred) : pred}`
    })
    .join(', ')
}

export function cloneRecord<T>(record: Record<number, T>) {
  return { ...record }
}

export function cloneEdgeStates(record: Record<string, GraphVisualState>) {
  return { ...record }
}

export function setsFromParent(nodes: GraphNode[], parent: Record<number, number>) {
  const groups = new Map<number, number[]>()
  const find = (x: number): number => (parent[x] === x ? x : find(parent[x]))
  for (const node of nodes) {
    const root = find(node.id)
    groups.set(root, [...(groups.get(root) ?? []), node.id])
  }

  return [...groups.entries()].map(([root, members], index) => ({
    label: label(nodes, root),
    members,
    color: palette[index % palette.length],
  }))
}
