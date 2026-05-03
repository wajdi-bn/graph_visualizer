import type { GraphEdge, GraphNode, GraphState, Step } from '@lib/types'
import type { Locale } from '@i18n/translations'

export const SESSION_GRAPHS_STORAGE_KEY = 'algoviz-session-graphs'
export const SESSION_GRAPHS_CHANGED_EVENT = 'algoviz:session-graphs-changed'
const SESSION_GRAPH_EXAMPLE_PREFIX = 'session:'
const VISUALIZER_WIDTH = 500
const VISUALIZER_HEIGHT = 340
const VISUALIZER_SAFE_MARGIN = 30

export interface SessionGraph {
  id: string
  name: string
  description: string
  directed: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
  createdAt: string
  updatedAt: string
}

export type SessionGraphDraft = Omit<SessionGraph, 'id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<SessionGraph, 'id' | 'createdAt' | 'updatedAt'>>

function hasSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function emitGraphChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SESSION_GRAPHS_CHANGED_EVENT))
}

function cleanNode(node: Partial<GraphNode>, index: number): GraphNode | null {
  const id = Number.isFinite(node.id) ? Number(node.id) : index
  const x = Number.isFinite(node.x) ? Number(node.x) : 250
  const y = Number.isFinite(node.y) ? Number(node.y) : 170
  const label = typeof node.label === 'string' && node.label.trim() ? node.label.trim() : String(id)

  return {
    id,
    label,
    x,
    y,
    color: typeof node.color === 'string' && node.color ? node.color : undefined,
  }
}

function cleanEdge(edge: Partial<GraphEdge>, nodeIds: Set<number>, directed: boolean): GraphEdge | null {
  const from = Number(edge.from)
  const to = Number(edge.to)
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null
  if (!nodeIds.has(from) || !nodeIds.has(to) || from === to) return null

  return {
    from,
    to,
    weight: Number.isFinite(edge.weight) ? Number(edge.weight) : undefined,
    directed,
    label: typeof edge.label === 'string' && edge.label.trim() ? edge.label.trim() : undefined,
    color: typeof edge.color === 'string' && edge.color ? edge.color : undefined,
    curve: Number.isFinite(edge.curve) ? Number(edge.curve) : undefined,
  }
}

export function normalizeSessionGraph(graph: Partial<SessionGraphDraft>): SessionGraphDraft {
  const directed = Boolean(graph.directed)
  const nodes = Array.isArray(graph.nodes)
    ? graph.nodes.map((node, index) => cleanNode(node, index)).filter((node): node is GraphNode => node != null)
    : []
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = Array.isArray(graph.edges)
    ? graph.edges
        .map((edge) => cleanEdge(edge, nodeIds, directed))
        .filter((edge): edge is GraphEdge => edge != null)
    : []

  return {
    id: typeof graph.id === 'string' && graph.id ? graph.id : undefined,
    name: typeof graph.name === 'string' && graph.name.trim() ? graph.name.trim() : 'Untitled graph',
    description: typeof graph.description === 'string' ? graph.description : '',
    directed,
    nodes,
    edges,
    createdAt: typeof graph.createdAt === 'string' ? graph.createdAt : undefined,
    updatedAt: typeof graph.updatedAt === 'string' ? graph.updatedAt : undefined,
  }
}

export function createSessionGraphId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `graph-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function makeSessionGraphExampleId(graphId: string) {
  return `${SESSION_GRAPH_EXAMPLE_PREFIX}${graphId}`
}

export function isSessionGraphExampleId(exampleId: string | null | undefined) {
  return typeof exampleId === 'string' && exampleId.startsWith(SESSION_GRAPH_EXAMPLE_PREFIX)
}

export function getSessionGraphIdFromExampleId(exampleId: string | null | undefined) {
  if (!isSessionGraphExampleId(exampleId)) return null
  return exampleId.slice(SESSION_GRAPH_EXAMPLE_PREFIX.length)
}

export function readSessionGraphs(): SessionGraph[] {
  if (!hasSessionStorage()) return []

  try {
    const raw = window.sessionStorage.getItem(SESSION_GRAPHS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => {
        const normalized = normalizeSessionGraph(item)
        if (!normalized.id) return null
        const now = new Date().toISOString()
        return {
          ...normalized,
          id: normalized.id,
          createdAt: normalized.createdAt ?? now,
          updatedAt: normalized.updatedAt ?? normalized.createdAt ?? now,
        }
      })
      .filter((graph): graph is SessionGraph => graph != null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  } catch {
    return []
  }
}

export function writeSessionGraphs(graphs: SessionGraph[]) {
  if (!hasSessionStorage()) return
  window.sessionStorage.setItem(SESSION_GRAPHS_STORAGE_KEY, JSON.stringify(graphs))
  emitGraphChange()
}

export function getSessionGraph(graphId: string | null | undefined) {
  if (!graphId) return null
  return readSessionGraphs().find((graph) => graph.id === graphId) ?? null
}

export function saveSessionGraph(draft: SessionGraphDraft, saveAsCopy = false): SessionGraph {
  const now = new Date().toISOString()
  const normalized = normalizeSessionGraph(draft)
  const id = saveAsCopy || !normalized.id ? createSessionGraphId() : normalized.id
  const graph: SessionGraph = {
    ...normalized,
    id,
    createdAt: saveAsCopy || !normalized.createdAt ? now : normalized.createdAt,
    updatedAt: now,
  }

  const graphs = readSessionGraphs()
  const nextGraphs = [graph, ...graphs.filter((item) => item.id !== graph.id)]
  writeSessionGraphs(nextGraphs)
  return graph
}

export function deleteSessionGraph(graphId: string) {
  writeSessionGraphs(readSessionGraphs().filter((graph) => graph.id !== graphId))
}

function fitNodesToVisualizer(nodes: GraphNode[]) {
  if (nodes.length === 0) return nodes

  const minX = Math.min(...nodes.map((node) => node.x))
  const maxX = Math.max(...nodes.map((node) => node.x))
  const minY = Math.min(...nodes.map((node) => node.y))
  const maxY = Math.max(...nodes.map((node) => node.y))
  const graphWidth = maxX - minX
  const graphHeight = maxY - minY
  const availableWidth = VISUALIZER_WIDTH - VISUALIZER_SAFE_MARGIN * 2
  const availableHeight = VISUALIZER_HEIGHT - VISUALIZER_SAFE_MARGIN * 2
  const scale = Math.min(
    1,
    graphWidth > 0 ? availableWidth / graphWidth : 1,
    graphHeight > 0 ? availableHeight / graphHeight : 1,
  )

  const scaledMinX = minX * scale
  const scaledMaxX = maxX * scale
  const scaledMinY = minY * scale
  const scaledMaxY = maxY * scale
  let dx = 0
  let dy = 0

  if (scaledMinX < VISUALIZER_SAFE_MARGIN) {
    dx = VISUALIZER_SAFE_MARGIN - scaledMinX
  } else if (scaledMaxX > VISUALIZER_WIDTH - VISUALIZER_SAFE_MARGIN) {
    dx = VISUALIZER_WIDTH - VISUALIZER_SAFE_MARGIN - scaledMaxX
  }

  if (scaledMinY < VISUALIZER_SAFE_MARGIN) {
    dy = VISUALIZER_SAFE_MARGIN - scaledMinY
  } else if (scaledMaxY > VISUALIZER_HEIGHT - VISUALIZER_SAFE_MARGIN) {
    dy = VISUALIZER_HEIGHT - VISUALIZER_SAFE_MARGIN - scaledMaxY
  }

  return nodes.map((node) => ({
    ...node,
    x: node.x * scale + dx,
    y: node.y * scale + dy,
  }))
}

export function graphToState(graph: SessionGraph): GraphState {
  const nodes = fitNodesToVisualizer(graph.nodes)

  return {
    nodes,
    edges: graph.edges.map((edge) => ({ ...edge, directed: graph.directed })),
    directed: graph.directed,
    visitedNodes: [],
    currentNode: null,
    visitedEdges: [],
    currentEdge: null,
  }
}

export function graphToSteps(graph: SessionGraph, locale: Locale = 'en'): Step[] {
  return [
    {
      graph: {
        ...graphToState(graph),
        phase: locale === 'fr' ? 'Graphe personnalise' : 'Custom graph',
      },
      description:
        locale === 'fr'
          ? `${graph.name} est charge depuis sessionStorage.`
          : `${graph.name} is loaded from sessionStorage.`,
      variables: {
        nodes: graph.nodes.length,
        edges: graph.edges.length,
        directed: graph.directed,
      },
    },
  ]
}
