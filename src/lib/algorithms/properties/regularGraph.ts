import type { Algorithm, Step } from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  degreeMap,
  graphFromInput,
  label,
  requireNodes,
  requireUndirectedCustom,
} from '@lib/algorithms/graphAlgorithmUtils'
import { getRegularDemo, regularExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'

export const regularGraph: Algorithm = {
  id: 'regular-graph',
  name: 'Regular Graph Check',
  category: 'Traversal / Properties',
  difficulty: 'easy',
  visualization: 'graph',
  code: `function isRegular(graph) {
  const degrees = graph.map((neighbors) => neighbors.length);
  return degrees.every((degree) => degree === degrees[0]);
}`,
  description: `Regular Graph Check

A graph is regular when every vertex has the same degree. This check computes the degree of each vertex and compares the result.

Time Complexity: O(V + E)
Space Complexity: O(V)`,
  examples: regularExampleOptions,
  generateSteps(locale = 'en', exampleId, customGraph) {
    const demo = customGraph
      ? graphFromInput(customGraph, { directed: false })
      : { ...getRegularDemo(exampleId), directed: false }
    const { nodes, edges } = demo
    const incompatible =
      requireNodes(locale, nodes, edges, false) ??
      requireUndirectedCustom(
        locale,
        customGraph,
        nodes,
        edges,
        'Regularity is implemented here for undirected graphs. Turn off Directed graph in the editor.',
        'Le test de regularite est implemente ici pour les graphes non orientes. Desactivez Graphe oriente dans l editeur.',
      )
    if (incompatible) return incompatible

    const degrees = degreeMap(nodes, edges)
    const values = Object.values(degrees)
    const first = values[0] ?? 0
    const regular = values.every((degree) => degree === first)

    return [
      {
        graph: baseGraph(nodes, edges, {
          labels: {
            degrees: Object.entries(degrees)
              .map(([id, degree]) => `${label(nodes, Number(id))}:${degree}`)
              .join(', '),
          },
          phase: d(locale, 'Compute degrees', 'Calculer les degres'),
        }),
        description: d(
          locale,
          `Degrees are ${Object.entries(degrees).map(([id, degree]) => `${label(nodes, Number(id))}=${degree}`).join(', ')}.`,
          `Les degres sont ${Object.entries(degrees).map(([id, degree]) => `${label(nodes, Number(id))}=${degree}`).join(', ')}.`,
        ),
        codeLine: 2,
        variables: { degrees: Object.values(degrees).join(', ') },
      },
      {
        graph: baseGraph(nodes, edges, {
          labels: { regular },
          phase: regular ? d(locale, 'Regular graph', 'Graphe regulier') : d(locale, 'Irregular graph', 'Graphe non regulier'),
        }),
        description: regular
          ? d(locale, 'Every vertex has the same degree, so the graph is regular.', 'Tous les sommets ont le meme degre, donc le graphe est regulier.')
          : d(locale, 'Not all vertices have the same degree, so the graph is not regular.', 'Tous les sommets n ont pas le meme degre, donc le graphe n est pas regulier.'),
        codeLine: 3,
        variables: { regular },
      },
    ]
  },
}