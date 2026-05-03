import type { Algorithm, GraphEdge, GraphVisualState, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  cloneEdgeStates,
  edgeKey,
  graphFromInput,
  incompatibilityStep,
  label,
  requireDirectedCustom,
  requireNodes,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  flowExampleOptions,
  getFlowDemo,
} from '@lib/algorithms/graphAlgorithmExamples'

interface ResidualEdge {
  edgeIndex: number
  from: number
  to: number
  residual: number
  direction: 'forward' | 'backward'
}

export const fordFulkerson: Algorithm = {
  id: 'ford-fulkerson',
  name: 'Ford-Fulkerson',
  category: 'Flows',
  difficulty: 'advanced',
  visualization: 'graph',
  code: `function fordFulkerson(graph, source, sink) {
  let maxFlow = 0;
  const flow = new Map();

  while (true) {
    const path = findAugmentingPath(graph, flow, source, sink);
    if (!path) break;

    const bottleneck = Math.min(...path.map(edge => edge.residual));

    for (const edge of path) {
      if (edge.forward) flow.set(edge.id, flow.get(edge.id) + bottleneck);
      else flow.set(edge.id, flow.get(edge.id) - bottleneck);
    }

    maxFlow += bottleneck;
  }

  return maxFlow;
}`,
  description: `Ford-Fulkerson

Ford-Fulkerson computes a maximum flow by repeatedly sending more flow through an augmenting path in the residual network.

Time Complexity: O(E * maxFlow) with integral capacities
Space Complexity: O(V + E)`,
  examples: flowExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = customGraph
      ? graphFromInput(customGraph, { defaultWeight: true })
      : { ...getFlowDemo(exampleId), directed: true }
    const { nodes } = demo
    const edges = demo.edges.map((edge) => ({ ...edge, directed: true }))
    const incompatible = requireNodes(locale, nodes, edges, true)
    if (incompatible) return incompatible
    if (nodes.length < 2) {
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        true,
        'Ford-Fulkerson needs at least a source and a sink.',
        'Ford-Fulkerson exige au moins une source et un puits.',
      )
    }
    const directedIssue = requireDirectedCustom(
      locale,
      customGraph,
      nodes,
      edges,
      'Ford-Fulkerson uses directed capacity networks. Turn on Directed graph in the editor.',
      'Ford-Fulkerson utilise des reseaux de capacite orientes. Activez Graphe oriente dans l editeur.',
    )
    if (directedIssue) return directedIssue
    const negativeCapacity = edges.find((edge) => (edge.weight ?? 1) < 0)
    if (negativeCapacity) {
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        true,
        'Flow capacities must be non-negative.',
        'Les capacites de flot doivent etre non negatives.',
      )
    }

    const source = nodes[0].id
    const sink = nodes[nodes.length - 1].id
    const sourceLabel = label(nodes, source)
    const sinkLabel = label(nodes, sink)
    const flow = new Array(edges.length).fill(0) as number[]
    const steps: Step[] = []
    let maxFlow = 0
    let iteration = 1

    steps.push({
      graph: baseGraph(nodes, edgesWithFlowLabels(edges, flow), {
        directed: true,
        currentNode: source,
        nodeColors: {
          [source]: '#38bdf8',
          [sink]: '#fb7185',
        },
        phase: d(locale, 'Initialize zero flow', 'Initialiser le flot nul'),
      }),
      description: d(
        locale,
        `Start with 0 flow from source ${sourceLabel} to sink ${sinkLabel}. Edge labels show flow/capacity.`,
        `On commence avec un flot 0 de la source ${sourceLabel} vers le puits ${sinkLabel}. Les etiquettes indiquent flot/capacite.`,
      ),
      codeLine: 2,
      variables: { source: sourceLabel, sink: sinkLabel, maxFlow },
    })

    while (true) {
      const search = findAugmentingPath(nodes.map((node) => node.id), edges, flow, source, sink)
      if (!search.path) {
        steps.push({
          graph: baseGraph(nodes, edgesWithFlowLabels(edges, flow), {
            directed: true,
            visitedNodes: search.visited,
            currentNode: null,
            nodeColors: {
              [source]: '#38bdf8',
              [sink]: '#fb7185',
            },
            phase: d(locale, 'No augmenting path', 'Aucun chemin augmentant'),
          }),
          description: d(
            locale,
            `No residual path reaches ${sinkLabel}. The maximum flow is ${maxFlow}.`,
            `Aucun chemin residuel n atteint ${sinkLabel}. Le flot maximum vaut ${maxFlow}.`,
          ),
          codeLine: 6,
          variables: { maxFlow },
        })
        break
      }

      const path = search.path
      const bottleneck = Math.min(...path.map((edge) => edge.residual))
      const pathNodes = [source, ...path.map((edge) => edge.to)]
      const pathEdges = path.map((edge) => originalPair(edges[edge.edgeIndex]))
      const edgeStates = edgeStatesForPath(edges, path)

      steps.push({
        graph: baseGraph(nodes, edgesWithFlowLabels(edges, flow), {
          directed: true,
          visitedNodes: pathNodes,
          visitedEdges: pathEdges,
          selectedEdges: pathEdges,
          edgeStates,
          nodeColors: {
            [source]: '#38bdf8',
            [sink]: '#fb7185',
          },
          phase: d(locale, `Augmenting path ${iteration}`, `Chemin augmentant ${iteration}`),
        }),
        description: d(
          locale,
          `Found residual path ${formatPath(nodes, pathNodes)} with bottleneck ${bottleneck}.`,
          `Chemin residuel trouve ${formatPath(nodes, pathNodes)} avec goulot ${bottleneck}.`,
        ),
        codeLine: 8,
        variables: {
          path: formatPath(nodes, pathNodes),
          bottleneck,
          maxFlow,
        },
      })

      for (const residualEdge of path) {
        const original = edges[residualEdge.edgeIndex]
        if (residualEdge.direction === 'forward') flow[residualEdge.edgeIndex] += bottleneck
        else flow[residualEdge.edgeIndex] -= bottleneck

        const stateKey = edgeKey(original.from, original.to, true)
        steps.push({
          graph: baseGraph(nodes, edgesWithFlowLabels(edges, flow), {
            directed: true,
            currentNode: residualEdge.to,
            currentEdge: originalPair(original),
            visitedEdges: pathEdges,
            selectedEdges: pathEdges,
            edgeStates: {
              ...cloneEdgeStates(edgeStates),
              [stateKey]: 'current',
            },
            nodeColors: {
              [source]: '#38bdf8',
              [sink]: '#fb7185',
            },
            phase: d(locale, 'Push bottleneck flow', 'Pousser le goulot'),
          }),
          description: residualEdge.direction === 'forward'
            ? d(
                locale,
                `Add ${bottleneck} units on ${label(nodes, original.from)} -> ${label(nodes, original.to)}.`,
                `Ajouter ${bottleneck} unites sur ${label(nodes, original.from)} -> ${label(nodes, original.to)}.`,
              )
            : d(
                locale,
                `Cancel ${bottleneck} units on ${label(nodes, original.from)} -> ${label(nodes, original.to)} through a reverse residual edge.`,
                `Annuler ${bottleneck} unites sur ${label(nodes, original.from)} -> ${label(nodes, original.to)} via une arete residuelle inverse.`,
              ),
          codeLine: 11,
          variables: {
            edge: `${label(nodes, original.from)}->${label(nodes, original.to)}`,
            bottleneck,
            flow: `${flow[residualEdge.edgeIndex]}/${original.weight ?? 1}`,
          },
        })
      }

      maxFlow += bottleneck
      steps.push({
        graph: baseGraph(nodes, edgesWithFlowLabels(edges, flow), {
          directed: true,
          visitedNodes: pathNodes,
          visitedEdges: pathEdges,
          selectedEdges: pathEdges,
          edgeStates,
          nodeColors: {
            [source]: '#38bdf8',
            [sink]: '#fb7185',
          },
          phase: d(locale, 'Increase max flow', 'Augmenter le flot'),
        }),
        description: d(
          locale,
          `Increase the total flow by ${bottleneck}. Current max-flow value: ${maxFlow}.`,
          `Augmenter le flot total de ${bottleneck}. Valeur courante du flot : ${maxFlow}.`,
        ),
        codeLine: 14,
        variables: { bottleneck, maxFlow },
      })

      iteration += 1
    }

    return steps
  },
}

function edgesWithFlowLabels(edges: GraphEdge[], flow: number[]) {
  return edges.map((edge, index) => ({
    ...edge,
    label: `${flow[index]}/${edge.weight ?? 1}`,
  }))
}

function findAugmentingPath(
  nodeIds: number[],
  edges: GraphEdge[],
  flow: number[],
  source: number,
  sink: number,
) {
  const queue = [source]
  const visited = new Set<number>([source])
  const parent: Record<number, ResidualEdge | null> = {}
  for (const id of nodeIds) parent[id] = null

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === sink) break

    for (let index = 0; index < edges.length; index += 1) {
      const edge = edges[index]
      const capacity = edge.weight ?? 1

      if (edge.from === current && capacity - flow[index] > 0 && !visited.has(edge.to)) {
        visited.add(edge.to)
        parent[edge.to] = {
          edgeIndex: index,
          from: edge.from,
          to: edge.to,
          residual: capacity - flow[index],
          direction: 'forward',
        }
        queue.push(edge.to)
      }

      if (edge.to === current && flow[index] > 0 && !visited.has(edge.from)) {
        visited.add(edge.from)
        parent[edge.from] = {
          edgeIndex: index,
          from: edge.to,
          to: edge.from,
          residual: flow[index],
          direction: 'backward',
        }
        queue.push(edge.from)
      }
    }
  }

  if (!visited.has(sink)) return { path: null, visited: [...visited] }

  const path: ResidualEdge[] = []
  let current = sink
  while (current !== source) {
    const edge = parent[current]
    if (!edge) return { path: null, visited: [...visited] }
    path.push(edge)
    current = edge.from
  }

  return { path: path.reverse(), visited: [...visited] }
}

function originalPair(edge: GraphEdge): [number, number] {
  return [edge.from, edge.to]
}

function edgeStatesForPath(edges: GraphEdge[], path: ResidualEdge[]) {
  const states: Record<string, GraphVisualState> = {}
  for (const residualEdge of path) {
    const original = edges[residualEdge.edgeIndex]
    states[edgeKey(original.from, original.to, true)] = residualEdge.direction === 'forward' ? 'selected' : 'candidate'
  }
  return states
}

function formatPath(nodes: { id: number; label: string }[], path: number[]) {
  return path.map((id) => label(nodes, id)).join(' -> ')
}
