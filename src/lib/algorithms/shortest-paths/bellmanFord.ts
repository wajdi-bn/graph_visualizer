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
  hasNegativeWeightCycle,
  inf,
  isDirectedGraph,
  label,
  requireNodes,
  requireValidSource,
  requireWeightedGraph,
  resolveSourceNodeId,
  incompatibilityStep,
} from '@lib/algorithms/graphAlgorithmUtils'
import { negativeWeightedExampleOptions } from '@lib/algorithms/graphAlgorithmExamples'

// ---------------------------------------------------------------------------
// Bellman-Ford — version conforme au cours (SPFA)
//   Initialisation : V = {s}, d(s) = 0, d(i) = ∞ ∀i ≠ s
//   Tant que V ≠ ∅ :
//     Sélectionner un nœud i dans V et l'en retirer
//     Pour chaque arc (i, j) sortant de i :
//       Si d(j) > d(i) + l(ij) :
//         d(j) ← d(i) + l(ij)
//         Ajouter j à V  (si pas déjà présent)
// ---------------------------------------------------------------------------

type RelaxEdge = Pick<GraphEdge, 'from' | 'to' | 'weight'> & {
  originalFrom: number
  originalTo: number
}

// Convertit une distance (number | string) en number de façon sûre
function numDist(v: number | string): number {
  return v === inf ? Infinity : (v as number)
}

export const bellmanFord: Algorithm = {
  id: 'bellman-ford',
  name: 'Bellman-Ford',
  category: 'Shortest Paths',
  difficulty: 'advanced',
  visualization: 'graph',
  examples: negativeWeightedExampleOptions,

  description: `Bellman-Ford

Bellman-Ford calcule les plus courts chemins depuis une source s dans un réseau pondéré, en maintenant une file V des nœuds à traiter.

Algorithme :
  Initialisation : V = {s}, d(s) = 0, d(i) = ∞ ∀i ≠ s
  Tant que V ≠ ∅ :
    Sélectionner un nœud i dans V et le retirer
    Pour chaque arc (i,j) sortant de i :
      Si d(j) > d(i) + l(ij) :
        d(j) ← d(i) + l(ij)
        Ajouter j à V (si absent)

Contraintes :
- Accepte les poids négatifs sur graphes orientés
- Ne fonctionne pas avec les circuits absorbants
- Graphes non orientés : poids strictement positifs uniquement

Complexité temporelle : O(V × E) dans le pire cas
Complexité spatiale : O(V)`,

  code: `function bellmanFord(adj, source) {
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
    // Selectionner un noeud i dans V et l'en retirer
    const i = V.shift();
    inV.delete(i);

    // Pour chaque arc (i, j) sortant de i
    for (const { to: j, weight: lij } of adj.get(i) ?? []) {
      // Si d(j) > d(i) + l(ij)
      if (dist.get(i) + lij < dist.get(j)) {
        dist.set(j, dist.get(i) + lij);
        parent.set(j, i);
        if (!inV.has(j)) {
          V.push(j);
          inV.add(j);
        }
      }
    }
  }

  return { dist, parent };
}`,

  generateSteps(
    locale = 'en',
    _exampleId?: string,
    // FIX 2 : customGraph typé correctement
    customGraph?: AlgorithmGraphInput,
    options?: AlgorithmRunOptions,
  ): Step[] {
    // ------------------------------------------------------------------
    // 1. Construction du graphe (IDs 0-based = negativeWeightedExampleOptions)
    // ------------------------------------------------------------------
    let nodes: GraphNode[] = [
      { id: 0, label: 'S', x: 70,  y: 165 },
      { id: 1, label: 'A', x: 210, y: 65  },
      { id: 2, label: 'B', x: 210, y: 265 },
      { id: 3, label: 'C', x: 370, y: 80  },
      { id: 4, label: 'D', x: 390, y: 250 },
    ]
    let edges: GraphEdge[] = [
      { from: 0, to: 1, weight:  6, directed: true },
      { from: 0, to: 2, weight:  7, directed: true },
      { from: 1, to: 2, weight:  8, directed: true },
      { from: 1, to: 3, weight:  5, directed: true },
      { from: 1, to: 4, weight: -4, directed: true },
      { from: 2, to: 3, weight: -3, directed: true },
      { from: 2, to: 4, weight:  9, directed: true },
      { from: 3, to: 1, weight: -2, directed: true },
      { from: 4, to: 3, weight:  7, directed: true },
    ]
    let directed = true

    if (customGraph) {
      directed = isDirectedGraph(customGraph)
      const custom = graphFromInput(customGraph, { directed })
      nodes = custom.nodes
      edges = custom.edges.map((e) => ({ ...e, directed }))
    }

    // ------------------------------------------------------------------
    // 2. Vérifications préalables
    // ------------------------------------------------------------------
    const incompatible =
      requireNodes(locale, nodes, edges, directed) ??
      requireWeightedGraph(locale, nodes, edges, directed)
    if (incompatible) return incompatible

    // Graphe non orienté : interdire les poids négatifs
    if (!directed) {
      const negativeEdge = edges.find((e) => (e.weight ?? 0) < 0)
      if (negativeEdge) {
        return incompatibilityStep(
          locale, nodes, edges, false,
          'Bellman-Ford does not accept negative weights on undirected graphs.',
          'Bellman-Ford n\'accepte pas les poids négatifs sur un graphe non orienté.',
        )
      }
    }

    // Construction des arcs de relaxation (double sens si non orienté)
    const relaxEdges: RelaxEdge[] = edges.flatMap((e) => {
      const fwd: RelaxEdge = {
        from: e.from, to: e.to,
        weight: e.weight ?? 0,
        originalFrom: e.from, originalTo: e.to,
      }
      if (directed) return [fwd]
      return [
        fwd,
        { from: e.to, to: e.from, weight: e.weight ?? 0, originalFrom: e.from, originalTo: e.to },
      ]
    })

    // Détection de circuit absorbant
    if (directed && hasNegativeWeightCycle(nodes, relaxEdges)) {
      return incompatibilityStep(
        locale, nodes, edges, true,
        'Bellman-Ford cannot run on a graph with a negative-weight cycle.',
        'Bellman-Ford ne peut pas s\'exécuter sur un graphe avec circuit absorbant.',
      )
    }

    const source = resolveSourceNodeId(nodes, customGraph, options)
    const sourceIssue = requireValidSource(locale, nodes, edges, directed, source)
    if (sourceIssue) return sourceIssue
    if (source == null) return []

    const sourceLabel = label(nodes, source)

    // ------------------------------------------------------------------
    // 3. État initial
    // ------------------------------------------------------------------
    const distances: Record<number, number | string> = {}
    const predecessors: Record<number, number | null> = {}

    for (const n of nodes) {
      distances[n.id]    = n.id === source ? 0 : inf
      predecessors[n.id] = null
    }

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
        `Initialization: d(${sourceLabel})=0, all others=∞. V={${sourceLabel}}. We start by exploring arcs from the source.`,
        `Initialisation : d(${sourceLabel})=0, tous les autres=∞. V={${sourceLabel}}. On commence par explorer les arcs depuis la source.`,
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
      const i      = V.shift()!
      inV.delete(i)
      const iLabel = label(nodes, i)
      const di     = numDist(distances[i])

      steps.push({
        graph: baseGraph(nodes, edges, {
          directed,
          sourceNodeId: source,
          currentNode: i,
          visitedEdges: predecessorEdges(),
          selectedEdges: predecessorEdges(),
          edgeStates: {},
          distances: cloneRecord(distances),
          predecessors: cloneRecord(predecessors),
          phase: d(locale, `Select ${iLabel}`, `Sélectionner ${iLabel}`),
        }),
        description: d(
          locale,
          `Select ${iLabel} from V (d(${iLabel})=${di}). We now examine all arcs leaving ${iLabel}. Remaining V={${V.join(', ') || '∅'}}.`,
          `Sélectionner ${iLabel} dans V (d(${iLabel})=${di}). On examine tous les arcs sortants de ${iLabel}. V restant={${V.join(', ') || '∅'}}.`,
        ),
        codeLine: 17,
        variables: {
          i: iLabel,
          'd(i)': String(di),
          V: `{${V.join(', ') || '∅'}}`,
        },
      })

      const outEdges = relaxEdges.filter((e) => e.from === i)

      for (const arc of outEdges) {
        const j      = arc.to
        const jLabel = label(nodes, j)
        const lij    = arc.weight ?? 0
        const dj     = numDist(distances[j])

        // Garde : si di est Infinity on ne relaxe pas
        const candidate = di === Infinity ? Infinity : di + lij
        const improved  = candidate < dj

        if (improved) {
          distances[j]    = candidate
          predecessors[j] = i
          if (!inV.has(j)) {
            V.push(j)
            inV.add(j)
          }
        }

        // edgeStates temporaire juste pour cette étape — ne persiste pas
        const stepEdgeStates: Record<string, GraphVisualState> = {
          [edgeKey(arc.originalFrom, arc.originalTo, directed)]: improved ? 'relaxed' : 'candidate',
        }

        steps.push({
          graph: baseGraph(nodes, edges, {
            directed,
            sourceNodeId: source,
            currentNode: i,
            visitedEdges: predecessorEdges(),
            selectedEdges: predecessorEdges(),
            edgeStates: stepEdgeStates,
            distances: cloneRecord(distances),
            predecessors: cloneRecord(predecessors),
            phase: d(locale, `Arc (${iLabel}→${jLabel})`, `Arc (${iLabel}→${jLabel})`),
          }),
          description: improved
            ? d(
                locale,
                `Arc (${iLabel}→${jLabel}): d(${iLabel})+l=${di}+${lij}=${candidate} < d(${jLabel})=${dj} → update d(${jLabel})=${candidate} and add ${jLabel} to V.`,
                `Arc (${iLabel}→${jLabel}) : d(${iLabel})+l=${di}+${lij}=${candidate} < d(${jLabel})=${dj} → on met à jour d(${jLabel})=${candidate} et on ajoute ${jLabel} à V.`,
              )
            : d(
                locale,
                `Arc (${iLabel}→${jLabel}): d(${iLabel})+l=${di}+${lij}=${candidate} ≥ d(${jLabel})=${dj} → no update, current path is already better.`,
                `Arc (${iLabel}→${jLabel}) : d(${iLabel})+l=${di}+${lij}=${candidate} ≥ d(${jLabel})=${dj} → pas de mise à jour, le chemin actuel est déjà meilleur.`,
              ),
          codeLine: improved ? 24 : 22,
          variables: {
            arc: `${iLabel}→${jLabel}`,
            'l(ij)': String(lij),
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
        visitedEdges: predecessorEdges(),
        selectedEdges: predecessorEdges(),
        distances: cloneRecord(distances),
        predecessors: cloneRecord(predecessors),
        pathResults,
        // edgeStates vide = seuls les selectedEdges (arcs prédécesseurs) sont colorés en bleu
        edgeStates: {} as Record<string, GraphVisualState>,
        phase: d(locale, 'V = ∅ — done', 'V = ∅ — terminé'),
      }),
      description: d(
        locale,
        `V = ∅. Bellman-Ford complete. All shortest paths from ${sourceLabel} have been found. Distances: ${formatDistances(nodes, distances)}.`,
        `V = ∅. Bellman-Ford terminé. Tous les plus courts chemins depuis ${sourceLabel} ont été trouvés. Distances : ${formatDistances(nodes, distances)}.`,
      ),
      variables: {
        source: sourceLabel,
        distances: formatDistances(nodes, distances),
      },
    })

    return steps
  },
}