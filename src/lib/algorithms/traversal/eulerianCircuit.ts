import type { Algorithm } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  graphFromInput,
  incompatibilityStep,
  isDirectedGraph,
  requireNodes,
} from '@lib/algorithms/graphAlgorithmUtils'
import { eulerianCircuitExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'
import {
  buildDirectedEulerianSteps,
  directedEulerianInput,
  validateDirectedEulerian,
} from '@lib/algorithms/traversal/eulerianDirectedUtils'
import {
  buildUndirectedEulerianSteps,
  validateUndirectedEulerian,
} from '@lib/algorithms/traversal/eulerianUndirectedUtils'

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

An Eulerian circuit uses every edge exactly once and returns to its start. Directed graphs require balanced in/out degree; undirected graphs require all even degrees.

Time Complexity: O(V + E)
Space Complexity: O(E)`,
  examples: eulerianCircuitExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    if (!customGraph) {
      const demo = directedEulerianInput(undefined, exampleId)
      const { nodes, edges } = demo
      const incompatible = requireNodes(locale, nodes, edges, true)
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
    }

    const custom = graphFromInput(customGraph, { directed: isDirectedGraph(customGraph) })
    const { nodes, edges, directed } = custom
    const incompatible = requireNodes(locale, nodes, edges, directed)
    if (incompatible) return incompatible

    if (directed) {
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
    }

    const validation = validateUndirectedEulerian(nodes, edges, 'circuit')
    if (!validation.ok || validation.start == null) {
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        false,
        'An undirected Eulerian circuit needs connectivity and all even degrees.',
        'Un circuit eulerien non oriente exige la connexite et des degres tous pairs.',
      )
    }

    const steps = buildUndirectedEulerianSteps(locale, nodes, edges, validation.start, 'circuit')
    steps.unshift({
      graph: {
        ...steps[0].graph!,
        phase: d(locale, 'Check undirected circuit conditions', 'Verifier les conditions du circuit non oriente'),
      },
      description: d(
        locale,
        'Degree and connectivity conditions are satisfied, so an undirected Eulerian circuit exists.',
        'Les conditions de degre et de connexite sont satisfaites, donc un circuit eulerien non oriente existe.',
      ),
      variables: { start: validation.start },
    })
    return steps
  },
}
