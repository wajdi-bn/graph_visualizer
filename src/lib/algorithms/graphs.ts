import type {
  Algorithm,
  GraphEdge,
  GraphNode,
  GraphSetState,
  GraphState,
  GraphVisualState,
  Step,
} from '@lib/types'
import { d } from '@lib/algorithms/shared'

const palette = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22c55e']

const inf = 'inf'

const weightedNodes: GraphNode[] = [
  { id: 0, label: 'A', x: 90, y: 80 },
  { id: 1, label: 'B', x: 250, y: 45 },
  { id: 2, label: 'C', x: 410, y: 90 },
  { id: 3, label: 'D', x: 135, y: 235 },
  { id: 4, label: 'E', x: 300, y: 210 },
  { id: 5, label: 'F', x: 420, y: 285 },
]

const weightedEdges: GraphEdge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 3, weight: 2 },
  { from: 1, to: 2, weight: 6 },
  { from: 1, to: 3, weight: 1 },
  { from: 1, to: 4, weight: 5 },
  { from: 2, to: 4, weight: 2 },
  { from: 2, to: 5, weight: 3 },
  { from: 3, to: 4, weight: 8 },
  { from: 4, to: 5, weight: 4 },
]

const weightedExampleOptions = [
  { id: 'standard', label: { en: 'Standard weighted graph', fr: 'Graphe pondere standard' } },
  { id: 'dense', label: { en: 'Denser graph', fr: 'Graphe plus dense' } },
]

const negativeWeightedExampleOptions = [
  {
    id: 'negative-directed',
    label: { en: 'Graph with negative weights', fr: 'Graphe avec poids negatifs' },
  },
]

const stronglyConnectedExampleOptions = [
  { id: 'directed-scc', label: { en: 'Directed SCC graph', fr: 'Graphe oriente CFC' } },
]

const eulerianExampleOptions = [
  { id: 'eulerian-circuit', label: { en: 'Eulerian circuit', fr: 'Circuit eulerien' } },
]

const coloringExampleOptions = [
  { id: 'coloring-dense', label: { en: 'Coloring graph', fr: 'Graphe de coloration' } },
]

function getWeightedDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'dense') {
    return {
      nodes: [
        { id: 0, label: 'A', x: 70, y: 170 },
        { id: 1, label: 'B', x: 170, y: 70 },
        { id: 2, label: 'C', x: 315, y: 65 },
        { id: 3, label: 'D', x: 425, y: 165 },
        { id: 4, label: 'E', x: 185, y: 270 },
        { id: 5, label: 'F', x: 335, y: 275 },
      ],
      edges: [
        { from: 0, to: 1, weight: 2 },
        { from: 0, to: 4, weight: 6 },
        { from: 1, to: 2, weight: 3 },
        { from: 1, to: 4, weight: 4 },
        { from: 1, to: 5, weight: 7 },
        { from: 2, to: 3, weight: 5 },
        { from: 2, to: 5, weight: 1 },
        { from: 3, to: 5, weight: 2 },
        { from: 4, to: 5, weight: 3 },
      ],
    }
  }

  return { nodes: weightedNodes, edges: weightedEdges }
}

function label(nodes: GraphNode[], id: number) {
  return nodes.find((node) => node.id === id)?.label ?? String(id)
}

function edgeKey(from: number, to: number, directed = false) {
  return directed || from <= to ? `${from}-${to}` : `${to}-${from}`
}

function adjacency(edges: GraphEdge[], directed = false) {
  const adj: Record<number, { node: number; weight: number }[]> = {}
  for (const edge of edges) {
    adj[edge.from] ??= []
    adj[edge.to] ??= []
    adj[edge.from].push({ node: edge.to, weight: edge.weight ?? 1 })
    if (!directed && !edge.directed) adj[edge.to].push({ node: edge.from, weight: edge.weight ?? 1 })
  }
  return adj
}

function baseGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  extra: Partial<GraphState> = {},
): GraphState {
  return {
    nodes,
    edges,
    directed: edges.some((edge) => edge.directed) || extra.directed,
    visitedNodes: [],
    currentNode: null,
    visitedEdges: [],
    currentEdge: null,
    ...extra,
  }
}

function formatDistances(nodes: GraphNode[], distances: Record<number, number | string>) {
  return nodes.map((node) => `${node.label}:${distances[node.id]}`).join(', ')
}

function formatPredecessors(nodes: GraphNode[], predecessors: Record<number, number | string | null>) {
  return nodes
    .map((node) => {
      const pred = predecessors[node.id]
      return `${node.label}:${pred == null ? '-' : typeof pred === 'number' ? label(nodes, pred) : pred}`
    })
    .join(', ')
}

function cloneRecord<T>(record: Record<number, T>) {
  return { ...record }
}

function cloneEdgeStates(record: Record<string, GraphVisualState>) {
  return { ...record }
}

function setsFromParent(nodes: GraphNode[], parent: Record<number, number>) {
  const groups = new Map<number, number[]>()
  const find = (x: number): number => (parent[x] === x ? x : find(parent[x]))
  for (const node of nodes) {
    const root = find(node.id)
    groups.set(root, [...(groups.get(root) ?? []), node.id])
  }

  return [...groups.entries()].map(([root, members], index) => ({
    label: label(nodes, root),
    members,
    color: palette[index % palette.length],
  }))
}

const dijkstra: Algorithm = {
  id: 'dijkstra',
  name: 'Dijkstra',
  category: 'Shortest Paths',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function dijkstra(graph, source) {
  const dist = Array(graph.length).fill(Infinity);
  const parent = Array(graph.length).fill(null);
  const visited = new Set();
  dist[source] = 0;

  while (visited.size < graph.length) {
    const u = minUnvisitedVertex(dist, visited);
    visited.add(u);

    for (const edge of graph[u]) {
      const next = dist[u] + edge.weight;
      if (!visited.has(edge.to) && next < dist[edge.to]) {
        dist[edge.to] = next;
        parent[edge.to] = u;
      }
    }
  }

  return { dist, parent };
}`,
  description: `Dijkstra

Dijkstra finds shortest paths from one source in a weighted graph with non-negative edge weights.

Time Complexity: O((V + E) log V)
Space Complexity: O(V)`,
  examples: weightedExampleOptions,
  generateSteps(locale = 'en', exampleId) {
    const { nodes, edges } = getWeightedDemo(exampleId)
    const adj = adjacency(edges)
    const distances: Record<number, number | string> = {}
    const predecessors: Record<number, number | null> = {}
    const visited = new Set<number>()
    const visitedNodes: number[] = []
    const selectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    for (const node of nodes) {
      distances[node.id] = node.id === 0 ? 0 : inf
      predecessors[node.id] = null
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        currentNode: 0,
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Initialize distances from A', 'Initialiser les distances depuis A'),
      }),
      description: d(
        locale,
        'Start at A. Its distance is 0; every other vertex is unknown.',
        'On commence en A. Sa distance vaut 0; toutes les autres sont inconnues.',
      ),
      codeLine: 5,
      variables: { source: 'A', distances: formatDistances(nodes, distances) },
    })

    while (visited.size < nodes.length) {
      let current = -1
      let best = Infinity
      for (const node of nodes) {
        const value = distances[node.id]
        if (!visited.has(node.id) && typeof value === 'number' && value < best) {
          current = node.id
          best = value
        }
      }
      if (current === -1) break

      visited.add(current)
      visitedNodes.push(current)
      if (predecessors[current] != null) selectedEdges.push([predecessors[current]!, current])

      steps.push({
        graph: baseGraph(nodes, edges, {
          visitedNodes: [...visitedNodes],
          currentNode: current,
          currentEdge: null,
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          distances: cloneRecord(distances),
          predecessors: cloneRecord(predecessors),
          phase: d(locale, 'Choose smallest unvisited distance', 'Choisir la plus petite distance non visitee'),
        }),
        description: d(
          locale,
          `Select ${label(nodes, current)} because it has the smallest tentative distance (${best}).`,
          `On selectionne ${label(nodes, current)} car il a la plus petite distance temporaire (${best}).`,
        ),
        codeLine: 8,
        variables: { vertex: label(nodes, current), distance: best },
      })

      for (const { node: neighbor, weight } of adj[current]) {
        if (visited.has(neighbor)) continue
        const oldDistance = distances[neighbor]
        const nextDistance = (distances[current] as number) + weight
        const key = edgeKey(current, neighbor)
        const improved = oldDistance === inf || nextDistance < (oldDistance as number)
        edgeStates[key] = improved ? 'relaxed' : 'candidate'

        if (improved) {
          distances[neighbor] = nextDistance
          predecessors[neighbor] = current
        }

        steps.push({
          graph: baseGraph(nodes, edges, {
            visitedNodes: [...visitedNodes],
            currentNode: current,
            currentEdge: [current, neighbor],
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, 'Relax outgoing edges', 'Relacher les aretes sortantes'),
          }),
          description: improved
            ? d(
                locale,
                `Relax ${label(nodes, current)}-${label(nodes, neighbor)}: ${oldDistance} becomes ${nextDistance}.`,
                `Relachement ${label(nodes, current)}-${label(nodes, neighbor)} : ${oldDistance} devient ${nextDistance}.`,
              )
            : d(
                locale,
                `${label(nodes, current)}-${label(nodes, neighbor)} gives ${nextDistance}, so ${label(nodes, neighbor)} stays ${oldDistance}.`,
                `${label(nodes, current)}-${label(nodes, neighbor)} donne ${nextDistance}, donc ${label(nodes, neighbor)} reste a ${oldDistance}.`,
              ),
          codeLine: 13,
          variables: {
            edge: `${label(nodes, current)}-${label(nodes, neighbor)}`,
            candidate: nextDistance,
            distances: formatDistances(nodes, distances),
          },
        })
      }
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        visitedNodes: [...visitedNodes],
        currentNode: null,
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Shortest-path tree complete', 'Arbre des plus courts chemins termine'),
      }),
      description: d(
        locale,
        `Dijkstra is complete. Distances: ${formatDistances(nodes, distances)}.`,
        `Dijkstra est termine. Distances : ${formatDistances(nodes, distances)}.`,
      ),
      codeLine: 20,
      variables: { distances: formatDistances(nodes, distances) },
    })

    return steps
  },
}

const bellmanFord: Algorithm = {
  id: 'bellman-ford',
  name: 'Bellman-Ford',
  category: 'Shortest Paths',
  difficulty: 'advanced',
  visualization: 'graph',
  code: `function bellmanFord(edges, vertexCount, source) {
  const dist = Array(vertexCount).fill(Infinity);
  const parent = Array(vertexCount).fill(null);
  dist[source] = 0;

  for (let pass = 1; pass < vertexCount; pass++) {
    for (const { from, to, weight } of edges) {
      if (dist[from] + weight < dist[to]) {
        dist[to] = dist[from] + weight;
        parent[to] = from;
      }
    }
  }

  return { dist, parent };
}`,
  description: `Bellman-Ford

Bellman-Ford finds shortest paths from a source even when directed edges have negative weights, as long as there is no negative cycle reachable from the source.

Time Complexity: O(VE)
Space Complexity: O(V)`,
  examples: negativeWeightedExampleOptions,
  generateSteps(locale = 'en') {
    const nodes: GraphNode[] = [
      { id: 0, label: 'S', x: 70, y: 165 },
      { id: 1, label: 'A', x: 210, y: 65 },
      { id: 2, label: 'B', x: 210, y: 265 },
      { id: 3, label: 'C', x: 370, y: 80 },
      { id: 4, label: 'D', x: 390, y: 250 },
    ]
    const edges: GraphEdge[] = [
      { from: 0, to: 1, weight: 6, directed: true },
      { from: 0, to: 2, weight: 7, directed: true },
      { from: 1, to: 2, weight: 8, directed: true },
      { from: 1, to: 3, weight: 5, directed: true },
      { from: 1, to: 4, weight: -4, directed: true },
      { from: 2, to: 3, weight: -3, directed: true },
      { from: 2, to: 4, weight: 9, directed: true },
      { from: 3, to: 1, weight: -2, directed: true },
      { from: 4, to: 3, weight: 7, directed: true },
    ]
    const distances: Record<number, number | string> = {}
    const predecessors: Record<number, number | null> = {}
    const selectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    for (const node of nodes) {
      distances[node.id] = node.id === 0 ? 0 : inf
      predecessors[node.id] = null
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed: true,
        currentNode: 0,
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Initialization', 'Initialisation'),
      }),
      description: d(
        locale,
        'Initialize Bellman-Ford from source S.',
        'Initialiser Bellman-Ford depuis la source S.',
      ),
      codeLine: 4,
      variables: { source: 'S', distances: formatDistances(nodes, distances) },
    })

    for (let pass = 1; pass < nodes.length; pass++) {
      let changed = false
      for (const edge of edges) {
        const fromDistance = distances[edge.from]
        const candidate = fromDistance === inf ? inf : (fromDistance as number) + (edge.weight ?? 1)
        const oldDistance = distances[edge.to]
        const improved = candidate !== inf && (oldDistance === inf || (candidate as number) < (oldDistance as number))
        edgeStates[edgeKey(edge.from, edge.to, true)] = improved ? 'relaxed' : 'candidate'

        if (improved) {
          distances[edge.to] = candidate
          predecessors[edge.to] = edge.from
          changed = true
        }

        const selected = Object.entries(predecessors)
          .filter(([, pred]) => pred != null)
          .map(([to, pred]) => [pred as number, Number(to)] as [number, number])
        selectedEdges.splice(0, selectedEdges.length, ...selected)

        steps.push({
          graph: baseGraph(nodes, edges, {
            directed: true,
            currentNode: edge.from,
            currentEdge: [edge.from, edge.to],
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            edgeStates: cloneEdgeStates(edgeStates),
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, `Pass ${pass}`, `Passage ${pass}`),
          }),
          description: improved
            ? d(
                locale,
                `Pass ${pass}: ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} improves ${oldDistance} to ${candidate}.`,
                `Passage ${pass} : ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} ameliore ${oldDistance} en ${candidate}.`,
              )
            : d(
                locale,
                `Pass ${pass}: ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} gives ${candidate}; no update.`,
                `Passage ${pass} : ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} donne ${candidate}; pas de mise a jour.`,
              ),
          codeLine: 8,
          variables: {
            pass,
            edge: `${label(nodes, edge.from)}->${label(nodes, edge.to)}`,
            candidate: String(candidate),
            distances: formatDistances(nodes, distances),
          },
        })
      }

      if (!changed) {
        steps.push({
          graph: baseGraph(nodes, edges, {
            directed: true,
            currentNode: null,
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, 'No updates', 'Aucune mise a jour'),
          }),
          description: d(
            locale,
            'No edge relaxed during this pass, so the distances are already stable.',
            'Aucune arete relachee pendant ce passage; les distances sont stables.',
          ),
          codeLine: 14,
          variables: { pass, distances: formatDistances(nodes, distances) },
        })
        break
      }
    }

    return steps
  },
}

const bellman: Algorithm = {
  id: 'bellman',
  name: 'Bellman',
  category: 'Shortest Paths',
  difficulty: 'advanced',
  visualization: 'graph',
  code: `function bellman(edges, vertexCount, source) {
  let previous = Array(vertexCount).fill(Infinity);
  previous[source] = 0;

  for (let k = 1; k < vertexCount; k++) {
    const current = previous.slice();
    for (const { from, to, weight } of edges) {
      current[to] = Math.min(current[to], previous[from] + weight);
    }
    previous = current;
  }

  return previous;
}`,
  description: `Bellman

Bellman's dynamic-programming shortest-path recurrence computes the best distance using at most k edges, then increases k until every simple shortest path is covered.

Time Complexity: O(VE)
Space Complexity: O(V)`,
  examples: negativeWeightedExampleOptions,
  generateSteps(locale = 'en') {
    const nodes: GraphNode[] = [
      { id: 0, label: 'S', x: 55, y: 170 },
      { id: 1, label: 'A', x: 170, y: 80 },
      { id: 2, label: 'B', x: 185, y: 260 },
      { id: 3, label: 'C', x: 330, y: 165 },
      { id: 4, label: 'T', x: 455, y: 170 },
    ]
    const edges: GraphEdge[] = [
      { from: 0, to: 1, weight: 3, directed: true },
      { from: 0, to: 2, weight: 8, directed: true },
      { from: 1, to: 2, weight: 2, directed: true },
      { from: 1, to: 3, weight: 5, directed: true },
      { from: 1, to: 4, weight: 10, directed: true },
      { from: 2, to: 3, weight: -4, directed: true },
      { from: 2, to: 4, weight: 12, directed: true },
      { from: 3, to: 4, weight: 6, directed: true },
    ]
    let previous: Record<number, number | string> = {}
    const predecessors: Record<number, number | null> = {}
    const steps: Step[] = []

    for (const node of nodes) {
      previous[node.id] = node.id === 0 ? 0 : inf
      predecessors[node.id] = null
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed: true,
        currentNode: 0,
        distances: cloneRecord(previous),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'k = 0 edges', 'k = 0 arete'),
      }),
      description: d(
        locale,
        'With at most 0 edges, only the source S has distance 0.',
        'Avec au plus 0 arete, seule la source S a une distance de 0.',
      ),
      codeLine: 3,
      variables: { k: 0, distances: formatDistances(nodes, previous) },
    })

    for (let k = 1; k < nodes.length; k++) {
      const current = { ...previous }
      let changed = false

      for (const edge of edges) {
        const fromValue = previous[edge.from]
        const candidate = fromValue === inf ? inf : (fromValue as number) + (edge.weight ?? 1)
        const oldValue = current[edge.to]
        const improved = candidate !== inf && (oldValue === inf || (candidate as number) < (oldValue as number))

        if (improved) {
          current[edge.to] = candidate
          predecessors[edge.to] = edge.from
          changed = true
        }

        steps.push({
          graph: baseGraph(nodes, edges, {
            directed: true,
            currentNode: edge.from,
            currentEdge: [edge.from, edge.to],
            visitedEdges: Object.entries(predecessors)
              .filter(([, pred]) => pred != null)
              .map(([to, pred]) => [pred as number, Number(to)] as [number, number]),
            selectedEdges: Object.entries(predecessors)
              .filter(([, pred]) => pred != null)
              .map(([to, pred]) => [pred as number, Number(to)] as [number, number]),
            edgeStates: {
              [edgeKey(edge.from, edge.to, true)]: improved ? 'relaxed' : 'candidate',
            },
            distances: cloneRecord(current),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, `k = ${k} edges`, `k = ${k} aretes`),
          }),
          description: improved
            ? d(
                locale,
                `Using at most ${k} edges, ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} improves ${label(nodes, edge.to)} to ${candidate}.`,
                `Avec au plus ${k} aretes, ${label(nodes, edge.from)} -> ${label(nodes, edge.to)} ameliore ${label(nodes, edge.to)} a ${candidate}.`,
              )
            : d(
                locale,
                `${label(nodes, edge.from)} -> ${label(nodes, edge.to)} does not improve the k=${k} row.`,
                `${label(nodes, edge.from)} -> ${label(nodes, edge.to)} n'ameliore pas la ligne k=${k}.`,
              ),
          codeLine: 8,
          variables: { k, candidate: String(candidate), distances: formatDistances(nodes, current) },
        })
      }

      previous = current
      if (!changed) break
    }

    return steps
  },
}

const kruskal: Algorithm = {
  id: 'kruskal',
  name: 'Kruskal',
  category: 'Spanning Trees',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function kruskal(vertices, edges) {
  const uf = new UnionFind(vertices);
  const mst = [];

  edges.sort((a, b) => a.weight - b.weight);
  for (const edge of edges) {
    if (uf.find(edge.from) !== uf.find(edge.to)) {
      uf.union(edge.from, edge.to);
      mst.push(edge);
    }
  }

  return mst;
}`,
  description: `Kruskal

Kruskal builds a minimum spanning tree by scanning edges from lightest to heaviest and accepting only edges that connect two different components.

Time Complexity: O(E log E)
Space Complexity: O(V)`,
  examples: weightedExampleOptions,
  generateSteps(locale = 'en', exampleId) {
    const demo = getWeightedDemo(exampleId)
    const nodes = demo.nodes
    const edges = [...demo.edges].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
    const parent: Record<number, number> = {}
    const rank: Record<number, number> = {}
    const selectedEdges: [number, number][] = []
    const rejectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    const find = (x: number): number => {
      if (parent[x] !== x) parent[x] = find(parent[x])
      return parent[x]
    }
    const union = (a: number, b: number) => {
      const rootA = find(a)
      const rootB = find(b)
      if (rootA === rootB) return false
      if (rank[rootA] < rank[rootB]) parent[rootA] = rootB
      else if (rank[rootA] > rank[rootB]) parent[rootB] = rootA
      else {
        parent[rootB] = rootA
        rank[rootA]++
      }
      return true
    }

    for (const node of nodes) {
      parent[node.id] = node.id
      rank[node.id] = 0
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        sets: setsFromParent(nodes, parent),
        phase: d(locale, 'Sort edges by weight', 'Trier les aretes par poids'),
      }),
      description: d(
        locale,
        'Start with each vertex in its own component, then inspect edges in increasing weight order.',
        'Chaque sommet commence dans son propre composant, puis on inspecte les aretes par poids croissant.',
      ),
      codeLine: 5,
      variables: { sortedWeights: edges.map((edge) => edge.weight).join(', ') },
    })

    for (const edge of edges) {
      const accepted = find(edge.from) !== find(edge.to)
      if (accepted) {
        union(edge.from, edge.to)
        selectedEdges.push([edge.from, edge.to])
        edgeStates[edgeKey(edge.from, edge.to)] = 'selected'
      } else {
        rejectedEdges.push([edge.from, edge.to])
        edgeStates[edgeKey(edge.from, edge.to)] = 'rejected'
      }

      steps.push({
        graph: baseGraph(nodes, edges, {
          currentEdge: [edge.from, edge.to],
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          rejectedEdges: [...rejectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          sets: setsFromParent(nodes, parent),
          phase: d(locale, 'Cycle test with Union-Find', 'Test de cycle avec Union-Find'),
        }),
        description: accepted
          ? d(
              locale,
              `Accept ${label(nodes, edge.from)}-${label(nodes, edge.to)} (weight ${edge.weight}); it connects two components.`,
              `Accepter ${label(nodes, edge.from)}-${label(nodes, edge.to)} (poids ${edge.weight}) ; elle relie deux composants.`,
            )
          : d(
              locale,
              `Reject ${label(nodes, edge.from)}-${label(nodes, edge.to)} because both endpoints are already connected.`,
              `Rejeter ${label(nodes, edge.from)}-${label(nodes, edge.to)} car les deux extremites sont deja connectees.`,
            ),
        codeLine: accepted ? 8 : 7,
        variables: { edge: `${label(nodes, edge.from)}-${label(nodes, edge.to)}`, accepted },
      })
    }

    return steps
  },
}

const prim: Algorithm = {
  id: 'prim',
  name: 'Prim',
  category: 'Spanning Trees',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function prim(graph, start) {
  const inTree = new Set();
  const key = Array(graph.length).fill(Infinity);
  const parent = Array(graph.length).fill(null);
  key[start] = 0;

  while (inTree.size < graph.length) {
    const u = minOutsideTree(key, inTree);
    inTree.add(u);
    for (const edge of graph[u]) {
      if (!inTree.has(edge.to) && edge.weight < key[edge.to]) {
        key[edge.to] = edge.weight;
        parent[edge.to] = u;
      }
    }
  }

  return parent;
}`,
  description: `Prim

Prim grows a minimum spanning tree from one start vertex, always adding the cheapest edge that leaves the current tree.

Time Complexity: O(E log V)
Space Complexity: O(V)`,
  examples: weightedExampleOptions,
  generateSteps(locale = 'en', exampleId) {
    const { nodes, edges } = getWeightedDemo(exampleId)
    const adj = adjacency(edges)
    const inTree = new Set<number>()
    const key: Record<number, number | string> = {}
    const parent: Record<number, number | null> = {}
    const selectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    for (const node of nodes) {
      key[node.id] = node.id === 0 ? 0 : inf
      parent[node.id] = null
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        currentNode: 0,
        distances: cloneRecord(key),
        predecessors: cloneRecord(parent),
        phase: d(locale, 'Start the tree at A', 'Demarrer l arbre en A'),
      }),
      description: d(
        locale,
        'Start Prim from A. Key values store the cheapest known edge into the tree.',
        'On demarre Prim depuis A. Les cles stockent la moins chere arete connue vers l arbre.',
      ),
      codeLine: 5,
      variables: { start: 'A', keys: formatDistances(nodes, key) },
    })

    while (inTree.size < nodes.length) {
      let current = -1
      let best = Infinity
      for (const node of nodes) {
        const value = key[node.id]
        if (!inTree.has(node.id) && typeof value === 'number' && value < best) {
          current = node.id
          best = value
        }
      }
      if (current === -1) break

      inTree.add(current)
      if (parent[current] != null) {
        selectedEdges.push([parent[current]!, current])
        edgeStates[edgeKey(parent[current]!, current)] = 'selected'
      }

      steps.push({
        graph: baseGraph(nodes, edges, {
          visitedNodes: [...inTree],
          currentNode: current,
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          currentEdge: parent[current] == null ? null : [parent[current]!, current],
          edgeStates: cloneEdgeStates(edgeStates),
          distances: cloneRecord(key),
          predecessors: cloneRecord(parent),
          phase: d(locale, 'Add cheapest outside vertex', 'Ajouter le sommet externe le moins cher'),
        }),
        description:
          parent[current] == null
            ? d(locale, 'A is the first vertex in the tree.', 'A est le premier sommet dans l arbre.')
            : d(
                locale,
                `Add ${label(nodes, current)} through ${label(nodes, parent[current]!)}-${label(nodes, current)} (weight ${key[current]}).`,
                `Ajouter ${label(nodes, current)} via ${label(nodes, parent[current]!)}-${label(nodes, current)} (poids ${key[current]}).`,
              ),
        codeLine: 9,
        variables: { vertex: label(nodes, current), key: key[current] },
      })

      for (const { node: neighbor, weight } of adj[current]) {
        if (inTree.has(neighbor)) continue
        if (key[neighbor] === inf || weight < (key[neighbor] as number)) {
          key[neighbor] = weight
          parent[neighbor] = current
          edgeStates[edgeKey(current, neighbor)] = 'relaxed'

          steps.push({
            graph: baseGraph(nodes, edges, {
              visitedNodes: [...inTree],
              currentNode: current,
              currentEdge: [current, neighbor],
              visitedEdges: [...selectedEdges],
              selectedEdges: [...selectedEdges],
              edgeStates: cloneEdgeStates(edgeStates),
              distances: cloneRecord(key),
              predecessors: cloneRecord(parent),
              phase: d(locale, 'Update frontier keys', 'Mettre a jour les cles de frontiere'),
            }),
            description: d(
              locale,
              `Update ${label(nodes, neighbor)}: cheapest connection is now from ${label(nodes, current)} with weight ${weight}.`,
              `Mettre a jour ${label(nodes, neighbor)} : la connexion la moins chere vient de ${label(nodes, current)} avec le poids ${weight}.`,
            ),
            codeLine: 12,
            variables: { vertex: label(nodes, neighbor), key: weight, keys: formatDistances(nodes, key) },
          })
        }
      }
    }

    return steps
  },
}

const componentExampleOptions = [
  { id: 'three-components', label: { en: 'Three components', fr: 'Trois composantes' } },
  { id: 'isolated-pairs', label: { en: 'Isolated vertex and pairs', fr: 'Sommet isole et paires' } },
]

function getComponentDemo(exampleId?: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (exampleId === 'isolated-pairs') {
    return {
      nodes: [
        { id: 0, label: 'A', x: 90, y: 90 },
        { id: 1, label: 'B', x: 205, y: 90 },
        { id: 2, label: 'C', x: 350, y: 80 },
        { id: 3, label: 'D', x: 445, y: 165 },
        { id: 4, label: 'E', x: 120, y: 260 },
        { id: 5, label: 'F', x: 285, y: 270 },
        { id: 6, label: 'G', x: 430, y: 275 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 2, to: 3 },
        { from: 5, to: 6 },
      ],
    }
  }

  return {
    nodes: [
      { id: 0, label: 'A', x: 90, y: 80 },
      { id: 1, label: 'B', x: 210, y: 70 },
      { id: 2, label: 'C', x: 150, y: 185 },
      { id: 3, label: 'D', x: 330, y: 85 },
      { id: 4, label: 'E', x: 430, y: 160 },
      { id: 5, label: 'F', x: 315, y: 245 },
      { id: 6, label: 'G', x: 105, y: 295 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 0, to: 2 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ],
  }
}

const connectedComponents: Algorithm = {
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
  generateSteps(locale = 'en', exampleId) {
    const { nodes, edges } = getComponentDemo(exampleId)
    const adj = adjacency(edges)
    const visited = new Set<number>()
    const visitedNodes: number[] = []
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
          }
        }

        steps.push({
          graph: baseGraph(nodes, edges, {
            visitedNodes: [...visitedNodes],
            currentNode: current,
            stack: [...stack],
            nodeColors: cloneRecord(nodeColors),
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

    return steps
  },
}

const kosaraju: Algorithm = {
  id: 'kosaraju',
  name: 'Kosaraju',
  category: 'Connectivity',
  difficulty: 'advanced',
  visualization: 'graph',
  code: `function kosaraju(graph) {
  const visited = new Set();
  const order = [];

  for (const vertex of graph.vertices) {
    if (!visited.has(vertex)) dfs1(vertex, visited, order);
  }

  const reversed = reverseEdges(graph);
  visited.clear();
  const components = [];

  while (order.length > 0) {
    const vertex = order.pop();
    if (!visited.has(vertex)) {
      const component = [];
      dfs2(reversed, vertex, visited, component);
      components.push(component);
    }
  }

  return components;
}`,
  description: `Kosaraju

Kosaraju finds strongly connected components in a directed graph with two DFS passes: one for finishing order, and one on the reversed graph.

Time Complexity: O(V + E)
Space Complexity: O(V)`,
  examples: stronglyConnectedExampleOptions,
  generateSteps(locale = 'en') {
    const nodes: GraphNode[] = [
      { id: 0, label: 'A', x: 95, y: 85 },
      { id: 1, label: 'B', x: 235, y: 65 },
      { id: 2, label: 'C', x: 175, y: 205 },
      { id: 3, label: 'D', x: 340, y: 130 },
      { id: 4, label: 'E', x: 435, y: 245 },
      { id: 5, label: 'F', x: 280, y: 280 },
    ]
    const edges: GraphEdge[] = [
      { from: 0, to: 1, directed: true },
      { from: 1, to: 2, directed: true },
      { from: 2, to: 0, directed: true },
      { from: 1, to: 3, directed: true },
      { from: 3, to: 4, directed: true },
      { from: 4, to: 5, directed: true },
      { from: 5, to: 3, directed: true },
    ]
    const reversedEdges = edges.map((edge) => ({ from: edge.to, to: edge.from, directed: true }))
    const adj = adjacency(edges, true)
    const revAdj = adjacency(reversedEdges, true)
    const visited = new Set<number>()
    const order: number[] = []
    const nodeColors: Record<number, string> = {}
    const steps: Step[] = []

    const dfs1 = (node: number) => {
      visited.add(node)
      steps.push({
        graph: baseGraph(nodes, edges, {
          directed: true,
          visitedNodes: [...visited],
          currentNode: node,
          order: [...order],
          phase: d(locale, 'First DFS: finishing order', 'Premier DFS : ordre de fin'),
        }),
        description: d(
          locale,
          `First pass visits ${label(nodes, node)}.`,
          `Le premier passage visite ${label(nodes, node)}.`,
        ),
        codeLine: 6,
        variables: { vertex: label(nodes, node), order: order.map((id) => label(nodes, id)).join(', ') },
      })

      for (const { node: neighbor } of adj[node] ?? []) {
        if (!visited.has(neighbor)) dfs1(neighbor)
      }

      order.push(node)
      steps.push({
        graph: baseGraph(nodes, edges, {
          directed: true,
          visitedNodes: [...visited],
          currentNode: node,
          order: [...order],
          phase: d(locale, 'Push after DFS finish', 'Empiler apres la fin du DFS'),
        }),
        description: d(
          locale,
          `${label(nodes, node)} is finished; push it to the order stack.`,
          `${label(nodes, node)} est termine; on l'empile dans l ordre.`,
        ),
        codeLine: 6,
        variables: { pushed: label(nodes, node), order: order.map((id) => label(nodes, id)).join(', ') },
      })
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) dfs1(node.id)
    }

    visited.clear()
    const secondOrder = [...order].reverse()
    const components: number[][] = []

    for (const start of secondOrder) {
      if (visited.has(start)) continue
      const color = palette[components.length % palette.length]
      const stack = [start]
      const component: number[] = []
      visited.add(start)
      nodeColors[start] = color

      while (stack.length > 0) {
        const current = stack.pop()!
        component.push(current)
        for (const { node: neighbor } of revAdj[current] ?? []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            stack.push(neighbor)
            nodeColors[neighbor] = color
          }
        }

        steps.push({
          graph: baseGraph(nodes, reversedEdges, {
            directed: true,
            visitedNodes: [...visited],
            currentNode: current,
            nodeColors: cloneRecord(nodeColors),
            stack: [...stack],
            order: [...secondOrder],
            phase: d(locale, 'Second DFS on reversed graph', 'Second DFS sur le graphe inverse'),
          }),
          description: d(
            locale,
            `On the reversed graph, ${label(nodes, current)} joins SCC ${components.length + 1}.`,
            `Sur le graphe inverse, ${label(nodes, current)} rejoint la CFC ${components.length + 1}.`,
          ),
          codeLine: 16,
          variables: { component: component.map((id) => label(nodes, id)).join(', ') },
        })
      }
      components.push(component)
    }

    return steps
  },
}

const eulerianPath: Algorithm = {
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
    const edge = firstUnusedEdge(u);
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

An Eulerian path uses every edge exactly once. This visualization uses Hierholzer's algorithm on a graph where every vertex has even degree, so the result is an Eulerian circuit.

Time Complexity: O(V + E)
Space Complexity: O(E)`,
  examples: eulerianExampleOptions,
  generateSteps(locale = 'en') {
    const nodes: GraphNode[] = [
      { id: 0, label: 'A', x: 95, y: 90 },
      { id: 1, label: 'B', x: 250, y: 55 },
      { id: 2, label: 'C', x: 190, y: 190 },
      { id: 3, label: 'D', x: 335, y: 180 },
      { id: 4, label: 'E', x: 420, y: 285 },
      { id: 5, label: 'F', x: 260, y: 300 },
    ]
    const edges: GraphEdge[] = [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 0 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 2 },
    ]
    const used = new Set<string>()
    const stack = [0]
    const path: number[] = []
    const visitedEdges: [number, number][] = []
    const steps: Step[] = []

    const incident = (node: number) =>
      edges.find((edge) => !used.has(edgeKey(edge.from, edge.to)) && (edge.from === node || edge.to === node))

    steps.push({
      graph: baseGraph(nodes, edges, {
        currentNode: 0,
        stack: [...stack],
        order: [...path],
        phase: d(locale, 'All degrees are even', 'Tous les degres sont pairs'),
      }),
      description: d(
        locale,
        'Every vertex has even degree, so an Eulerian circuit exists. Start at A.',
        'Chaque sommet a un degre pair, donc un circuit eulerien existe. On commence en A.',
      ),
      codeLine: 2,
      variables: { start: 'A' },
    })

    while (stack.length > 0) {
      const current = stack[stack.length - 1]
      const edge = incident(current)
      if (edge) {
        used.add(edgeKey(edge.from, edge.to))
        const next = edge.from === current ? edge.to : edge.from
        stack.push(next)
        visitedEdges.push([edge.from, edge.to])
        steps.push({
          graph: baseGraph(nodes, edges, {
            visitedEdges: [...visitedEdges],
            selectedEdges: [...visitedEdges],
            currentNode: next,
            currentEdge: [edge.from, edge.to],
            stack: [...stack],
            order: [...path],
            phase: d(locale, 'Walk through unused edges', 'Parcourir les aretes non utilisees'),
          }),
          description: d(
            locale,
            `Use edge ${label(nodes, edge.from)}-${label(nodes, edge.to)} and move to ${label(nodes, next)}.`,
            `Utiliser l arete ${label(nodes, edge.from)}-${label(nodes, edge.to)} et aller vers ${label(nodes, next)}.`,
          ),
          codeLine: 8,
          variables: { stack: stack.map((id) => label(nodes, id)).join(' -> ') },
        })
      } else {
        const done = stack.pop()!
        path.push(done)
        steps.push({
          graph: baseGraph(nodes, edges, {
            visitedEdges: [...visitedEdges],
            selectedEdges: [...visitedEdges],
            currentNode: done,
            stack: [...stack],
            order: [...path],
            phase: d(locale, 'Backtrack into final circuit', 'Retour arriere vers le circuit final'),
          }),
          description: d(
            locale,
            `${label(nodes, done)} has no unused edge left; add it to the circuit.`,
            `${label(nodes, done)} n a plus d arete inutilisee; on l ajoute au circuit.`,
          ),
          codeLine: 12,
          variables: { circuit: [...path].reverse().map((id) => label(nodes, id)).join(' -> ') },
        })
      }
    }

    return steps
  },
}

const welshPowell: Algorithm = {
  id: 'welsh-powell',
  name: 'Welsh-Powell',
  category: 'Coloring',
  difficulty: 'intermediate',
  visualization: 'graph',
  code: `function welshPowell(graph) {
  const order = verticesByDescendingDegree(graph);
  const color = {};
  let colorId = 0;

  for (const vertex of order) {
    if (color[vertex]) continue;
    color[vertex] = colorId;
    for (const candidate of order) {
      if (!color[candidate] && isSafe(candidate, colorId, graph, color)) {
        color[candidate] = colorId;
      }
    }
    colorId++;
  }

  return color;
}`,
  description: `Welsh-Powell

Welsh-Powell greedily colors vertices in decreasing degree order, assigning the same color to as many non-adjacent vertices as possible.

Time Complexity: O(V^2)
Space Complexity: O(V)`,
  examples: coloringExampleOptions,
  generateSteps(locale = 'en') {
    const nodes: GraphNode[] = [
      { id: 0, label: 'A', x: 110, y: 65 },
      { id: 1, label: 'B', x: 260, y: 55 },
      { id: 2, label: 'C', x: 405, y: 100 },
      { id: 3, label: 'D', x: 95, y: 230 },
      { id: 4, label: 'E', x: 260, y: 190 },
      { id: 5, label: 'F', x: 405, y: 265 },
    ]
    const edges: GraphEdge[] = [
      { from: 0, to: 1 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 1, to: 2 },
      { from: 1, to: 4 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ]
    const adj = adjacency(edges)
    const order = [...nodes]
      .sort((a, b) => (adj[b.id]?.length ?? 0) - (adj[a.id]?.length ?? 0))
      .map((node) => node.id)
    const colors: Record<number, string> = {}
    const steps: Step[] = []

    steps.push({
      graph: baseGraph(nodes, edges, {
        order: [...order],
        phase: d(locale, 'Order by decreasing degree', 'Ordonner par degre decroissant'),
      }),
      description: d(
        locale,
        `Order vertices by decreasing degree: ${order.map((id) => label(nodes, id)).join(', ')}.`,
        `Ordonner les sommets par degre decroissant : ${order.map((id) => label(nodes, id)).join(', ')}.`,
      ),
      codeLine: 2,
      variables: { order: order.map((id) => label(nodes, id)).join(', ') },
    })

    let colorIndex = 0
    for (const start of order) {
      if (colors[start]) continue
      const color = palette[colorIndex % palette.length]
      colors[start] = color
      steps.push({
        graph: baseGraph(nodes, edges, {
          currentNode: start,
          nodeColors: cloneRecord(colors),
          order: [...order],
          phase: d(locale, `Color ${colorIndex + 1}`, `Couleur ${colorIndex + 1}`),
        }),
        description: d(
          locale,
          `Assign a new color to ${label(nodes, start)}.`,
          `Assigner une nouvelle couleur a ${label(nodes, start)}.`,
        ),
        codeLine: 7,
        variables: { vertex: label(nodes, start), color: colorIndex + 1 },
      })

      for (const candidate of order) {
        if (colors[candidate]) continue
        const neighbors = new Set((adj[candidate] ?? []).map((entry) => entry.node))
        const safe = Object.entries(colors)
          .filter(([, assigned]) => assigned === color)
          .every(([id]) => !neighbors.has(Number(id)))

        if (safe) colors[candidate] = color

        steps.push({
          graph: baseGraph(nodes, edges, {
            currentNode: candidate,
            nodeColors: cloneRecord(colors),
            order: [...order],
            phase: d(locale, `Color ${colorIndex + 1}`, `Couleur ${colorIndex + 1}`),
          }),
          description: safe
            ? d(
                locale,
                `${label(nodes, candidate)} is not adjacent to this color group, so it gets the same color.`,
                `${label(nodes, candidate)} n est pas adjacent au groupe de cette couleur, donc il recoit la meme couleur.`,
              )
            : d(
                locale,
                `${label(nodes, candidate)} touches this color group, so it must wait for another color.`,
                `${label(nodes, candidate)} touche ce groupe de couleur, donc il attend une autre couleur.`,
              ),
          codeLine: 10,
          variables: { candidate: label(nodes, candidate), safe },
        })
      }
      colorIndex++
    }

    return steps
  },
}

const unionFind: Algorithm = {
  id: 'union-find',
  name: 'Union-Find',
  category: 'Auxiliary Structures',
  difficulty: 'easy',
  visualization: 'graph',
  code: `class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(0);
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return false;
    if (this.rank[rootA] < this.rank[rootB]) this.parent[rootA] = rootB;
    else if (this.rank[rootA] > this.rank[rootB]) this.parent[rootB] = rootA;
    else {
      this.parent[rootB] = rootA;
      this.rank[rootA]++;
    }
    return true;
  }
}`,
  description: `Union-Find

Union-Find maintains disjoint sets with near-constant find and union operations. It is the auxiliary structure behind Kruskal's cycle checks.

Time Complexity: O(alpha(V)) amortized
Space Complexity: O(V)`,
  examples: [
    { id: 'cycle-checks', label: { en: 'Cycle checks', fr: 'Tests de cycle' } },
    { id: 'two-clusters', label: { en: 'Two clusters', fr: 'Deux groupes' } },
  ],
  generateSteps(locale = 'en', exampleId) {
    const nodes: GraphNode[] = [
      { id: 0, label: '0', x: 80, y: 95 },
      { id: 1, label: '1', x: 200, y: 75 },
      { id: 2, label: '2', x: 325, y: 95 },
      { id: 3, label: '3', x: 445, y: 145 },
      { id: 4, label: '4', x: 145, y: 250 },
      { id: 5, label: '5', x: 285, y: 260 },
      { id: 6, label: '6', x: 420, y: 285 },
    ]
    const operations: [number, number][] =
      exampleId === 'two-clusters'
        ? [
            [0, 1],
            [1, 2],
            [2, 3],
            [4, 5],
            [5, 6],
            [0, 3],
            [3, 6],
          ]
        : [
            [0, 1],
            [2, 3],
            [4, 5],
            [1, 2],
            [5, 6],
            [0, 3],
            [3, 6],
          ]
    const edges: GraphEdge[] = operations.map(([from, to], index) => ({
      from,
      to,
      label: `u${index + 1}`,
    }))
    const parent: Record<number, number> = {}
    const rank: Record<number, number> = {}
    const selectedEdges: [number, number][] = []
    const rejectedEdges: [number, number][] = []
    const edgeStates: Record<string, GraphVisualState> = {}
    const steps: Step[] = []

    const find = (x: number): number => {
      if (parent[x] !== x) parent[x] = find(parent[x])
      return parent[x]
    }
    const union = (a: number, b: number) => {
      const rootA = find(a)
      const rootB = find(b)
      if (rootA === rootB) return false
      if (rank[rootA] < rank[rootB]) parent[rootA] = rootB
      else if (rank[rootA] > rank[rootB]) parent[rootB] = rootA
      else {
        parent[rootB] = rootA
        rank[rootA]++
      }
      return true
    }

    for (const node of nodes) {
      parent[node.id] = node.id
      rank[node.id] = 0
    }

    steps.push({
      graph: baseGraph(nodes, edges, {
        sets: setsFromParent(nodes, parent),
        phase: d(locale, 'makeSet for every vertex', 'makeSet pour chaque sommet'),
      }),
      description: d(
        locale,
        'Each vertex starts as its own set.',
        'Chaque sommet commence dans son propre ensemble.',
      ),
      codeLine: 3,
      variables: { sets: nodes.length },
    })

    for (const [from, to] of operations) {
      const beforeFrom = find(from)
      const beforeTo = find(to)
      const merged = union(from, to)
      if (merged) {
        selectedEdges.push([from, to])
        edgeStates[edgeKey(from, to)] = 'selected'
      } else {
        rejectedEdges.push([from, to])
        edgeStates[edgeKey(from, to)] = 'rejected'
      }

      steps.push({
        graph: baseGraph(nodes, edges, {
          currentNode: from,
          currentEdge: [from, to],
          selectedEdges: [...selectedEdges],
          rejectedEdges: [...rejectedEdges],
          visitedEdges: [...selectedEdges],
          edgeStates: cloneEdgeStates(edgeStates),
          sets: setsFromParent(nodes, parent),
          phase: d(locale, 'union operation', 'operation union'),
        }),
        description: merged
          ? d(
              locale,
              `union(${from}, ${to}) merges roots ${beforeFrom} and ${beforeTo}.`,
              `union(${from}, ${to}) fusionne les racines ${beforeFrom} et ${beforeTo}.`,
            )
          : d(
              locale,
              `union(${from}, ${to}) finds the same root, so the sets are already connected.`,
              `union(${from}, ${to}) trouve la meme racine; les ensembles sont deja connectes.`,
            ),
        codeLine: 14,
        variables: { from, to, merged },
      })
    }

    return steps
  },
}

export {
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
}
