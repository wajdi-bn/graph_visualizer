import type { Algorithm } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  incompatibilityStep,
  requireDirectedCustom,
  requireNodes,
} from '@lib/algorithms/graphAlgorithmUtils'
import { eulerianExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'
import {
  buildDirectedEulerianSteps,
  directedEulerianInput,
  validateDirectedEulerian,
} from '@lib/algorithms/traversal/eulerianDirectedUtils'

export const eulerianPath: Algorithm = {
  id: 'eulerian-path',
  name: 'Eulerian Path',
  category: 'Traversal / Properties',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function eulerianPath(graph, start) {
  const stack = [start];
  const path = [];

  while (stack.length > 0) {
    const u = stack[stack.length - 1];
    const edge = firstUnusedOutgoingEdge(u);
    if (edge) {
      markUsed(edge);
      stack.push(edge.to);
    } else {
      path.push(stack.pop());
    }
  }

  return path.reverse();
}`,
  description: `Eulerian Path

A directed Eulerian path uses every directed edge exactly once. It exists when the non-isolated vertices are connected and the in/out degree differences identify a valid start and end.

Time Complexity: O(V + E)
Space Complexity: O(E)`,
  examples: eulerianExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = directedEulerianInput(customGraph, exampleId)
    const { nodes, edges } = demo
    const directedIssue = requireDirectedCustom(
      locale,
      customGraph,
      nodes,
      edges,
      'Eulerian path is implemented for directed graphs. Turn on Directed graph in the editor.',
      'Le chemin eulerien est implemente pour les graphes orientes. Activez Graphe oriente dans l editeur.',
    )
    const incompatible = requireNodes(locale, nodes, edges, true) ?? directedIssue
    if (incompatible) return incompatible

    const validation = validateDirectedEulerian(nodes, edges, 'path')
    if (!validation.ok || validation.start == null) {
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        true,
        'A directed Eulerian path needs weak connectivity and either 0 or 2 degree-imbalance vertices.',
        'Un chemin eulerien oriente exige la connexite faible et 0 ou 2 sommets avec desequilibre de degre.',
      )
    }

    const steps = buildDirectedEulerianSteps(locale, nodes, edges, validation.start, 'path')
    steps.unshift({
      graph: {
        ...steps[0].graph!,
        phase: d(locale, 'Check directed path conditions', 'Verifier les conditions du chemin oriente'),
      },
      description: d(
        locale,
        'Degree and connectivity conditions are satisfied, so a directed Eulerian path exists.',
        'Les conditions de degre et de connexite sont satisfaites, donc un chemin eulerien oriente existe.',
      ),
      variables: { start: validation.start },
    })
    return steps
  },
}
