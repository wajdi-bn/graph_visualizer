import { useEffect, useMemo, useRef, useState } from 'react'
import type { GraphEdge, GraphNode, GraphVisualState, Step } from '@lib/types'
import type { Locale } from '@i18n/translations'
import { translations } from '@i18n/translations'
import { label } from '@lib/algorithms/graphAlgorithmUtils'

const NODE_RADIUS = 22
const EDGE_CURVE_STEP = 24

const stateColors: Record<GraphVisualState, string> = {
  default: 'var(--graph-edge-default, #242424)',
  current: 'var(--graph-current, #ffffff)',
  visited: 'var(--graph-edge-visited, #666666)',
  relaxed: 'var(--graph-relaxed, #38bdf8)',
  selected: 'var(--graph-selected, #34d399)',
  rejected: 'var(--graph-rejected, #fb7185)',
  candidate: 'var(--graph-candidate, #fbbf24)',
  colored: 'var(--graph-selected, #34d399)',
  component: 'var(--graph-relaxed, #38bdf8)',
  finished: 'var(--graph-edge-visited, #666666)',
}

interface GraphVisualizerProps {
  step: Step
  locale?: Locale
  selectedSourceNodeId?: number | null
  selectedSinkNodeId?: number | null
  onSourceNodeClick?: (nodeId: number) => void
  onEdgeWeightChange?: (edgeIndex: number, edge: GraphEdge) => void
}

function edgeKey(from: number, to: number, directed = false) {
  return directed || from <= to ? `${from}-${to}` : `${to}-${from}`
}

function edgeInstanceKey(edge: GraphEdge, index: number, directed = false) {
  return `${edgeKey(edge.from, edge.to, directed)}#${index}`
}

function edgePairKey(edge: Pick<GraphEdge, 'from' | 'to'>) {
  return edge.from <= edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`
}

function pairIncludes(pairs: [number, number][] | undefined, from: number, to: number, directed: boolean) {
  return pairs?.some(([a, b]) =>
    directed ? a === from && b === to : (a === from && b === to) || (a === to && b === from),
  ) ?? false
}

function pathToEdges(path: number[]) {
  const edges: [number, number][] = []
  for (let i = 1; i < path.length; i += 1) edges.push([path[i - 1], path[i]])
  return edges
}

function formatNodeList(ids: number[] | undefined, nodes: GraphNode[]) {
  if (!ids || ids.length === 0) return ''
  return ids.map((id) => nodes.find((node) => node.id === id)?.label ?? String(id)).join(', ')
}

function formatEdgeList(pairs: [number, number][] | undefined, nodes: GraphNode[]) {
  if (!pairs || pairs.length === 0) return ''
  return pairs
    .map(([from, to]) => `${label(nodes, from)}-${label(nodes, to)}`)
    .join(', ')
}

function resolveEdgeState(edge: GraphEdge, index: number, graph: NonNullable<Step['graph']>): GraphVisualState {
  const directed = graph.directed || edge.directed || false
  const key = edgeKey(edge.from, edge.to, directed)
  const undirectedKey = edgeKey(edge.from, edge.to, false)
  const instanceKey = edgeInstanceKey(edge, index, directed)

  // Check selectedEdges/rejectedEdges FIRST - these take precedence over currentEdge
  if (pairIncludes(graph.selectedEdges, edge.from, edge.to, directed)) return 'selected'
  if (pairIncludes(graph.rejectedEdges, edge.from, edge.to, directed)) return 'rejected'
  
  if (graph.currentEdge) {
    const [from, to] = graph.currentEdge
    const currentMatches = directed
      ? from === edge.from && to === edge.to
      : (from === edge.from && to === edge.to) || (from === edge.to && to === edge.from)
    if (currentMatches) return 'current'
  }
  if (graph.edgeStates?.[instanceKey]) return graph.edgeStates[instanceKey]
  if (graph.edgeStates?.[key]) return graph.edgeStates[key]
  if (graph.edgeStates?.[undirectedKey]) return graph.edgeStates[undirectedKey]
  if (pairIncludes(graph.visitedEdges, edge.from, edge.to, directed)) return 'visited'
  return edge.state ?? 'default'
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

function hexToRgb(color: string) {
  const normalized = color.trim()
  const shortMatch = /^#([0-9a-f]{3})$/i.exec(normalized)
  if (shortMatch) {
    const [, value] = shortMatch
    return {
      r: parseInt(value[0] + value[0], 16),
      g: parseInt(value[1] + value[1], 16),
      b: parseInt(value[2] + value[2], 16),
    }
  }

  const longMatch = /^#([0-9a-f]{6})$/i.exec(normalized)
  if (!longMatch) return null
  const [, value] = longMatch
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function getEdgeCurve(edge: GraphEdge, index: number, edges: GraphEdge[]) {
  if (Number.isFinite(edge.curve)) return Number(edge.curve)

  // Check if there is an opposite-direction edge between the same two nodes
  const hasOppositeEdge = edges.some(
    (candidate, candidateIndex) =>
      candidateIndex !== index && candidate.from === edge.to && candidate.to === edge.from
  )

  if (hasOppositeEdge) {
    // Opposite edges: curve in opposite directions (positive for one, negative for other)
    // Use the canonical direction (from < to) to determine the sign
    const curveMagnitude = EDGE_CURVE_STEP
    if (edge.from < edge.to) {
      return curveMagnitude
    } else {
      return -curveMagnitude
    }
  }

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

function getEdgePathGeometry(
  edge: GraphEdge,
  index: number,
  edges: GraphEdge[],
  from: GraphNode,
  to: GraphNode,
  directed: boolean,
) {
  const end = directed
    ? endpoint(from.x, from.y, to.x, to.y, NODE_RADIUS + 4)
    : { x: to.x, y: to.y }
  const start = directed
    ? endpoint(to.x, to.y, from.x, from.y, NODE_RADIUS + 2)
    : { x: from.x, y: from.y }
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

  return { path, label }
}

function readableTextColor(fill: string | undefined) {
  if (!fill) return 'var(--graph-node-text, #fff)'
  const rgb = hexToRgb(fill)
  if (!rgb) return 'var(--graph-node-text, #fff)'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.58 ? '#0f172a' : '#ffffff'
}

export default function GraphVisualizer({
  step,
  locale = 'en',
  selectedSourceNodeId,
  selectedSinkNodeId,
  onSourceNodeClick,
  onEdgeWeightChange,
}: GraphVisualizerProps) {
  const t = translations[locale]
  const { graph } = step
  if (!graph) return null

  const {
    nodes,
    edges,
    visitedNodes = [],
    currentNode,
    distances,
    predecessors,
    queue,
    stack,
    order,
    sets,
    nodeColors,
    colors,
    phase,
    selectedEdges,
    components,
    treeNodes,
    remainingNodes,
    pathResults,
    resultPath,
    resultNote,
    labels,
  } = graph

  const currentNodeLabel =
    currentNode != null ? nodes.find((node) => node.id === currentNode)?.label : null
  const visitedLabels = visitedNodes
    .map((id) => nodes.find((node) => node.id === id)?.label)
    .filter(Boolean)
  const hasEdgeLabels = edges.some((edge) => edge.weight != null || edge.label)
  // Prefer explicit UI selections, then fall back to the source/sink recorded by the current step.
  const activeSourceNodeId = selectedSourceNodeId ?? graph.sourceNodeId ?? null
  const activeSinkNodeId = selectedSinkNodeId ?? graph.sinkNodeId ?? null
  const [selectedResultNodeId, setSelectedResultNodeId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setSelectedResultNodeId(null)
  }, [pathResults])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setSelectedResultNodeId(null)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const highlightedResult = useMemo(() => {
    if (!pathResults || selectedResultNodeId == null) return null
    return pathResults.entries.find((entry) => entry.nodeId === selectedResultNodeId) ?? null
  }, [pathResults, selectedResultNodeId])

  const highlightedEdges = useMemo(() => {
    if (!highlightedResult) return []
    return pathToEdges(highlightedResult.path)
  }, [highlightedResult])

  const highlightedNodes = useMemo(() => {
    if (!highlightedResult) return new Set<number>()
    return new Set(highlightedResult.path)
  }, [highlightedResult])

  const chipClass =
    'text-xs font-mono bg-white/6 text-neutral-300 px-2 py-1 rounded-md border border-white/8'

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center gap-4"
      role="img"
      aria-label={`Graph visualization: ${nodes.length} nodes, ${edges.length} edges.${currentNodeLabel ? ` Current node: ${currentNodeLabel}.` : ''}${visitedLabels.length > 0 ? ` Visited: ${visitedLabels.join(', ')}.` : ''}`}
    >
      {phase && (
        <div className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
          {phase}
        </div>
      )}

      <svg viewBox="0 0 500 340" className="w-full max-w-xl" aria-hidden="true">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker
            id="arrow-context"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>

        {edges.map((edge, index) => {
          const from = nodes.find((node) => node.id === edge.from)
          const to = nodes.find((node) => node.id === edge.to)
          if (!from || !to) return null

          const directed = graph.directed || edge.directed || false
          const state = resolveEdgeState(edge, index, graph)
          const isHighlighted = highlightedResult
            ? pairIncludes(highlightedEdges, edge.from, edge.to, directed)
            : false
          // When a specific result is highlighted, suppress other algorithm-driven edge
          // highlights by forcing non-selected edges to the default visual state.
          const effectiveState: GraphVisualState = highlightedResult && !isHighlighted ? 'default' : state
          const customEdgeColor =
            graph.edgeColors?.[edgeInstanceKey(edge, index, directed)] ??
            graph.edgeColors?.[edgeKey(edge.from, edge.to, directed)] ??
            null
          const baseColor = customEdgeColor ?? edge.color ?? stateColors[effectiveState]
          const color =
            effectiveState === 'rejected'
              ? stateColors.rejected
              : effectiveState === 'selected' && customEdgeColor == null
                ? stateColors.selected
                : baseColor
          const geometry = getEdgePathGeometry(edge, index, edges, from, to, directed)
          const edgeLabel = edge.label ?? edge.weight

          const handleEdgeClick = () => {
            if (!onEdgeWeightChange) return
            onEdgeWeightChange(index, edge)
          }

          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              {onEdgeWeightChange && (
                <path
                  d={geometry.path}
                  stroke="transparent"
                  strokeWidth={14}
                  strokeLinecap="round"
                  fill="none"
                  className="cursor-pointer"
                  onClick={handleEdgeClick}
                />
              )}
              <path
                d={geometry.path}
                stroke={isHighlighted ? highlightedResult?.color : color}
                strokeWidth={
                  isHighlighted || effectiveState === 'current' || effectiveState === 'selected' ? 3 : 2
                }
                strokeDasharray={state === 'rejected' ? '5 5' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                markerEnd={directed ? 'url(#arrow-context)' : undefined}
                filter={state === 'current' ? 'url(#glow)' : undefined}
                className={onEdgeWeightChange ? 'cursor-pointer' : undefined}
                onClick={onEdgeWeightChange ? handleEdgeClick : undefined}
              />
              {hasEdgeLabels && edgeLabel != null && (
                <>
                  <circle
                    cx={geometry.label.x}
                    cy={geometry.label.y}
                    r={edge.weight != null && edge.weight < 0 ? 12 : 10}
                    fill="var(--graph-weight-bg, #000)"
                    stroke={isHighlighted ? highlightedResult?.color : color}
                    strokeWidth={1}
                    className={onEdgeWeightChange ? 'cursor-pointer' : undefined}
                    onClick={onEdgeWeightChange ? handleEdgeClick : undefined}
                  />
                  <text
                    x={geometry.label.x}
                    y={geometry.label.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={state === 'current' ? 'var(--graph-current-text, #000)' : 'var(--graph-weight-text, #aaa)'}
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="Inter, system-ui, sans-serif"
                    className={onEdgeWeightChange ? 'cursor-pointer' : undefined}
                    onClick={onEdgeWeightChange ? handleEdgeClick : undefined}
                  >
                    {edgeLabel}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {nodes.map((node) => {
          const isCurrent = currentNode === node.id
          const isVisited = visitedNodes.includes(node.id)
          const customColor = nodeColors?.[node.id] ?? colors?.[node.id] ?? node.color
          const nodeState = graph.nodeStates?.[node.id] ?? node.state
          const fill = isCurrent
            ? 'var(--graph-node-current, #fff)'
            : customColor
              ? customColor
              : isVisited || nodeState === 'visited' || nodeState === 'component'
                ? 'var(--graph-node-visited, #555)'
                : 'var(--graph-node-default, #1a1a1a)'
          const stroke = isCurrent
            ? 'var(--graph-node-current, #fff)'
            : customColor
              ? customColor
              : isVisited || nodeState === 'visited' || nodeState === 'component'
                ? 'var(--graph-stroke-visited, #777)'
                : 'var(--graph-stroke-default, #333)'
          const textFill = isCurrent
            ? 'var(--graph-current-text, #000)'
            : customColor
              ? readableTextColor(customColor)
              : 'var(--graph-node-text, #fff)'

          const isSourceSelected = activeSourceNodeId === node.id
          const isSinkSelected = activeSinkNodeId === node.id
          const isResultNode = highlightedNodes.has(node.id)
          const resultColor = highlightedResult?.color

          return (
            <g key={node.id}>
              {isCurrent && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS + 4}
                  fill="none"
                  stroke="var(--graph-node-current, #fff)"
                  strokeWidth={2}
                  opacity={0.25}
                >
                  <animate
                    attributeName="r"
                    values={`${NODE_RADIUS + 3};${NODE_RADIUS + 10};${NODE_RADIUS + 3}`}
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0;0.3"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {isSourceSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS + 6}
                  fill="none"
                  stroke="var(--graph-selected, #34d399)"
                  strokeWidth={3}
                  opacity={0.8}
                  style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              )}

              {isSinkSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS + 9}
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth={3}
                  opacity={0.8}
                  style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              )}

              {isResultNode && resultColor && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS + 7}
                  fill="none"
                  stroke={resultColor}
                  strokeWidth={3}
                  opacity={0.85}
                />
              )}

              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
                style={{
                  cursor: onSourceNodeClick ? 'pointer' : 'default',
                }}
                filter={isCurrent ? 'url(#glow)' : undefined}
                onClick={onSourceNodeClick ? () => onSourceNodeClick(node.id) : undefined}
              />

              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={textFill}
                fontSize="13"
                fontWeight="700"
                fontFamily="Inter, system-ui, sans-serif"
                style={{
                  pointerEvents: 'none',
                }}
              >
                {node.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl">
        {queue && (
          <StatusGroup
            label={t.queue}
            value={queue.length > 0 ? formatNodeList(queue, nodes) : t.empty}
            chipClass={chipClass}
          />
        )}
        {stack && (
          <StatusGroup
            label={t.stack}
            value={stack.length > 0 ? formatNodeList(stack, nodes) : t.empty}
            chipClass={chipClass}
          />
        )}
        {order && (
          <StatusGroup
            label={t.order}
            value={order.length > 0 ? formatNodeList(order, nodes) : t.empty}
            chipClass={chipClass}
          />
        )}
      </div>

      {!pathResults && (distances || predecessors) && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
          {distances && (
            <StatusMap
              label={typeof labels?.distances === 'string' ? labels.distances : t.distances}
              entries={Object.entries(distances).map(([nodeId, value]) => ({
                id: Number(nodeId),
                key: nodes.find((node) => node.id === Number(nodeId))?.label ?? nodeId,
                value,
              }))}
              chipClass={chipClass}
              activeId={selectedResultNodeId}
              onEntryClick={
                pathResults
                  ? (entryId) => {
                      const entry = pathResults.entries.find((item) => item.nodeId === entryId)
                      if (entry?.reachable) setSelectedResultNodeId(entryId)
                    }
                  : undefined
              }
            />
          )}
          {predecessors && (
            <StatusMap
              label={typeof labels?.predecessors === 'string' ? labels.predecessors : t.predecessors}
              entries={Object.entries(predecessors).map(([nodeId, value]) => ({
                id: Number(nodeId),
                key: nodes.find((node) => node.id === Number(nodeId))?.label ?? nodeId,
                value:
                  value == null
                    ? '-'
                    : typeof value === 'number'
                      ? nodes.find((node) => node.id === value)?.label ?? value
                      : value,
              }))}
              chipClass={chipClass}
            />
          )}
        </div>
      )}

      {pathResults && (
        <div className="flex flex-col items-center gap-2 max-w-3xl">
          <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
            {t.shortestPathResults}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {pathResults.entries.map((entry) => {
              const nodeLabel = nodes.find((node) => node.id === entry.nodeId)?.label ?? entry.nodeId
              const distanceLabel = entry.reachable ? String(entry.distance) : t.unreachable
              const isActive = selectedResultNodeId === entry.nodeId
              return (
                <button
                  key={entry.nodeId}
                  type="button"
                  onClick={() => entry.reachable && setSelectedResultNodeId(entry.nodeId)}
                  className={`${chipClass} flex items-center gap-2 ${
                    entry.reachable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                  } ${isActive ? 'border-white/40 text-white' : ''}`}
                  aria-pressed={isActive}
                >
                  <span
                    className="inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>
                    {nodeLabel}: {distanceLabel}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {resultPath && resultPath.length > 0 && (
        <div className="flex flex-col items-center gap-2 max-w-3xl">
          <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
            {t.resultPath}
          </span>
          <div className="text-xs font-mono text-neutral-200 bg-white/6 px-3 py-2 rounded-md border border-white/10">
            {resultPath
              .map((id) => nodes.find((node) => node.id === id)?.label ?? id)
              .join(' -> ')}
          </div>
          {resultNote && (
            <div className="text-[11px] text-emerald-300/90 font-medium">
              {resultNote}
            </div>
          )}
        </div>
      )}

      {typeof labels?.treeEdges === 'string' && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
          <StatusGroup
            label={labels.treeEdges}
            value={
              selectedEdges && selectedEdges.length > 0
                ? formatEdgeList(selectedEdges, nodes)
                : t.empty
            }
            chipClass={chipClass}
          />
        </div>
      )}

      {(treeNodes || remainingNodes || currentNode != null) && (treeNodes || remainingNodes) && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
          <StatusGroup
            label={t.processingNode}
            value={currentNodeLabel ?? t.empty}
            chipClass={chipClass}
          />
          {treeNodes && (
            <StatusGroup
              label={t.treeNodes}
              value={treeNodes.length > 0 ? formatNodeList(treeNodes, nodes) : t.empty}
              chipClass={chipClass}
            />
          )}
          {remainingNodes && (
            <StatusGroup
              label={t.remainingNodes}
              value={remainingNodes.length > 0 ? formatNodeList(remainingNodes, nodes) : t.empty}
              chipClass={chipClass}
            />
          )}
        </div>
      )}

      {components && components.length > 0 && (
        <div className="flex flex-col items-center gap-2 max-w-3xl">
          <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
            {t.components}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {components.map((component, index) => (
              <span key={index} className={chipClass}>
                {t.componentLabel.replace('{n}', String(index + 1))}: {formatNodeList(component, nodes)}
              </span>
            ))}
          </div>
        </div>
      )}

      {sets && sets.length > 0 && !treeNodes && !remainingNodes && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
          <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
            {t.sets}
          </span>
          {sets.map((set) => (
            <span
              key={`${set.label}-${set.members.join('-')}`}
              className={chipClass}
              style={{ borderColor: set.color, color: set.color }}
            >
              {set.label}: {'{'}
              {set.members.map((id) => nodes.find((node) => node.id === id)?.label ?? id).join(', ')}
              {'}'}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusGroup({
  label,
  value,
  chipClass,
}: {
  label: string
  value: string
  chipClass: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className={chipClass}>{value}</span>
    </div>
  )
}

function StatusMap({
  label,
  entries,
  chipClass,
  activeId,
  onEntryClick,
}: {
  label: string
  entries: { id?: number; key: string; value: string | number }[]
  chipClass: string
  activeId?: number | null
  onEntryClick?: (id: number) => void
}) {
  return (
    <div className="flex items-center gap-2.5 flex-wrap justify-center">
      <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
        {label}
      </span>
      <div className="flex gap-1 flex-wrap" aria-hidden="true">
        {entries.map(({ id, key, value }) => {
          const isActive = id != null && activeId === id
          const canClick = id != null && onEntryClick
          const className = `${chipClass} ${canClick ? 'cursor-pointer' : ''} ${
            isActive ? 'border-white/40 text-white' : ''
          }`

          if (canClick) {
            return (
              <button
                key={key}
                type="button"
                className={className}
                onClick={() => onEntryClick(id)}
                aria-pressed={isActive}
              >
                {key}: {String(value)}
              </button>
            )
          }

          return (
            <span key={key} className={className}>
              {key}: {String(value)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
