import type { Algorithm, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  adjacency,
  baseGraph,
  cloneEdgeStates,
  cloneRecord,
  edgeKey,
  graphFromInput,
  label,
  palette,
  requireNodes,
  requireUndirectedCustom,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  componentExampleOptions,
  getComponentDemo,
} from '@lib/algorithms/graphAlgorithmExamples'

export const connectedComponents: Algorithm = {
  id: 'connected-components',
  name: 'Connected Components',
  category: 'Connectivity',
  difficulty: 'easy',
  visualization: 'graph',
  code: `function connectedComponents(graph) {
  const visited = new Set();
  const components = [];

  for (const vertex of graph.vertices) {
    if (visited.has(vertex)) continue;
    const component = [];
    const stack = [vertex];
    visited.add(vertex);

    while (stack.length > 0) {
      const u = stack.pop();
      component.push(u);
      for (const v of graph[u]) {
        if (!visited.has(v)) {
          visited.add(v);
          stack.push(v);
        }
      }
    }

    components.push(component);
  }

  return components;
}`,
  description: `Connected Components

Connected components partition an undirected graph into maximal groups where every vertex is reachable from every other vertex in the same group.

Time Complexity: O(V + E)
Space Complexity: O(V)`,
  examples: componentExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = customGraph
      ? graphFromInput(customGraph, { directed: false })
      : { ...getComponentDemo(exampleId), directed: false }
    const { nodes, edges } = demo
    const incompatible =
      requireNodes(locale, nodes, edges, false) ??
      requireUndirectedCustom(
        locale,
        customGraph,
        nodes,
        edges,
        'Connected components is defined here for undirected graphs. Turn off Directed graph in the editor.',
        'Les composantes connexes sont definies ici pour les graphes non orientes. Desactivez Graphe oriente dans l editeur.',
      )
    if (incompatible) return incompatible
    const adj = adjacency(edges)
    const visited = new Set<number>()
    const visitedNodes: number[] = []
    const visitedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const nodeColors: Record<number, string> = {}
    const components: number[][] = []
    const steps: Step[] = []

    for (const node of nodes) {
      if (visited.has(node.id)) continue
      const componentIndex = components.length
      const color = palette[componentIndex % palette.length]
      const stack = [node.id]
      const component: number[] = []
      visited.add(node.id)
      nodeColors[node.id] = color

      steps.push({
        graph: baseGraph(nodes, edges, {
          currentNode: node.id,
          stack: [...stack],
          nodeColors: cloneRecord(nodeColors),
          visitedEdges: [...visitedEdges],
          selectedEdges: [...visitedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          phase: d(locale, `Start component ${componentIndex + 1}`, `Demarrer le composant ${componentIndex + 1}`),
        }),
        description: d(
          locale,
          `Start a new component from ${label(nodes, node.id)}.`,
          `Demarrer un nouveau composant depuis ${label(nodes, node.id)}.`,
        ),
        codeLine: 6,
        variables: { component: componentIndex + 1, start: label(nodes, node.id) },
      })

      while (stack.length > 0) {
        const current = stack.pop()!
        component.push(current)
        visitedNodes.push(current)

        for (const { node: neighbor } of adj[current] ?? []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            stack.push(neighbor)
            nodeColors[neighbor] = color
            visitedEdges.push([current, neighbor])
            edgeStates[edgeKey(current, neighbor)] = 'selected'

            steps.push({
              graph: baseGraph(nodes, edges, {
                visitedNodes: [...visitedNodes],
                currentNode: current,
                currentEdge: [current, neighbor],
                stack: [...stack],
                nodeColors: cloneRecord(nodeColors),
                visitedEdges: [...visitedEdges],
                selectedEdges: [...visitedEdges],
                edgeStates: cloneEdgeStates(edgeStates),
                phase: d(locale, `Explore component ${componentIndex + 1}`, `Explorer le composant ${componentIndex + 1}`),
              }),
              description: d(
                locale,
                `Discover ${label(nodes, neighbor)} from ${label(nodes, current)} and add it to the component.`,
                `Decouvrir ${label(nodes, neighbor)} depuis ${label(nodes, current)} et l'ajouter au composant.`,
              ),
              codeLine: 12,
              variables: { neighbor: label(nodes, neighbor) },
            })
          }
        }

        steps.push({
          graph: baseGraph(nodes, edges, {
            visitedNodes: [...visitedNodes],
            currentNode: current,
            stack: [...stack],
            nodeColors: cloneRecord(nodeColors),
            visitedEdges: [...visitedEdges],
            selectedEdges: [...visitedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            phase: d(locale, `Explore component ${componentIndex + 1}`, `Explorer le composant ${componentIndex + 1}`),
          }),
          description: d(
            locale,
            `Visit ${label(nodes, current)}. Component ${componentIndex + 1}: ${component.map((id) => label(nodes, id)).join(', ')}.`,
            `Visiter ${label(nodes, current)}. Composant ${componentIndex + 1} : ${component.map((id) => label(nodes, id)).join(', ')}.`,
          ),
          codeLine: 12,
          variables: { current: label(nodes, current), stack: stack.map((id) => label(nodes, id)).join(', ') },
        })
      }

      components.push(component)
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        visitedNodes: [...visitedNodes],
        nodeColors: cloneRecord(nodeColors),
        visitedEdges: [...visitedEdges],
        selectedEdges: [...visitedEdges],
        edgeStates: cloneEdgeStates(edgeStates),
        components,
        phase: d(locale, 'Components complete', 'Composantes terminees'),
      }),
      description: d(
        locale,
        `Connected components complete. Found ${components.length} component(s).`,
        `Composantes connexes terminees. ${components.length} composante(s) trouvee(s).`,
      ),
      variables: { components: components.length },
    })

    return steps
  },
}


