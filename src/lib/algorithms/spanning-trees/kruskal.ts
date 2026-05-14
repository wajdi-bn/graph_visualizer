import type { Algorithm, GraphEdge, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  cloneEdgeStates,
  edgeKey,
  graphFromInput,
  isDirectedGraph,
  isTree,
  label,
  requireNodes,
  requireWeightedGraph,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  computePrimForest,
  countComponents,
  getForestTargetEdgeCount,
  sumEdgeWeights,
} from '@lib/algorithms/spanning-trees/mstUtils'
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
  const sets = new DisjointSet(vertices);
  const mst = [];

  edges.sort((a, b) => a.weight - b.weight);
  for (const edge of edges) {
    if (sets.find(edge.from) !== sets.find(edge.to)) {
      sets.union(edge.from, edge.to);
      mst.push(edge);
    }
  }

  return mst;
}`,
  description: `Kruskal

Kruskal builds a minimum spanning tree by scanning edges from lightest to heaviest and accepting only edges that connect two different components.

If the graph is directed, edge directions are ignored and the graph is treated as undirected for the spanning tree computation.

Time Complexity: O(E log E)
Space Complexity: O(V)`,
  examples: weightedExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    // When a directed graph is provided, treat it as undirected for MST
    const directed = customGraph ? isDirectedGraph(customGraph) : false
    const demo = customGraph
      ? graphFromInput(customGraph, { directed: false })
      : { ...getWeightedDemo(exampleId), directed: false }
    const nodes = demo.nodes
    // Normalise edges as undirected and sort by weight ascending (pedagogical sort step)
    const edges = [...demo.edges]
      .map((e) => ({ ...e, directed: false }))
      .sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))

    const incompatible =
      requireNodes(locale, nodes, edges, false) ??
      requireWeightedGraph(locale, nodes, edges, false)
    if (incompatible) return incompatible

    const parent: Record<number, number> = {}
    const rank: Record<number, number> = {}
    const selectedEdges: [number, number][] = []
    const selectedEdgeObjects: GraphEdge[] = []
    const rejectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []
    const componentCount = countComponents(nodes, edges)
    const targetEdgeCount = getForestTargetEdgeCount(nodes.length, componentCount)
    let stoppedEarly = false

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

    // Initial step: show sorted edge list as preamble
    const sortedWeightList = edges.map((e) => `${label(nodes, e.from)}-${label(nodes, e.to)} (${e.weight ?? 0})`).join(', ')
    steps.push({
      graph: baseGraph(nodes, edges, {
        directed: false,
        phase: d(locale, 'Sort edges by weight', 'Trier les arêtes par poids'),
      }),
      description: d(
        locale,
        `Edges sorted by weight: ${sortedWeightList}. Each vertex starts in its own disjoint set.${directed ? ' (Directed graph treated as undirected for MST.)' : ''}`,
        `Arêtes triées par poids : ${sortedWeightList}. Chaque sommet commence dans son propre ensemble disjoint.${directed ? ' (Graphe orienté traité comme non orienté pour l\'ACM.)' : ''}`,
      ),
      codeLine: 5,
      variables: { sortedEdges: edges.length, targetEdges: targetEdgeCount },
    })

    for (const edge of edges) {
      if (selectedEdgeObjects.length >= targetEdgeCount) {
        stoppedEarly = true
        break
      }
      const accepted = find(edge.from) !== find(edge.to)
      if (accepted) {
        union(edge.from, edge.to)
        selectedEdges.push([edge.from, edge.to])
        selectedEdgeObjects.push(edge)
        edgeStates[edgeKey(edge.from, edge.to)] = 'selected'
      } else {
        rejectedEdges.push([edge.from, edge.to])
        edgeStates[edgeKey(edge.from, edge.to)] = 'rejected'
      }

      steps.push({
        graph: baseGraph(nodes, edges, {
          directed: false,
          currentEdge: [edge.from, edge.to],
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          rejectedEdges: [...rejectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          phase: d(locale, 'Union-Find cycle test', 'Test de cycle Union-Find'),
        }),
        description: accepted
          ? d(
              locale,
              `✓ Accept ${label(nodes, edge.from)}–${label(nodes, edge.to)} (weight ${edge.weight ?? 0}): connects two different components.`,
              `✓ Accepter ${label(nodes, edge.from)}–${label(nodes, edge.to)} (poids ${edge.weight ?? 0}) : relie deux composantes différentes.`,
            )
          : d(
              locale,
              `✗ Reject ${label(nodes, edge.from)}–${label(nodes, edge.to)} (weight ${edge.weight ?? 0}): both endpoints already in the same component — would form a cycle.`,
              `✗ Rejeter ${label(nodes, edge.from)}–${label(nodes, edge.to)} (poids ${edge.weight ?? 0}) : les deux extrémités sont déjà dans la même composante — formerait un cycle.`,
            ),
        codeLine: accepted ? 8 : 7,
        variables: { edge: `${label(nodes, edge.from)}-${label(nodes, edge.to)}`, accepted },
      })

      if (accepted && selectedEdgeObjects.length >= targetEdgeCount) {
        stoppedEarly = true
        steps.push({
          graph: baseGraph(nodes, edges, {
            directed: false,
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            rejectedEdges: [...rejectedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            phase: d(locale, 'MST complete', 'ACM terminé'),
          }),
          description: d(
            locale,
            `MST complete: selected ${selectedEdgeObjects.length} edge(s) (V – 1 = ${targetEdgeCount}). Remaining edges are not inspected.`,
            `ACM terminé : ${selectedEdgeObjects.length} arête(s) sélectionnée(s) (V – 1 = ${targetEdgeCount}). Les arêtes restantes ne sont pas inspectées.`,
          ),
          codeLine: 12,
          variables: { edgesSelected: selectedEdgeObjects.length },
        })
        break
      }
    }

    const totalCost = sumEdgeWeights(selectedEdgeObjects)
    const validTree = isTree(nodes, selectedEdgeObjects)
    const primSummary = computePrimForest(nodes, edges)
    const crossCheckMatch = Math.abs(primSummary.totalCost - totalCost) < 1e-9
    const edgeList = selectedEdgeObjects.map(
      (edge) => `${label(nodes, edge.from)}–${label(nodes, edge.to)} (w=${edge.weight ?? 1})`,
    )
    const emptyEdgeLine = d(locale, '- none', '- aucune')
    const edgeListLines = edgeList.length > 0 ? edgeList.map((e) => `- ${e}`) : [emptyEdgeLine]

    // Summary step — all edges visible with their final states
    steps.push({
      graph: baseGraph(nodes, edges, {
        directed: false,
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        rejectedEdges: [...rejectedEdges],
        edgeStates: cloneEdgeStates(edgeStates),
        phase: d(locale, 'MST summary', 'Résumé de l\'ACM'),
      }),
      description: d(
        locale,
        `Kruskal complete. MST cost: ${totalCost}. Blue = selected, Red = rejected (cycle), Grey = not reached.`,
        `Kruskal terminé. Coût de l'ACM : ${totalCost}. Bleu = sélectionnée, Rouge = rejetée (cycle), Gris = non atteinte.`,
      ),
      codeLine: 12,
      variables: {
        totalCost,
        validTree,
        components: componentCount,
        edgesSelected: selectedEdgeObjects.length,
        targetEdges: targetEdgeCount,
        stoppedEarly,
        primCost: primSummary.totalCost,
        costMatch: crossCheckMatch,
      },
      consoleOutput: [
        d(locale, `=== Minimum Spanning Tree ===`, `=== Arbre Couvrant Minimal ===`),
        d(locale, `Edges selected (${selectedEdgeObjects.length}):`, `Arêtes sélectionnées (${selectedEdgeObjects.length}) :`),
        ...edgeListLines,
        d(locale, `Total cost: ${totalCost}`, `Coût total : ${totalCost}`),
        d(locale, `Valid spanning tree: ${validTree ? 'yes' : 'no'}`, `Arbre couvrant valide : ${validTree ? 'oui' : 'non'}`),
        d(locale, `Components: ${componentCount} (${componentCount === 1 ? 'connected' : 'forest'})`, `Composantes : ${componentCount} (${componentCount === 1 ? 'connexe' : 'forêt'})`),
        d(locale, `Cross-check vs Prim: ${crossCheckMatch ? 'costs match ✓' : `costs differ — Prim=${primSummary.totalCost}, Kruskal=${totalCost}`}`, `Vérification croisée Prim : ${crossCheckMatch ? 'coûts identiques ✓' : `coûts différents — Prim=${primSummary.totalCost}, Kruskal=${totalCost}`}`),
      ],
    })

    // Final "MST only" step — rejected and unprocessed edges are hidden
    const mstOnlyEdgeStates: Record<string, GraphVisualState> = {}
    for (const [from, to] of selectedEdges) mstOnlyEdgeStates[edgeKey(from, to)] = 'selected'

    steps.push({
      graph: baseGraph(nodes, selectedEdgeObjects, {
        directed: false,
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        edgeStates: mstOnlyEdgeStates,
        phase: d(locale, 'Minimum spanning tree only', 'Arbre couvrant minimal uniquement'),
      }),
      description: d(
        locale,
        `Minimum spanning tree only. Total cost: ${totalCost}. Rejected and unprocessed edges are hidden.`,
        `Arbre couvrant minimal uniquement. Coût total : ${totalCost}. Les arêtes rejetées et non traitées sont masquées.`,
      ),
      codeLine: 12,
      variables: { totalCost, edgesSelected: selectedEdgeObjects.length },
    })

    return steps
  },
}
