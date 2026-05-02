import type { Algorithm, GraphVisualState, Step } from '@lib/types'
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
import {
  getWeightedDemo,
  weightedExampleOptions,
} from '@lib/algorithms/graphAlgorithmExamples'

export const kruskal: Algorithm = {
  id: 'kruskal',
  name: 'Kruskal',
  category: 'Spanning Trees',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function kruskal(vertices, edges) {
  const uf = new UnionFind(vertices);
  const mst = [];

  edges.sort((a, b) => a.weight - b.weight);
  for (const edge of edges) {
    if (uf.find(edge.from) !== uf.find(edge.to)) {
      uf.union(edge.from, edge.to);
      mst.push(edge);
    }
  }

  return mst;
}`,
  description: `Kruskal

Kruskal builds a minimum spanning tree by scanning edges from lightest to heaviest and accepting only edges that connect two different components.

Time Complexity: O(E log E)
Space Complexity: O(V)`,
  examples: weightedExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = customGraph
      ? graphFromInput(customGraph, { directed: false, defaultWeight: true })
      : { ...getWeightedDemo(exampleId), directed: false }
    const nodes = demo.nodes
    const edges = [...demo.edges].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
    const incompatible =
      requireNodes(locale, nodes, edges, false) ??
      requireUndirectedCustom(
        locale,
        customGraph,
        nodes,
        edges,
        'Kruskal builds an undirected minimum spanning tree. Turn off Directed graph in the editor.',
        'Kruskal construit un arbre couvrant minimal non oriente. Desactivez Graphe oriente dans l editeur.',
      )
    if (incompatible) return incompatible
    const parent: Record<number, number> = {}
    const rank: Record<number, number> = {}
    const selectedEdges: [number, number][] = []
    const rejectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

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
        phase: d(locale, 'Sort edges by weight', 'Trier les aretes par poids'),
      }),
      description: d(
        locale,
        'Start with each vertex in its own component, then inspect edges in increasing weight order.',
        'Chaque sommet commence dans son propre composant, puis on inspecte les aretes par poids croissant.',
      ),
      codeLine: 5,
      variables: { sortedWeights: edges.map((edge) => edge.weight).join(', ') },
    })

    for (const edge of edges) {
      const accepted = find(edge.from) !== find(edge.to)
      if (accepted) {
        union(edge.from, edge.to)
        selectedEdges.push([edge.from, edge.to])
        edgeStates[edgeKey(edge.from, edge.to)] = 'selected'
      } else {
        rejectedEdges.push([edge.from, edge.to])
        edgeStates[edgeKey(edge.from, edge.to)] = 'rejected'
      }

      steps.push({
        graph: baseGraph(nodes, edges, {
          currentEdge: [edge.from, edge.to],
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          rejectedEdges: [...rejectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          sets: setsFromParent(nodes, parent),
          phase: d(locale, 'Cycle test with Union-Find', 'Test de cycle avec Union-Find'),
        }),
        description: accepted
          ? d(
              locale,
              `Accept ${label(nodes, edge.from)}-${label(nodes, edge.to)} (weight ${edge.weight}); it connects two components.`,
              `Accepter ${label(nodes, edge.from)}-${label(nodes, edge.to)} (poids ${edge.weight}) ; elle relie deux composants.`,
            )
          : d(
              locale,
              `Reject ${label(nodes, edge.from)}-${label(nodes, edge.to)} because both endpoints are already connected.`,
              `Rejeter ${label(nodes, edge.from)}-${label(nodes, edge.to)} car les deux extremites sont deja connectees.`,
            ),
        codeLine: accepted ? 8 : 7,
        variables: { edge: `${label(nodes, edge.from)}-${label(nodes, edge.to)}`, accepted },
      })
    }

    return steps
  },
}


