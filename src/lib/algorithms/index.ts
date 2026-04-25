import type { Algorithm, Category } from '@lib/types'

import {
  dijkstra,
  bellmanFord,
  bellman,
  kruskal,
  prim,
  connectedComponents,
  kosaraju,
  eulerianPath,
  welshPowell,
  unionFind,
} from '@lib/algorithms/graphs'

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
    name: 'Auxiliary Structures',
    algorithms: algorithms.filter((algorithm) => algorithm.category === 'Auxiliary Structures'),
  },
]
