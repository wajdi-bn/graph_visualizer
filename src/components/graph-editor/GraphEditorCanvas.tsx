import type { RefObject } from 'react'
import type { Locale } from '@i18n/translations'
import type { EditorDraft, EditorTool, Selection, ViewBox } from './graphEditorTypes'
import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_COLOR,
  NODE_RADIUS,
  SELECTED_COLOR,
  WAITING_EDGE_COLOR,
  endpoint,
  readableTextColor,
} from './graphEditorUtils'

interface MarqueeRect {
  x: number
  y: number
  width: number
  height: number
}

interface GraphEditorCanvasProps {
  svgRef: RefObject<SVGSVGElement | null>
  locale: Locale
  draft: EditorDraft
  tool: EditorTool
  edgeStartId: number | null
  selection: Selection
  selectedEdgeIndexes: number[]
  viewBox: ViewBox
  marqueeRect: MarqueeRect | null
  handlePointerMove: (event: React.PointerEvent<SVGSVGElement>) => void
  handlePointerUp: () => void
  handleWheel: (event: React.WheelEvent<SVGSVGElement>) => void
  openContextMenu: (event: React.MouseEvent, selectionForTarget?: Selection) => void
  handleCanvasPointerDown: (event: React.PointerEvent<SVGRectElement>) => void
  handleEdgePointerDown: (event: React.PointerEvent<SVGLineElement>, index: number) => void
  handleNodePointerDown: (event: React.PointerEvent<SVGGElement>, nodeId: number) => void
}

export function GraphEditorCanvas({
  svgRef,
  locale,
  draft,
  tool,
  edgeStartId,
  selection,
  selectedEdgeIndexes,
  viewBox,
  marqueeRect,
  handlePointerMove,
  handlePointerUp,
  handleWheel,
  openContextMenu,
  handleCanvasPointerDown,
  handleEdgePointerDown,
  handleNodePointerDown,
}: GraphEditorCanvasProps) {
  return (
    <div className="min-h-0 flex-1 p-2 sm:p-3">
      <div className="h-full min-h-[390px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
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
                    )}
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
                  )}
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
  )
}
