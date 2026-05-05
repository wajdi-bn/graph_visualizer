import type {
  Algorithm,
  AlgorithmGraphInput,
  AlgorithmRunOptions,
  GraphEdge,
  GraphNode,
  GraphVisualState,
  Step,
} from '@lib/types'
import { d } from '@lib/algorithms/shared'
import {
  baseGraph,
  buildShortestPathResults,
  cloneRecord,
  edgeKey,
  formatDistances,
  graphFromInput,
  inf,
  isDirectedGraph,
  label,
  requireNodes,
  requireValidSource,
  requireWeightedGraph,
  resolveSourceNodeId,
  incompatibilityStep,
} from '@lib/algorithms/graphAlgorithmUtils'
import { weightedExampleOptions, getWeightedDemo } from '@lib/algorithms/graphAlgorithmExamples'

// ---------------------------------------------------------------------------
// Dijkstra — version conforme au cours
//   Initialisation : V = {s}, d(s) = 0, d(i) = ∞ ∀i ≠ s
//   Tant que V ≠ ∅ :
//     Sélectionner i dans V tel que d(i) = min(d(j)) j∈V
//     Retirer i de V
//     Pour chaque arc (i, j) sortant de i :
//       Si d(j) > d(i) + a(ij) :
//         d(j) ← d(i) + a(ij)
//         Ajouter j à V  (si pas déjà présent)
//
// Propriété clé : chaque sommet est traité UNE SEULE FOIS
// ---------------------------------------------------------------------------

type RelaxEdge = Pick<GraphEdge, 'from' | 'to' | 'weight'> & {
  originalFrom: number
  originalTo: number
}

function numDist(v: number | string): number {
  return v === inf ? Infinity : (v as number)
}

export const dijkstra: Algorithm = {
  id: 'dijkstra',
  name: 'Dijkstra',
  category: 'Shortest Paths',
  difficulty: 'intermediate',
  visualization: 'graph',
  examples: weightedExampleOptions,

  description: `Dijkstra

Dijkstra finds shortest paths from a chosen source. It selects at each step the node with the minimum distance in V, guaranteeing each node is processed exactly once.

Requirements: non-negative edge weights, at least one node.

Time Complexity: O((V + E) log V)
Space Complexity: O(V)`,

  code: `function dijkstra(adj, source) {
  // Initialisation
  const dist = new Map();
  const parent = new Map();
  for (const node of adj.keys()) {
    dist.set(node, Infinity);
    parent.set(node, null);
  }
  dist.set(source, 0);

  // V = file des noeuds a traiter
  const V = [source];
  const inV = new Set([source]);

  // Tant que V != vide
  while (V.length > 0) {
    // Selectionner i dans V tel que d(i) = min
    const i = V.reduce((a, b) => dist.get(a) <= dist.get(b) ? a : b);
    V.splice(V.indexOf(i), 1);
    inV.delete(i);

    // Pour chaque arc (i, j) sortant de i
    for (const { to: j, weight: aij } of adj.get(i) ?? []) {
      // Si d(j) > d(i) + a(ij)
      if (dist.get(i) + aij < dist.get(j)) {
        dist.set(j, dist.get(i) + aij);
        parent.set(j, i);
        if (!inV.has(j)) {
          V.push(j);           // Ajouter j a V
          inV.add(j);
        }
      }
    }
  }

  return { dist, parent };
}`,

  generateSteps(
    locale = 'en',
    exampleId?: string,
    customGraph?: AlgorithmGraphInput,
    options?: AlgorithmRunOptions,
  ): Step[] {
    // ------------------------------------------------------------------
    // 1. Construction du graphe
    // ------------------------------------------------------------------
    let nodes: GraphNode[]
    let edges: GraphEdge[]
    let directed: boolean

    if (customGraph) {
      directed = isDirectedGraph(customGraph)
      const custom = graphFromInput(customGraph, { directed, defaultWeight: true })
      nodes = custom.nodes
      edges = custom.edges.map((e) => ({ ...e, directed }))
    } else {
      const demo = getWeightedDemo(exampleId)
      nodes = demo.nodes
      edges = demo.edges
      directed = false
    }

    // ------------------------------------------------------------------
    // 2. Vérifications préalables
    // ------------------------------------------------------------------
    const incompatible =
      requireNodes(locale, nodes, edges, directed) ??
      requireWeightedGraph(locale, nodes, edges, directed)
    if (incompatible) return incompatible

    // Dijkstra : pas de poids négatifs
    const negativeEdge = edges.find((e) => (e.weight ?? 0) < 0)
    if (negativeEdge) {
      return incompatibilityStep(
        locale, nodes, edges, directed,
        'Dijkstra requires non-negative edge weights. Use Bellman-Ford for negative weights.',
        'Dijkstra exige des poids non négatifs. Utilisez Bellman-Ford pour les poids négatifs.',
      )
    }

    const source = resolveSourceNodeId(nodes, customGraph, options)
    const sourceIssue = requireValidSource(locale, nodes, edges, directed, source)
    if (sourceIssue) return sourceIssue
    if (source == null) return []

    const sourceLabel = label(nodes, source)

    // Construction des arcs de relaxation
    const relaxEdges: RelaxEdge[] = edges.flatMap((e) => {
      const fwd: RelaxEdge = {
        from: e.from, to: e.to,
        weight: e.weight ?? 1,
        originalFrom: e.from, originalTo: e.to,
      }
      if (directed) return [fwd]
      return [
        fwd,
        { from: e.to, to: e.from, weight: e.weight ?? 1, originalFrom: e.from, originalTo: e.to },
      ]
    })

    // ------------------------------------------------------------------
    // 3. État initial
    // ------------------------------------------------------------------
    const distances: Record<number, number | string> = {}
    const predecessors: Record<number, number | null> = {}
    const selectedEdges: [number, number][] = []

    for (const n of nodes) {
      distances[n.id]    = n.id === source ? 0 : inf
      predecessors[n.id] = null
    }

    // V = file des nœuds à traiter, initialisée avec s
    const V: number[]   = [source]
    const inV           = new Set<number>([source])
    const steps: Step[] = []

    const predecessorEdges = (): [number, number][] =>
      Object.entries(predecessors)
        .filter(([, p]) => p != null)
        .map(([to, p]) => [p as number, Number(to)])

    // ------------------------------------------------------------------
    // 4. Étape d'initialisation
    // ------------------------------------------------------------------
    steps.push({
      graph: baseGraph(nodes, edges, {
        directed,
        sourceNodeId: source,
        currentNode: source,
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        phase: d(locale, 'Init: V={s}, d(s)=0', 'Init : V={s}, d(s)=0'),
      }),
      description: d(
        locale,
        `Source = ${sourceLabel}. d(${sourceLabel})=0, all others=∞. V={${sourceLabel}}.`,
        `Source = ${sourceLabel}. d(${sourceLabel})=0, tous les autres=∞. V={${sourceLabel}}.`,
      ),
      codeLine: 9,
      variables: {
        V: `{${V.join(', ')}}`,
        distances: formatDistances(nodes, distances),
      },
    })

    // ------------------------------------------------------------------
    // 5. Boucle principale — Tant que V ≠ ∅
    // ------------------------------------------------------------------
    while (V.length > 0) {
      // Sélectionner i dans V tel que d(i) = min
      let minDist = Infinity
      let i = V[0]
      for (const node of V) {
        const nd = numDist(distances[node])
        if (nd < minDist) {
          minDist = nd
          i = node
        }
      }

      // Retirer i de V
      V.splice(V.indexOf(i), 1)
      inV.delete(i)
      const iLabel = label(nodes, i)
      const di     = numDist(distances[i])

      // Mise à jour des selectedEdges pour l'arbre
      if (predecessors[i] != null) {
        selectedEdges.push([predecessors[i]!, i])
      }

      steps.push({
        graph: baseGraph(nodes, edges, {
          directed,
          sourceNodeId: source,
          currentNode: i,
          visitedEdges: [...selectedEdges],
          selectedEdges: [...selectedEdges],
          edgeStates: {},
          distances: cloneRecord(distances),
          predecessors: cloneRecord(predecessors),
          phase: d(locale, `Select min: ${iLabel}`, `Sélectionner min : ${iLabel}`),
        }),
        description: d(
          locale,
          `Select ${iLabel} (d=${di}, minimum in V). Remove from V. Remaining V={${V.join(', ') || '∅'}}.`,
          `Sélectionner ${iLabel} (d=${di}, minimum dans V). Retirer de V. V restant={${V.join(', ') || '∅'}}.`,
        ),
        codeLine: 17,
        variables: {
          i: iLabel,
          'd(i)': String(di),
          V: `{${V.join(', ') || '∅'}}`,
        },
      })

      // Pour chaque arc (i, j) sortant de i
      const outEdges = relaxEdges.filter((e) => e.from === i)

      for (const arc of outEdges) {
        const j      = arc.to
        const jLabel = label(nodes, j)
        const aij    = arc.weight ?? 1
        const dj     = numDist(distances[j])

        const candidate = di === Infinity ? Infinity : di + aij
        const improved  = candidate < dj

        if (improved) {
          distances[j]    = candidate
          predecessors[j] = i
          if (!inV.has(j)) {
            V.push(j)
            inV.add(j)
          }
        }

        // edgeStates temporaire — ne persiste pas à l'étape suivante
        const stepEdgeStates: Record<string, GraphVisualState> = {
          [edgeKey(arc.originalFrom, arc.originalTo, directed)]: improved ? 'relaxed' : 'candidate',
        }

        steps.push({
          graph: baseGraph(nodes, edges, {
            directed,
            sourceNodeId: source,
            currentNode: i,
            visitedEdges: [...selectedEdges],
            selectedEdges: [...selectedEdges],
            edgeStates: stepEdgeStates,
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, `Arc (${iLabel}→${jLabel})`, `Arc (${iLabel}→${jLabel})`),
          }),
          description: improved
            ? d(
                locale,
                `(${iLabel}→${jLabel}): ${di}+${aij}=${candidate} < ${dj} → d(${jLabel})=${candidate}, add ${jLabel} to V.`,
                `(${iLabel}→${jLabel}) : ${di}+${aij}=${candidate} < ${dj} → d(${jLabel})=${candidate}, ajouter ${jLabel} à V.`,
              )
            : d(
                locale,
                `(${iLabel}→${jLabel}): ${di}+${aij}=${candidate} ≥ ${dj} → no update.`,
                `(${iLabel}→${jLabel}) : ${di}+${aij}=${candidate} ≥ ${dj} → pas de mise à jour.`,
              ),
          codeLine: improved ? 24 : 22,
          variables: {
            arc: `${iLabel}→${jLabel}`,
            'a(ij)': String(aij),
            candidate: candidate === Infinity ? '∞' : String(candidate),
            'old d(j)': dj === Infinity ? '∞' : String(dj),
            V: `{${V.join(', ') || '∅'}}`,
            distances: formatDistances(nodes, distances),
          },
        })
      }
    }

    // ------------------------------------------------------------------
    // 6. Étape finale — V = ∅
    // ------------------------------------------------------------------
    const pathResults = buildShortestPathResults(nodes, predecessors, distances, source)

    steps.push({
      graph: baseGraph(nodes, edges, {
        directed,
        sourceNodeId: source,
        currentNode: null,
        visitedEdges: [...selectedEdges],
        selectedEdges: [...selectedEdges],
        edgeStates: {} as Record<string, GraphVisualState>,
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        pathResults,
        phase: d(locale, 'Shortest-path tree complete', 'Arbre des plus courts chemins terminé'),
      }),
      description: d(
        locale,
        `V = ∅. Dijkstra complete from ${sourceLabel}. Distances: ${formatDistances(nodes, distances)}.`,
        `V = ∅. Dijkstra terminé depuis ${sourceLabel}. Distances : ${formatDistances(nodes, distances)}.`,
      ),
      variables: {
        source: sourceLabel,
        distances: formatDistances(nodes, distances),
      },
    })

    return steps
  },
}