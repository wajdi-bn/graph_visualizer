import type { Algorithm, GraphEdge, GraphNode, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  adjacency,
  baseGraph,
  cloneEdgeStates,
  cloneRecord,
  edgeKey,
  graphFromInput,
  label,
  requireNodes,
  requireUndirectedCustom,
} from '@lib/algorithms/graphAlgorithmUtils'
import { getTreeDemo, treeExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'

export const treeCheck: Algorithm = {
  id: 'tree-check',
  name: 'Tree Check',
  category: 'Traversal / Properties',
  difficulty: 'easy',
  visualization: 'graph',
  code: `function isTree(graph) {
  return isConnected(graph) && graph.edgeCount === graph.vertexCount - 1;
}`,
  description: `Tree Check

A graph is a tree when it is connected and acyclic. This treatment checks both properties with a DFS traversal.

Time Complexity: O(V + E)
Space Complexity: O(V)`,
  examples: treeExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = customGraph
      ? graphFromInput(customGraph, { directed: false })
      : { ...getTreeDemo(exampleId), directed: false }
    const { nodes, edges } = demo
    const incompatible =
      requireNodes(locale, nodes, edges, false) ??
      requireUndirectedCustom(
        locale,
        customGraph,
        nodes,
        edges,
        'Tree checking is implemented here for undirected graphs. Turn off Directed graph in the editor.',
        'Le test d arbre est implemente ici pour les graphes non orientes. Desactivez Graphe oriente dans l editeur.',
      )
    if (incompatible) return incompatible

    const adj = adjacency(edges)
    const visited = new Set<number>()
    const stack = [nodes[0]?.id].filter((id): id is number => id != null)
    const parent: Record<number, number | null> = {}
    const selectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    for (const node of nodes) parent[node.id] = null

    steps.push({
      graph: baseGraph(nodes, edges, {
        currentNode: stack[0] ?? null,
        stack: [...stack],
        phase: d(locale, 'Start DFS tree test', 'Demarrer le test d arbre par DFS'),
      }),
      description: d(locale, 'Check connectivity and cycles with DFS.', 'Verifier la connectivite et les cycles avec DFS.'),
      codeLine: 1,
      variables: { vertices: nodes.length, edges: edges.length },
    })

    while (stack.length > 0) {
      const current = stack.pop()!
      if (visited.has(current)) continue
      visited.add(current)

      steps.push({
        graph: baseGraph(nodes, edges, {
          currentNode: current,
          visitedNodes: [...visited],
          stack: [...stack],
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          phase: d(locale, 'Explore component', 'Explorer la composante'),
        }),
        description: d(
          locale,
          `Visit ${label(nodes, current)} while testing whether the graph is a tree.`,
          `Visiter ${label(nodes, current)} pendant le test pour savoir si le graphe est un arbre.`,
        ),
        codeLine: 3,
        variables: { vertex: label(nodes, current) },
      })

      for (const { node: neighbor } of adj[current] ?? []) {
        if (!visited.has(neighbor)) {
          parent[neighbor] = current
          stack.push(neighbor)
          selectedEdges.push([current, neighbor])
          edgeStates[edgeKey(current, neighbor)]= 'selected'
        } else if (parent[current] !== neighbor) {
          steps.push({
            graph: baseGraph(nodes, edges, {
              currentNode: current,
              currentEdge: [current, neighbor],
              visitedNodes: [...visited],
              stack: [...stack],
              visitedEdges: [...selectedEdges],
              selectedEdges: [...selectedEdges],
              edgeStates: { ...cloneEdgeStates(edgeStates), [edgeKey(current, neighbor)]: 'rejected' },
              phase: d(locale, 'Cycle found', 'Cycle trouve'),
            }),
            description: d(
              locale,
              `A back edge ${label(nodes, current)}-${label(nodes, neighbor)} shows that the graph is not a tree.`,
              `Une arrete de retour ${label(nodes, current)}-${label(nodes, neighbor)} montre que le graphe n'est pas un arbre.`,
            ),
            codeLine: 4,
            variables: { tree: false },
          })
          return steps
        }
      }
    }

    const connected = visited.size === nodes.length
    const tree = connected && edges.length === nodes.length - 1

    steps.push({
      graph: baseGraph(nodes, edges, {
        visitedNodes: [...visited],
        currentNode: null,
        stack: [],
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        edgeStates: cloneEdgeStates(edgeStates),
        labels: { connected, tree },
        phase: tree ? d(locale, 'Graph is a tree', 'Le graphe est un arbre') : d(locale, 'Graph is not a tree', "Le graphe n'est pas un arbre"),
      }),
      description: tree
        ? d(locale, 'The graph is connected and acyclic, so it is a tree.', 'Le graphe est connexe et sans cycle, donc c est un arbre.')
        : d(locale, 'The graph fails the tree test.', 'Le graphe ne verifie pas le test d arbre.'),
      codeLine: 5,
      variables: { connected, tree },
    })

    return steps
  },
}