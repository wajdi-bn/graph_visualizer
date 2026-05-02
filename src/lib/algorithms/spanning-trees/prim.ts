import type { Algorithm, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  adjacency,
  baseGraph,
  cloneEdgeStates,
  cloneRecord,
  edgeKey,
  formatDistances,
  graphFromInput,
  inf,
  label,
  requireNodes,
  requireUndirectedCustom,
} from '@lib/algorithms/graphAlgorithmUtils'
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
  code: `function prim(graph, start) {
  const inTree = new Set();
  const key = Array(graph.length).fill(Infinity);
  const parent = Array(graph.length).fill(null);
  key[start] = 0;

  while (inTree.size < graph.length) {
    const u = minOutsideTree(key, inTree);
    inTree.add(u);
    for (const edge of graph[u]) {
      if (!inTree.has(edge.to) && edge.weight < key[edge.to]) {
        key[edge.to] = edge.weight;
        parent[edge.to] = u;
      }
    }
  }

  return parent;
}`,
  description: `Prim

Prim grows a minimum spanning tree from one start vertex, always adding the cheapest edge that leaves the current tree.

Time Complexity: O(E log V)
Space Complexity: O(V)`,
  examples: weightedExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = customGraph
      ? graphFromInput(customGraph, { directed: false, defaultWeight: true })
      : { ...getWeightedDemo(exampleId), directed: false }
    const { nodes, edges } = demo
    const incompatible =
      requireNodes(locale, nodes, edges, false) ??
      requireUndirectedCustom(
        locale,
        customGraph,
        nodes,
        edges,
        'Prim builds an undirected minimum spanning tree. Turn off Directed graph in the editor.',
        'Prim construit un arbre couvrant minimal non oriente. Desactivez Graphe oriente dans l editeur.',
      )
    if (incompatible) return incompatible
    const source = nodes[0].id
    const sourceLabel = label(nodes, source)
    const adj = adjacency(edges)
    const inTree = new Set<number>()
    const key: Record<number, number | string> = {}
    const parent: Record<number, number | null> = {}
    const selectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    for (const node of nodes) {
      key[node.id] = node.id === source ? 0 : inf
      parent[node.id] = null
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        currentNode: source,
        distances: cloneRecord(key),
        predecessors: cloneRecord(parent),
        phase: d(locale, `Start the tree at ${sourceLabel}`, `Demarrer l arbre en ${sourceLabel}`),
      }),
      description: d(
        locale,
        `Start Prim from ${sourceLabel}. Key values store the cheapest known edge into the tree.`,
        `On demarre Prim depuis ${sourceLabel}. Les cles stockent la moins chere arete connue vers l arbre.`,
      ),
      codeLine: 5,
      variables: { start: sourceLabel, keys: formatDistances(nodes, key) },
    })

    while (inTree.size < nodes.length) {
      let current = -1
      let best = Infinity
      for (const node of nodes) {
        const value = key[node.id]
        if (!inTree.has(node.id) && typeof value === 'number' && value < best) {
          current = node.id
          best = value
        }
      }
      if (current === -1) break

      inTree.add(current)
      if (parent[current] != null) {
        selectedEdges.push([parent[current]!, current])
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
          distances: cloneRecord(key),
          predecessors: cloneRecord(parent),
          phase: d(locale, 'Add cheapest outside vertex', 'Ajouter le sommet externe le moins cher'),
        }),
        description:
          parent[current] == null
            ? d(
                locale,
                `${label(nodes, current)} is the first vertex in the tree.`,
                `${label(nodes, current)} est le premier sommet dans l arbre.`,
              )
            : d(
                locale,
                `Add ${label(nodes, current)} through ${label(nodes, parent[current]!)}-${label(nodes, current)} (weight ${key[current]}).`,
                `Ajouter ${label(nodes, current)} via ${label(nodes, parent[current]!)}-${label(nodes, current)} (poids ${key[current]}).`,
              ),
        codeLine: 9,
        variables: { vertex: label(nodes, current), key: key[current] },
      })

      for (const { node: neighbor, weight } of adj[current] ?? []) {
        if (inTree.has(neighbor)) continue
        if (key[neighbor] === inf || weight < (key[neighbor] as number)) {
          key[neighbor] = weight
          parent[neighbor] = current
          edgeStates[edgeKey(current, neighbor)] = 'relaxed'

          steps.push({
            graph: baseGraph(nodes, edges, {
              visitedNodes: [...inTree],
              currentNode: current,
              currentEdge: [current, neighbor],
              visitedEdges: [...selectedEdges],
              selectedEdges: [...selectedEdges],
              edgeStates: cloneEdgeStates(edgeStates),
              distances: cloneRecord(key),
              predecessors: cloneRecord(parent),
              phase: d(locale, 'Update frontier keys', 'Mettre a jour les cles de frontiere'),
            }),
            description: d(
              locale,
              `Update ${label(nodes, neighbor)}: cheapest connection is now from ${label(nodes, current)} with weight ${weight}.`,
              `Mettre a jour ${label(nodes, neighbor)} : la connexion la moins chere vient de ${label(nodes, current)} avec le poids ${weight}.`,
            ),
            codeLine: 12,
            variables: { vertex: label(nodes, neighbor), key: weight, keys: formatDistances(nodes, key) },
          })
        }
      }
    }

    return steps
  },
}


