import type { Algorithm } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  graphFromInput,
  incompatibilityStep,
  isDirectedGraph,
  requireNodes,
} from '@lib/algorithms/graphAlgorithmUtils'
import { eulerianExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'
import {
  buildDirectedEulerianSteps,
  directedEulerianInput,
  validateDirectedEulerian,
} from '@lib/algorithms/traversal/eulerianDirectedUtils'
import {
  buildUndirectedEulerianSteps,
  validateUndirectedEulerian,
} from '@lib/algorithms/traversal/eulerianUndirectedUtils'

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

An Eulerian path uses every edge exactly once. Directed graphs use in/out degree conditions; undirected graphs require 0 or 2 odd-degree vertices.

Time Complexity: O(V + E)
Space Complexity: O(E)`,
  examples: eulerianExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    if (!customGraph) {
      const demo = directedEulerianInput(undefined, exampleId)
      const { nodes, edges } = demo
      const incompatible = requireNodes(locale, nodes, edges, true)
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

      const resultNote = validation.isCircuit
        ? d(
            locale,
            'Special case: this path is an Eulerian circuit.',
            'Cas particulier : ce chemin est un circuit eulerien.',
          )
        : undefined
      const steps = buildDirectedEulerianSteps(
        locale,
        nodes,
        edges,
        validation.start,
        'path',
        resultNote,
      )
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
    }

    const custom = graphFromInput(customGraph, { directed: isDirectedGraph(customGraph) })
    const { nodes, edges, directed } = custom
    const incompatible = requireNodes(locale, nodes, edges, directed)
    if (incompatible) return incompatible

    if (directed) {
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

      const resultNote = validation.isCircuit
        ? d(
            locale,
            'Special case: this path is an Eulerian circuit.',
            'Cas particulier : ce chemin est un circuit eulerien.',
          )
        : undefined
      const steps = buildDirectedEulerianSteps(
        locale,
        nodes,
        edges,
        validation.start,
        'path',
        resultNote,
      )
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
    }

    const validation = validateUndirectedEulerian(nodes, edges, 'path')
    if (!validation.ok || validation.start == null) {
      return incompatibilityStep(
        locale,
        nodes,
        edges,
        false,
        'An undirected Eulerian path needs connectivity and 0 or 2 odd-degree vertices.',
        'Un chemin eulerien non oriente exige la connexite et 0 ou 2 sommets de degre impair.',
      )
    }

    const resultNote = validation.isCircuit
      ? d(
          locale,
          'Special case: this path is an Eulerian circuit.',
          'Cas particulier : ce chemin est un circuit eulerien.',
        )
      : undefined
    const steps = buildUndirectedEulerianSteps(
      locale,
      nodes,
      edges,
      validation.start,
      'path',
      resultNote,
    )
    steps.unshift({
      graph: {
        ...steps[0].graph!,
        phase: d(locale, 'Check undirected path conditions', 'Verifier les conditions du chemin non oriente'),
      },
      description: d(
        locale,
        'Degree and connectivity conditions are satisfied, so an undirected Eulerian path exists.',
        'Les conditions de degre et de connexite sont satisfaites, donc un chemin eulerien non oriente existe.',
      ),
      variables: { start: validation.start },
    })
    return steps
  },
}
