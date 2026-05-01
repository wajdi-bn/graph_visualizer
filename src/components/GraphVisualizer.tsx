import type { GraphEdge, GraphNode, GraphVisualState, Step } from '@lib/types'
import type { Locale } from '@i18n/translations'
import { translations } from '@i18n/translations'

const NODE_RADIUS = 22

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
}

function edgeKey(from: number, to: number, directed = false) {
  return directed || from <= to ? `${from}-${to}` : `${to}-${from}`
}

function pairIncludes(pairs: [number, number][] | undefined, from: number, to: number, directed: boolean) {
  return pairs?.some(([a, b]) =>
    directed ? a === from && b === to : (a === from && b === to) || (a === to && b === from),
  ) ?? false
}

function formatNodeList(ids: number[] | undefined, nodes: GraphNode[]) {
  if (!ids || ids.length === 0) return ''
  return ids.map((id) => nodes.find((node) => node.id === id)?.label ?? String(id)).join(', ')
}

function resolveEdgeState(edge: GraphEdge, graph: NonNullable<Step['graph']>): GraphVisualState {
  const directed = graph.directed || edge.directed || false
  const key = edgeKey(edge.from, edge.to, directed)
  const undirectedKey = edgeKey(edge.from, edge.to, false)

  if (graph.currentEdge) {
    const [from, to] = graph.currentEdge
    const currentMatches = directed
      ? from === edge.from && to === edge.to
      : (from === edge.from && to === edge.to) || (from === edge.to && to === edge.from)
    if (currentMatches) return 'current'
  }
  if (graph.edgeStates?.[key]) return graph.edgeStates[key]
  if (graph.edgeStates?.[undirectedKey]) return graph.edgeStates[undirectedKey]
  if (pairIncludes(graph.rejectedEdges, edge.from, edge.to, directed)) return 'rejected'
  if (pairIncludes(graph.selectedEdges, edge.from, edge.to, directed)) return 'selected'
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

function readableTextColor(fill: string | undefined) {
  if (!fill) return 'var(--graph-node-text, #fff)'
  const rgb = hexToRgb(fill)
  if (!rgb) return 'var(--graph-node-text, #fff)'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.58 ? '#0f172a' : '#ffffff'
}

export default function GraphVisualizer({ step, locale = 'en' }: GraphVisualizerProps) {
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
  } = graph

  const currentNodeLabel =
    currentNode != null ? nodes.find((node) => node.id === currentNode)?.label : null
  const visitedLabels = visitedNodes
    .map((id) => nodes.find((node) => node.id === id)?.label)
    .filter(Boolean)
  const hasEdgeLabels = edges.some((edge) => edge.weight != null || edge.label)

  const chipClass =
    'text-xs font-mono bg-white/6 text-neutral-300 px-2 py-1 rounded-md border border-white/8'

  return (
    <div
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
          {Object.entries(stateColors).map(([state, color]) => (
            <marker
              key={state}
              id={`arrow-${state}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          ))}
        </defs>

        {edges.map((edge, index) => {
          const from = nodes.find((node) => node.id === edge.from)
          const to = nodes.find((node) => node.id === edge.to)
          if (!from || !to) return null

          const directed = graph.directed || edge.directed || false
          const state = resolveEdgeState(edge, graph)
          const color =
            graph.edgeColors?.[edgeKey(edge.from, edge.to, directed)] ??
            edge.color ??
            stateColors[state]
          const end = directed
            ? endpoint(from.x, from.y, to.x, to.y, NODE_RADIUS + 4)
            : { x: to.x, y: to.y }
          const start = directed
            ? endpoint(to.x, to.y, from.x, from.y, NODE_RADIUS + 2)
            : { x: from.x, y: from.y }
          const midX = (start.x + end.x) / 2
          const midY = (start.y + end.y) / 2
          const edgeLabel = edge.label ?? edge.weight

          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={color}
                strokeWidth={state === 'current' || state === 'selected' ? 3 : 2}
                strokeDasharray={state === 'rejected' ? '5 5' : undefined}
                strokeLinecap="round"
                markerEnd={directed ? `url(#arrow-${state})` : undefined}
                style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }}
                filter={state === 'current' ? 'url(#glow)' : undefined}
              />
              {hasEdgeLabels && edgeLabel != null && (
                <>
                  <circle
                    cx={midX}
                    cy={midY}
                    r={edge.weight != null && edge.weight < 0 ? 12 : 10}
                    fill="var(--graph-weight-bg, #000)"
                    stroke={color}
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={state === 'current' ? 'var(--graph-current-text, #000)' : 'var(--graph-weight-text, #aaa)'}
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="Inter, system-ui, sans-serif"
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

              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
                style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
                filter={isCurrent ? 'url(#glow)' : undefined}
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
                style={{ transition: 'fill 0.3s ease' }}
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

      {(distances || predecessors) && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
          {distances && (
            <StatusMap
              label={t.distances}
              entries={Object.entries(distances).map(([nodeId, value]) => [
                nodes.find((node) => node.id === Number(nodeId))?.label ?? nodeId,
                value,
              ])}
              chipClass={chipClass}
            />
          )}
          {predecessors && (
            <StatusMap
              label={t.predecessors}
              entries={Object.entries(predecessors).map(([nodeId, value]) => [
                nodes.find((node) => node.id === Number(nodeId))?.label ?? nodeId,
                value == null
                  ? '-'
                  : typeof value === 'number'
                    ? nodes.find((node) => node.id === value)?.label ?? value
                    : value,
              ])}
              chipClass={chipClass}
            />
          )}
        </div>
      )}

      {sets && sets.length > 0 && (
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
}: {
  label: string
  entries: [string, string | number][]
  chipClass: string
}) {
  return (
    <div className="flex items-center gap-2.5 flex-wrap justify-center">
      <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
        {label}
      </span>
      <div className="flex gap-1 flex-wrap" aria-hidden="true">
        {entries.map(([key, value]) => (
          <span key={key} className={chipClass}>
            {key}: {String(value)}
          </span>
        ))}
      </div>
    </div>
  )
}
