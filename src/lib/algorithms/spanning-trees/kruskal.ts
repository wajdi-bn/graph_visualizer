import type { Algorithm, GraphEdge, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  adjacency,
  cloneEdgeStates,
  edgeKey,
  graphFromInput,
  isTree,
  label,
  palette,
  requireConnectedGraph,
  requireNodes,
  requireUndirectedCustom,
  requireWeightedGraph,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  buildForestColors,
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

Time Complexity: O(E log E)
Space Complexity: O(V)`,
  examples: weightedExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = customGraph
      ? graphFromInput(customGraph, { directed: false })
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
      ) ??
      requireWeightedGraph(locale, nodes, edges, false) ??
      requireConnectedGraph(locale, nodes, edges)
    if (incompatible) return incompatible
    const parent: Record<number, number> = {}
    const rank: Record<number, number> = {}
    const selectedEdges: [number, number][] = []
    const selectedEdgeObjects: GraphEdge[] = []
    const rejectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []
    const treeNodes = new Set<number>()
    const componentCount = countComponents(nodes, edges)
    const targetEdgeCount = getForestTargetEdgeCount(nodes.length, componentCount)
    let stoppedEarly = false
    const nodeColors: Record<number, string> = {}
    const componentColorByNode: Record<number, string> = {}
    const componentVisited = new Set<number>()
    const adj = adjacency(edges)
    let componentColorIndex = 0

    for (const node of nodes) {
      if (componentVisited.has(node.id)) continue
      const color = palette[componentColorIndex % palette.length]
      componentColorIndex += 1
      const stack = [node.id]
      componentVisited.add(node.id)

      while (stack.length > 0) {
        const current = stack.pop()!
        componentColorByNode[current] = color
        for (const { node: neighbor } of adj[current] ?? []) {
          if (componentVisited.has(neighbor)) continue
          componentVisited.add(neighbor)
          stack.push(neighbor)
        }
      }
    }

    const startNodeId = nodes[0]?.id ?? null
    if (startNodeId != null) {
      nodeColors[startNodeId] = componentColorByNode[startNodeId] ?? palette[0]
    }

    const treeSnapshot = () => ({
      treeNodes: [...treeNodes],
      remainingNodes: nodes.filter((node) => !treeNodes.has(node.id)).map((node) => node.id),
    })

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
        currentNode: startNodeId,
        ...treeSnapshot(),
        nodeColors: { ...nodeColors },
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
      if (selectedEdgeObjects.length >= targetEdgeCount) {
        stoppedEarly = true
        break
      }
      const accepted = find(edge.from) !== find(edge.to)
      const fromWasColored = Boolean(nodeColors[edge.from])
      const toWasColored = Boolean(nodeColors[edge.to])
      let stepCurrentNode: number | null = edge.from
      if (accepted) {
        union(edge.from, edge.to)
        selectedEdges.push([edge.from, edge.to])
        selectedEdgeObjects.push(edge)
        edgeStates[edgeKey(edge.from, edge.to)] = 'selected'
        treeNodes.add(edge.from)
        treeNodes.add(edge.to)

        const color = componentColorByNode[edge.from] ?? componentColorByNode[edge.to]
        if (color) {
          if (!nodeColors[edge.from]) nodeColors[edge.from] = color
          if (!nodeColors[edge.to]) nodeColors[edge.to] = color
        }

        if (!fromWasColored && nodeColors[edge.from]) stepCurrentNode = edge.from
        else if (!toWasColored && nodeColors[edge.to]) stepCurrentNode = edge.to
      } else {
        rejectedEdges.push([edge.from, edge.to])
        edgeStates[edgeKey(edge.from, edge.to)] = 'rejected'
      }

      steps.push({
        graph: baseGraph(nodes, edges, {
          currentNode: stepCurrentNode,
          currentEdge: [edge.from, edge.to],
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          rejectedEdges: [...rejectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          ...treeSnapshot(),
          nodeColors: { ...nodeColors },
          phase: d(locale, 'Cycle test with disjoint sets', 'Test de cycle avec ensembles disjoints'),
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

      if (accepted && selectedEdgeObjects.length >= targetEdgeCount) {
        stoppedEarly = true
        steps.push({
          graph: baseGraph(nodes, edges, {
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            rejectedEdges: [...rejectedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            ...treeSnapshot(),
            nodeColors: { ...nodeColors },
            phase: d(locale, 'MST complete', 'ACM termine'),
          }),
          description: d(
            locale,
            'The spanning tree has V - 1 edges; remaining edges are no longer needed.',
            'L arbre couvrant contient V - 1 aretes; les autres aretes ne sont plus utiles.',
          ),
          codeLine: 12,
          variables: { edgesSelected: selectedEdgeObjects.length },
        })
        break
      }
    }

    for (const node of nodes) {
      if (nodeColors[node.id]) continue
      nodeColors[node.id] = componentColorByNode[node.id]
      treeNodes.add(node.id)
      steps.push({
        graph: baseGraph(nodes, edges, {
          currentNode: node.id,
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          rejectedEdges: [...rejectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          ...treeSnapshot(),
          nodeColors: { ...nodeColors },
          phase: d(locale, 'Single-vertex component', 'Composante monovertex'),
        }),
        description: d(
          locale,
          `${label(nodes, node.id)} remains isolated, forming its own component.`,
          `${label(nodes, node.id)} reste isole et forme sa propre composante.`,
        ),
        codeLine: 12,
        variables: { vertex: label(nodes, node.id) },
      })
    }

    const totalCost = sumEdgeWeights(selectedEdgeObjects)
    const validTree = isTree(nodes, selectedEdgeObjects)
    const primSummary = computePrimForest(nodes, edges)
    const crossCheckMatch = Math.abs(primSummary.totalCost - totalCost) < 1e-9
    const forestColors = buildForestColors(nodes, selectedEdgeObjects)
    const edgeList = selectedEdgeObjects.map(
      (edge) => `${label(nodes, edge.from)}-${label(nodes, edge.to)} (w=${edge.weight ?? 1})`,
    )
    const emptyEdgeLine = d(locale, '- none', '- aucune')
    const edgeListLines = edgeList.length > 0 ? edgeList.map((edge) => `- ${edge}`) : [emptyEdgeLine]

    steps.push({
      graph: baseGraph(nodes, edges, {
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        rejectedEdges: [...rejectedEdges],
        edgeStates: cloneEdgeStates(edgeStates),
        nodeColors: forestColors.nodeColors,
        edgeColors: forestColors.edgeColors,
        ...treeSnapshot(),
        phase: d(locale, 'MST summary', 'Resume de l ACM'),
      }),
      description: d(
        locale,
        'Summary of the minimum spanning tree built by Kruskal.',
        'Resume de l arbre couvrant minimal construit par Kruskal.',
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
        d(locale, `Edges (${selectedEdgeObjects.length}):`, `Aretes (${selectedEdgeObjects.length}) :`),
        ...edgeListLines,
        d(locale, `Total cost: ${totalCost}`, `Cout total : ${totalCost}`),
        d(
          locale,
          `Valid spanning tree: ${validTree ? 'yes' : 'no'}`,
          `Arbre couvrant valide : ${validTree ? 'oui' : 'non'}`,
        ),
        d(
          locale,
          `Components: ${componentCount} (${componentCount === 1 ? 'connected' : 'forest'})`,
          `Composantes : ${componentCount} (${componentCount === 1 ? 'connexe' : 'foret'})`,
        ),
        d(
          locale,
          `Cross-check: Prim=${primSummary.totalCost}, Kruskal=${totalCost}, match=${crossCheckMatch ? 'yes' : 'no'}`,
          `Verification croisee : Prim=${primSummary.totalCost}, Kruskal=${totalCost}, ok=${crossCheckMatch ? 'oui' : 'non'}`,
        ),
      ],
    })

    return steps
  },
}


