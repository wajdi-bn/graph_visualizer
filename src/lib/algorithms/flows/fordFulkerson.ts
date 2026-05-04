import type { Algorithm, AlgorithmRunOptions, GraphEdge, GraphVisualState, Step } from '@lib/types'
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
  requireValidSink,
  requireValidSource,
  requireWeightedGraph,
  resolveSinkNodeId,
  resolveSourceNodeId,
} from '@lib/algorithms/graphAlgorithmUtils'
import {
  flowExampleOptions,
  getFlowDemo,
} from '@lib/algorithms/graphAlgorithmExamples'

// ── Types ────────────────────────────────────────────────────────────────────

interface ResidualEdge {
  edgeIndex: number   // index into the original edges array
  from: number
  to: number
  residual: number
  direction: 'forward' | 'backward'
}

// ── Algorithm ────────────────────────────────────────────────────────────────

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

Ford-Fulkerson here uses Edmonds-Karp: each augmenting path is chosen by BFS in the residual network. Parallel edges between the same pair of nodes are fully supported.

Time Complexity: O(VE²)
Space Complexity: O(V + E)`,
  examples: flowExampleOptions,

  generateSteps(locale = 'en', exampleId, customGraph, options?: AlgorithmRunOptions) {
    // ── Input resolution ─────────────────────────────────────────────────────
    const demo = customGraph
      ? graphFromInput(customGraph)
      : { ...getFlowDemo(exampleId), directed: true }

    const { nodes } = demo
    const inputEdges = demo.edges
    const inputDirected = Boolean(demo.directed)

    const incompatible = requireNodes(locale, nodes, inputEdges, inputDirected)
    if (incompatible) return incompatible

    const directedIssue = requireDirectedCustom(
      locale,
      customGraph,
      nodes,
      inputEdges,
      'Ford-Fulkerson uses directed capacity networks. Turn on Directed graph in the editor.',
      'Ford-Fulkerson utilise des reseaux de capacite orientes. Activez Graphe oriente dans l editeur.',
    )
    if (directedIssue) return directedIssue

    const edges = inputEdges.map((edge) => ({ ...edge, directed: true }))

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

    const weightedIssue = requireWeightedGraph(locale, nodes, edges, true)
    if (weightedIssue) return weightedIssue

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

    const source = resolveSourceNodeId(nodes, customGraph, options)
    const sourceIssue = requireValidSource(locale, nodes, edges, true, source)
    if (sourceIssue) return sourceIssue

    const sink = resolveSinkNodeId(nodes, source, customGraph, options)
    const sinkIssue = requireValidSink(locale, nodes, edges, true, sink)
    if (sinkIssue) return sinkIssue

    if (source == null || sink == null) return []

    const sourceLabel = label(nodes, source)
    const sinkLabel = label(nodes, sink)

    // ── Flow state — one entry per original edge index ───────────────────────
    const flow = new Array(edges.length).fill(0) as number[]
    const steps: Step[] = []
    let maxFlow = 0
    let iteration = 1

    // ── Step 0: initialisation ───────────────────────────────────────────────
    steps.push({
      graph: baseGraph(nodes, edgesWithFlowLabels(edges, flow), {
        directed: true,
        sourceNodeId: source,
        sinkNodeId: sink,
        currentNode: source,
        nodeColors: { [source]: '#38bdf8', [sink]: '#fb7185' },
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

    // ── Main loop ────────────────────────────────────────────────────────────
    while (true) {
      const search = findAugmentingPath(
        nodes.map((node) => node.id),
        edges,
        flow,
        source,
        sink,
      )

      // No augmenting path → algorithm terminates
      if (!search.path) {
        steps.push({
          graph: baseGraph(nodes, edgesWithFlowLabels(edges, flow), {
            directed: true,
            visitedNodes: search.visited,
            sourceNodeId: source,
            sinkNodeId: sink,
            currentNode: null,
            nodeColors: { [source]: '#38bdf8', [sink]: '#fb7185' },
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
      const bottleneck = Math.min(...path.map((re) => re.residual))
      const pathNodes = [source, ...path.map((re) => re.to)]

      // Build edge pairs for the visualiser using the original edge direction
      const pathEdgePairs = path.map((re) => originalPair(edges[re.edgeIndex]))
      const edgeStates = edgeStatesForPath(edges, path)

      // Show the found augmenting path
      steps.push({
        graph: baseGraph(nodes, edgesWithFlowLabels(edges, flow), {
          directed: true,
          visitedNodes: pathNodes,
          sourceNodeId: source,
          sinkNodeId: sink,
          visitedEdges: pathEdgePairs,
          selectedEdges: pathEdgePairs,
          edgeStates,
          nodeColors: { [source]: '#38bdf8', [sink]: '#fb7185' },
          phase: d(locale, `Augmenting path ${iteration}`, `Chemin augmentant ${iteration}`),
        }),
        description: d(
          locale,
          `Found residual path ${formatPath(nodes, pathNodes)} with bottleneck ${bottleneck}.`,
          `Chemin residuel trouve ${formatPath(nodes, pathNodes)} avec goulot ${bottleneck}.`,
        ),
        codeLine: 8,
        variables: { path: formatPath(nodes, pathNodes), bottleneck, maxFlow },
      })

      // Push flow along the path edge by edge
      for (const residualEdge of path) {
        const original = edges[residualEdge.edgeIndex]

        if (residualEdge.direction === 'forward') {
          flow[residualEdge.edgeIndex] += bottleneck
        } else {
          flow[residualEdge.edgeIndex] -= bottleneck
        }

        const stateKey = edgeKey(original.from, original.to, true)
        steps.push({
          graph: baseGraph(nodes, edgesWithFlowLabels(edges, flow), {
            directed: true,
            currentNode: residualEdge.to,
            sourceNodeId: source,
            sinkNodeId: sink,
            currentEdge: originalPair(original),
            visitedEdges: pathEdgePairs,
            selectedEdges: pathEdgePairs,
            edgeStates: {
              ...cloneEdgeStates(edgeStates),
              [stateKey]: 'current',
            },
            nodeColors: { [source]: '#38bdf8', [sink]: '#fb7185' },
            phase: d(locale, 'Push bottleneck flow', 'Pousser le goulot'),
          }),
          description:
            residualEdge.direction === 'forward'
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
            direction: residualEdge.direction,
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
          sourceNodeId: source,
          sinkNodeId: sink,
          visitedEdges: pathEdgePairs,
          selectedEdges: pathEdgePairs,
          edgeStates,
          nodeColors: { [source]: '#38bdf8', [sink]: '#fb7185' },
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function edgesWithFlowLabels(edges: GraphEdge[], flow: number[]) {
  return edges.map((edge, index) => ({
    ...edge,
    label: `${flow[index]}/${edge.weight ?? 1}`,
  }))
}

/**
 * BFS on the residual graph.
 *
 * FIX: parent is now a Map<nodeId, ResidualEdge> keyed by destination node.
 * For each node we store exactly ONE incoming residual edge (the first BFS
 * encounter), which is sufficient to reconstruct the shortest augmenting path.
 * This correctly handles parallel edges: multiple forward/backward residual
 * edges between the same pair of nodes are all evaluated independently because
 * each has its own edgeIndex.
 */
function findAugmentingPath(
  nodeIds: number[],
  edges: GraphEdge[],
  flow: number[],
  source: number,
  sink: number,
): { path: ResidualEdge[] | null; visited: number[] } {
  const queue: number[] = [source]
  const visited = new Set<number>([source])

  // Map from nodeId → the residual edge that first reached it
  const parent = new Map<number, ResidualEdge>()

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === sink) break

    for (let index = 0; index < edges.length; index++) {
      const edge = edges[index]
      const capacity = edge.weight ?? 1

      // Forward residual edge: u → v with remaining capacity
      if (edge.from === current && !visited.has(edge.to)) {
        const remaining = capacity - flow[index]
        if (remaining > 0) {
          visited.add(edge.to)
          parent.set(edge.to, {
            edgeIndex: index,
            from: edge.from,
            to: edge.to,
            residual: remaining,
            direction: 'forward',
          })
          queue.push(edge.to)
        }
      }

      // Backward residual edge: v → u to cancel existing forward flow
      if (edge.to === current && !visited.has(edge.from)) {
        const cancelable = flow[index]
        if (cancelable > 0) {
          visited.add(edge.from)
          parent.set(edge.from, {
            edgeIndex: index,
            from: edge.to,   // traversal direction is reversed
            to: edge.from,
            residual: cancelable,
            direction: 'backward',
          })
          queue.push(edge.from)
        }
      }
    }
  }

  if (!visited.has(sink)) return { path: null, visited: [...visited] }

  // Reconstruct path from sink back to source
  const path: ResidualEdge[] = []
  let current = sink

  while (current !== source) {
    const edge = parent.get(current)
    if (!edge) return { path: null, visited: [...visited] }
    path.push(edge)
    current = edge.from
  }

  return { path: path.reverse(), visited: [...visited] }
}

function originalPair(edge: GraphEdge): [number, number] {
  return [edge.from, edge.to]
}

function edgeStatesForPath(
  edges: GraphEdge[],
  path: ResidualEdge[],
): Record<string, GraphVisualState> {
  const states: Record<string, GraphVisualState> = {}
  for (const residualEdge of path) {
    const original = edges[residualEdge.edgeIndex]
    states[edgeKey(original.from, original.to, true)] =
      residualEdge.direction === 'forward' ? 'selected' : 'candidate'
  }
  return states
}

function formatPath(nodes: { id: number; label: string }[], path: number[]): string {
  return path.map((id) => label(nodes, id)).join(' -> ')
}