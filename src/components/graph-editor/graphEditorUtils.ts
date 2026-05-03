import type { Locale } from '@i18n/translations'
import {
  normalizeSessionGraph,
  type SessionGraph,
  type SessionGraphDraft,
} from '@lib/sessionGraphs'
import type { GraphEdge, GraphNode } from '@lib/types'
import type { ClipboardPayload, EditorDraft, Selection, SelectionBox, ViewBox } from './graphEditorTypes'

export const CANVAS_WIDTH = 500
export const CANVAS_HEIGHT = 420
export const NODE_RADIUS = 22
export const CANVAS_PADDING = 14
export const DEFAULT_NODE_COLOR = '#1e293b'
export const DEFAULT_EDGE_COLOR = '#475569'
export const SELECTED_COLOR = '#22d3ee'
export const WAITING_EDGE_COLOR = '#facc15'
export const HISTORY_LIMIT = 80
export const EDGE_CURVE_STEP = 34
export const MAX_EDGE_CURVE = 160

export function defaultViewBox(): ViewBox {
  return {
    x: -CANVAS_PADDING,
    y: -CANVAS_PADDING,
    width: CANVAS_WIDTH + CANVAS_PADDING * 2,
    height: CANVAS_HEIGHT + CANVAS_PADDING * 2,
  }
}

export function blankDraft(): EditorDraft {
  return {
    name: 'Untitled graph',
    description: '',
    directed: false,
    nodes: [],
    edges: [],
  }
}

export function cloneDraft(draft: EditorDraft): EditorDraft {
  return {
    ...draft,
    nodes: draft.nodes.map((node) => ({ ...node })),
    edges: draft.edges.map((edge) => ({ ...edge })),
  }
}

export function draftFromGraph(graph: SessionGraph): EditorDraft {
  return {
    id: graph.id,
    name: graph.name,
    description: graph.description,
    directed: graph.directed,
    nodes: graph.nodes.map((node) => ({ ...node })),
    edges: graph.edges.map((edge) => ({ ...edge })),
    createdAt: graph.createdAt,
    updatedAt: graph.updatedAt,
  }
}

export function draftFromJson(value: unknown): EditorDraft | null {
  const candidate = value
  const normalized = normalizeSessionGraph(candidate as Partial<SessionGraphDraft>)
  return {
    ...blankDraft(),
    ...normalized,
    name: normalized.name,
    description: normalized.description,
    directed: normalized.directed,
    nodes: normalized.nodes,
    edges: normalized.edges,
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function clampNodePoint(point: { x: number; y: number }) {
  return {
    x: clamp(point.x, NODE_RADIUS, CANVAS_WIDTH - NODE_RADIUS),
    y: clamp(point.y, NODE_RADIUS, CANVAS_HEIGHT - NODE_RADIUS),
  }
}

export function emptySelection(): Selection {
  return { nodeIds: [], edgeIndexes: [] }
}

export function hasSelection(selection: Selection) {
  return selection.nodeIds.length > 0 || selection.edgeIndexes.length > 0
}

export function normalizeSelection(selection: Selection): Selection {
  return {
    nodeIds: [...new Set(selection.nodeIds)],
    edgeIndexes: [...new Set(selection.edgeIndexes)],
  }
}

export function edgeKey(edge: GraphEdge, directed: boolean) {
  return directed || edge.from <= edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`
}

export function nextNodeLabel(nodes: GraphNode[]) {
  const labels = new Set(nodes.map((node) => node.label))
  for (let index = 0; index < 26; index++) {
    const label = String.fromCharCode(65 + index)
    if (!labels.has(label)) return label
  }
  return `N${nodes.length + 1}`
}

export function nextNodeId(nodes: GraphNode[]) {
  return nodes.length === 0 ? 0 : Math.max(...nodes.map((node) => node.id)) + 1
}

export function endpoint(fromX: number, fromY: number, toX: number, toY: number, offset: number) {
  const dx = toX - fromX
  const dy = toY - fromY
  const length = Math.sqrt(dx * dx + dy * dy) || 1
  return {
    x: toX - (dx / length) * offset,
    y: toY - (dy / length) * offset,
  }
}

export function edgePairKey(edge: Pick<GraphEdge, 'from' | 'to'>) {
  return edge.from <= edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`
}

export function getEdgeCurve(edge: GraphEdge, index: number, edges: GraphEdge[]) {
  if (Number.isFinite(edge.curve)) return clamp(Number(edge.curve), -MAX_EDGE_CURVE, MAX_EDGE_CURVE)

  const pairKey = edgePairKey(edge)
  const parallelIndexes = edges
    .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
    .filter(({ candidate }) => edgePairKey(candidate) === pairKey)
    .map(({ candidateIndex }) => candidateIndex)

  if (parallelIndexes.length <= 1) return 0

  const position = parallelIndexes.indexOf(index)
  const middle = (parallelIndexes.length - 1) / 2
  return (position - middle) * EDGE_CURVE_STEP
}

export function getEdgePathGeometry(
  edge: GraphEdge,
  index: number,
  edges: GraphEdge[],
  from: GraphNode,
  to: GraphNode,
  directed: boolean,
) {
  const start = directed
    ? endpoint(to.x, to.y, from.x, from.y, NODE_RADIUS + 2)
    : { x: from.x, y: from.y }
  const end = directed
    ? endpoint(from.x, from.y, to.x, to.y, NODE_RADIUS + 4)
    : { x: to.x, y: to.y }
  const curve = getEdgeCurve(edge, index, edges)
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const normal = length > 0
    ? { x: -dy / length, y: dx / length }
    : { x: 0, y: -1 }
  const mid = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  }
  const control = {
    x: mid.x + normal.x * curve,
    y: mid.y + normal.y * curve,
  }
  const label = {
    x: (start.x + 2 * control.x + end.x) / 4,
    y: (start.y + 2 * control.y + end.y) / 4,
  }
  const path = Math.abs(curve) < 0.5
    ? `M ${start.x} ${start.y} L ${end.x} ${end.y}`
    : `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`

  return { start, end, control, label, curve, path }
}

export function edgeCurveFromPoint(
  start: { x: number; y: number },
  end: { x: number; y: number },
  point: { x: number; y: number },
) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const normal = length > 0
    ? { x: -dy / length, y: dx / length }
    : { x: 0, y: -1 }
  const mid = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  }

  return clamp(
    (point.x - mid.x) * normal.x + (point.y - mid.y) * normal.y,
    -MAX_EDGE_CURVE,
    MAX_EDGE_CURVE,
  )
}

export function displayDate(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function colorValue(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function hexToRgb(color: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return null
  const value = match[1]
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

export function readableTextColor(fill: string | undefined) {
  if (!fill) return '#ffffff'
  const rgb = hexToRgb(fill)
  if (!rgb) return '#ffffff'
  // Keep labels readable when users choose light node colors in the editor.
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.58 ? '#0f172a' : '#ffffff'
}

export function getSelectionEdgeIndexes(draft: EditorDraft, selection: Selection) {
  const selectedNodes = new Set(selection.nodeIds)
  const indexes = new Set(selection.edgeIndexes)
  // A marquee selection includes edges only when both endpoints are inside the selected zone.
  draft.edges.forEach((edge, index) => {
    if (selectedNodes.has(edge.from) && selectedNodes.has(edge.to)) indexes.add(index)
  })
  return [...indexes].filter((index) => draft.edges[index])
}

export function getSelectionPayload(draft: EditorDraft, selection: Selection): ClipboardPayload | null {
  const nodeIds = new Set(selection.nodeIds)
  // Copying an edge also copies its endpoints so pasted graphs stay valid.
  for (const index of selection.edgeIndexes) {
    const edge = draft.edges[index]
    if (edge) {
      nodeIds.add(edge.from)
      nodeIds.add(edge.to)
    }
  }

  if (nodeIds.size === 0) return null

  const nodes = draft.nodes.filter((node) => nodeIds.has(node.id)).map((node) => ({ ...node }))
  const selectedEdges = new Set(getSelectionEdgeIndexes(draft, selection))
  const edges = draft.edges
    .filter((edge, index) => selectedEdges.has(index) || (nodeIds.has(edge.from) && nodeIds.has(edge.to)))
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to))
    .map((edge) => ({ ...edge }))

  return { nodes, edges }
}

export function getMarqueeRect(start: SelectionBox['start'], end: SelectionBox['end']) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}
