import type { Algorithm, AlgorithmRunOptions, GraphEdge, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  cloneEdgeStates,
  edgeKey,
  formatDistances,
  graphFromInput,
  isDirectedGraph,
  inf,
  isTree,
  label,
  requireNodes,
  requireWeightedGraph,
  resolveSourceNodeId,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  MinHeap,
  computeKruskalForest,
  sumEdgeWeights,
} from '@lib/algorithms/spanning-trees/mstUtils'
import {
  getWeightedDemo,
  weightedExampleOptions,
} from '@lib/algorithms/graphAlgorithmExamples'

export const prim: Algorithm = {
  id: 'prim',
  name: 'Prim',
  category: 'Spanning Trees',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function prim(nodes, adj, start = 0) {
  const inTree = new Set();
  const key = {};
  const parent = {};
  const heap = new MinHeap(); // { node, key }

  // Initialization
  for (const node of nodes) {
    key[node] = Infinity;
    parent[node] = null;
  }

  key[start] = 0;
  heap.push({ node: start, key: 0 });

  while (!heap.isEmpty()) {
    const { node: u } = heap.pop();
    if (inTree.has(u)) continue;
    inTree.add(u);

    for (const edge of adj[u]) {
      const v = edge.to;
      const weight = edge.weight;

      // Only consider vertices outside the tree
      if (!inTree.has(v) && weight < key[v]) {
        key[v] = weight;
        parent[v] = u;
        heap.push({ node: v, key: weight });
      }
    }
  }

  return parent; // or build MST edges from it
}`,
  description: `Prim

Prim grows a minimum spanning tree by extracting the cheapest outgoing edge from a min-heap.

If the graph is directed, edge directions are ignored and the graph is treated as undirected for the spanning tree computation.

**How to use:**
- Default: Starts from the first node in the graph
- Custom: Click any node in the graph visualization to start Prim from that node

Time Complexity: O(E log V)
Space Complexity: O(V)`,
  examples: weightedExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph, options?: AlgorithmRunOptions) {
    const directed = customGraph ? isDirectedGraph(customGraph) : false
    const demo = customGraph
      ? graphFromInput(customGraph, { directed: false })
      : { ...getWeightedDemo(exampleId), directed: false }
    const nodes = demo.nodes
    // Treat all edges as undirected for MST computation
    const edges = demo.edges.map((e) => ({ ...e, directed: false }))
    const incompatible =
      requireNodes(locale, nodes, edges, false) ??
      requireWeightedGraph(locale, nodes, edges, false)
    if (incompatible) return incompatible
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

    const inTree = new Set<number>()
    const key: Record<number, number | string> = {}
    const keyNum: Record<number, number> = {}
    const parent: Record<number, number | null> = {}
    const parentEdge: Record<number, GraphEdge | null> = {}
    const selectedEdges: [number, number][] = []
    const selectedEdgeObjects: GraphEdge[] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []
    const heap = new MinHeap<{ node: number; key: number }>()
    const resolvedSourceNodeId = resolveSourceNodeId(nodes, customGraph, options)
    let componentIndex = 0
    const treeEdgesLabel = d(locale, 'Tree edges', 'Arêtes de l\'arbre')
    const treeEdgeColor = 'var(--graph-selected, #34d399)'
    // directed flag used for informational message only
    void directed

    for (const node of nodes) {
      key[node.id] = inf
      keyNum[node.id] = Number.POSITIVE_INFINITY
      parent[node.id] = null
      parentEdge[node.id] = null
    }

    const startComponent = (startId: number) => {
      componentIndex += 1
      key[startId] = 0
      keyNum[startId] = 0
      heap.push({ node: startId, key: 0 })

      const startLabel = label(nodes, startId)
      const phase =
        componentIndex === 1
          ? d(locale, `Start the tree at ${startLabel}`, `Démarrer l'arbre en ${startLabel}`)
          : d(locale, `Start component ${componentIndex}`, `Démarrer la composante ${componentIndex}`)
      const description =
        componentIndex === 1
          ? d(
              locale,
              `Start Prim from ${startLabel}. Keys track the cheapest edge into the tree. You can click any node to start from a different vertex.`,
              `On démarre Prim depuis ${startLabel}. Les clés gardent l'arête la moins chère. Vous pouvez cliquer sur n'importe quel sommet pour commencer ailleurs.`,
            )
          : d(
              locale,
              `The graph is disconnected; start a new component at ${startLabel}.`,
              `Le graphe est non connexe ; on démarre une nouvelle composante en ${startLabel}.`,
            )

      steps.push({
        graph: baseGraph(nodes, edges, {
          visitedNodes: [...inTree],
          currentNode: startId,
          selectedEdges: [...selectedEdges],
          edgeColors: buildTreeEdgeColors(selectedEdges, treeEdgeColor),
          labels: { treeEdges: treeEdgesLabel },
          phase,
        }),
        description,
        codeLine: 10,
        variables: {
          start: startLabel,
          component: componentIndex,
          keys: formatDistances(nodes, key),
        },
      })
    }

    for (const node of nodes) {
      if (inTree.has(node.id)) continue
      
      // For the first component, use the resolved source node if available
      let nodeToStart = node.id
      if (componentIndex === 0 && resolvedSourceNodeId !== null && resolvedSourceNodeId !== undefined) {
        nodeToStart = resolvedSourceNodeId
      }
      
      if (keyNum[nodeToStart] === Number.POSITIVE_INFINITY) startComponent(nodeToStart)

      while (!heap.isEmpty()) {
        const entry = heap.pop()
        if (!entry) break
        if (inTree.has(entry.node)) continue
        if (entry.key !== keyNum[entry.node]) continue

        const current = entry.node
        inTree.add(current)
        if (parent[current] != null && parentEdge[current]) {
          selectedEdges.push([parent[current]!, current])
          selectedEdgeObjects.push(parentEdge[current]!)
          edgeStates[edgeKey(parent[current]!, current)] = 'selected'
        }

        steps.push({
          graph: baseGraph(nodes, edges, {
            visitedNodes: [...inTree],
            currentNode: current,
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            currentEdge: parent[current] == null ? null : [parent[current]!, current],
            edgeStates: cloneEdgeStates(edgeStates),
            edgeColors: buildTreeEdgeColors(selectedEdges, treeEdgeColor),
            labels: { treeEdges: treeEdgesLabel },
            phase: d(locale, 'Extract min from heap', 'Extraire le minimum du tas'),
          }),
          description:
            parent[current] == null
              ? d(
                  locale,
                  `${label(nodes, current)} starts a new tree in its component.`,
                  `${label(nodes, current)} démarre un nouvel arbre dans sa composante.`,
                )
              : d(
                  locale,
                  `Add ${label(nodes, current)} through ${label(nodes, parent[current]!)}–${label(nodes, current)} (weight ${key[current]}).`,
                  `Ajouter ${label(nodes, current)} via ${label(nodes, parent[current]!)}–${label(nodes, current)} (poids ${key[current]}).`,
                ),
          codeLine: 14,
          variables: { vertex: label(nodes, current), key: key[current] },
        })

        for (const { node: neighbor, weight, edge } of adj[current] ?? []) {
          if (inTree.has(neighbor)) continue
          if (weight < keyNum[neighbor]) {
            keyNum[neighbor] = weight
            key[neighbor] = weight
            parent[neighbor] = current
            parentEdge[neighbor] = edge
            heap.push({ node: neighbor, key: weight })

            steps.push({
              graph: baseGraph(nodes, edges, {
                visitedNodes: [...inTree],
                currentNode: current,
                currentEdge: [current, neighbor],
                visitedEdges: [...selectedEdges],
                selectedEdges: [...selectedEdges],
                edgeStates: cloneEdgeStates(edgeStates),
                edgeColors: buildTreeEdgeColors(selectedEdges, treeEdgeColor),
                labels: { treeEdges: treeEdgesLabel },
                phase: d(locale, 'Update frontier keys', 'Mettre à jour les clés de frontière'),
              }),
              description: d(
                locale,
                `Update ${label(nodes, neighbor)}: cheapest connection is now from ${label(nodes, current)} with weight ${weight}.`,
                `Mettre à jour ${label(nodes, neighbor)} : la connexion la moins chère vient de ${label(nodes, current)} avec le poids ${weight}.`,
              ),
              codeLine: 18,
              variables: { vertex: label(nodes, neighbor), key: weight, keys: formatDistances(nodes, key) },
            })
          }
        }
      }
    }

    const totalCost = sumEdgeWeights(selectedEdgeObjects)
    const validTree = isTree(nodes, selectedEdgeObjects)
    const kruskalSummary = computeKruskalForest(nodes, edges)
    const crossCheckMatch = Math.abs(kruskalSummary.totalCost - totalCost) < 1e-9
    const edgeList = selectedEdgeObjects.map(
      (edge) => `${label(nodes, edge.from)}–${label(nodes, edge.to)} (w=${edge.weight ?? 1})`,
    )
    const emptyEdgeLine = d(locale, '- none', '- aucune')
    const edgeListLines = edgeList.length > 0 ? edgeList.map((e) => `- ${e}`) : [emptyEdgeLine]

    // Summary step
    steps.push({
      graph: baseGraph(nodes, edges, {
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        edgeStates: cloneEdgeStates(edgeStates),
        edgeColors: buildTreeEdgeColors(selectedEdges, treeEdgeColor),
        labels: { treeEdges: treeEdgesLabel },
        phase: d(locale, 'MST summary', 'Résumé de l\'ACM'),
      }),
      description: d(
        locale,
        `Prim complete. MST cost: ${totalCost}. Selected edges are highlighted in green.`,
        `Prim terminé. Coût de l'ACM : ${totalCost}. Les arêtes sélectionnées sont surlignées en vert.`,
      ),
      codeLine: 26,
      variables: {
        totalCost,
        validTree,
        components: kruskalSummary.componentCount,
        edgesSelected: selectedEdgeObjects.length,
        targetEdges: kruskalSummary.targetEdgeCount,
        kruskalCost: kruskalSummary.totalCost,
        costMatch: crossCheckMatch,
      },
      consoleOutput: [
        d(locale, `=== Minimum Spanning Tree (Prim) ===`, `=== Arbre Couvrant Minimal (Prim) ===`),
        d(locale, `Edges selected (${selectedEdgeObjects.length}):`, `Arêtes sélectionnées (${selectedEdgeObjects.length}) :`),
        ...edgeListLines,
        d(locale, `Total cost: ${totalCost}`, `Coût total : ${totalCost}`),
        d(locale, `Valid spanning tree: ${validTree ? 'yes' : 'no'}`, `Arbre couvrant valide : ${validTree ? 'oui' : 'non'}`),
        d(locale, `Cross-check vs Kruskal: ${crossCheckMatch ? 'costs match ✓' : `costs differ — Kruskal=${kruskalSummary.totalCost}, Prim=${totalCost}`}`, `Vérification croisée Kruskal : ${crossCheckMatch ? 'coûts identiques ✓' : `coûts différents — Kruskal=${kruskalSummary.totalCost}, Prim=${totalCost}`}`),
      ],
    })

    // Final MST-only step — only the selected tree edges shown
    const mstOnlyEdgeStates: Record<string, GraphVisualState> = {}
    for (const [from, to] of selectedEdges) mstOnlyEdgeStates[edgeKey(from, to)] = 'selected'

    steps.push({
      graph: baseGraph(nodes, selectedEdgeObjects, {
        directed: false,
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        edgeStates: mstOnlyEdgeStates,
        edgeColors: buildTreeEdgeColors(selectedEdges, treeEdgeColor),
        labels: { treeEdges: treeEdgesLabel },
        phase: d(locale, 'Minimum spanning tree only', 'Arbre couvrant minimal uniquement'),
      }),
      description: d(
        locale,
        `Minimum spanning tree only. Total cost: ${totalCost}. Non-tree edges are hidden.`,
        `Arbre couvrant minimal uniquement. Coût total : ${totalCost}. Les arêtes hors-arbre sont masquées.`,
      ),
      codeLine: 26,
      variables: { totalCost, edgesSelected: selectedEdgeObjects.length },
    })

    return steps
  },
}

function buildTreeEdgeColors(pairs: [number, number][], color: string) {
  const edgeColors: Record<string, string> = {}
  for (const [from, to] of pairs) {
    edgeColors[edgeKey(from, to, false)] = color
  }
  return edgeColors
}


