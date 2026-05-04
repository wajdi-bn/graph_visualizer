import type {
  AlgorithmGraphInput,
  AlgorithmRunOptions,
  GraphEdge,
  GraphNode,
  GraphState,
  GraphVisualState,
  Step,
} from '@lib/types'
import { d } from '@lib/algorithms/shared'

export const palette = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22c55e']

export const inf = 'inf'

export function isDirectedGraph(graph: AlgorithmGraphInput) {
  return Boolean(graph.directed || graph.edges.some((edge) => edge.directed))
}

// Custom graphs can omit edge weights or direction; normalize once before algorithm-specific logic runs.
export function graphFromInput(
  graph: AlgorithmGraphInput,
  options: { directed?: boolean; defaultWeight?: boolean } = {},
): { nodes: GraphNode[]; edges: GraphEdge[]; directed: boolean } {
  const directed = options.directed ?? isDirectedGraph(graph)
  const nodes = graph.nodes.map((node) => ({ ...node }))
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = graph.edges
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to)
    .map((edge) => ({
      ...edge,
      weight: edge.weight ?? (options.defaultWeight ? 1 : undefined),
      directed,
    }))

  return { nodes, edges, directed }
}

export function label(nodes: GraphNode[], id: number) {
  return nodes.find((node) => node.id === id)?.label ?? String(id)
}

export function edgeKey(from: number, to: number, directed = false) {
  return directed || from <= to ? `${from}-${to}` : `${to}-${from}`
}

export function edgeInstanceKey(edge: Pick<GraphEdge, 'from' | 'to'>, index: number, directed = false) {
  return `${edgeKey(edge.from, edge.to, directed)}#${index}`
}

export function adjacency(edges: GraphEdge[], directed = false) {
  const adj: Record<number, { node: number; weight: number }[]> = {}
  for (const edge of edges) {
    adj[edge.from] ??= []
    adj[edge.to] ??= []
    adj[edge.from].push({ node: edge.to, weight: edge.weight ?? 1 })
    if (!directed && !edge.directed) adj[edge.to].push({ node: edge.from, weight: edge.weight ?? 1 })
  }
  return adj
}

export function baseGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  extra: Partial<GraphState> = {},
): GraphState {
  return {
    nodes,
    edges,
    directed: edges.some((edge) => edge.directed) || extra.directed,
    visitedNodes: [],
    currentNode: null,
    visitedEdges: [],
    currentEdge: null,
    ...extra,
  }
}

export function incompatibilityStep(
  locale: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  directed: boolean,
  messageEn: string,
  messageFr: string,
): Step[] {
  return [
    {
      graph: baseGraph(nodes, edges, {
        directed,
        phase: d(locale, 'Graph is not compatible', 'Graphe incompatible'),
      }),
      description: d(locale, messageEn, messageFr),
      isError: true,
      variables: {
        nodes: nodes.length,
        edges: edges.length,
        directed,
      },
    },
  ]
}

export function requireNodes(locale: string, nodes: GraphNode[], edges: GraphEdge[], directed = false) {
  if (nodes.length > 0) return null
  return incompatibilityStep(
    locale,
    nodes,
    edges,
    directed,
    'Add at least one vertex before running this algorithm.',
    'Ajoutez au moins un sommet avant de lancer cet algorithme.',
  )
}

export function requireUndirectedCustom(
  locale: string,
  graph: AlgorithmGraphInput | undefined,
  nodes: GraphNode[],
  edges: GraphEdge[],
  messageEn: string,
  messageFr: string,
) {
  if (!graph || !isDirectedGraph(graph)) return null
  return incompatibilityStep(locale, nodes, edges, true, messageEn, messageFr)
}

export function requireDirectedCustom(
  locale: string,
  graph: AlgorithmGraphInput | undefined,
  nodes: GraphNode[],
  edges: GraphEdge[],
  messageEn: string,
  messageFr: string,
) {
  if (!graph || isDirectedGraph(graph)) return null
  return incompatibilityStep(locale, nodes, edges, false, messageEn, messageFr)
}

export function requireWeightedGraph(locale: string, nodes: GraphNode[], edges: GraphEdge[], directed = false) {
  const missing = edges.find((edge) => !Number.isFinite(edge.weight))
  if (!missing) return null
  return incompatibilityStep(
    locale,
    nodes,
    edges,
    directed,
    'This algorithm requires a weighted graph. Give every edge a finite numeric weight.',
    'Cet algorithme exige un graphe pondere. Donnez un poids numerique fini a chaque arete.',
  )
}

export function requirePositiveWeights(locale: string, nodes: GraphNode[], edges: GraphEdge[], directed = false) {
  const invalid = edges.find((edge) => !Number.isFinite(edge.weight) || (edge.weight ?? 0) <= 0)
  if (!invalid) return null
  return incompatibilityStep(
    locale,
    nodes,
    edges,
    directed,
    'All edge weights must be strictly positive for this graph type.',
    'Tous les poids des aretes doivent etre strictement positifs pour ce type de graphe.',
  )
}

export function requireConnectedGraph(locale: string, nodes: GraphNode[], edges: GraphEdge[]) {
  if (isConnectedGraph(nodes, edges, false)) return null
  return incompatibilityStep(
    locale,
    nodes,
    edges,
    false,
    'This algorithm needs a connected undirected graph.',
    'Cet algorithme exige un graphe non oriente connexe.',
  )
}

export function resolveSourceNodeId(
  nodes: GraphNode[],
  customGraph?: AlgorithmGraphInput,
  options?: AlgorithmRunOptions,
) {
  const candidate = options?.sourceNodeId ?? customGraph?.sourceNodeId ?? nodes[0]?.id ?? null
  return candidate != null && nodes.some((node) => node.id === candidate) ? candidate : null
}

export function resolveSinkNodeId(
  nodes: GraphNode[],
  source: number | null,
  customGraph?: AlgorithmGraphInput,
  options?: AlgorithmRunOptions,
) {
  const fallback = [...nodes].reverse().find((node) => node.id !== source)?.id ?? null
  const hasOptionSink = options != null && Object.hasOwn(options, 'sinkNodeId')
  const hasGraphSink = customGraph != null && Object.hasOwn(customGraph, 'sinkNodeId')
  const candidate = hasOptionSink
    ? options?.sinkNodeId
    : hasGraphSink
      ? customGraph?.sinkNodeId
      : fallback
  return candidate != null && candidate !== source && nodes.some((node) => node.id === candidate)
    ? candidate
    : null
}

export function requireValidSource(
  locale: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  directed: boolean,
  source: number | null,
) {
  if (source != null) return null
  return incompatibilityStep(
    locale,
    nodes,
    edges,
    directed,
    'Choose a valid source vertex before running this algorithm.',
    'Choisissez un sommet source valide avant de lancer cet algorithme.',
  )
}

export function requireValidSink(
  locale: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  directed: boolean,
  sink: number | null,
) {
  if (sink != null) return null
  return incompatibilityStep(
    locale,
    nodes,
    edges,
    directed,
    'Choose a valid sink vertex different from the source.',
    'Choisissez un puits valide different de la source.',
  )
}

export function topologicalOrder(nodes: GraphNode[], edges: GraphEdge[]) {
  const indegree: Record<number, number> = {}
  const outgoing: Record<number, number[]> = {}
  for (const node of nodes) {
    indegree[node.id] = 0
    outgoing[node.id] = []
  }
  for (const edge of edges) {
    outgoing[edge.from] ??= []
    outgoing[edge.from].push(edge.to)
    indegree[edge.to] = (indegree[edge.to] ?? 0) + 1
  }

  const queue = nodes.filter((node) => indegree[node.id] === 0).map((node) => node.id)
  const order: number[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    order.push(current)
    for (const next of outgoing[current] ?? []) {
      indegree[next] -= 1
      if (indegree[next] === 0) queue.push(next)
    }
  }

  return order.length === nodes.length ? order : null
}

export function hasNegativeWeightCycle(nodes: GraphNode[], edges: GraphEdge[]) {
  const dist: Record<number, number> = {}
  for (const node of nodes) dist[node.id] = 0

  // Initializing every distance at zero is equivalent to adding a super source,
  // so this detects negative cycles anywhere in the directed graph.
  for (let pass = 0; pass < Math.max(0, nodes.length - 1); pass += 1) {
    let changed = false
    for (const edge of edges) {
      const weight = edge.weight ?? 0
      if (dist[edge.from] + weight < dist[edge.to]) {
        dist[edge.to] = dist[edge.from] + weight
        changed = true
      }
    }
    if (!changed) return false
  }

  return edges.some((edge) => dist[edge.from] + (edge.weight ?? 0) < dist[edge.to])
}

export function formatDistances(nodes: GraphNode[], distances: Record<number, number | string>) {
  return nodes.map((node) => `${node.label}:${distances[node.id]}`).join(', ')
}

export function formatPredecessors(nodes: GraphNode[], predecessors: Record<number, number | string | null>) {
  return nodes
    .map((node) => {
      const pred = predecessors[node.id]
      return `${node.label}:${pred == null ? '-' : typeof pred === 'number' ? label(nodes, pred) : pred}`
    })
    .join(', ')
}

export function buildShortestPathResults(
  nodes: GraphNode[],
  predecessors: Record<number, number | null>,
  distances: Record<number, number | string>,
  source: number,
  colors: string[] = palette,
) {
  const entries: {
    nodeId: number
    distance: number | string
    path: number[]
    color: string
    reachable: boolean
  }[] = []

  let colorIndex = 0
  for (const node of nodes) {
    const distance = distances[node.id]
    const unreachable = distance === inf || distance == null
    const visited = new Set<number>()
    const path: number[] = []
    let current: number | null = node.id

    while (current != null && !visited.has(current)) {
      visited.add(current)
      path.push(current)
      if (current === source) break
      const pred = predecessors[current]
      current = typeof pred === 'number' ? pred : null
    }

    const reachable = !unreachable && path[path.length - 1] === source
    const color = reachable ? colors[colorIndex % colors.length] : 'var(--graph-edge-visited, #666666)'
    if (reachable) colorIndex += 1

    entries.push({
      nodeId: node.id,
      distance: distance ?? inf,
      path: reachable ? path.reverse() : [],
      color,
      reachable,
    })
  }

  return {
    sourceId: source,
    entries,
  }
}

export function cloneRecord<T>(record: Record<number, T>) {
  return { ...record }
}

export function cloneEdgeStates(record: Record<string, GraphVisualState>) {
  return { ...record }
}

export function setsFromParent(nodes: GraphNode[], parent: Record<number, number>) {
  const groups = new Map<number, number[]>()
  const find = (x: number): number => (parent[x] === x ? x : find(parent[x]))
  for (const node of nodes) {
    const root = find(node.id)
    groups.set(root, [...(groups.get(root) ?? []), node.id])
  }

  return [...groups.entries()].map(([root, members], index) => ({
    label: label(nodes, root),
    members,
    color: palette[index % palette.length],
  }))
}

export function degreeMap(nodes: GraphNode[], edges: GraphEdge[], directed = false) {
  const degrees: Record<number, number> = {}
  for (const node of nodes) degrees[node.id] = 0
  for (const edge of edges) {
    degrees[edge.from] = (degrees[edge.from] ?? 0) + 1
    if (directed) degrees[edge.to] = (degrees[edge.to] ?? 0) + 1
    else if (!edge.directed) degrees[edge.to] = (degrees[edge.to] ?? 0) + 1
  }
  return degrees
}

export function isConnectedGraph(nodes: GraphNode[], edges: GraphEdge[], directed = false) {
  if (nodes.length <= 1) return nodes.length === 1 || nodes.length === 0
  const adj = adjacency(edges, directed)
  const start = nodes[0].id
  const visited = new Set<number>([start])
  const stack = [start]

  while (stack.length > 0) {
    const current = stack.pop()!
    for (const { node: neighbor } of adj[current] ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        stack.push(neighbor)
      }
    }
  }

  return visited.size === nodes.length
}

export function hasUndirectedCycle(nodes: GraphNode[], edges: GraphEdge[]) {
  const adj = adjacency(edges)
  const visited = new Set<number>()

  const dfs = (node: number, parent: number | null): boolean => {
    visited.add(node)
    for (const { node: neighbor } of adj[node] ?? []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, node)) return true
      } else if (neighbor !== parent) {
        return true
      }
    }
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && dfs(node.id, null)) return true
  }

  return false
}

export function hasDirectedCycle(nodes: GraphNode[], edges: GraphEdge[]) {
  const adj = adjacency(edges, true)
  const visited = new Set<number>()
  const inStack = new Set<number>()

  const dfs = (node: number): boolean => {
    visited.add(node)
    inStack.add(node)

    for (const { node: neighbor } of adj[node] ?? []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (inStack.has(neighbor)) {
        return true
      }
    }

    inStack.delete(node)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && dfs(node.id)) return true
  }

  return false
}

export function isTree(nodes: GraphNode[], edges: GraphEdge[]) {
  return nodes.length > 0 && edges.length === nodes.length - 1 && isConnectedGraph(nodes, edges)
}

export function bfsTraversal(nodes: GraphNode[], edges: GraphEdge[], startId: number, directed = false) {
  const adj = adjacency(edges, directed)
  const visited = new Set<number>([startId])
  const queue = [startId]
  const order: number[] = []
  const distances: Record<number, number | string> = {}
  const predecessors: Record<number, number | null> = {}

  for (const node of nodes) {
    distances[node.id] = node.id === startId ? 0 : inf
    predecessors[node.id] = null
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    order.push(current)
    for (const { node: neighbor } of adj[current] ?? []) {
      if (visited.has(neighbor)) continue
      visited.add(neighbor)
      queue.push(neighbor)
      predecessors[neighbor] = current
      distances[neighbor] = (distances[current] as number) + 1
    }
  }

  return { order, distances, predecessors }
}

export function dfsTraversal(nodes: GraphNode[], edges: GraphEdge[], startId: number, directed = false) {
  const adj = adjacency(edges, directed)
  const visited = new Set<number>()
  const stack = [startId]
  const order: number[] = []
  const predecessors: Record<number, number | null> = {}

  for (const node of nodes) predecessors[node.id] = null

  while (stack.length > 0) {
    const current = stack.pop()!
    if (visited.has(current)) continue
    visited.add(current)
    order.push(current)
    const neighbors = [...(adj[current] ?? [])].map((entry) => entry.node).reverse()
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue
      predecessors[neighbor] = current
      stack.push(neighbor)
    }
  }

  return { order, predecessors }
}

export function shortestUnweightedPath(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: number,
  targetId: number,
  directed = false,
) {
  const { predecessors, distances } = bfsTraversal(nodes, edges, startId, directed)
  return {
    distances,
    predecessors,
    path: reconstructPath(predecessors, startId, targetId),
  }
}

export function isBipartiteGraph(nodes: GraphNode[], edges: GraphEdge[], directed = false) {
  const adj = adjacency(edges, directed)
  const color: Record<number, 0 | 1 | null> = {}

  for (const node of nodes) color[node.id] = null

  for (const start of nodes) {
    if (color[start.id] != null) continue
    color[start.id] = 0
    const queue = [start.id]

    while (queue.length > 0) {
      const current = queue.shift()!
      for (const { node: neighbor } of adj[current] ?? []) {
        if (color[neighbor] == null) {
          color[neighbor] = color[current] === 0 ? 1 : 0
          queue.push(neighbor)
        } else if (color[neighbor] === color[current]) {
          return { bipartite: false, color }
        }
      }
    }
  }

  return { bipartite: true, color }
}

export function isEulerianCircuitGraph(nodes: GraphNode[], edges: GraphEdge[], directed = false) {
  const degrees = degreeMap(nodes, edges, directed)
  const connected = isConnectedGraph(nodes, edges, directed)
  const allEven = Object.values(degrees).every((degree) => degree % 2 === 0)
  return { eulerianCircuit: nodes.length > 0 && connected && allEven, connected, allEven, degrees }
}

function formatNodePath(nodes: GraphNode[], path: number[]) {
  return path.map((id) => label(nodes, id)).join(' -> ')
}

function edgePairsFromPath(path: number[]): [number, number][] {
  const pairs: [number, number][] = []
  for (let i = 0; i < path.length - 1; i += 1) {
    pairs.push([path[i], path[i + 1]])
  }
  return pairs
}

function findUndirectedCyclePath(nodes: GraphNode[], edges: GraphEdge[]) {
  const adj = adjacency(edges, false)
  const visited = new Set<number>()
  const parent: Record<number, number | null> = {}
  for (const node of nodes) parent[node.id] = null

  const buildCycle = (from: number, to: number) => {
    const path = [from]
    let current = from
    while (current !== to && parent[current] != null) {
      current = parent[current] as number
      path.push(current)
    }
    if (current !== to) return null
    path.reverse()
    path.push(path[0])
    return path
  }

  const dfs = (node: number, parentId: number | null): number[] | null => {
    visited.add(node)
    for (const { node: neighbor } of adj[node] ?? []) {
      if (neighbor === parentId) continue
      if (visited.has(neighbor)) {
        return buildCycle(node, neighbor)
      }
      parent[neighbor] = node
      const found = dfs(neighbor, node)
      if (found) return found
    }
    return null
  }

  for (const node of nodes) {
    if (visited.has(node.id)) continue
    const found = dfs(node.id, null)
    if (found) return found
  }

  return null
}

function findDirectedCyclePath(nodes: GraphNode[], edges: GraphEdge[]) {
  const adj = adjacency(edges, true)
  const visited = new Set<number>()
  const inStack = new Set<number>()
  const parent: Record<number, number | null> = {}
  for (const node of nodes) parent[node.id] = null

  const buildCycle = (from: number, to: number) => {
    const path = [from]
    let current = from
    while (current !== to && parent[current] != null) {
      current = parent[current] as number
      path.push(current)
    }
    if (current !== to) return null
    path.reverse()
    path.push(path[0])
    return path
  }

  const dfs = (node: number): number[] | null => {
    visited.add(node)
    inStack.add(node)
    for (const { node: neighbor } of adj[node] ?? []) {
      if (!visited.has(neighbor)) {
        parent[neighbor] = node
        const found = dfs(neighbor)
        if (found) return found
      } else if (inStack.has(neighbor)) {
        return buildCycle(node, neighbor)
      }
    }
    inStack.delete(node)
    return null
  }

  for (const node of nodes) {
    if (visited.has(node.id)) continue
    const found = dfs(node.id)
    if (found) return found
  }

  return null
}

function findEulerianCircuitPath(nodes: GraphNode[], edges: GraphEdge[], directed: boolean) {
  if (nodes.length === 0 || edges.length === 0) return null
  if (directed) return null

  const adj = new Map<number, { node: number; edgeId: number }[]>()
  for (const node of nodes) adj.set(node.id, [])
  edges.forEach((edge, index) => {
    adj.get(edge.from)?.push({ node: edge.to, edgeId: index })
    adj.get(edge.to)?.push({ node: edge.from, edgeId: index })
  })

  const used = new Array(edges.length).fill(false)
  const iterator: Record<number, number> = {}
  for (const node of nodes) iterator[node.id] = 0

  const start = nodes.find((node) => (adj.get(node.id)?.length ?? 0) > 0)?.id ?? nodes[0].id
  const stack = [start]
  const circuit: number[] = []

  while (stack.length > 0) {
    const v = stack[stack.length - 1]
    const list = adj.get(v) ?? []
    let idx = iterator[v] ?? 0
    while (idx < list.length && used[list[idx].edgeId]) idx += 1
    iterator[v] = idx
    if (idx >= list.length) {
      circuit.push(v)
      stack.pop()
    } else {
      const { node: next, edgeId } = list[idx]
      used[edgeId] = true
      stack.push(next)
    }
  }

  if (circuit.length !== edges.length + 1) return null
  return circuit.reverse()
}

function findBipartiteConflictEdge(
  edges: GraphEdge[],
  colors: Record<number, 0 | 1 | null>,
): [number, number] | null {
  for (const edge of edges) {
    const a = colors[edge.from]
    const b = colors[edge.to]
    if (a != null && b != null && a === b) return [edge.from, edge.to]
  }
  return null
}

function findDegreeMismatch(nodes: GraphNode[], degrees: Record<number, number>) {
  if (nodes.length === 0) return null
  const base = degrees[nodes[0].id]
  for (const node of nodes) {
    if (degrees[node.id] !== base) {
      return { nodeId: node.id, degree: degrees[node.id], base }
    }
  }
  return null
}

export type PropertyKey =
  | 'bfs'
  | 'dfs'
  | 'path'
  | 'cycle'
  | 'circuit'
  | 'bipartite'
  | 'tree'
  | 'regular'

export interface PropertyDemoResult {
  title: string
  verdict: string
  description: string
  steps: Step[]
}

export function buildPropertyDemo(
  locale: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  directed: boolean,
  property: PropertyKey,
): PropertyDemoResult | null {
  if (nodes.length === 0) return null

  const source = nodes[0].id
  const target = nodes[nodes.length - 1].id
  const degrees = degreeMap(nodes, edges, directed)
  const makeStep = (extra: Partial<GraphState>, description: string) => ({
    graph: baseGraph(nodes, edges, { directed, ...extra }),
    description,
  })

  if (property === 'bfs') {
    const result = bfsTraversal(nodes, edges, source, directed)
    return {
      title: d(locale, 'Breadth-first traversal', 'Parcours en largeur'),
      verdict: d(locale, 'Traversal computed', 'Parcours calcule'),
      description: d(
        locale,
        `BFS starts at ${label(nodes, source)} and visits the nearest vertices first.`,
        `Le BFS commence en ${label(nodes, source)} et visite d abord les sommets les plus proches.`,
      ),
      steps: [
        makeStep(
          {
            currentNode: source,
            queue: [source],
            distances: result.distances,
            predecessors: result.predecessors,
            phase: d(locale, 'Initialize the queue', 'Initialiser la file'),
          },
          d(locale, 'Put the source in the queue.', 'Mettre la source dans la file.'),
        ),
        makeStep(
          {
            currentNode: source,
            visitedNodes: [source],
            queue: [source],
            distances: result.distances,
            predecessors: result.predecessors,
            phase: d(locale, 'Inspect source neighbors', 'Inspecter les voisins de la source'),
          },
          d(locale, 'The source is removed from the queue and its neighbors are discovered.', 'La source sort de la file et ses voisins sont decouverts.'),
        ),
        makeStep(
          {
            currentNode: result.order[1] ?? source,
            visitedNodes: result.order.slice(0, Math.min(3, result.order.length)),
            queue: result.order.slice(1),
            order: result.order.slice(0, Math.min(3, result.order.length)),
            distances: result.distances,
            predecessors: result.predecessors,
            phase: d(locale, 'Expand the frontier', 'Etendre la frontiere'),
          },
          d(locale, 'Continue level by level with the next vertices.', 'Continuer niveau par niveau avec les sommets suivants.'),
        ),
        makeStep(
          {
            currentNode: result.order[result.order.length - 1] ?? source,
            visitedNodes: result.order,
            order: result.order,
            distances: result.distances,
            predecessors: result.predecessors,
            phase: d(locale, 'BFS order', 'Ordre BFS'),
          },
          d(
            locale,
            `Order: ${formatNodePath(nodes, result.order)}. Distances: ${formatDistances(nodes, result.distances)}. Predecessors: ${formatPredecessors(nodes, result.predecessors)}.`,
            `Ordre: ${formatNodePath(nodes, result.order)}. Distances: ${formatDistances(nodes, result.distances)}. Predecesseurs: ${formatPredecessors(nodes, result.predecessors)}.`,
          ),
        ),
      ],
    }
  }

  if (property === 'dfs') {
    const result = dfsTraversal(nodes, edges, source, directed)
    return {
      title: d(locale, 'Depth-first traversal', 'Parcours en profondeur'),
      verdict: d(locale, 'Traversal computed', 'Parcours calcule'),
      description: d(
        locale,
        `DFS starts at ${label(nodes, source)} and goes deep before backtracking.`,
        `Le DFS commence en ${label(nodes, source)} et descend avant de revenir en arriere.`,
      ),
      steps: [
        makeStep(
          {
            currentNode: source,
            stack: [source],
            phase: d(locale, 'Initialize the stack', 'Initialiser la pile'),
          },
          d(locale, 'Push the start vertex.', 'Empiler le sommet de depart.'),
        ),
        makeStep(
          {
            currentNode: source,
            stack: [source, result.order[1] ?? source],
            visitedNodes: [source],
            phase: d(locale, 'Go deeper', 'Descendre plus loin'),
          },
          d(locale, 'The traversal dives into the first branch before exploring siblings.', 'Le parcours descend dans la premiere branche avant les voisines.'),
        ),
        makeStep(
          {
            currentNode: result.order[Math.max(0, result.order.length - 2)] ?? source,
            stack: result.order.slice().reverse(),
            visitedNodes: result.order.slice(0, Math.max(1, Math.min(4, result.order.length))),
            order: result.order.slice(0, Math.max(1, Math.min(4, result.order.length))),
            phase: d(locale, 'Backtrack', 'Retour en arriere'),
          },
          d(locale, 'When a branch is exhausted, DFS backtracks.', 'Quand une branche est terminee, DFS revient en arriere.'),
        ),
        makeStep(
          {
            currentNode: result.order[result.order.length - 1] ?? source,
            visitedNodes: result.order,
            order: result.order,
            phase: d(locale, 'DFS order', 'Ordre DFS'),
          },
          d(
            locale,
            `Order: ${formatNodePath(nodes, result.order)}. Predecessors: ${formatPredecessors(nodes, result.predecessors)}.`,
            `Ordre: ${formatNodePath(nodes, result.order)}. Predecesseurs: ${formatPredecessors(nodes, result.predecessors)}.`,
          ),
        ),
      ],
    }
  }

  if (property === 'path') {
    const result = shortestUnweightedPath(nodes, edges, source, target, directed)
    const pathText = result.path.length > 0 ? formatNodePath(nodes, result.path) : d(locale, 'No path', 'Aucun chemin')
    const pathEdges = result.path.length > 1 ? edgePairsFromPath(result.path) : []
    return {
      title: d(locale, 'Shortest path', 'Plus court chemin'),
      verdict: result.path.length > 0 ? d(locale, 'Path found', 'Chemin trouve') : d(locale, 'No path', 'Aucun chemin'),
      description: d(
        locale,
        `The search starts at ${label(nodes, source)} and targets ${label(nodes, target)}.`,
        `La recherche part de ${label(nodes, source)} et vise ${label(nodes, target)}.`,
      ),
      steps: [
        makeStep(
          {
            currentNode: source,
            queue: [source],
            distances: result.distances,
            predecessors: result.predecessors,
            phase: d(locale, 'Search the frontier', 'Explorer la frontiere'),
          },
          d(locale, 'Initialize the frontier from the source.', 'Initialiser la frontiere depuis la source.'),
        ),
        makeStep(
          {
            currentNode: source,
            queue: [source, ...(result.path[1] != null ? [result.path[1]] : [])],
            visitedNodes: [source],
            distances: result.distances,
            predecessors: result.predecessors,
            phase: d(locale, 'Relax neighbors', 'Relacher les voisins'),
          },
          d(locale, 'The algorithm assigns distance 1 to the immediate neighbors.', 'L algorithme attribue la distance 1 aux voisins immediats.'),
        ),
        makeStep(
          {
            currentNode: target,
            visitedNodes: result.path.length > 0 ? result.path : [source],
            visitedEdges: pathEdges,
            order: result.path,
            distances: result.distances,
            predecessors: result.predecessors,
            phase: d(locale, 'Reconstruct path', 'Reconstruire le chemin'),
          },
          d(
            locale,
            `Path: ${pathText}. Predecessors: ${formatPredecessors(nodes, result.predecessors)}.`,
            `Chemin : ${pathText}. Predecesseurs : ${formatPredecessors(nodes, result.predecessors)}.`,
          ),
        ),
      ],
    }
  }

  if (property === 'cycle') {
    const hasCycle = directed ? hasDirectedCycle(nodes, edges) : hasUndirectedCycle(nodes, edges)
    const cyclePath = directed ? findDirectedCyclePath(nodes, edges) : findUndirectedCyclePath(nodes, edges)
    const cycleEdges = cyclePath ? edgePairsFromPath(cyclePath) : []
    return {
      title: d(locale, 'Cycle detection', 'Detection de cycle'),
      verdict: hasCycle ? d(locale, 'Cycle found', 'Cycle trouve') : d(locale, 'No cycle', 'Aucun cycle'),
      description: d(
        locale,
        'A depth-first search tracks the active path to detect a back edge.',
        'Un DFS suit le chemin actif pour detecter une arete de retour.',
      ),
      steps: [
        makeStep(
          {
            directed,
            currentNode: source,
            stack: [source],
            visitedNodes: [source],
            phase: d(locale, 'DFS exploration', 'Exploration DFS'),
          },
          d(locale, 'Start exploring the graph.', 'Commencer l exploration du graphe.'),
        ),
        makeStep(
          {
            directed,
            currentNode: source,
            stack: [source, nodes[1]?.id ?? source],
            visitedNodes: nodes.slice(0, Math.min(2, nodes.length)).map((node) => node.id),
            phase: d(locale, 'Follow a branch', 'Suivre une branche'),
          },
          d(locale, 'DFS follows one branch deeply before checking others.', 'DFS suit une branche en profondeur avant les autres.'),
        ),
        makeStep(
          {
            directed,
            currentNode: hasCycle ? source : null,
            stack: hasCycle ? [source] : [],
            visitedNodes: hasCycle ? nodes.map((node) => node.id) : [source],
            visitedEdges: cycleEdges,
            phase: hasCycle ? d(locale, 'Cycle detected', 'Cycle detecte') : d(locale, 'Acyclic graph', 'Graphe acyclique'),
          },
          hasCycle
            ? d(
                locale,
                `Cycle found: ${cyclePath ? formatNodePath(nodes, cyclePath) : 'trace not available'}.`,
                `Cycle trouve : ${cyclePath ? formatNodePath(nodes, cyclePath) : 'trace indisponible'}.`,
              )
            : d(locale, 'No back edge was found.', 'Aucune arete de retour n a ete trouvee.'),
        ),
      ],
    }
  }

  if (property === 'circuit') {
    const circuit = isEulerianCircuitGraph(nodes, edges, directed)
    const circuitPath = circuit.eulerianCircuit ? findEulerianCircuitPath(nodes, edges, directed) : null
    const circuitEdges = circuitPath ? edgePairsFromPath(circuitPath) : []
    return {
      title: d(locale, 'Eulerian circuit', 'Circuit eulerien'),
      verdict: circuit.eulerianCircuit ? d(locale, 'Circuit possible', 'Circuit possible') : d(locale, 'Circuit impossible', 'Circuit impossible'),
      description: d(
        locale,
        'The graph must be connected and all vertices must have even degree.',
        'Le graphe doit etre connexe et tous les sommets doivent avoir un degre pair.',
      ),
      steps: [
        makeStep(
          {
            directed,
            labels: { degrees: Object.entries(circuit.degrees).map(([id, degree]) => `${id}:${degree}`).join(', ') },
            phase: d(locale, 'Check degrees', 'Verifier les degres'),
          },
          d(locale, `Degrees: ${Object.entries(circuit.degrees).map(([id, degree]) => `${id}=${degree}`).join(', ')}.`, `Degres : ${Object.entries(circuit.degrees).map(([id, degree]) => `${id}=${degree}`).join(', ')}.`),
        ),
        makeStep(
          {
            directed,
            visitedNodes: circuit.connected ? nodes.map((node) => node.id) : [source],
            phase: d(locale, 'Check connectivity', 'Verifier la connectivite'),
          },
          circuit.connected
            ? d(locale, 'The graph is connected.', 'Le graphe est connexe.')
            : d(locale, 'The graph is disconnected.', 'Le graphe est non connexe.'),
        ),
        makeStep(
          {
            directed,
            visitedNodes: circuit.eulerianCircuit ? nodes.map((node) => node.id) : [source],
            visitedEdges: circuitEdges,
            phase: circuit.eulerianCircuit ? d(locale, 'Eulerian circuit exists', 'Le circuit eulerien existe') : d(locale, 'Eulerian circuit blocked', 'Circuit eulerien bloque'),
          },
          circuit.eulerianCircuit
            ? d(
                locale,
                `All conditions are satisfied. Circuit: ${circuitPath ? formatNodePath(nodes, circuitPath) : 'trace not available'}.`,
                `Toutes les conditions sont satisfaites. Circuit : ${circuitPath ? formatNodePath(nodes, circuitPath) : 'trace indisponible'}.`,
              )
            : d(locale, 'One of the conditions is false.', 'Une des conditions est fausse.'),
        ),
      ],
    }
  }

  if (property === 'bipartite') {
    if (directed) {
      return {
        title: d(locale, 'Bipartite check', 'Test biparti'),
        verdict: d(locale, 'Not applicable', 'Non applicable'),
        description: d(locale, 'The check is defined for undirected graphs.', 'Le test est defini pour les graphes non orientes.'),
        steps: [makeStep({ directed, phase: d(locale, 'Not applicable', 'Non applicable') }, d(locale, 'The check is defined for undirected graphs.', 'Le test est defini pour les graphes non orientes.'))],
      }
    }
    const result = isBipartiteGraph(nodes, edges, directed)
    const conflictEdge = !result.bipartite ? findBipartiteConflictEdge(edges, result.color) : null
    const colors: Record<number, string> = {}
    for (const node of nodes) {
      const value = result.color[node.id]
      if (value == null) continue
      colors[node.id] = value === 0 ? '#38bdf8' : '#fbbf24'
    }
    return {
      title: d(locale, 'Bipartite check', 'Test biparti'),
      verdict: result.bipartite ? d(locale, 'Bipartite', 'Biparti') : d(locale, 'Not bipartite', 'Non biparti'),
      description: d(
        locale,
        'A BFS coloring gives opposite colors to neighbors.',
        'Un BFS de coloration donne des couleurs opposees aux voisins.',
      ),
      steps: [
        makeStep(
          {
            directed: false,
            currentNode: source,
            nodeColors: {},
            phase: d(locale, 'Coloring the graph', 'Coloration du graphe'),
          },
          d(locale, 'Color the source with the first color.', 'Colorer la source avec la premiere couleur.'),
        ),
        makeStep(
          {
            directed: false,
            currentNode: source,
            nodeColors: colors,
            phase: d(locale, 'Propagate colors', 'Propager les couleurs'),
          },
          d(locale, 'Neighbors receive the opposite color.', 'Les voisins recoivent la couleur opposee.'),
        ),
        makeStep(
          {
            directed: false,
            nodeColors: colors,
            currentEdge: conflictEdge ?? null,
            visitedEdges: conflictEdge ? [conflictEdge] : [],
            phase: result.bipartite ? d(locale, 'Bipartite graph', 'Graphe biparti') : d(locale, 'Color conflict', 'Conflit de couleur'),
          },
          result.bipartite
            ? d(locale, 'No conflict was found.', 'Aucun conflit n a ete trouve.')
            : d(
                locale,
                `Conflict on edge ${conflictEdge ? `${label(nodes, conflictEdge[0])}-${label(nodes, conflictEdge[1])}` : 'unknown'}: both endpoints share the same color.`,
                `Conflit sur l arete ${conflictEdge ? `${label(nodes, conflictEdge[0])}-${label(nodes, conflictEdge[1])}` : 'inconnue'} : les deux sommets ont la meme couleur.`,
              ),
        ),
      ],
    }
  }

  if (property === 'tree') {
    const tree = isTree(nodes, edges)
    const connected = isConnectedGraph(nodes, edges)
    const hasCycle = hasUndirectedCycle(nodes, edges)
    return {
      title: d(locale, 'Tree check', 'Test d arbre'),
      verdict: tree ? d(locale, 'Tree', 'Arbre') : d(locale, 'Not a tree', 'Pas un arbre'),
      description: d(
        locale,
        'A tree is connected and has exactly V - 1 edges.',
        'Un arbre est connexe et a exactement V - 1 aretes.',
      ),
      steps: [
        makeStep(
          {
            directed: false,
            currentNode: source,
            stack: [source],
            phase: d(locale, 'Connectivity test', 'Test de connectivite'),
          },
          d(locale, 'Explore the graph to check connectivity.', 'Explorer le graphe pour verifier la connectivite.'),
        ),
        makeStep(
          {
            directed: false,
            currentNode: source,
            visitedNodes: nodes.slice(0, Math.max(1, Math.ceil(nodes.length / 2))).map((node) => node.id),
            stack: nodes.slice(0, Math.max(1, Math.ceil(nodes.length / 2))).map((node) => node.id),
            phase: d(locale, 'Check for cycles', 'Verifier les cycles'),
          },
          d(locale, 'A tree must remain acyclic while the DFS explores it.', 'Un arbre doit rester sans cycle pendant le DFS.'),
        ),
        makeStep(
          {
            directed: false,
            visitedNodes: nodes.map((node) => node.id),
            phase: tree ? d(locale, 'Tree confirmed', 'Arbre confirme') : d(locale, 'Tree rejected', 'Arbre refuse'),
          },
          tree
            ? d(locale, 'The graph is connected and acyclic.', 'Le graphe est connexe et acyclique.')
            : d(
                locale,
                `Connected: ${connected ? 'yes' : 'no'}. Cycle: ${hasCycle ? 'yes' : 'no'}. Edges: ${edges.length}, expected ${Math.max(0, nodes.length - 1)}.`,
                `Connexe : ${connected ? 'oui' : 'non'}. Cycle : ${hasCycle ? 'oui' : 'non'}. Aretes : ${edges.length}, attendu ${Math.max(0, nodes.length - 1)}.`,
              ),
        ),
      ],
    }
  }

  const regular = !directed ? Object.values(degrees).every((degree, _, arr) => degree === arr[0]) : null
  const mismatch = regular === false ? findDegreeMismatch(nodes, degrees) : null
  return {
    title: d(locale, 'Regularity', 'Regularite'),
    verdict:
      regular == null
        ? d(locale, 'Not applicable', 'Non applicable')
        : regular
          ? d(locale, 'Regular graph', 'Graphe regulier')
          : d(locale, 'Irregular graph', 'Graphe non regulier'),
    description: d(
      locale,
      'All vertices must have the same degree.',
      'Tous les sommets doivent avoir le meme degre.',
    ),
    steps: [
      makeStep(
        {
          directed,
          labels: { degrees: Object.entries(degrees).map(([id, degree]) => `${id}:${degree}`).join(', ') },
          phase: d(locale, 'Compute degrees', 'Calculer les degres'),
        },
        d(locale, `Degrees: ${Object.entries(degrees).map(([id, degree]) => `${id}=${degree}`).join(', ')}.`, `Degres : ${Object.entries(degrees).map(([id, degree]) => `${id}=${degree}`).join(', ')}.`),
      ),
      makeStep(
        {
          directed,
          currentNode: source,
          phase: d(locale, 'Compare degrees', 'Comparer les degres'),
        },
        d(locale, 'The algorithm compares the first degree with all the others.', 'L algorithme compare le premier degre avec tous les autres.'),
      ),
      makeStep(
        {
          directed,
          phase: regular ? d(locale, 'Regular graph', 'Graphe regulier') : d(locale, 'Irregular graph', 'Graphe non regulier'),
        },
        regular
          ? d(locale, 'Every vertex has the same degree.', 'Chaque sommet a le meme degre.')
          : d(
              locale,
              `Mismatch at ${mismatch ? label(nodes, mismatch.nodeId) : 'unknown'}: ${mismatch?.degree ?? '-'} vs expected ${mismatch?.base ?? '-'}.`,
              `Ecart a ${mismatch ? label(nodes, mismatch.nodeId) : 'inconnu'} : ${mismatch?.degree ?? '-'} vs attendu ${mismatch?.base ?? '-'}.`,
            ),
      ),
    ],
  }
}

export function reconstructPath(
  predecessors: Record<number, number | null>,
  source: number,
  target: number,
) {
  const path: number[] = []
  let current: number | null = target

  while (current != null) {
    path.push(current)
    if (current === source) return path.reverse()
    current = predecessors[current] ?? null
  }

  return []
}
