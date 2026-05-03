import type { GraphEdge, GraphNode } from '@lib/types'
import { adjacency } from '@lib/algorithms/graphAlgorithmUtils'

export interface ForestResult {
  edges: GraphEdge[]
  totalCost: number
  componentCount: number
  targetEdgeCount: number
}

export function getForestTargetEdgeCount(nodeCount: number, componentCount: number) {
  return Math.max(0, nodeCount - componentCount)
}

export function countComponents(nodes: GraphNode[], edges: GraphEdge[]) {
  if (nodes.length === 0) return 0
  const adj = adjacency(edges, false)
  const visited = new Set<number>()
  let count = 0

  for (const node of nodes) {
    if (visited.has(node.id)) continue
    count += 1
    const stack = [node.id]
    visited.add(node.id)

    while (stack.length > 0) {
      const current = stack.pop()!
      for (const { node: neighbor } of adj[current] ?? []) {
        if (visited.has(neighbor)) continue
        visited.add(neighbor)
        stack.push(neighbor)
      }
    }
  }

  return count
}

export function sumEdgeWeights(edges: GraphEdge[]) {
  return edges.reduce((sum, edge) => sum + (edge.weight ?? 1), 0)
}

export class MinHeap<T extends { key: number }> {
  private items: T[] = []

  size() {
    return this.items.length
  }

  isEmpty() {
    return this.items.length === 0
  }

  push(item: T) {
    this.items.push(item)
    this.bubbleUp(this.items.length - 1)
  }

  pop(): T | null {
    if (this.items.length === 0) return null
    const root = this.items[0]
    const last = this.items.pop()!
    if (this.items.length > 0) {
      this.items[0] = last
      this.bubbleDown(0)
    }
    return root
  }

  private bubbleUp(index: number) {
    let current = index
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2)
      if (this.items[parent].key <= this.items[current].key) break
      ;[this.items[parent], this.items[current]] = [this.items[current], this.items[parent]]
      current = parent
    }
  }

  private bubbleDown(index: number) {
    let current = index
    const length = this.items.length
    while (true) {
      const left = current * 2 + 1
      const right = left + 1
      let smallest = current

      if (left < length && this.items[left].key < this.items[smallest].key) {
        smallest = left
      }
      if (right < length && this.items[right].key < this.items[smallest].key) {
        smallest = right
      }
      if (smallest === current) break

      ;[this.items[smallest], this.items[current]] = [this.items[current], this.items[smallest]]
      current = smallest
    }
  }
}

export function computeKruskalForest(nodes: GraphNode[], edges: GraphEdge[]): ForestResult {
  const sorted = [...edges].sort((a, b) => (a.weight ?? 1) - (b.weight ?? 1))
  const parent: Record<number, number> = {}
  const rank: Record<number, number> = {}
  const selected: GraphEdge[] = []

  for (const node of nodes) {
    parent[node.id] = node.id
    rank[node.id] = 0
  }

  const find = (x: number): number => {
    if (parent[x] !== x) parent[x] = find(parent[x])
    return parent[x]
  }
  const union = (a: number, b: number) => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA === rootB) return false
    if (rank[rootA] < rank[rootB]) parent[rootA] = rootB
    else if (rank[rootA] > rank[rootB]) parent[rootB] = rootA
    else {
      parent[rootB] = rootA
      rank[rootA] += 1
    }
    return true
  }

  const componentCount = countComponents(nodes, edges)
  const targetEdgeCount = getForestTargetEdgeCount(nodes.length, componentCount)

  for (const edge of sorted) {
    if (selected.length >= targetEdgeCount) break
    if (union(edge.from, edge.to)) selected.push(edge)
  }

  return {
    edges: selected,
    totalCost: sumEdgeWeights(selected),
    componentCount,
    targetEdgeCount,
  }
}

export function computePrimForest(nodes: GraphNode[], edges: GraphEdge[]): ForestResult {
  const componentCount = countComponents(nodes, edges)
  const targetEdgeCount = getForestTargetEdgeCount(nodes.length, componentCount)
  const adj: Record<number, { node: number; weight: number; edge: GraphEdge }[]> = {}

  for (const edge of edges) {
    const weight = edge.weight ?? 1
    adj[edge.from] ??= []
    adj[edge.from].push({ node: edge.to, weight, edge })
    if (!edge.directed) {
      adj[edge.to] ??= []
      adj[edge.to].push({ node: edge.from, weight, edge })
    }
  }

  const key: Record<number, number> = {}
  const parentEdge: Record<number, GraphEdge | null> = {}
  const inTree = new Set<number>()
  const selected: GraphEdge[] = []
  const heap = new MinHeap<{ node: number; key: number }>()

  for (const node of nodes) {
    key[node.id] = Number.POSITIVE_INFINITY
    parentEdge[node.id] = null
  }

  const startComponent = (nodeId: number) => {
    key[nodeId] = 0
    heap.push({ node: nodeId, key: 0 })
  }

  for (const node of nodes) {
    if (inTree.has(node.id)) continue
    if (key[node.id] === Number.POSITIVE_INFINITY) startComponent(node.id)

    while (!heap.isEmpty()) {
      const entry = heap.pop()
      if (!entry) break
      if (inTree.has(entry.node)) continue
      if (entry.key !== key[entry.node]) continue

      inTree.add(entry.node)
      const chosenEdge = parentEdge[entry.node]
      if (chosenEdge) selected.push(chosenEdge)

      for (const { node: neighbor, weight, edge } of adj[entry.node] ?? []) {
        if (inTree.has(neighbor)) continue
        if (weight < key[neighbor]) {
          key[neighbor] = weight
          parentEdge[neighbor] = edge
          heap.push({ node: neighbor, key: weight })
        }
      }
    }
  }

  return {
    edges: selected,
    totalCost: sumEdgeWeights(selected),
    componentCount,
    targetEdgeCount,
  }
}
