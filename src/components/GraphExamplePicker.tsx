import { useEffect, useRef, useState } from 'react'
import type { Algorithm } from '@lib/types'
import type { Locale } from '@i18n/translations'
import {
  getExampleIdForAlgorithm,
  getIncompatibilityReason,
  graphExampleCatalog,
  type GraphExampleCatalogItem,
} from '@lib/graphExamples'
import {
  getSessionGraphIdFromExampleId,
  makeSessionGraphExampleId,
  type SessionGraph,
} from '@lib/sessionGraphs'
import {
  buildFundamentalGraphTemplate,
  fundamentalGraphOptions,
  type FundamentalGraphKind,
} from '@lib/fundamentalGraphs'

interface GraphExamplePickerProps {
  locale: Locale
  selectedAlgorithm: Algorithm
  selectedExampleId: string | null
  sessionGraphs: SessionGraph[]
  onExampleChange: (exampleId: string) => void
  onCreateGraph: () => void
  onCreateFundamentalGraph: (kind: FundamentalGraphKind, size: number) => void
  onEditGraph: (graphId: string) => void
}

export default function GraphExamplePicker({
  locale,
  selectedAlgorithm,
  selectedExampleId,
  sessionGraphs,
  onExampleChange,
  onCreateGraph,
  onCreateFundamentalGraph,
  onEditGraph,
}: GraphExamplePickerProps) {
  const [open, setOpen] = useState(false)
  const [fundamentalSize, setFundamentalSize] = useState(3)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonLabel = locale === 'fr' ? 'Liste des graphes' : 'Graph list'
  const createLabel = locale === 'fr' ? 'Creer un graphe' : 'Create graph'
  const fundamentalLabel = locale === 'fr' ? 'Graphes fondamentaux' : 'Fundamental graphs'
  const selectedSessionGraphId = getSessionGraphIdFromExampleId(selectedExampleId)
  const currentSessionGraph =
    sessionGraphs.find((graph) => graph.id === selectedSessionGraphId) ?? null
  const currentItem =
    graphExampleCatalog.find(
      (item) => getExampleIdForAlgorithm(item, selectedAlgorithm.id) === selectedExampleId,
    ) ?? graphExampleCatalog.find((item) => getExampleIdForAlgorithm(item, selectedAlgorithm.id))
  const currentLabel = currentSessionGraph?.name ?? currentItem?.label[locale]

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`h-7 max-w-[210px] flex items-center gap-1.5 rounded-md border px-2 text-[11px] transition-colors ${
          open
            ? 'border-white/18 bg-white/10 text-white'
            : 'border-white/8 bg-white/6 text-neutral-300 hover:bg-white/8 hover:text-white'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={buttonLabel}
        title={buttonLabel}
      >
        <GridIcon />
        <span className="shrink-0">{buttonLabel}</span>
        {currentLabel && (
          <>
            <span className="text-neutral-600" aria-hidden="true">
              /
            </span>
            <span className="truncate text-neutral-500">{currentLabel}</span>
          </>
        )}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[640px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-white/12 bg-black shadow-2xl shadow-black/50"
          role="menu"
          aria-label={buttonLabel}
        >
          <div className="border-b border-white/8 px-3 py-2">
            <div className="text-xs font-semibold text-white font-heading">{buttonLabel}</div>
          </div>

          <div className="max-h-[min(70vh,560px)] overflow-y-auto p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {graphExampleCatalog.map((item) => (
                <GraphExampleCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  algorithmId={selectedAlgorithm.id}
                  selectedExampleId={selectedExampleId}
                  onSelect={(exampleId) => {
                    onExampleChange(exampleId)
                    setOpen(false)
                  }}
                />
              ))}

              {sessionGraphs.length > 0 && (
                <div className="col-span-2 md:col-span-3 mt-1 border-t border-white/8 pt-3 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                  {locale === 'fr' ? 'Graphes de session' : 'Session graphs'}
                </div>
              )}

              {sessionGraphs.map((graph) => (
                <SessionGraphCard
                  key={graph.id}
                  graph={graph}
                  locale={locale}
                  selected={graph.id === selectedSessionGraphId}
                  onSelect={(graphId) => {
                    onExampleChange(makeSessionGraphExampleId(graphId))
                    setOpen(false)
                  }}
                  onEdit={(graphId) => {
                    onEditGraph(graphId)
                    setOpen(false)
                  }}
                />
              ))}

              <div className="col-span-2 md:col-span-3 mt-1 border-t border-white/8 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                    {fundamentalLabel}
                  </div>
                  <label className="flex items-center gap-2 text-[10px] text-neutral-500">
                    <span>n</span>
                    <input
                      type="number"
                      min={3}
                      max={12}
                      value={fundamentalSize}
                      onChange={(event) => {
                        const next = Number(event.target.value)
                        setFundamentalSize(Number.isFinite(next) ? Math.max(3, Math.floor(next)) : 3)
                      }}
                      className="h-7 w-16 rounded-md border border-white/10 bg-black px-2 text-[11px] text-white outline-none focus:border-white/24"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {fundamentalGraphOptions.map((option) => {
                    const template = buildFundamentalGraphTemplate(option.kind, fundamentalSize, locale)
                    return (
                      <button
                        key={option.kind}
                        type="button"
                        onClick={() => {
                          onCreateFundamentalGraph(option.kind, fundamentalSize)
                          setOpen(false)
                        }}
                        className="min-h-[132px] rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-left transition-colors hover:border-white/22 hover:bg-white/8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/25"
                        role="menuitem"
                        aria-label={`${option.label[locale]} n=${fundamentalSize}`}
                        title={option.description[locale]}
                      >
                        <SessionGraphPreview
                          graph={{
                            id: option.kind,
                            name: template.name,
                            description: template.description,
                            directed: template.directed,
                            weighted: template.weighted,
                            nodes: template.nodes,
                            edges: template.edges,
                            createdAt: '',
                            updatedAt: '',
                          }}
                          selected={false}
                        />
                        <div className="mt-2 text-xs font-semibold text-white">
                          {option.label[locale]}
                        </div>
                        <div className="mt-1 text-[10px] leading-4 text-neutral-500">
                          {option.description[locale]} {locale === 'fr' ? 'par defaut' : 'by default'} n = {fundamentalSize}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onCreateGraph()
                  setOpen(false)
                }}
                className="min-h-[132px] rounded-lg border border-dashed border-white/16 bg-white/[0.03] p-2.5 text-left transition-colors hover:border-white/28 hover:bg-white/8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/25"
                role="menuitem"
                aria-label={createLabel}
              >
                <div className="mb-2 flex h-[62px] items-center justify-center rounded-md border border-white/8 bg-black/40">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/14 text-xl text-neutral-300">
                    +
                  </span>
                </div>
                <div className="text-xs font-semibold text-white">{createLabel}</div>
                <div className="mt-1 text-[10px] leading-4 text-neutral-500">
                  {locale === 'fr' ? 'Demarrer avec un graphe vide' : 'Start with a blank graph'}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionGraphCard({
  graph,
  locale,
  selected,
  onSelect,
  onEdit,
}: {
  graph: SessionGraph
  locale: Locale
  selected: boolean
  onSelect: (graphId: string) => void
  onEdit: (graphId: string) => void
}) {
  return (
    <div
      className={`min-h-[132px] rounded-lg border p-2.5 text-left transition-all ${
        selected
          ? 'border-emerald-400/70 bg-emerald-400/10'
          : 'border-white/10 bg-white/[0.03] hover:border-white/22 hover:bg-white/8'
      }`}
    >
      <SessionGraphPreview graph={graph} selected={selected} />
      <div className="mt-2 truncate text-xs font-semibold text-white">{graph.name}</div>
      <div className="mt-1 line-clamp-1 text-[10px] leading-4 text-neutral-500">
        {graph.nodes.length} {locale === 'fr' ? 'sommets' : 'nodes'} / {graph.edges.length}{' '}
        {locale === 'fr' ? 'aretes' : 'edges'}
      </div>
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => onSelect(graph.id)}
          className="h-6 flex-1 rounded-md bg-white px-2 text-[10px] font-medium text-black transition-colors hover:bg-neutral-200"
          aria-current={selected ? 'true' : undefined}
        >
          {locale === 'fr' ? 'Ouvrir' : 'Open'}
        </button>
        <button
          type="button"
          onClick={() => onEdit(graph.id)}
          className="h-6 rounded-md border border-white/12 bg-white/6 px-2 text-[10px] text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          {locale === 'fr' ? 'Editer' : 'Edit'}
        </button>
      </div>
    </div>
  )
}

function SessionGraphPreview({
  graph,
  selected,
}: {
  graph: SessionGraph
  selected: boolean
}) {
  const markerId = `session-arrow-${graph.id}`
  const stroke = selected ? '#34d399' : '#737373'
  const nodeStroke = selected ? '#34d399' : '#a3a3a3'
  const normalized = normalizePreviewNodes(graph)

  return (
    <div className="h-[62px] rounded-md border border-white/8 bg-black/40">
      <svg viewBox="0 0 100 64" className="h-full w-full" aria-hidden="true">
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
          </marker>
        </defs>

        {graph.edges.map((edge, index) => {
          const from = normalized.find((node) => node.id === edge.from)
          const to = normalized.find((node) => node.id === edge.to)
          if (!from || !to) return null
          return (
            <line
              key={`${edge.from}-${edge.to}-${index}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={edge.color ?? stroke}
              strokeWidth="1.8"
              strokeLinecap="round"
              markerEnd={graph.directed ? `url(#${markerId})` : undefined}
            />
          )
        })}

        {normalized.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="4.8"
              fill={node.color ?? '#111827'}
              stroke={nodeStroke}
              strokeWidth="1.4"
            />
            <text
              x={node.x}
              y={node.y + 1.5}
              textAnchor="middle"
              fill="#f5f5f5"
              fontSize="4.8"
              fontWeight="700"
            >
              {node.label.slice(0, 2)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function normalizePreviewNodes(graph: SessionGraph) {
  if (graph.nodes.length === 0) return []

  const minX = Math.min(...graph.nodes.map((node) => node.x))
  const maxX = Math.max(...graph.nodes.map((node) => node.x))
  const minY = Math.min(...graph.nodes.map((node) => node.y))
  const maxY = Math.max(...graph.nodes.map((node) => node.y))
  const width = maxX - minX
  const height = maxY - minY

  return graph.nodes.map((node) => ({
    ...node,
    x: width === 0 ? 50 : 10 + ((node.x - minX) / width) * 80,
    y: height === 0 ? 32 : 8 + ((node.y - minY) / height) * 48,
  }))
}

function GraphExampleCard({
  item,
  locale,
  algorithmId,
  selectedExampleId,
  onSelect,
}: {
  item: GraphExampleCatalogItem
  locale: Locale
  algorithmId: string
  selectedExampleId: string | null
  onSelect: (exampleId: string) => void
}) {
  const exampleId = getExampleIdForAlgorithm(item, algorithmId)
  const disabled = !exampleId
  const selected = exampleId != null && exampleId === selectedExampleId
  const reason = disabled ? getIncompatibilityReason(algorithmId, locale) : item.description[locale]

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (exampleId) onSelect(exampleId)
      }}
      className={`min-h-[132px] rounded-lg border p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/25 ${
        selected
          ? 'border-emerald-400/70 bg-emerald-400/10'
          : disabled
            ? 'cursor-not-allowed border-white/6 bg-white/[0.02] opacity-45 grayscale'
            : 'border-white/10 bg-white/[0.03] hover:border-white/22 hover:bg-white/8'
      }`}
      role="menuitem"
      aria-disabled={disabled}
      aria-current={selected ? 'true' : undefined}
      title={reason}
    >
      <GraphPreview item={item} selected={selected} disabled={disabled} />
      <div className={`mt-2 text-xs font-semibold ${disabled ? 'text-neutral-500' : 'text-white'}`}>
        {item.label[locale]}
      </div>
      <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-neutral-500">{reason}</div>
    </button>
  )
}

function GraphPreview({
  item,
  selected,
  disabled,
}: {
  item: GraphExampleCatalogItem
  selected: boolean
  disabled: boolean
}) {
  const markerId = `arrow-${item.id}`
  const stroke = selected ? '#34d399' : disabled ? '#525252' : '#737373'
  const nodeFill = selected ? '#064e3b' : disabled ? '#171717' : '#111827'
  const nodeStroke = selected ? '#34d399' : disabled ? '#404040' : '#a3a3a3'

  return (
    <div className="h-[62px] rounded-md border border-white/8 bg-black/40">
      <svg viewBox="0 0 100 64" className="h-full w-full" aria-hidden="true">
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
          </marker>
        </defs>

        {item.preview.edges.map((edge, index) => {
          const from = item.preview.nodes.find((node) => node.id === edge.from)
          const to = item.preview.nodes.find((node) => node.id === edge.to)
          if (!from || !to) return null
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2

          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={edge.weight != null && edge.weight < 0 ? '#fb7185' : stroke}
                strokeWidth="1.8"
                strokeLinecap="round"
                markerEnd={edge.directed ? `url(#${markerId})` : undefined}
              />
              {edge.weight != null && (
                <text
                  x={midX}
                  y={midY - 2}
                  textAnchor="middle"
                  fill={edge.weight < 0 ? '#fb7185' : '#d4d4d4'}
                  fontSize="5"
                  fontWeight="700"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          )
        })}

        {item.preview.nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="4.8"
              fill={nodeFill}
              stroke={nodeStroke}
              strokeWidth="1.4"
            />
            <text
              x={node.x}
              y={node.y + 1.5}
              textAnchor="middle"
              fill="#f5f5f5"
              fontSize="4.8"
              fontWeight="700"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function GridIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M2 2h5v5H2V2Zm7 0h5v5H9V2ZM2 9h5v5H2V9Zm7 0h5v5H9V9Z" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3 w-3 shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4.22 5.97 8 9.75l3.78-3.78.94.94L8 11.63 3.28 6.91l.94-.94Z" />
    </svg>
  )
}
