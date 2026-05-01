import { useEffect, useMemo, useRef, useState } from 'react'
import type { GraphEdge, GraphNode } from '@lib/types'
import type { Locale } from '@i18n/translations'
import {
  deleteSessionGraph,
  saveSessionGraph,
  type SessionGraph,
  type SessionGraphDraft,
} from '@lib/sessionGraphs'

const CANVAS_WIDTH = 500
const CANVAS_HEIGHT = 340
const NODE_RADIUS = 22
const DEFAULT_NODE_COLOR = '#111827'
const DEFAULT_EDGE_COLOR = '#737373'

type EditorTool = 'select' | 'node' | 'edge'
type SelectedElement = { type: 'node'; id: number } | { type: 'edge'; index: number } | null

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
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
  const [draft, setDraft] = useState<EditorDraft>(() => blankDraft())
  const [tool, setTool] = useState<EditorTool>('select')
  const [selected, setSelected] = useState<SelectedElement>(null)
  const [edgeStartId, setEdgeStartId] = useState<number | null>(null)
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')

  const selectedNode =
    selected?.type === 'node' ? draft.nodes.find((node) => node.id === selected.id) ?? null : null
  const selectedEdge =
    selected?.type === 'edge' ? draft.edges[selected.index] ?? null : null

  const filteredGraphs = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return graphs
    return graphs.filter((graph) =>
      `${graph.name} ${graph.description}`.toLowerCase().includes(needle),
    )
  }, [graphs, query])

  useEffect(() => {
    if (!open) return

    const initialGraph = initialGraphId
      ? graphs.find((graph) => graph.id === initialGraphId) ?? null
      : null

    setDraft(initialGraph ? draftFromGraph(initialGraph) : blankDraft())
    setTool('select')
    setSelected(null)
    setEdgeStartId(null)
    setDraggingNodeId(null)
    setNotice('')
  }, [open, initialGraphId, graphs])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const target = event.target as HTMLElement | null
        const editing =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.tagName === 'SELECT'
        if (!editing) deleteSelected()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, selected])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2200)
    return () => window.clearTimeout(timer)
  }, [notice])

  if (!open) return null

  function getCanvasPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }

    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const matrix = svg.getScreenCTM()
    if (!matrix) return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
    const transformed = point.matrixTransform(matrix.inverse())
    return {
      x: clamp(transformed.x, NODE_RADIUS, CANVAS_WIDTH - NODE_RADIUS),
      y: clamp(transformed.y, NODE_RADIUS, CANVAS_HEIGHT - NODE_RADIUS),
    }
  }

  function updateDraft(update: Partial<EditorDraft>) {
    setDraft((current) => ({ ...current, ...update }))
  }

  function updateNode(nodeId: number, update: Partial<GraphNode>) {
    setDraft((current) => ({
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
    }))
  }

  function updateEdge(index: number, update: Partial<GraphEdge>) {
    setDraft((current) => ({
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
    }))
  }

  function addNodeAt(x: number, y: number) {
    const id = nextNodeId(draft.nodes)
    const node: GraphNode = {
      id,
      label: nextNodeLabel(draft.nodes),
      x,
      y,
      color: DEFAULT_NODE_COLOR,
    }

    setDraft((current) => ({ ...current, nodes: [...current.nodes, node] }))
    setSelected({ type: 'node', id })
  }

  function addEdge(from: number, to: number) {
    if (from === to) return

    const nextEdge: GraphEdge = {
      from,
      to,
      weight: 1,
      directed: draft.directed,
      color: DEFAULT_EDGE_COLOR,
    }
    const nextKey = edgeKey(nextEdge, draft.directed)
    const exists = draft.edges.some((edge) => edgeKey(edge, draft.directed) === nextKey)
    if (exists) {
      setNotice(locale === 'fr' ? 'Cette arete existe deja.' : 'That edge already exists.')
      return
    }

    setDraft((current) => ({ ...current, edges: [...current.edges, nextEdge] }))
    setSelected({ type: 'edge', index: draft.edges.length })
  }

  function deleteSelected() {
    if (!selected) return

    if (selected.type === 'node') {
      const nodeId = selected.id
      setDraft((current) => ({
        ...current,
        nodes: current.nodes.filter((node) => node.id !== nodeId),
        edges: current.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
      }))
    } else {
      setDraft((current) => ({
        ...current,
        edges: current.edges.filter((_, index) => index !== selected.index),
      }))
    }

    setSelected(null)
    setEdgeStartId(null)
  }

  function handleCanvasPointerDown(event: React.PointerEvent<SVGRectElement>) {
    const point = getCanvasPoint(event.clientX, event.clientY)
    setSelected(null)
    setEdgeStartId(null)

    if (tool === 'node') {
      addNodeAt(point.x, point.y)
      setTool('select')
    }
  }

  function handleNodePointerDown(event: React.PointerEvent<SVGGElement>, nodeId: number) {
    event.stopPropagation()
    setSelected({ type: 'node', id: nodeId })

    if (tool === 'edge') {
      if (edgeStartId == null) {
        setEdgeStartId(nodeId)
      } else {
        addEdge(edgeStartId, nodeId)
        setEdgeStartId(null)
      }
      return
    }

    setDraggingNodeId(nodeId)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (draggingNodeId == null || tool !== 'select') return
    const point = getCanvasPoint(event.clientX, event.clientY)
    updateNode(draggingNodeId, point)
  }

  function handlePointerUp() {
    setDraggingNodeId(null)
  }

  function layoutCircle() {
    if (draft.nodes.length === 0) return
    const radius = Math.min(118, 38 + draft.nodes.length * 9)
    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT / 2
    const nextNodes = draft.nodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / draft.nodes.length - Math.PI / 2
      return {
        ...node,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      }
    })
    updateDraft({ nodes: nextNodes })
  }

  function handleSave(saveAsCopy = false) {
    const graph = saveSessionGraph(
      {
        ...draft,
        id: saveAsCopy ? undefined : draft.id,
        name: saveAsCopy
          ? `${draft.name.trim() || 'Untitled graph'} ${locale === 'fr' ? '(copie)' : '(copy)'}`
          : draft.name.trim() || 'Untitled graph',
      },
      saveAsCopy,
    )
    onSaved(graph)
    onClose()
  }

  function handleDeleteGraph() {
    if (!draft.id) return
    const confirmed = window.confirm(
      locale === 'fr'
        ? 'Supprimer ce graphe de sessionStorage ?'
        : 'Delete this graph from sessionStorage?',
    )
    if (!confirmed) return
    deleteSessionGraph(draft.id)
    onDeleted(draft.id)
    setDraft(blankDraft())
    setSelected(null)
  }

  function selectGraph(graph: SessionGraph) {
    setDraft(draftFromGraph(graph))
    setSelected(null)
    setEdgeStartId(null)
    setTool('select')
  }

  function clearGraph() {
    setDraft((current) => ({
      ...current,
      nodes: [],
      edges: [],
    }))
    setSelected(null)
    setEdgeStartId(null)
  }

  function setDirected(directed: boolean) {
    setDraft((current) => ({
      ...current,
      directed,
      edges: current.edges.map((edge) => ({ ...edge, directed })),
    }))
  }

  const title = draft.id
    ? locale === 'fr'
      ? 'Modifier le graphe'
      : 'Edit graph'
    : locale === 'fr'
      ? 'Creer un graphe'
      : 'Create graph'

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
                onClick={() => {
                  setDraft(blankDraft())
                  setSelected(null)
                  setEdgeStartId(null)
                }}
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
                        ? 'border-emerald-400/60 bg-emerald-400/10'
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
                {draft.nodes.length} {locale === 'fr' ? 'sommets' : 'nodes'} / {draft.edges.length}{' '}
                {locale === 'fr' ? 'aretes' : 'edges'}
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
                  disabled={!selected}
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
                    viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                    className="h-full w-full touch-none"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
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
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#d4d4d4" />
                      </marker>
                    </defs>
                    <rect
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      fill="transparent"
                      onPointerDown={handleCanvasPointerDown}
                    />

                    {draft.edges.map((edge, index) => {
                      const from = draft.nodes.find((node) => node.id === edge.from)
                      const to = draft.nodes.find((node) => node.id === edge.to)
                      if (!from || !to) return null

                      const selectedEdgeIndex = selected?.type === 'edge' ? selected.index : -1
                      const selectedEdge = selectedEdgeIndex === index
                      const color = selectedEdge ? '#34d399' : edge.color ?? DEFAULT_EDGE_COLOR
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
                            onPointerDown={(event) => {
                              event.stopPropagation()
                              setSelected({ type: 'edge', index })
                              setEdgeStartId(null)
                            }}
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
                              <circle cx={midX} cy={midY} r={11} fill="#000" stroke={color} strokeWidth={1} />
                              <text
                                x={midX}
                                y={midY}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#d4d4d4"
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
                      const active = selected?.type === 'node' && selected.id === node.id
                      const waitingForEdge = tool === 'edge' && edgeStartId === node.id
                      return (
                        <g
                          key={node.id}
                          onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                          className="cursor-pointer"
                        >
                          {(active || waitingForEdge) && (
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={NODE_RADIUS + 5}
                              fill="none"
                              stroke={waitingForEdge ? '#fbbf24' : '#34d399'}
                              strokeWidth={2}
                              opacity={0.9}
                            />
                          )}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={NODE_RADIUS}
                            fill={node.color ?? DEFAULT_NODE_COLOR}
                            stroke={active ? '#34d399' : '#d4d4d4'}
                            strokeWidth={active ? 2.4 : 1.6}
                          />
                          <text
                            x={node.x}
                            y={node.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize="12"
                            fontWeight={700}
                          >
                            {node.label}
                          </text>
                        </g>
                      )
                    })}
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
                        className="h-4 w-4 accent-emerald-400"
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
                      {locale === 'fr'
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

                  {selectedEdge && selected?.type === 'edge' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <FieldLabel label={locale === 'fr' ? 'Source' : 'Source'}>
                          <select
                            value={selectedEdge.from}
                            onChange={(event) =>
                              updateEdge(selected.index, { from: Number(event.target.value) })
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
                              updateEdge(selected.index, { to: Number(event.target.value) })
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
                            updateEdge(selected.index, {
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
                            updateEdge(selected.index, { label: event.target.value || undefined })
                          }
                          className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                        />
                      </FieldLabel>
                      <FieldLabel label={locale === 'fr' ? 'Couleur' : 'Color'}>
                        <input
                          type="color"
                          value={colorValue(selectedEdge.color, DEFAULT_EDGE_COLOR)}
                          onChange={(event) => updateEdge(selected.index, { color: event.target.value })}
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
                      className="h-8 rounded-md border border-rose-400/25 bg-rose-400/10 px-2 text-xs text-rose-200 transition-colors hover:bg-rose-400/15"
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
          ? 'border-emerald-400/60 bg-emerald-400/12 text-emerald-200'
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
