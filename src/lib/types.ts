export type VisualizationType = 'graph'

export interface GraphNode {
  id: number
  label: string
  x: number
  y: number
  color?: string
  state?: GraphVisualState
}

export interface GraphEdge {
  from: number
  to: number
  weight?: number
  directed?: boolean
  label?: string
  color?: string
  state?: GraphVisualState
}

export type GraphVisualState =
  | 'default'
  | 'current'
  | 'visited'
  | 'relaxed'
  | 'selected'
  | 'rejected'
  | 'candidate'
  | 'colored'
  | 'component'
  | 'finished'

export interface GraphSetState {
  label: string
  members: number[]
  color?: string
}

export interface GraphState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  directed?: boolean
  visitedNodes: number[]
  currentNode: number | null
  visitedEdges: [number, number][]
  currentEdge: [number, number] | null
  nodeStates?: Record<number, GraphVisualState>
  edgeStates?: Record<string, GraphVisualState>
  nodeColors?: Record<number, string>
  edgeColors?: Record<string, string>
  selectedEdges?: [number, number][]
  rejectedEdges?: [number, number][]
  queue?: number[]
  stack?: number[]
  distances?: Record<number, number | string>
  predecessors?: Record<number, number | string | null>
  labels?: Record<string, string | number>
  order?: number[]
  colors?: Record<number, string>
  sets?: GraphSetState[]
  phase?: string
}

export interface Step {
  graph?: GraphState
  codeLine?: number
  description?: string
  variables?: Record<string, string | number | boolean | null>
  consoleOutput?: string[]
}

export type Difficulty = 'easy' | 'intermediate' | 'advanced'

export interface AlgorithmExample {
  id: string
  label: {
    en: string
    fr: string
  }
}

export interface AlgorithmGraphInput {
  nodes: GraphNode[]
  edges: GraphEdge[]
  directed?: boolean
}

export interface Algorithm {
  id: string
  name: string
  category: string
  difficulty: Difficulty
  description: string
  code: string
  visualization: VisualizationType
  examples?: AlgorithmExample[]
  generateSteps: (locale?: string, exampleId?: string, customGraph?: AlgorithmGraphInput) => Step[]
}

export interface Category {
  name: string
  algorithms: Algorithm[]
}
