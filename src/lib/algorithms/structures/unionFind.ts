import type { Algorithm, GraphEdge, GraphNode, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  cloneEdgeStates,
  edgeKey,
  graphFromInput,
  label,
  requireNodes,
  requireUndirectedCustom,
  setsFromParent,
} from '@lib/algorithms/graphAlgorithmUtils'

export const unionFind: Algorithm = {
  id: 'union-find',
  name: 'Union-Find',
  category: 'Auxiliary Structures',
  difficulty: 'easy',
  visualization: 'graph',
  code: `class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(0);
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return false;
    if (this.rank[rootA] < this.rank[rootB]) this.parent[rootA] = rootB;
    else if (this.rank[rootA] > this.rank[rootB]) this.parent[rootB] = rootA;
    else {
      this.parent[rootB] = rootA;
      this.rank[rootA]++;
    }
    return true;
  }
}`,
  description: `Union-Find

Union-Find maintains disjoint sets with near-constant find and union operations. It is the auxiliary structure behind Kruskal's cycle checks.

Time Complexity: O(alpha(V)) amortized
Space Complexity: O(V)`,
  examples: [
    { id: 'cycle-checks', label: { en: 'Cycle checks', fr: 'Tests de cycle' } },
    { id: 'two-clusters', label: { en: 'Two clusters', fr: 'Deux groupes' } },
  ],
  generateSteps(locale = 'en', exampleId, customGraph) {
    let nodes: GraphNode[] = [
      { id: 0, label: '0', x: 80, y: 95 },
      { id: 1, label: '1', x: 200, y: 75 },
      { id: 2, label: '2', x: 325, y: 95 },
      { id: 3, label: '3', x: 445, y: 145 },
      { id: 4, label: '4', x: 145, y: 250 },
      { id: 5, label: '5', x: 285, y: 260 },
      { id: 6, label: '6', x: 420, y: 285 },
    ]
    let operations: [number, number][] =
      exampleId === 'two-clusters'
        ? [
            [0, 1],
            [1, 2],
            [2, 3],
            [4, 5],
            [5, 6],
            [0, 3],
            [3, 6],
          ]
        : [
            [0, 1],
            [2, 3],
            [4, 5],
            [1, 2],
            [5, 6],
            [0, 3],
            [3, 6],
          ]
    let edges: GraphEdge[] = operations.map(([from, to], index) => ({
      from,
      to,
      label: `u${index + 1}`,
    }))
    if (customGraph) {
      const custom = graphFromInput(customGraph, { directed: false })
      const incompatible =
        requireNodes(locale, custom.nodes, custom.edges, false) ??
        requireUndirectedCustom(
          locale,
          customGraph,
          custom.nodes,
          custom.edges,
          'Union-Find cycle checks are implemented here for undirected graphs. Turn off Directed graph in the editor.',
          'Les tests Union-Find sont implementes ici pour les graphes non orientes. Desactivez Graphe oriente dans l editeur.',
        )
      if (incompatible) return incompatible
      nodes = custom.nodes
      operations = custom.edges.map((edge) => [edge.from, edge.to])
      edges = custom.edges.map((edge, index) => ({
        ...edge,
        label: edge.label ?? `u${index + 1}`,
        directed: false,
      }))
    }
    const parent: Record<number, number> = {}
    const rank: Record<number, number> = {}
    const selectedEdges: [number, number][] = []
    const rejectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    // Path compression and rank keep later connectivity checks nearly constant time.
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
        rank[rootA]++
      }
      return true
    }

    for (const node of nodes) {
      parent[node.id] = node.id
      rank[node.id] = 0
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        sets: setsFromParent(nodes, parent),
        phase: d(locale, 'makeSet for every vertex', 'makeSet pour chaque sommet'),
      }),
      description: d(
        locale,
        'Each vertex starts as its own set.',
        'Chaque sommet commence dans son propre ensemble.',
      ),
      codeLine: 3,
      variables: { sets: nodes.length },
    })

    for (const [from, to] of operations) {
      const beforeFrom = find(from)
      const beforeTo = find(to)
      const merged = union(from, to)
      if (merged) {
        selectedEdges.push([from, to])
        edgeStates[edgeKey(from, to)] = 'selected'
      } else {
        rejectedEdges.push([from, to])
        edgeStates[edgeKey(from, to)] = 'rejected'
      }

      steps.push({
        graph: baseGraph(nodes, edges, {
          currentNode: from,
          currentEdge: [from, to],
          selectedEdges: [...selectedEdges],
          rejectedEdges: [...rejectedEdges],
          visitedEdges: [...selectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          sets: setsFromParent(nodes, parent),
          phase: d(locale, 'union operation', 'operation union'),
        }),
        description: merged
          ? d(
              locale,
              `union(${from}, ${to}) merges roots ${beforeFrom} and ${beforeTo}.`,
              `union(${from}, ${to}) fusionne les racines ${beforeFrom} et ${beforeTo}.`,
            )
          : d(
              locale,
              `union(${from}, ${to}) finds the same root, so the sets are already connected.`,
              `union(${from}, ${to}) trouve la meme racine; les ensembles sont deja connectes.`,
            ),
        codeLine: 14,
        variables: { from, to, merged },
      })
    }

    return steps
  },
}


