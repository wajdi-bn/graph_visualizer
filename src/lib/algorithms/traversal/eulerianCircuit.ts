import type { Algorithm } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  incompatibilityStep,
  requireDirectedCustom,
  requireNodes,
} from '@lib/algorithms/graphAlgorithmUtils'
import { eulerianCircuitExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'
import {
  buildDirectedEulerianSteps,
  directedEulerianInput,
  validateDirectedEulerian,
} from '@lib/algorithms/traversal/eulerianDirectedUtils'

export const eulerianCircuit: Algorithm = {
  id: 'eulerian-circuit',
  name: 'Eulerian Circuit',
  category: 'Traversal / Properties',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function eulerianCircuit(graph, start) {
  const stack = [start];
  const circuit = [];

  while (stack.length > 0) {
    const u = stack[stack.length - 1];
    const edge = firstUnusedOutgoingEdge(u);
    if (edge) {
      markUsed(edge);
      stack.push(edge.to);
    } else {
      circuit.push(stack.pop());
    }
  }

  return circuit.reverse();
}`,
  description: `Eulerian Circuit

A directed Eulerian circuit uses every directed edge exactly once and returns to its start. Every non-isolated vertex must be connected in the underlying graph and have equal in-degree and out-degree.

Time Complexity: O(V + E)
Space Complexity: O(E)`,
  examples: eulerianCircuitExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = directedEulerianInput(customGraph, exampleId)
    const { nodes, edges } = demo
    const directedIssue = requireDirectedCustom(
      locale,
      customGraph,
      nodes,
      edges,
      'Eulerian circuit is implemented for directed graphs. Turn on Directed graph in the editor.',
      'Le circuit eulerien est implemente pour les graphes orientes. Activez Graphe oriente dans l editeur.',
    )
    const incompatible = requireNodes(locale, nodes, edges, true) ?? directedIssue
    if (incompatible) return incompatible

    const validation = validateDirectedEulerian(nodes, edges, 'circuit')
    if (!validation.ok || validation.start == null) {
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        true,
        'A directed Eulerian circuit needs weak connectivity and equal in-degree/out-degree at every vertex.',
        'Un circuit eulerien oriente exige la connexite faible et degre entrant = degre sortant pour chaque sommet.',
      )
    }

    const steps = buildDirectedEulerianSteps(locale, nodes, edges, validation.start, 'circuit')
    steps.unshift({
      graph: {
        ...steps[0].graph!,
        phase: d(locale, 'Check directed circuit conditions', 'Verifier les conditions du circuit oriente'),
      },
      description: d(
        locale,
        'Every non-isolated vertex is connected and balanced, so a directed Eulerian circuit exists.',
        'Chaque sommet non isole est connecte et equilibre, donc un circuit eulerien oriente existe.',
      ),
      variables: { start: validation.start },
    })
    return steps
  },
}
