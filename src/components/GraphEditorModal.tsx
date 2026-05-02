import { useEffect, useMemo, useRef, useState } from 'react'
import type { GraphEdge, GraphNode } from '@lib/types'
import {
  deleteSessionGraph,
  normalizeSessionGraph,
  saveSessionGraph,
  type SessionGraph,
} from '@lib/sessionGraphs'
import type {
  ClipboardPayload,
  ContextMenuState,
  DragState,
  EditorDraft,
  EditorTool,
  GraphEditorModalProps,
  Selection,
  SelectionBox,
  ViewBox,
} from '@components/graph-editor/graphEditorTypes'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_COLOR,
  HISTORY_LIMIT,
  NODE_RADIUS,
  blankDraft,
  clamp,
  clampNodePoint,
  cloneDraft,
  defaultViewBox,
  draftFromGraph,
  draftFromJson,
  edgeKey,
  emptySelection,
  getMarqueeRect,
  getSelectionEdgeIndexes,
  getSelectionPayload,
  hasSelection,
  nextNodeId,
  nextNodeLabel,
  normalizeSelection,
} from '@components/graph-editor/graphEditorUtils'
import { GraphEditorCanvas } from '@components/graph-editor/GraphEditorCanvas'
import { GraphEditorContextMenu } from '@components/graph-editor/GraphEditorContextMenu'
import { GraphEditorInspector } from '@components/graph-editor/GraphEditorInspector'
import { GraphEditorSidebar } from '@components/graph-editor/GraphEditorSidebar'
import { GraphEditorToolbar } from '@components/graph-editor/GraphEditorToolbar'

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
  const viewBoxRef = useRef<ViewBox>(defaultViewBox())
  const historyRef = useRef<{ past: EditorDraft[]; future: EditorDraft[] }>({ past: [], future: [] })
  const graphsRef = useRef<SessionGraph[]>(graphs)
  const dragRef = useRef<DragState | null>(null)
  const clipboardRef = useRef<ClipboardPayload | null>(null)

  // Refs mirror state so global keyboard and pointer handlers always use fresh data.
  const [draft, setDraft] = useState<EditorDraft>(() => blankDraft())
  const [tool, setTool] = useState<EditorTool>('select')
  const [selection, setSelectionState] = useState<Selection>(() => emptySelection())
  const [edgeStartId, setEdgeStartId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [viewBox, setViewBoxState] = useState<ViewBox>(() => defaultViewBox())
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null)
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
    setViewBox(defaultViewBox())
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

    // Dragging nodes mutates the draft live; the history snapshot is committed on release.
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
    setViewBox(defaultViewBox())
  }

  function createNewGraph() {
    replaceDraft(blankDraft())
    setSelection(emptySelection())
    setEdgeStartId(null)
    setTool('select')
    historyRef.current = { past: [], future: [] }
    setHistory(historyRef.current)
    setViewBox(defaultViewBox())
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
      setViewBox(defaultViewBox())
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
      <div className="flex h-[min(840px,calc(100vh-1rem))] w-[min(1220px,calc(100vw-1rem))] overflow-hidden rounded-lg border border-white/12 bg-black shadow-2xl shadow-black/70">
        <GraphEditorSidebar
          locale={locale}
          graphs={filteredGraphs}
          activeGraphId={draft.id}
          query={query}
          setQuery={setQuery}
          createNewGraph={createNewGraph}
          selectGraph={selectGraph}
        />

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
              <GraphEditorToolbar
                locale={locale}
                tool={tool}
                setTool={setTool}
                setEdgeStartId={setEdgeStartId}
                history={history}
                selection={selection}
                draft={draft}
                fileInputRef={fileInputRef}
                undo={undo}
                redo={redo}
                deleteSelected={deleteSelected}
                layoutCircle={layoutCircle}
                zoomBy={zoomBy}
                fitView={fitView}
                importJson={importJson}
                exportJson={exportJson}
                clearGraph={clearGraph}
              />

              <GraphEditorCanvas
                svgRef={svgRef}
                locale={locale}
                draft={draft}
                tool={tool}
                edgeStartId={edgeStartId}
                selection={selection}
                selectedEdgeIndexes={selectedEdgeIndexes}
                viewBox={viewBox}
                marqueeRect={marqueeRect}
                handlePointerMove={handlePointerMove}
                handlePointerUp={handlePointerUp}
                handleWheel={handleWheel}
                openContextMenu={openContextMenu}
                handleCanvasPointerDown={handleCanvasPointerDown}
                handleEdgePointerDown={handleEdgePointerDown}
                handleNodePointerDown={handleNodePointerDown}
              />
            </main>

            <GraphEditorInspector
              locale={locale}
              draft={draft}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              selectedEdgeIndex={selectedEdgeIndex}
              selectedCount={selectedCount}
              updateDraft={updateDraft}
              updateNode={updateNode}
              updateEdge={updateEdge}
              setDirected={setDirected}
              handleSave={handleSave}
              handleDeleteGraph={handleDeleteGraph}
            />
          </div>
        </section>
      </div>

      <GraphEditorContextMenu
        locale={locale}
        contextMenu={contextMenu}
        selection={selection}
        hasClipboard={hasClipboard}
        copySelection={copySelection}
        duplicateSelection={duplicateSelection}
        pasteClipboard={pasteClipboard}
        deleteSelected={deleteSelected}
        selectAll={selectAll}
        fitView={fitView}
        closeContextMenu={() => setContextMenu(null)}
      />

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
