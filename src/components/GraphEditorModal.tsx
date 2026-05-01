import { useEffect, useMemo, useRef, useState } from 'react'
import type { GraphEdge, GraphNode } from '@lib/types'
import type { Locale } from '@i18n/translations'
import {
  deleteSessionGraph,
  normalizeSessionGraph,
  saveSessionGraph,
  type SessionGraph,
  type SessionGraphDraft,
} from '@lib/sessionGraphs'

const CANVAS_WIDTH = 500
const CANVAS_HEIGHT = 340
const NODE_RADIUS = 22
const DEFAULT_NODE_COLOR = '#1e293b'
const DEFAULT_EDGE_COLOR = '#475569'
const SELECTED_COLOR = '#22d3ee'
const WAITING_EDGE_COLOR = '#facc15'
const HISTORY_LIMIT = 80

type EditorTool = 'select' | 'node' | 'edge'

interface Selection {
  nodeIds: number[]
  edgeIndexes: number[]
}

interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

type ContextMenuState = {
  x: number
  y: number
} | null

type ClipboardPayload = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

type DragState =
  | {
      type: 'nodes'
      pointerId: number
      start: { x: number; y: number }
      nodeIds: number[]
      nodeStarts: Record<number, { x: number; y: number }>
      originalDraft: EditorDraft
      moved: boolean
    }
  | {
      type: 'pan'
      pointerId: number
      startClient: { x: number; y: number }
      viewStart: ViewBox
    }
  | {
      type: 'marquee'
      pointerId: number
      start: { x: number; y: number }
      end: { x: number; y: number }
    }

type EditorDraft = SessionGraphDraft & {
  name: string
  description: string
  directed: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
}

interface GraphEditorModalProps {
  open: boolean
  locale: Locale
  graphs: SessionGraph[]
  initialGraphId: string | null
  onClose: () => void
  onSaved: (graph: SessionGraph) => void
  onDeleted: (graphId: string) => void
}

function blankDraft(): EditorDraft {
  return {
    name: 'Untitled graph',
    description: '',
    directed: false,
    nodes: [],
    edges: [],
  }
}

function cloneDraft(draft: EditorDraft): EditorDraft {
  return {
    ...draft,
    nodes: draft.nodes.map((node) => ({ ...node })),
    edges: draft.edges.map((edge) => ({ ...edge })),
  }
}

function draftFromGraph(graph: SessionGraph): EditorDraft {
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

function draftFromJson(value: unknown): EditorDraft | null {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clampNodePoint(point: { x: number; y: number }) {
  return {
    x: clamp(point.x, NODE_RADIUS, CANVAS_WIDTH - NODE_RADIUS),
    y: clamp(point.y, NODE_RADIUS, CANVAS_HEIGHT - NODE_RADIUS),
  }
}

function emptySelection(): Selection {
  return { nodeIds: [], edgeIndexes: [] }
}

function hasSelection(selection: Selection) {
  return selection.nodeIds.length > 0 || selection.edgeIndexes.length > 0
}

function normalizeSelection(selection: Selection): Selection {
  return {
    nodeIds: [...new Set(selection.nodeIds)],
    edgeIndexes: [...new Set(selection.edgeIndexes)],
  }
}

function edgeKey(edge: GraphEdge, directed: boolean) {
  return directed || edge.from <= edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`
}

function nextNodeLabel(nodes: GraphNode[]) {
  const labels = new Set(nodes.map((node) => node.label))
  for (let index = 0; index < 26; index++) {
    const label = String.fromCharCode(65 + index)
    if (!labels.has(label)) return label
  }
  return `N${nodes.length + 1}`
}

function nextNodeId(nodes: GraphNode[]) {
  return nodes.length === 0 ? 0 : Math.max(...nodes.map((node) => node.id)) + 1
}

function endpoint(fromX: number, fromY: number, toX: number, toY: number, offset: number) {
  const dx = toX - fromX
  const dy = toY - fromY
  const length = Math.sqrt(dx * dx + dy * dy) || 1
  return {
    x: toX - (dx / length) * offset,
    y: toY - (dy / length) * offset,
  }
}

function displayDate(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function colorValue(value: string | undefined, fallback: string) {
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

function readableTextColor(fill: string | undefined) {
  if (!fill) return '#ffffff'
  const rgb = hexToRgb(fill)
  if (!rgb) return '#ffffff'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.58 ? '#0f172a' : '#ffffff'
}

function getSelectionEdgeIndexes(draft: EditorDraft, selection: Selection) {
  const selectedNodes = new Set(selection.nodeIds)
  const indexes = new Set(selection.edgeIndexes)
  draft.edges.forEach((edge, index) => {
    if (selectedNodes.has(edge.from) && selectedNodes.has(edge.to)) indexes.add(index)
  })
  return [...indexes].filter((index) => draft.edges[index])
}

function getSelectionPayload(draft: EditorDraft, selection: Selection): ClipboardPayload | null {
  const nodeIds = new Set(selection.nodeIds)
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

function getMarqueeRect(start: { x: number; y: number }, end: { x: number; y: number }) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

export default function GraphEditorModal({
  open,
  locale,
  graphs,
  initialGraphId,
  onClose,
  onSaved,
  onDeleted,
}: GraphEditorModalProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const draftRef = useRef<EditorDraft>(blankDraft())
  const selectionRef = useRef<Selection>(emptySelection())
  const viewBoxRef = useRef<ViewBox>({ x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
  const historyRef = useRef<{ past: EditorDraft[]; future: EditorDraft[] }>({ past: [], future: [] })
  const graphsRef = useRef<SessionGraph[]>(graphs)
  const dragRef = useRef<DragState | null>(null)
  const clipboardRef = useRef<ClipboardPayload | null>(null)

  const [draft, setDraft] = useState<EditorDraft>(() => blankDraft())
  const [tool, setTool] = useState<EditorTool>('select')
  const [selection, setSelectionState] = useState<Selection>(() => emptySelection())
  const [edgeStartId, setEdgeStartId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [viewBox, setViewBoxState] = useState<ViewBox>(() => ({
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  }))
  const [selectionBox, setSelectionBox] = useState<{
    start: { x: number; y: number }
    end: { x: number; y: number }
  } | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const [history, setHistory] = useState<{ past: EditorDraft[]; future: EditorDraft[] }>({
    past: [],
    future: [],
  })

  const selectedEdgeIndexes = useMemo(
    () => getSelectionEdgeIndexes(draft, selection),
    [draft, selection],
  )
  const selectedNode =
    selection.nodeIds.length === 1 && selectedEdgeIndexes.length === 0
      ? draft.nodes.find((node) => node.id === selection.nodeIds[0]) ?? null
      : null
  const selectedEdgeIndex =
    selection.nodeIds.length === 0 && selectedEdgeIndexes.length === 1 ? selectedEdgeIndexes[0] : null
  const selectedEdge = selectedEdgeIndex == null ? null : draft.edges[selectedEdgeIndex] ?? null
  const selectedCount = selection.nodeIds.length + selectedEdgeIndexes.length

  const filteredGraphs = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return graphs
    return graphs.filter((graph) =>
      `${graph.name} ${graph.description}`.toLowerCase().includes(needle),
    )
  }, [graphs, query])

  useEffect(() => {
    graphsRef.current = graphs
  }, [graphs])

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => {
    selectionRef.current = selection
  }, [selection])

  useEffect(() => {
    viewBoxRef.current = viewBox
  }, [viewBox])

  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    if (!open) return

    const initialGraph = initialGraphId
      ? graphsRef.current.find((graph) => graph.id === initialGraphId) ?? null
      : null
    const initialDraft = initialGraph ? draftFromGraph(initialGraph) : blankDraft()

    draftRef.current = initialDraft
    setDraft(initialDraft)
    setTool('select')
    setSelection(emptySelection())
    setEdgeStartId(null)
    setSelectionBox(null)
    setContextMenu(null)
    setNotice('')
    setViewBox({ x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
    historyRef.current = { past: [], future: [] }
    setHistory(historyRef.current)
  }, [open, initialGraphId])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = () => setContextMenu(null)
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const editing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT'

      if (event.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null)
          return
        }
        if (edgeStartId != null) {
          setEdgeStartId(null)
          return
        }
        onClose()
        return
      }

      if (editing) return

      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if ((event.ctrlKey || event.metaKey) && key === 'y') {
        event.preventDefault()
        redo()
      } else if ((event.ctrlKey || event.metaKey) && key === 's') {
        event.preventDefault()
        handleSave(false)
      } else if ((event.ctrlKey || event.metaKey) && key === 'c') {
        event.preventDefault()
        copySelection()
      } else if ((event.ctrlKey || event.metaKey) && key === 'v') {
        event.preventDefault()
        pasteClipboard()
      } else if ((event.ctrlKey || event.metaKey) && key === 'd') {
        event.preventDefault()
        duplicateSelection()
      } else if ((event.ctrlKey || event.metaKey) && key === 'a') {
        event.preventDefault()
        selectAll()
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        deleteSelected()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, contextMenu, edgeStartId, onClose])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2200)
    return () => window.clearTimeout(timer)
  }, [notice])

  if (!open) return null

  function setSelection(next: Selection) {
    const normalized = normalizeSelection(next)
    selectionRef.current = normalized
    setSelectionState(normalized)
  }

  function setViewBox(next: ViewBox) {
    viewBoxRef.current = next
    setViewBoxState(next)
  }

  function pushHistorySnapshot(snapshot: EditorDraft) {
    const next = {
      past: [...historyRef.current.past.slice(-(HISTORY_LIMIT - 1)), cloneDraft(snapshot)],
      future: [],
    }
    historyRef.current = next
    setHistory(next)
  }

  function replaceDraft(next: EditorDraft) {
    draftRef.current = next
    setDraft(next)
  }

  function applyDraft(mutator: (current: EditorDraft) => EditorDraft, options: { keepSelection?: boolean } = {}) {
    const before = cloneDraft(draftRef.current)
    const next = mutator(cloneDraft(draftRef.current))
    replaceDraft(next)
    pushHistorySnapshot(before)
    if (!options.keepSelection) setSelection(emptySelection())
    setContextMenu(null)
  }

  function undo() {
    const current = historyRef.current
    if (current.past.length === 0) return
    const previous = current.past[current.past.length - 1]
    const next = {
      past: current.past.slice(0, -1),
      future: [cloneDraft(draftRef.current), ...current.future],
    }
    historyRef.current = next
    setHistory(next)
    replaceDraft(cloneDraft(previous))
    setSelection(emptySelection())
    setEdgeStartId(null)
  }

  function redo() {
    const current = historyRef.current
    if (current.future.length === 0) return
    const nextDraft = current.future[0]
    const next = {
      past: [...current.past, cloneDraft(draftRef.current)],
      future: current.future.slice(1),
    }
    historyRef.current = next
    setHistory(next)
    replaceDraft(cloneDraft(nextDraft))
    setSelection(emptySelection())
    setEdgeStartId(null)
  }

  function getCanvasPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }

    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const matrix = svg.getScreenCTM()
    if (!matrix) return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
    return point.matrixTransform(matrix.inverse())
  }

  function updateDraft(update: Partial<EditorDraft>) {
    applyDraft((current) => ({ ...current, ...update }), { keepSelection: true })
  }

  function updateNode(nodeId: number, update: Partial<GraphNode>) {
    applyDraft(
      (current) => ({
        ...current,
        nodes: current.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                ...update,
                x: update.x == null ? node.x : clamp(update.x, NODE_RADIUS, CANVAS_WIDTH - NODE_RADIUS),
                y: update.y == null ? node.y : clamp(update.y, NODE_RADIUS, CANVAS_HEIGHT - NODE_RADIUS),
              }
            : node,
        ),
      }),
      { keepSelection: true },
    )
  }

  function updateEdge(index: number, update: Partial<GraphEdge>) {
    applyDraft(
      (current) => ({
        ...current,
        edges: current.edges.map((edge, edgeIndex) =>
          edgeIndex === index
            ? {
                ...edge,
                ...update,
                directed: current.directed,
              }
            : edge,
        ),
      }),
      { keepSelection: true },
    )
  }

  function addNodeAt(x: number, y: number) {
    const id = nextNodeId(draftRef.current.nodes)
    const point = clampNodePoint({ x, y })
    const node: GraphNode = {
      id,
      label: nextNodeLabel(draftRef.current.nodes),
      x: point.x,
      y: point.y,
      color: DEFAULT_NODE_COLOR,
    }

    applyDraft((current) => ({ ...current, nodes: [...current.nodes, node] }), {
      keepSelection: true,
    })
    setSelection({ nodeIds: [id], edgeIndexes: [] })
  }

  function addEdge(from: number, to: number) {
    if (from === to) return

    const current = draftRef.current
    const nextEdge: GraphEdge = {
      from,
      to,
      weight: 1,
      directed: current.directed,
      color: DEFAULT_EDGE_COLOR,
    }
    const nextKey = edgeKey(nextEdge, current.directed)
    const exists = current.edges.some((edge) => edgeKey(edge, current.directed) === nextKey)
    if (exists) {
      setNotice(locale === 'fr' ? 'Cette arete existe deja.' : 'That edge already exists.')
      return
    }

    applyDraft((draftValue) => ({ ...draftValue, edges: [...draftValue.edges, nextEdge] }), {
      keepSelection: true,
    })
    setSelection({ nodeIds: [], edgeIndexes: [current.edges.length] })
  }

  function deleteSelected() {
    const currentSelection = selectionRef.current
    if (!hasSelection(currentSelection)) return

    const nodeIds = new Set(currentSelection.nodeIds)
    const edgeIndexes = new Set(getSelectionEdgeIndexes(draftRef.current, currentSelection))

    applyDraft((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => !nodeIds.has(node.id)),
      edges: current.edges.filter(
        (edge, index) => !edgeIndexes.has(index) && !nodeIds.has(edge.from) && !nodeIds.has(edge.to),
      ),
    }))
    setEdgeStartId(null)
  }

  function selectAll() {
    setSelection({
      nodeIds: draftRef.current.nodes.map((node) => node.id),
      edgeIndexes: draftRef.current.edges.map((_, index) => index),
    })
  }

  function copySelection() {
    const payload = getSelectionPayload(draftRef.current, selectionRef.current)
    if (!payload) return
    clipboardRef.current = payload
    setNotice(locale === 'fr' ? 'Selection copiee.' : 'Selection copied.')
  }

  function pastePayload(payload: ClipboardPayload | null) {
    if (!payload || payload.nodes.length === 0) return

    const current = draftRef.current
    let nextId = nextNodeId(current.nodes)
    const idMap = new Map<number, number>()
    const nextNodes = payload.nodes.map((node) => {
      const id = nextId++
      idMap.set(node.id, id)
      const point = clampNodePoint({ x: node.x + 28, y: node.y + 28 })
      return {
        ...node,
        id,
        x: point.x,
        y: point.y,
      }
    })
    const nextEdges = payload.edges
      .map((edge) => {
        const from = idMap.get(edge.from)
        const to = idMap.get(edge.to)
        if (from == null || to == null) return null
        return {
          ...edge,
          from,
          to,
          directed: current.directed,
        }
      })
      .filter((edge): edge is GraphEdge => edge != null)

    applyDraft(
      (draftValue) => ({
        ...draftValue,
        nodes: [...draftValue.nodes, ...nextNodes],
        edges: [...draftValue.edges, ...nextEdges],
      }),
      { keepSelection: true },
    )

    const edgeStartIndex = current.edges.length
    setSelection({
      nodeIds: nextNodes.map((node) => node.id),
      edgeIndexes: nextEdges.map((_, index) => edgeStartIndex + index),
    })
  }

  function pasteClipboard() {
    pastePayload(clipboardRef.current)
  }

  function duplicateSelection() {
    const payload = getSelectionPayload(draftRef.current, selectionRef.current)
    pastePayload(payload)
  }

  function handleCanvasPointerDown(event: React.PointerEvent<SVGRectElement>) {
    if (event.button === 2) return
    setContextMenu(null)
    const point = getCanvasPoint(event.clientX, event.clientY)
    setEdgeStartId(null)

    if (tool === 'node') {
      addNodeAt(point.x, point.y)
      setTool('select')
      return
    }

    if (event.button === 1 || event.altKey) {
      dragRef.current = {
        type: 'pan',
        pointerId: event.pointerId,
        startClient: { x: event.clientX, y: event.clientY },
        viewStart: viewBoxRef.current,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    if (tool === 'select') {
      dragRef.current = {
        type: 'marquee',
        pointerId: event.pointerId,
        start: point,
        end: point,
      }
      setSelectionBox({ start: point, end: point })
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  function handleNodePointerDown(event: React.PointerEvent<SVGGElement>, nodeId: number) {
    if (event.button === 2) return
    event.stopPropagation()
    setContextMenu(null)

    if (tool === 'edge') {
      setSelection({ nodeIds: [nodeId], edgeIndexes: [] })
      if (edgeStartId == null) {
        setEdgeStartId(nodeId)
      } else {
        addEdge(edgeStartId, nodeId)
        setEdgeStartId(null)
      }
      return
    }

    if (event.ctrlKey || event.metaKey) {
      const selectedNodes = new Set(selectionRef.current.nodeIds)
      if (selectedNodes.has(nodeId)) selectedNodes.delete(nodeId)
      else selectedNodes.add(nodeId)
      setSelection({ ...selectionRef.current, nodeIds: [...selectedNodes] })
      return
    }

    const selectedNodes = new Set(selectionRef.current.nodeIds)
    const nodeIds = selectedNodes.has(nodeId) ? [...selectedNodes] : [nodeId]
    setSelection({ nodeIds, edgeIndexes: selectedNodes.has(nodeId) ? selectionRef.current.edgeIndexes : [] })

    const start = getCanvasPoint(event.clientX, event.clientY)
    const nodeStarts: Record<number, { x: number; y: number }> = {}
    for (const id of nodeIds) {
      const node = draftRef.current.nodes.find((entry) => entry.id === id)
      if (node) nodeStarts[id] = { x: node.x, y: node.y }
    }

    dragRef.current = {
      type: 'nodes',
      pointerId: event.pointerId,
      start,
      nodeIds,
      nodeStarts,
      originalDraft: cloneDraft(draftRef.current),
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleEdgePointerDown(event: React.PointerEvent<SVGLineElement>, index: number) {
    if (event.button === 2) return
    event.stopPropagation()
    setContextMenu(null)

    if (event.ctrlKey || event.metaKey) {
      const edgeIndexes = new Set(selectionRef.current.edgeIndexes)
      if (edgeIndexes.has(index)) edgeIndexes.delete(index)
      else edgeIndexes.add(index)
      setSelection({ ...selectionRef.current, edgeIndexes: [...edgeIndexes] })
      return
    }

    setSelection({ nodeIds: [], edgeIndexes: [index] })
    setEdgeStartId(null)
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    if (!drag) return

    if (drag.type === 'nodes') {
      const point = getCanvasPoint(event.clientX, event.clientY)
      const dx = point.x - drag.start.x
      const dy = point.y - drag.start.y
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) drag.moved = true

      const nodeIds = new Set(drag.nodeIds)
      const next = {
        ...draftRef.current,
        nodes: draftRef.current.nodes.map((node) => {
          if (!nodeIds.has(node.id)) return node
          const start = drag.nodeStarts[node.id]
          if (!start) return node
          return {
            ...node,
            ...clampNodePoint({ x: start.x + dx, y: start.y + dy }),
          }
        }),
      }
      replaceDraft(next)
      return
    }

    if (drag.type === 'pan') {
      const svg = svgRef.current
      const bounds = svg?.getBoundingClientRect()
      if (!bounds) return
      const dx = ((event.clientX - drag.startClient.x) / bounds.width) * drag.viewStart.width
      const dy = ((event.clientY - drag.startClient.y) / bounds.height) * drag.viewStart.height
      setViewBox({
        ...drag.viewStart,
        x: drag.viewStart.x - dx,
        y: drag.viewStart.y - dy,
      })
      return
    }

    if (drag.type === 'marquee') {
      const point = getCanvasPoint(event.clientX, event.clientY)
      drag.end = point
      setSelectionBox({ start: drag.start, end: point })
    }
  }

  function handlePointerUp() {
    const drag = dragRef.current
    if (!drag) return

    if (drag.type === 'nodes' && drag.moved) {
      pushHistorySnapshot(drag.originalDraft)
    }

    if (drag.type === 'marquee') {
      const rect = getMarqueeRect(drag.start, drag.end)
      if (rect.width < 3 && rect.height < 3) {
        setSelection(emptySelection())
      } else {
        const nodeIds = draftRef.current.nodes
          .filter(
            (node) =>
              node.x >= rect.x &&
              node.x <= rect.x + rect.width &&
              node.y >= rect.y &&
              node.y <= rect.y + rect.height,
          )
          .map((node) => node.id)
        const selectedNodes = new Set(nodeIds)
        const edgeIndexes = draftRef.current.edges
          .map((edge, index) => ({ edge, index }))
          .filter(({ edge }) => selectedNodes.has(edge.from) && selectedNodes.has(edge.to))
          .map(({ index }) => index)
        setSelection({ nodeIds, edgeIndexes })
      }
      setSelectionBox(null)
    }

    dragRef.current = null
  }

  function layoutCircle() {
    if (draftRef.current.nodes.length === 0) return
    const radius = Math.min(118, 38 + draftRef.current.nodes.length * 9)
    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT / 2
    applyDraft(
      (current) => ({
        ...current,
        nodes: current.nodes.map((node, index) => {
          const angle = (Math.PI * 2 * index) / current.nodes.length - Math.PI / 2
          return {
            ...node,
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius,
          }
        }),
      }),
      { keepSelection: true },
    )
  }

  function handleSave(saveAsCopy = false) {
    const graph = saveSessionGraph(
      {
        ...draftRef.current,
        id: saveAsCopy ? undefined : draftRef.current.id,
        name: saveAsCopy
          ? `${draftRef.current.name.trim() || 'Untitled graph'} ${locale === 'fr' ? '(copie)' : '(copy)'}`
          : draftRef.current.name.trim() || 'Untitled graph',
      },
      saveAsCopy,
    )
    onSaved(graph)
    onClose()
  }

  function handleDeleteGraph() {
    if (!draftRef.current.id) return
    const confirmed = window.confirm(
      locale === 'fr'
        ? 'Supprimer ce graphe de sessionStorage ?'
        : 'Delete this graph from sessionStorage?',
    )
    if (!confirmed) return
    deleteSessionGraph(draftRef.current.id)
    onDeleted(draftRef.current.id)
    replaceDraft(blankDraft())
    setSelection(emptySelection())
    historyRef.current = { past: [], future: [] }
    setHistory(historyRef.current)
  }

  function selectGraph(graph: SessionGraph) {
    const next = draftFromGraph(graph)
    replaceDraft(next)
    setSelection(emptySelection())
    setEdgeStartId(null)
    setTool('select')
    historyRef.current = { past: [], future: [] }
    setHistory(historyRef.current)
    setViewBox({ x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
  }

  function createNewGraph() {
    replaceDraft(blankDraft())
    setSelection(emptySelection())
    setEdgeStartId(null)
    setTool('select')
    historyRef.current = { past: [], future: [] }
    setHistory(historyRef.current)
    setViewBox({ x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
  }

  function clearGraph() {
    if (draftRef.current.nodes.length === 0 && draftRef.current.edges.length === 0) return
    applyDraft((current) => ({
      ...current,
      nodes: [],
      edges: [],
    }))
    setEdgeStartId(null)
  }

  function setDirected(directed: boolean) {
    applyDraft(
      (current) => ({
        ...current,
        directed,
        edges: current.edges.map((edge) => ({ ...edge, directed })),
      }),
      { keepSelection: true },
    )
  }

  function zoomBy(factor: number, center = { x: viewBoxRef.current.x + viewBoxRef.current.width / 2, y: viewBoxRef.current.y + viewBoxRef.current.height / 2 }) {
    const current = viewBoxRef.current
    const nextWidth = clamp(current.width * factor, 80, 1000)
    const nextHeight = clamp(current.height * factor, 55, 680)
    const px = (center.x - current.x) / current.width
    const py = (center.y - current.y) / current.height
    setViewBox({
      x: center.x - nextWidth * px,
      y: center.y - nextHeight * py,
      width: nextWidth,
      height: nextHeight,
    })
  }

  function fitView() {
    if (draftRef.current.nodes.length === 0) {
      setViewBox({ x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
      return
    }

    const minX = Math.min(...draftRef.current.nodes.map((node) => node.x)) - 60
    const maxX = Math.max(...draftRef.current.nodes.map((node) => node.x)) + 60
    const minY = Math.min(...draftRef.current.nodes.map((node) => node.y)) - 60
    const maxY = Math.max(...draftRef.current.nodes.map((node) => node.y)) + 60
    let width = Math.max(120, maxX - minX)
    let height = Math.max(90, maxY - minY)
    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT
    const currentAspect = width / height

    if (currentAspect > aspect) {
      height = width / aspect
    } else {
      width = height * aspect
    }

    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    setViewBox({
      x: cx - width / 2,
      y: cy - height / 2,
      width,
      height,
    })
  }

  function handleWheel(event: React.WheelEvent<SVGSVGElement>) {
    event.preventDefault()
    const point = getCanvasPoint(event.clientX, event.clientY)
    zoomBy(event.deltaY > 0 ? 1.12 : 0.88, point)
  }

  function openContextMenu(event: React.MouseEvent, selectionForTarget?: Selection) {
    event.preventDefault()
    event.stopPropagation()
    if (selectionForTarget) setSelection(selectionForTarget)
    setContextMenu({ x: event.clientX, y: event.clientY })
  }

  function exportJson() {
    const payload = normalizeSessionGraph(draftRef.current)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(draftRef.current.name || 'graph').trim().replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function importJson(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? ''))
        const imported = draftFromJson(parsed)
        if (!imported) throw new Error('Invalid graph')
        applyDraft(() => ({ ...imported, id: undefined, createdAt: undefined, updatedAt: undefined }))
        setSelection(emptySelection())
        fitView()
        setNotice(locale === 'fr' ? 'Graphe importe.' : 'Graph imported.')
      } catch {
        setNotice(locale === 'fr' ? 'JSON invalide.' : 'Invalid JSON file.')
      }
    }
    reader.readAsText(file)
  }

  const title = draft.id
    ? locale === 'fr'
      ? 'Modifier le graphe'
      : 'Edit graph'
    : locale === 'fr'
      ? 'Creer un graphe'
      : 'Create graph'

  const marqueeRect = selectionBox ? getMarqueeRect(selectionBox.start, selectionBox.end) : null
  const hasClipboard = clipboardRef.current != null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="graph-editor-title"
    >
      <div className="flex h-[min(760px,calc(100vh-1rem))] w-[min(1180px,calc(100vw-1rem))] overflow-hidden rounded-lg border border-white/12 bg-black shadow-2xl shadow-black/70">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/8 bg-white/[0.02] md:flex">
          <div className="border-b border-white/8 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-white font-heading">
                {locale === 'fr' ? 'Graphes de session' : 'Session graphs'}
              </div>
              <button
                type="button"
                onClick={createNewGraph}
                className="h-7 rounded-md border border-white/10 bg-white/6 px-2 text-[11px] text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                {locale === 'fr' ? 'Nouveau' : 'New'}
              </button>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder={locale === 'fr' ? 'Chercher...' : 'Search...'}
              className="mt-2 h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-white/22"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filteredGraphs.length === 0 ? (
              <div className="p-3 text-xs leading-5 text-neutral-500">
                {locale === 'fr' ? 'Aucun graphe enregistre.' : 'No saved graphs yet.'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGraphs.map((graph) => (
                  <button
                    key={graph.id}
                    type="button"
                    onClick={() => selectGraph(graph)}
                    className={`w-full rounded-md border p-2 text-left transition-colors ${
                      graph.id === draft.id
                        ? 'border-cyan-300/60 bg-cyan-300/10'
                        : 'border-white/8 bg-white/[0.03] hover:border-white/18 hover:bg-white/8'
                    }`}
                  >
                    <div className="truncate text-xs font-semibold text-white">{graph.name}</div>
                    <div className="mt-1 text-[10px] text-neutral-500">
                      {graph.nodes.length} {locale === 'fr' ? 'sommets' : 'nodes'} /{' '}
                      {graph.edges.length} {locale === 'fr' ? 'aretes' : 'edges'}
                    </div>
                    <div className="mt-1 text-[10px] text-neutral-600">
                      {displayDate(graph.updatedAt, locale)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-white/8 px-3 sm:px-4">
            <div className="min-w-0">
              <h2 id="graph-editor-title" className="truncate text-sm font-semibold text-white font-heading">
                {title}
              </h2>
              <div className="hidden text-[11px] text-neutral-500 sm:block">
                {selectedCount > 0
                  ? `${selectedCount} ${locale === 'fr' ? 'selectionnes' : 'selected'}`
                  : `${draft.nodes.length} ${locale === 'fr' ? 'sommets' : 'nodes'} / ${draft.edges.length} ${
                      locale === 'fr' ? 'aretes' : 'edges'
                    }`}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="h-8 rounded-md bg-white px-3 text-xs font-medium text-black transition-colors hover:bg-neutral-200"
              >
                {locale === 'fr' ? 'Enregistrer' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="hidden h-8 rounded-md border border-white/12 bg-white/6 px-3 text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white sm:block"
              >
                {locale === 'fr' ? 'Copie' : 'Save copy'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/8 hover:text-white"
                aria-label={locale === 'fr' ? 'Fermer' : 'Close'}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <main className="flex min-w-0 flex-1 flex-col">
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/8 px-3 py-2">
                <ToolButton
                  active={tool === 'select'}
                  label={locale === 'fr' ? 'Selectionner' : 'Select'}
                  onClick={() => {
                    setTool('select')
                    setEdgeStartId(null)
                  }}
                >
                  <path d="M5 3.5 15 12l-5.1 1.1L8 18.5 5 3.5Z" />
                </ToolButton>
                <ToolButton
                  active={tool === 'node'}
                  label={locale === 'fr' ? 'Ajouter sommet' : 'Add node'}
                  onClick={() => {
                    setTool('node')
                    setEdgeStartId(null)
                  }}
                >
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 9v6M9 12h6" />
                </ToolButton>
                <ToolButton
                  active={tool === 'edge'}
                  label={locale === 'fr' ? 'Connecter' : 'Connect'}
                  onClick={() => {
                    setTool('edge')
                    setEdgeStartId(null)
                  }}
                >
                  <circle cx="6" cy="18" r="2.5" />
                  <circle cx="18" cy="6" r="2.5" />
                  <path d="m8 16 8-8" />
                </ToolButton>
                <ToolButton
                  active={false}
                  disabled={history.past.length === 0}
                  label={locale === 'fr' ? 'Annuler' : 'Undo'}
                  onClick={undo}
                >
                  <path d="M9 7H4v5M4 12a7 7 0 1 0 2-5" />
                </ToolButton>
                <ToolButton
                  active={false}
                  disabled={history.future.length === 0}
                  label={locale === 'fr' ? 'Retablir' : 'Redo'}
                  onClick={redo}
                >
                  <path d="M15 7h5v5M20 12a7 7 0 1 1-2-5" />
                </ToolButton>
                <ToolButton
                  active={false}
                  disabled={!hasSelection(selection)}
                  label={locale === 'fr' ? 'Supprimer selection' : 'Delete selected'}
                  onClick={deleteSelected}
                >
                  <path d="M6 7h12M10 7V5h4v2M8 7l1 12h6l1-12" />
                </ToolButton>
                <ToolButton
                  active={false}
                  disabled={draft.nodes.length === 0}
                  label={locale === 'fr' ? 'Disposition automatique' : 'Auto layout'}
                  onClick={layoutCircle}
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                </ToolButton>
                <ToolButton active={false} label={locale === 'fr' ? 'Zoom avant' : 'Zoom in'} onClick={() => zoomBy(0.82)}>
                  <path d="M10 5v10M5 10h10M15 15l5 5" />
                </ToolButton>
                <ToolButton active={false} label={locale === 'fr' ? 'Zoom arriere' : 'Zoom out'} onClick={() => zoomBy(1.18)}>
                  <path d="M5 10h10M15 15l5 5" />
                </ToolButton>
                <ToolButton active={false} label={locale === 'fr' ? 'Ajuster la vue' : 'Fit view'} onClick={fitView}>
                  <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
                </ToolButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) importJson(file)
                    event.currentTarget.value = ''
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 rounded-md border border-white/10 bg-white/6 px-2 text-[11px] text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {locale === 'fr' ? 'Importer' : 'Import'}
                </button>
                <button
                  type="button"
                  onClick={exportJson}
                  className="h-8 rounded-md border border-white/10 bg-white/6 px-2 text-[11px] text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {locale === 'fr' ? 'Exporter' : 'Export'}
                </button>
                <button
                  type="button"
                  onClick={clearGraph}
                  disabled={draft.nodes.length === 0 && draft.edges.length === 0}
                  className="ml-auto h-8 rounded-md border border-white/10 bg-white/6 px-2 text-[11px] text-neutral-400 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35"
                >
                  {locale === 'fr' ? 'Vider' : 'Clear'}
                </button>
              </div>

              <div className="min-h-0 flex-1 p-3">
                <div className="h-full min-h-[320px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
                  <svg
                    ref={svgRef}
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                    className={`h-full w-full touch-none ${tool === 'node' ? 'cursor-crosshair' : ''}`}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onWheel={handleWheel}
                    onContextMenu={(event) => openContextMenu(event)}
                    aria-label={locale === 'fr' ? 'Zone de dessin du graphe' : 'Graph drawing area'}
                  >
                    <defs>
                      <marker
                        id="graph-editor-arrow"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-stroke-default, #22d3ee)" />
                      </marker>
                      <pattern id="graph-editor-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                        <path
                          d="M 24 0 H 0 V 24"
                          fill="none"
                          stroke="var(--graph-editor-grid, rgba(148, 163, 184, 0.14))"
                          strokeWidth="0.8"
                        />
                      </pattern>
                      <pattern id="graph-editor-grid-major" width="120" height="120" patternUnits="userSpaceOnUse">
                        <path
                          d="M 120 0 H 0 V 120"
                          fill="none"
                          stroke="var(--graph-editor-grid-major, rgba(34, 211, 238, 0.14))"
                          strokeWidth="1.1"
                        />
                      </pattern>
                    </defs>
                    <rect
                      x={viewBox.x}
                      y={viewBox.y}
                      width={viewBox.width}
                      height={viewBox.height}
                      fill="transparent"
                      onPointerDown={handleCanvasPointerDown}
                    />
                    <rect
                      x={viewBox.x}
                      y={viewBox.y}
                      width={viewBox.width}
                      height={viewBox.height}
                      fill="url(#graph-editor-grid)"
                      pointerEvents="none"
                    />
                    <rect
                      x={viewBox.x}
                      y={viewBox.y}
                      width={viewBox.width}
                      height={viewBox.height}
                      fill="url(#graph-editor-grid-major)"
                      pointerEvents="none"
                    />

                    {draft.edges.map((edge, index) => {
                      const from = draft.nodes.find((node) => node.id === edge.from)
                      const to = draft.nodes.find((node) => node.id === edge.to)
                      if (!from || !to) return null

                      const selectedEdge = selectedEdgeIndexes.includes(index)
                      const color = selectedEdge ? SELECTED_COLOR : edge.color ?? DEFAULT_EDGE_COLOR
                      const start = draft.directed
                        ? endpoint(to.x, to.y, from.x, from.y, NODE_RADIUS + 2)
                        : { x: from.x, y: from.y }
                      const end = draft.directed
                        ? endpoint(from.x, from.y, to.x, to.y, NODE_RADIUS + 4)
                        : { x: to.x, y: to.y }
                      const midX = (start.x + end.x) / 2
                      const midY = (start.y + end.y) / 2
                      const label = edge.label ?? edge.weight

                      return (
                        <g key={`${edge.from}-${edge.to}-${index}`}>
                          <line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke="transparent"
                            strokeWidth={14}
                            strokeLinecap="round"
                            onPointerDown={(event) => handleEdgePointerDown(event, index)}
                            onContextMenu={(event) =>
                              openContextMenu(
                                event,
                                selectedEdgeIndexes.includes(index)
                                  ? undefined
                                  : { nodeIds: [], edgeIndexes: [index] },
                              )
                            }
                          />
                          <line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke={color}
                            strokeWidth={selectedEdge ? 3 : 2}
                            strokeLinecap="round"
                            markerEnd={draft.directed ? 'url(#graph-editor-arrow)' : undefined}
                          />
                          {label != null && (
                            <>
                              <circle
                                cx={midX}
                                cy={midY}
                                r={11}
                                fill="var(--graph-weight-bg, #020617)"
                                stroke={color}
                                strokeWidth={1}
                              />
                              <text
                                x={midX}
                                y={midY}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="var(--graph-weight-text, #e2e8f0)"
                                fontSize="9"
                                fontWeight={700}
                              >
                                {label}
                              </text>
                            </>
                          )}
                        </g>
                      )
                    })}

                    {draft.nodes.map((node) => {
                      const active = selection.nodeIds.includes(node.id)
                      const waitingForEdge = tool === 'edge' && edgeStartId === node.id
                      return (
                        <g
                          key={node.id}
                          onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                          onContextMenu={(event) =>
                            openContextMenu(
                              event,
                              selection.nodeIds.includes(node.id)
                                ? undefined
                                : { nodeIds: [node.id], edgeIndexes: [] },
                            )
                          }
                          className="cursor-pointer"
                        >
                          {(active || waitingForEdge) && (
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={NODE_RADIUS + 5}
                              fill="none"
                              stroke={waitingForEdge ? WAITING_EDGE_COLOR : SELECTED_COLOR}
                              strokeWidth={2}
                              opacity={0.9}
                            />
                          )}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={NODE_RADIUS}
                            fill={node.color ?? DEFAULT_NODE_COLOR}
                            stroke={active ? SELECTED_COLOR : 'var(--graph-stroke-default, #22d3ee)'}
                            strokeWidth={active ? 2.4 : 1.6}
                          />
                          <text
                            x={node.x}
                            y={node.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={readableTextColor(node.color ?? DEFAULT_NODE_COLOR)}
                            fontSize="12"
                            fontWeight={700}
                          >
                            {node.label}
                          </text>
                        </g>
                      )
                    })}

                    {marqueeRect && (
                      <rect
                        x={marqueeRect.x}
                        y={marqueeRect.y}
                        width={marqueeRect.width}
                        height={marqueeRect.height}
                        fill={SELECTED_COLOR}
                        fillOpacity={0.08}
                        stroke={SELECTED_COLOR}
                        strokeWidth={1}
                        strokeDasharray="5 4"
                        pointerEvents="none"
                      />
                    )}
                  </svg>
                </div>
              </div>
            </main>

            <aside className="max-h-[280px] shrink-0 overflow-y-auto border-t border-white/8 bg-white/[0.02] p-3 lg:max-h-none lg:w-[290px] lg:border-l lg:border-t-0">
              <div className="space-y-4">
                <section>
                  <div className="mb-2 text-xs font-semibold text-white font-heading">
                    {locale === 'fr' ? 'Informations' : 'Graph info'}
                  </div>
                  <div className="space-y-2">
                    <FieldLabel label={locale === 'fr' ? 'Nom' : 'Name'}>
                      <input
                        value={draft.name}
                        onChange={(event) => updateDraft({ name: event.target.value })}
                        className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                      />
                    </FieldLabel>
                    <FieldLabel label={locale === 'fr' ? 'Description' : 'Description'}>
                      <textarea
                        value={draft.description}
                        onChange={(event) => updateDraft({ description: event.target.value })}
                        rows={3}
                        className="w-full resize-none rounded-md border border-white/10 bg-black px-2 py-1.5 text-xs text-white outline-none focus:border-white/24"
                      />
                    </FieldLabel>
                    <label className="flex items-center justify-between rounded-md border border-white/10 bg-black px-2 py-2 text-xs text-neutral-300">
                      <span>{locale === 'fr' ? 'Graphe oriente' : 'Directed graph'}</span>
                      <input
                        type="checkbox"
                        checked={draft.directed}
                        onChange={(event) => setDirected(event.target.checked)}
                        className="h-4 w-4 accent-cyan-300"
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <div className="mb-2 text-xs font-semibold text-white font-heading">
                    {selectedNode
                      ? locale === 'fr'
                        ? 'Sommet'
                        : 'Node'
                      : selectedEdge
                        ? locale === 'fr'
                          ? 'Arete'
                          : 'Edge'
                        : locale === 'fr'
                          ? 'Selection'
                          : 'Selection'}
                  </div>

                  {!selectedNode && !selectedEdge && (
                    <div className="rounded-md border border-white/8 bg-black p-3 text-xs leading-5 text-neutral-500">
                      {selectedCount > 1
                        ? locale === 'fr'
                          ? `${selectedCount} elements selectionnes.`
                          : `${selectedCount} elements selected.`
                        : locale === 'fr'
                          ? 'Selectionnez un sommet ou une arete pour modifier ses details.'
                          : 'Select a node or edge to edit its details.'}
                    </div>
                  )}

                  {selectedNode && (
                    <div className="space-y-2">
                      <FieldLabel label={locale === 'fr' ? 'Etiquette' : 'Label'}>
                        <input
                          value={selectedNode.label}
                          onChange={(event) => updateNode(selectedNode.id, { label: event.target.value })}
                          className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                        />
                      </FieldLabel>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldLabel label="X">
                          <input
                            type="number"
                            value={Math.round(selectedNode.x)}
                            onChange={(event) => updateNode(selectedNode.id, { x: Number(event.target.value) })}
                            className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                          />
                        </FieldLabel>
                        <FieldLabel label="Y">
                          <input
                            type="number"
                            value={Math.round(selectedNode.y)}
                            onChange={(event) => updateNode(selectedNode.id, { y: Number(event.target.value) })}
                            className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                          />
                        </FieldLabel>
                      </div>
                      <FieldLabel label={locale === 'fr' ? 'Couleur' : 'Color'}>
                        <input
                          type="color"
                          value={colorValue(selectedNode.color, DEFAULT_NODE_COLOR)}
                          onChange={(event) => updateNode(selectedNode.id, { color: event.target.value })}
                          className="h-8 w-full rounded-md border border-white/10 bg-black p-1"
                        />
                      </FieldLabel>
                    </div>
                  )}

                  {selectedEdge && selectedEdgeIndex != null && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <FieldLabel label={locale === 'fr' ? 'Source' : 'Source'}>
                          <select
                            value={selectedEdge.from}
                            onChange={(event) =>
                              updateEdge(selectedEdgeIndex, { from: Number(event.target.value) })
                            }
                            className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                          >
                            {draft.nodes.map((node) => (
                              <option key={node.id} value={node.id}>
                                {node.label}
                              </option>
                            ))}
                          </select>
                        </FieldLabel>
                        <FieldLabel label={locale === 'fr' ? 'Cible' : 'Target'}>
                          <select
                            value={selectedEdge.to}
                            onChange={(event) =>
                              updateEdge(selectedEdgeIndex, { to: Number(event.target.value) })
                            }
                            className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                          >
                            {draft.nodes.map((node) => (
                              <option key={node.id} value={node.id}>
                                {node.label}
                              </option>
                            ))}
                          </select>
                        </FieldLabel>
                      </div>
                      <FieldLabel label={locale === 'fr' ? 'Poids' : 'Weight'}>
                        <input
                          type="number"
                          value={selectedEdge.weight ?? ''}
                          onChange={(event) =>
                            updateEdge(selectedEdgeIndex, {
                              weight: event.target.value === '' ? undefined : Number(event.target.value),
                            })
                          }
                          className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                        />
                      </FieldLabel>
                      <FieldLabel label={locale === 'fr' ? 'Etiquette' : 'Label'}>
                        <input
                          value={selectedEdge.label ?? ''}
                          onChange={(event) =>
                            updateEdge(selectedEdgeIndex, { label: event.target.value || undefined })
                          }
                          className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                        />
                      </FieldLabel>
                      <FieldLabel label={locale === 'fr' ? 'Couleur' : 'Color'}>
                        <input
                          type="color"
                          value={colorValue(selectedEdge.color, DEFAULT_EDGE_COLOR)}
                          onChange={(event) => updateEdge(selectedEdgeIndex, { color: event.target.value })}
                          className="h-8 w-full rounded-md border border-white/10 bg-black p-1"
                        />
                      </FieldLabel>
                    </div>
                  )}
                </section>

                <section className="flex flex-wrap gap-2 border-t border-white/8 pt-3">
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    className="h-8 rounded-md border border-white/12 bg-white/6 px-2 text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
                  >
                    {locale === 'fr' ? 'Copie' : 'Save copy'}
                  </button>
                  {draft.id && (
                    <button
                      type="button"
                      onClick={handleDeleteGraph}
                      className="h-8 rounded-md border border-rose-500/35 bg-rose-500/10 px-2 text-xs text-rose-500 transition-colors hover:bg-rose-500/15"
                    >
                      {locale === 'fr' ? 'Supprimer' : 'Delete graph'}
                    </button>
                  )}
                </section>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {contextMenu && (
        <div
          className="fixed z-[120] w-44 overflow-hidden rounded-md border border-white/12 bg-black py-1 shadow-2xl shadow-black/60"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
          role="menu"
        >
          <ContextMenuItem
            disabled={!hasSelection(selection)}
            onClick={() => {
              copySelection()
              setContextMenu(null)
            }}
          >
            {locale === 'fr' ? 'Copier' : 'Copy'}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={!hasSelection(selection)}
            onClick={() => {
              duplicateSelection()
              setContextMenu(null)
            }}
          >
            {locale === 'fr' ? 'Dupliquer' : 'Duplicate'}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={!hasClipboard}
            onClick={() => {
              pasteClipboard()
              setContextMenu(null)
            }}
          >
            {locale === 'fr' ? 'Coller' : 'Paste'}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={!hasSelection(selection)}
            onClick={() => {
              deleteSelected()
              setContextMenu(null)
            }}
          >
            {locale === 'fr' ? 'Supprimer' : 'Delete'}
          </ContextMenuItem>
          <div className="my-1 border-t border-white/8" />
          <ContextMenuItem
            onClick={() => {
              selectAll()
              setContextMenu(null)
            }}
          >
            {locale === 'fr' ? 'Tout selectionner' : 'Select all'}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              fitView()
              setContextMenu(null)
            }}
          >
            {locale === 'fr' ? 'Ajuster la vue' : 'Fit view'}
          </ContextMenuItem>
        </div>
      )}

      {notice && (
        <div
          className="fixed bottom-4 left-1/2 z-[110] -translate-x-1/2 rounded-lg border border-white/12 bg-black px-3 py-2 text-xs text-neutral-300 shadow-2xl shadow-black/50"
          role="status"
        >
          {notice}
        </div>
      )}
    </div>
  )
}

function ToolButton({
  active,
  disabled = false,
  label,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:pointer-events-none disabled:opacity-35 ${
        active
          ? 'border-cyan-300/60 bg-cyan-300/12 text-cyan-100'
          : 'border-white/10 bg-white/6 text-neutral-400 hover:bg-white/10 hover:text-white'
      }`}
      aria-label={label}
      title={label}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}

function ContextMenuItem({
  disabled = false,
  onClick,
  children,
}: {
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="block h-8 w-full px-3 text-left text-xs text-neutral-300 transition-colors hover:bg-white/8 hover:text-white disabled:pointer-events-none disabled:text-neutral-700"
      role="menuitem"
    >
      {children}
    </button>
  )
}

function FieldLabel({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-neutral-500">{label}</span>
      {children}
    </label>
  )
}
