import type { Locale } from '@i18n/translations'
import type { GraphEdge, GraphNode } from '@lib/types'
import type { SessionGraph, SessionGraphDraft } from '@lib/sessionGraphs'

export type EditorTool = 'select' | 'node' | 'edge'

export interface Selection {
  nodeIds: number[]
  edgeIndexes: number[]
}

export interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

export interface SelectionBox {
  start: { x: number; y: number }
  end: { x: number; y: number }
}

export type ContextMenuState = {
  x: number
  y: number
} | null

export type ClipboardPayload = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type EditorDraft = SessionGraphDraft & {
  name: string
  description: string
  directed: boolean
  weighted: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type DragState =
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
  | {
      type: 'edge-curve'
      pointerId: number
      edgeIndex: number
      startCurve: number
      startPointerCurve: number
      originalDraft: EditorDraft
      moved: boolean
    }

export interface GraphEditorModalProps {
  open: boolean
  locale: Locale
  graphs: SessionGraph[]
  initialGraphId: string | null
  onClose: () => void
  onSaved: (graph: SessionGraph) => void
  onDeleted: (graphId: string) => void
}
