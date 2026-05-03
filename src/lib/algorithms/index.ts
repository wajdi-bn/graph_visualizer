import type { Algorithm, Category } from '@lib/types'

import { dijkstra } from '@lib/algorithms/shortest-paths/dijkstra'
import { bellmanFord } from '@lib/algorithms/shortest-paths/bellmanFord'
import { bellman } from '@lib/algorithms/shortest-paths/bellman'
import { kruskal } from '@lib/algorithms/spanning-trees/kruskal'
import { prim } from '@lib/algorithms/spanning-trees/prim'
import { connectedComponents } from '@lib/algorithms/connectivity/connectedComponents'
import { kosaraju } from '@lib/algorithms/connectivity/kosaraju'
import { eulerianPath } from '@lib/algorithms/traversal/eulerianPath'
import { welshPowell } from '@lib/algorithms/coloring/welshPowell'
import { unionFind } from '@lib/algorithms/structures/unionFind'
import { fordFulkerson } from '@lib/algorithms/flows/fordFulkerson'

export const algorithms: Algorithm[] = [
  dijkstra,
  bellmanFord,
  bellman,
  kruskal,
  prim,
  connectedComponents,
  kosaraju,
  eulerianPath,
  welshPowell,
  fordFulkerson,
  unionFind,
]

export const categories: Category[] = [
  {
    name: 'Shortest Paths',
    algorithms: algorithms.filter((algorithm) => algorithm.category === 'Shortest Paths'),
  },
  {
    name: 'Spanning Trees',
    algorithms: algorithms.filter((algorithm) => algorithm.category === 'Spanning Trees'),
  },
  {
    name: 'Connectivity',
    algorithms: algorithms.filter((algorithm) => algorithm.category === 'Connectivity'),
  },
  {
    name: 'Traversal / Properties',
    algorithms: algorithms.filter((algorithm) => algorithm.category === 'Traversal / Properties'),
  },
  {
    name: 'Coloring',
    algorithms: algorithms.filter((algorithm) => algorithm.category === 'Coloring'),
  },
  {
    name: 'Flows',
    algorithms: algorithms.filter((algorithm) => algorithm.category === 'Flows'),
  },
  {
    name: 'Auxiliary Structures',
    algorithms: algorithms.filter((algorithm) => algorithm.category === 'Auxiliary Structures'),
  },
]
