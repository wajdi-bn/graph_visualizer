import type { Locale } from '@i18n/translations'
import type { GraphEdge, GraphNode } from '@lib/types'
import type { SessionGraphDraft } from '@lib/sessionGraphs'

export interface AlgorithmPresetItem {
  id: string
  label: Record<Locale, string>
  description: Record<Locale, string>
  build: (locale: Locale) => SessionGraphDraft
}

export interface AlgorithmPresetSection {
  id: 'default' | 'complex' | 'extreme' | 'constraints'
  title: Record<Locale, string>
  items: AlgorithmPresetItem[]
}

const sectionTitles: Record<AlgorithmPresetSection['id'], Record<Locale, string>> = {
  default: {
    en: 'Default graphs',
    fr: 'Graphes par defaut',
  },
  complex: {
    en: 'More complex graphs',
    fr: 'Graphes plus complexes',
  },
  extreme: {
    en: 'Extreme cases',
    fr: 'Graphes de cas extremes',
  },
  constraints: {
    en: 'Preconditions and limitations',
    fr: 'Preconditions et limitations',
  },
}

function mkDraft(
  locale: Locale,
  nameEn: string,
  nameFr: string,
  descriptionEn: string,
  descriptionFr: string,
  directed: boolean,
  weighted: boolean,
  nodes: GraphNode[],
  edges: GraphEdge[],
): SessionGraphDraft {
  return {
    name: locale === 'fr' ? nameFr : nameEn,
    description: locale === 'fr' ? descriptionFr : descriptionEn,
    directed,
    weighted,
    nodes,
    edges,
  }
}

function mkSection(
  id: AlgorithmPresetSection['id'],
  items: AlgorithmPresetItem[],
): AlgorithmPresetSection {
  return { id, title: sectionTitles[id], items }
}

function n(id: number, label: string, x: number, y: number): GraphNode {
  return { id, label, x, y }
}

function e(from: number, to: number, weight?: number, directed = false): GraphEdge {
  return { from, to, weight, directed }
}

const presetsByAlgorithm: Record<string, AlgorithmPresetSection[]> = {
  dijkstra: [
    mkSection('default', [
      {
        id: 'dijkstra-simple-weighted',
        label: { en: 'Simple weighted graph', fr: 'Graphe simple pondere' },
        description: { en: 'Pedagogical shortest paths', fr: 'Plus courts chemins pedagogiques' },
        build: (locale) =>
          mkDraft(
            locale,
            'Dijkstra - Simple weighted',
            'Dijkstra - Simple pondere',
            'Default weighted graph for Dijkstra.',
            'Graphe pondere par defaut pour Dijkstra.',
            false,
            true,
            [n(0, 'A', 80, 170), n(1, 'B', 200, 80), n(2, 'C', 320, 100), n(3, 'D', 220, 260)],
            [e(0, 1, 4), e(1, 2, 3), e(0, 3, 2), e(3, 2, 6), e(1, 3, 1)],
          ),
      },
    ]),
    mkSection('complex', [
      {
        id: 'dijkstra-complex-weighted',
        label: { en: 'Complex weighted graph', fr: 'Graphe pondere complexe' },
        description: { en: 'Several alternatives and detours', fr: 'Plusieurs alternatives et detours' },
        build: (locale) =>
          mkDraft(
            locale,
            'Dijkstra - Complex weighted',
            'Dijkstra - Pondere complexe',
            'Complex weighted graph for path comparison.',
            'Graphe pondere complexe pour comparer les chemins.',
            false,
            true,
            [n(0, 'A', 60, 170), n(1, 'B', 145, 70), n(2, 'C', 250, 60), n(3, 'D', 360, 110), n(4, 'E', 145, 275), n(5, 'F', 300, 270)],
            [e(0, 1, 4), e(1, 2, 2), e(2, 3, 7), e(0, 4, 6), e(4, 5, 2), e(5, 3, 3), e(1, 5, 5), e(2, 5, 1)],
          ),
      },
      {
        id: 'dijkstra-dense',
        label: { en: 'Dense graph', fr: 'Graphe dense' },
        description: { en: 'Many weighted edges', fr: 'Beaucoup d aretes ponderees' },
        build: (locale) =>
          mkDraft(
            locale,
            'Dijkstra - Dense',
            'Dijkstra - Dense',
            'Dense weighted graph.',
            'Graphe pondere dense.',
            false,
            true,
            [n(0, 'A', 70, 170), n(1, 'B', 170, 80), n(2, 'C', 300, 80), n(3, 'D', 400, 170), n(4, 'E', 170, 260), n(5, 'F', 300, 260)],
            [e(0, 1, 2), e(0, 4, 6), e(1, 2, 3), e(1, 4, 4), e(1, 5, 7), e(2, 3, 5), e(2, 5, 1), e(3, 5, 2), e(4, 5, 3)],
          ),
      },
    ]),
    mkSection('extreme', [
      {
        id: 'dijkstra-disconnected',
        label: { en: 'Disconnected graph', fr: 'Graphe deconnecte' },
        description: { en: 'Unreachable vertices', fr: 'Sommets inaccessibles' },
        build: (locale) =>
          mkDraft(
            locale,
            'Dijkstra - Disconnected',
            'Dijkstra - Deconnecte',
            'Disconnected weighted graph.',
            'Graphe pondere deconnecte.',
            false,
            true,
            [n(0, 'A', 80, 170), n(1, 'B', 200, 110), n(2, 'C', 200, 240), n(3, 'D', 360, 170)],
            [e(0, 1, 3), e(1, 2, 2)],
          ),
      },
    ]),
    mkSection('constraints', [
      {
        id: 'dijkstra-negative-weight-fail',
        label: { en: 'Negative edge (expected failure)', fr: 'Poids negatif (echec attendu)' },
        description: { en: 'Should be rejected by Dijkstra', fr: 'Doit etre refuse par Dijkstra' },
        build: (locale) =>
          mkDraft(
            locale,
            'Dijkstra - Negative weight',
            'Dijkstra - Poids negatif',
            'Contains a negative edge.',
            'Contient une arete negative.',
            false,
            true,
            [n(0, 'A', 100, 170), n(1, 'B', 240, 100), n(2, 'C', 240, 240)],
            [e(0, 1, -3), e(1, 2, 2), e(0, 2, 8)],
          ),
      },
    ]),
  ],
  'bellman-ford': [
    mkSection('default', [
      {
        id: 'bf-simple',
        label: { en: 'Simple graph', fr: 'Graphe simple' },
        description: { en: 'Directed weighted baseline', fr: 'Base ponderee orientee' },
        build: (locale) =>
          mkDraft(
            locale,
            'Bellman-Ford - Simple',
            'Bellman-Ford - Simple',
            'Simple directed weighted graph.',
            'Graphe oriente pondere simple.',
            true,
            true,
            [n(0, 'S', 70, 170), n(1, 'A', 180, 90), n(2, 'B', 180, 250), n(3, 'T', 330, 170)],
            [e(0, 1, 4, true), e(0, 2, 6, true), e(1, 3, 2, true), e(2, 3, 1, true), e(1, 2, 1, true)],
          ),
      },
    ]),
    mkSection('complex', [
      {
        id: 'bf-negative',
        label: { en: 'Graph with negative edges', fr: 'Graphe avec poids negatifs' },
        description: { en: 'No negative cycle', fr: 'Sans cycle negatif' },
        build: (locale) =>
          mkDraft(
            locale,
            'Bellman-Ford - Negative edges',
            'Bellman-Ford - Poids negatifs',
            'Negative edges without negative cycle.',
            'Poids negatifs sans cycle negatif.',
            true,
            true,
            [n(0, 'S', 70, 170), n(1, 'A', 190, 80), n(2, 'B', 190, 250), n(3, 'C', 330, 120), n(4, 'D', 330, 240)],
            [e(0, 1, 6, true), e(0, 2, 7, true), e(1, 4, -4, true), e(2, 3, -3, true), e(3, 1, -2, true), e(4, 3, 7, true)],
          ),
      },
    ]),
    mkSection('extreme', [
      {
        id: 'bf-large',
        label: { en: 'Large graph', fr: 'Graphe large' },
        description: { en: 'More nodes and arcs', fr: 'Plus de sommets et d arcs' },
        build: (locale) => mkDraft(
          locale,
          'Bellman-Ford - Large',
          'Bellman-Ford - Large',
          'Large directed graph for stress testing.',
          'Grand graphe oriente pour test de charge.',
          true,
          true,
          [n(0, 'S', 50, 170), n(1, 'A', 130, 70), n(2, 'B', 130, 270), n(3, 'C', 230, 70), n(4, 'D', 230, 270), n(5, 'E', 330, 110), n(6, 'F', 330, 230), n(7, 'T', 430, 170)],
          [e(0, 1, 5, true), e(0, 2, 4, true), e(1, 3, 2, true), e(2, 4, 3, true), e(3, 5, 2, true), e(4, 6, 2, true), e(5, 7, 2, true), e(6, 7, 2, true), e(1, 4, 1, true), e(2, 3, 6, true)],
        ),
      },
    ]),
    mkSection('constraints', [
      {
        id: 'bf-negative-cycle',
        label: { en: 'Negative cycle', fr: 'Cycle negatif' },
        description: { en: 'Expected negative-cycle detection', fr: 'Detection de cycle negatif attendue' },
        build: (locale) => mkDraft(
          locale,
          'Bellman-Ford - Negative cycle',
          'Bellman-Ford - Cycle negatif',
          'Contains a reachable negative cycle.',
          'Contient un cycle negatif atteignable.',
          true,
          true,
          [n(0, 'S', 80, 170), n(1, 'A', 220, 90), n(2, 'B', 320, 170), n(3, 'C', 220, 250)],
          [e(0, 1, 1, true), e(1, 2, -4, true), e(2, 3, 1, true), e(3, 1, 1, true)],
        ),
      },
    ]),
  ],
  bellman: [
    mkSection('default', [
      {
        id: 'bellman-standard',
        label: { en: 'Standard graph', fr: 'Graphe standard' },
        description: { en: 'Baseline directed weighted graph', fr: 'Base orientee ponderee' },
        build: (locale) => presetsByAlgorithm['bellman-ford'][0].items[0].build(locale),
      },
    ]),
    mkSection('complex', [
      {
        id: 'bellman-multi-path',
        label: { en: 'Multi-path graph', fr: 'Graphe multi-chemins' },
        description: { en: 'Several equivalent routes', fr: 'Plusieurs routes equivalentes' },
        build: (locale) => mkDraft(
          locale,
          'Bellman - Multi path',
          'Bellman - Multi chemins',
          'Multiple route choices to destination.',
          'Plusieurs choix de chemins vers la destination.',
          true,
          true,
          [n(0, 'S', 70, 170), n(1, 'A', 180, 80), n(2, 'B', 180, 250), n(3, 'C', 320, 80), n(4, 'D', 320, 250), n(5, 'T', 440, 170)],
          [e(0, 1, 2, true), e(0, 2, 2, true), e(1, 3, 2, true), e(2, 4, 2, true), e(3, 5, 2, true), e(4, 5, 2, true), e(1, 4, 3, true), e(2, 3, 3, true)],
        ),
      },
      {
        id: 'bellman-constraints-complex',
        label: { en: 'Complex constraints', fr: 'Contraintes complexes' },
        description: { en: 'Mixed signs and detours', fr: 'Signes mixtes et detours' },
        build: (locale) => mkDraft(
          locale,
          'Bellman - Complex constraints',
          'Bellman - Contraintes complexes',
          'Mixed positive and negative edges without negative cycle.',
          'Poids positifs et negatifs sans cycle negatif.',
          true,
          true,
          [n(0, 'S', 60, 170), n(1, 'A', 160, 90), n(2, 'B', 160, 250), n(3, 'C', 280, 70), n(4, 'D', 280, 270), n(5, 'T', 420, 170)],
          [e(0, 1, 3, true), e(0, 2, 4, true), e(1, 3, -1, true), e(2, 4, -1, true), e(3, 5, 3, true), e(4, 5, 4, true), e(1, 4, 2, true), e(2, 3, 2, true)],
        ),
      },
    ]),
    mkSection('extreme', []),
    mkSection('constraints', []),
  ],
  kruskal: [
    mkSection('default', [
      {
        id: 'kruskal-mst-simple',
        label: { en: 'Simple MST', fr: 'MST simple' },
        description: { en: 'Basic connected weighted graph', fr: 'Graphe pondere connexe simple' },
        build: (locale) => presetsByAlgorithm.dijkstra[0].items[0].build(locale),
      },
    ]),
    mkSection('complex', [
      {
        id: 'kruskal-dense',
        label: { en: 'Dense graph', fr: 'Graphe dense' },
        description: { en: 'Many candidate edges', fr: 'Beaucoup d aretes candidates' },
        build: (locale) => presetsByAlgorithm.dijkstra[1].items[1].build(locale),
      },
    ]),
    mkSection('constraints', [
      {
        id: 'kruskal-disconnected-fail',
        label: { en: 'Disconnected graph (failure)', fr: 'Graphe deconnecte (echec)' },
        description: { en: 'Expected connectivity failure', fr: 'Echec de connexite attendu' },
        build: (locale) => presetsByAlgorithm.dijkstra[2].items[0].build(locale),
      },
    ]),
    mkSection('extreme', []),
  ],
  prim: [
    mkSection('default', [
      {
        id: 'prim-mst-simple',
        label: { en: 'Simple MST', fr: 'MST simple' },
        description: { en: 'Connected weighted graph', fr: 'Graphe pondere connexe' },
        build: (locale) => presetsByAlgorithm.dijkstra[0].items[0].build(locale),
      },
    ]),
    mkSection('complex', [
      {
        id: 'prim-complex-weighted',
        label: { en: 'Complex weighted graph', fr: 'Graphe pondere complexe' },
        description: { en: 'Larger frontier updates', fr: 'Mises a jour de frontiere plus riches' },
        build: (locale) => presetsByAlgorithm.dijkstra[1].items[0].build(locale),
      },
    ]),
    mkSection('extreme', [
      {
        id: 'prim-disconnected',
        label: { en: 'Disconnected graph', fr: 'Graphe deconnecte' },
        description: { en: 'Expected partial tree / incompatibility', fr: 'Arbre partiel / incompatibilite attendue' },
        build: (locale) => presetsByAlgorithm.dijkstra[2].items[0].build(locale),
      },
    ]),
    mkSection('constraints', []),
  ],
  'connected-components': [
    mkSection('default', [
      {
        id: 'cc-multi-components',
        label: { en: 'Multi-component graph', fr: 'Graphe multi-composants' },
        description: { en: 'Several connected groups', fr: 'Plusieurs groupes connexes' },
        build: (locale) => mkDraft(
          locale,
          'Connected Components - Multi',
          'Composantes connexes - Multi',
          'Graph with three components.',
          'Graphe avec trois composantes.',
          false,
          false,
          [n(0, 'A', 70, 90), n(1, 'B', 170, 90), n(2, 'C', 120, 190), n(3, 'D', 300, 90), n(4, 'E', 390, 150), n(5, 'F', 320, 250)],
          [e(0, 1), e(1, 2), e(0, 2), e(3, 4)],
        ),
      },
    ]),
    mkSection('complex', [
      {
        id: 'cc-fully-connected',
        label: { en: 'Fully connected graph', fr: 'Graphe totalement connexe' },
        description: { en: 'Single component', fr: 'Une seule composante' },
        build: (locale) => mkDraft(
          locale,
          'Connected Components - Fully connected',
          'Composantes connexes - Totalement connexe',
          'Single connected component.',
          'Une unique composante connexe.',
          false,
          false,
          [n(0, 'A', 90, 90), n(1, 'B', 220, 70), n(2, 'C', 350, 100), n(3, 'D', 150, 240), n(4, 'E', 310, 250)],
          [e(0, 1), e(1, 2), e(2, 4), e(4, 3), e(3, 0), e(1, 3)],
        ),
      },
    ]),
    mkSection('extreme', [
      {
        id: 'cc-isolated-nodes',
        label: { en: 'Isolated nodes', fr: 'Noeuds isoles' },
        description: { en: 'Mostly isolated vertices', fr: 'Sommets majoritairement isoles' },
        build: (locale) => mkDraft(
          locale,
          'Connected Components - Isolated',
          'Composantes connexes - Isoles',
          'Mostly isolated nodes.',
          'Sommets majoritairement isoles.',
          false,
          false,
          [n(0, 'A', 90, 90), n(1, 'B', 230, 80), n(2, 'C', 360, 120), n(3, 'D', 130, 250), n(4, 'E', 280, 260)],
          [e(0, 1)],
        ),
      },
    ]),
    mkSection('constraints', []),
  ],
  kosaraju: [
    mkSection('default', [
      {
        id: 'kosaraju-scc-simple',
        label: { en: 'Simple SCC', fr: 'SCC simple' },
        description: { en: 'One clear SCC and one tail', fr: 'Une SCC claire et une queue' },
        build: (locale) => mkDraft(
          locale,
          'Kosaraju - SCC simple',
          'Kosaraju - SCC simple',
          'Directed graph with one SCC.',
          'Graphe oriente avec une SCC.',
          true,
          false,
          [n(0, 'A', 100, 100), n(1, 'B', 220, 90), n(2, 'C', 170, 210), n(3, 'D', 330, 170)],
          [e(0, 1, undefined, true), e(1, 2, undefined, true), e(2, 0, undefined, true), e(1, 3, undefined, true)],
        ),
      },
    ]),
    mkSection('complex', [
      {
        id: 'kosaraju-scc-complex',
        label: { en: 'Complex SCC graph', fr: 'SCC complexe' },
        description: { en: 'Multiple SCC blocks', fr: 'Plusieurs blocs SCC' },
        build: (locale) => mkDraft(
          locale,
          'Kosaraju - SCC complex',
          'Kosaraju - SCC complexe',
          'Directed graph with two SCC clusters.',
          'Graphe oriente avec deux grappes SCC.',
          true,
          false,
          [n(0, 'A', 70, 100), n(1, 'B', 170, 80), n(2, 'C', 140, 200), n(3, 'D', 290, 100), n(4, 'E', 390, 80), n(5, 'F', 360, 200)],
          [e(0, 1, undefined, true), e(1, 2, undefined, true), e(2, 0, undefined, true), e(2, 3, undefined, true), e(3, 4, undefined, true), e(4, 5, undefined, true), e(5, 3, undefined, true)],
        ),
      },
    ]),
    mkSection('extreme', [
      {
        id: 'kosaraju-no-major-scc',
        label: { en: 'No significant SCC', fr: 'Sans SCC significative' },
        description: { en: 'Mostly acyclic directed graph', fr: 'Graphe oriente presque acyclique' },
        build: (locale) => mkDraft(
          locale,
          'Kosaraju - No major SCC',
          'Kosaraju - Sans SCC majeure',
          'Directed acyclic-like graph.',
          'Graphe oriente de type DAG.',
          true,
          false,
          [n(0, 'A', 70, 170), n(1, 'B', 170, 90), n(2, 'C', 170, 250), n(3, 'D', 290, 170), n(4, 'E', 390, 170)],
          [e(0, 1, undefined, true), e(0, 2, undefined, true), e(1, 3, undefined, true), e(2, 3, undefined, true), e(3, 4, undefined, true)],
        ),
      },
    ]),
    mkSection('constraints', []),
  ],
  'eulerian-path': [
    mkSection('default', [
      {
        id: 'euler-path-valid',
        label: { en: 'Valid Eulerian graph', fr: 'Graphe eulerien valide' },
        description: { en: 'Eulerian path exists', fr: 'Chemin eulerien existe' },
        build: (locale) => mkDraft(
          locale,
          'Eulerian Path - Valid',
          'Chemin eulerien - Valide',
          'Directed graph with Eulerian path.',
          'Graphe oriente avec chemin eulerien.',
          true,
          false,
          [n(0, 'A', 90, 120), n(1, 'B', 220, 70), n(2, 'C', 340, 120), n(3, 'D', 220, 250)],
          [e(0, 1, undefined, true), e(1, 2, undefined, true), e(2, 3, undefined, true), e(3, 1, undefined, true)],
        ),
      },
    ]),
    mkSection('complex', [
      {
        id: 'euler-path-semi',
        label: { en: 'Semi-Eulerian graph', fr: 'Graphe semi-eulerien' },
        description: { en: 'Exactly one start/end imbalance', fr: 'Desequilibre start/end controle' },
        build: (locale) => mkDraft(
          locale,
          'Eulerian Path - Semi',
          'Chemin eulerien - Semi',
          'Semi-Eulerian directed graph.',
          'Graphe oriente semi-eulerien.',
          true,
          false,
          [n(0, 'A', 80, 170), n(1, 'B', 210, 90), n(2, 'C', 340, 170), n(3, 'D', 210, 250)],
          [e(0, 1, undefined, true), e(1, 2, undefined, true), e(2, 3, undefined, true), e(3, 0, undefined, true), e(0, 2, undefined, true)],
        ),
      },
    ]),
    mkSection('constraints', [
      {
        id: 'euler-path-invalid-odd',
        label: { en: 'Invalid graph (odd degree mismatch)', fr: 'Graphe invalide (degres impairs)' },
        description: { en: 'Expected failure for Eulerian path', fr: 'Echec attendu du chemin eulerien' },
        build: (locale) => mkDraft(
          locale,
          'Eulerian Path - Invalid',
          'Chemin eulerien - Invalide',
          'Violates Eulerian path conditions.',
          'Viole les conditions du chemin eulerien.',
          true,
          false,
          [n(0, 'A', 90, 100), n(1, 'B', 220, 80), n(2, 'C', 330, 170), n(3, 'D', 220, 260)],
          [e(0, 1, undefined, true), e(1, 2, undefined, true), e(2, 0, undefined, true), e(0, 3, undefined, true)],
        ),
      },
    ]),
    mkSection('extreme', []),
  ],
  'eulerian-circuit': [
    mkSection('default', [
      {
        id: 'euler-circuit-valid',
        label: { en: 'Valid circuit', fr: 'Circuit valide' },
        description: { en: 'Eulerian circuit exists', fr: 'Circuit eulerien existe' },
        build: (locale) => mkDraft(
          locale,
          'Eulerian Circuit - Valid',
          'Circuit eulerien - Valide',
          'Balanced directed Eulerian graph.',
          'Graphe eulerien oriente equilibre.',
          true,
          false,
          [n(0, 'A', 90, 120), n(1, 'B', 220, 70), n(2, 'C', 340, 120), n(3, 'D', 220, 250)],
          [e(0, 1, undefined, true), e(1, 2, undefined, true), e(2, 3, undefined, true), e(3, 0, undefined, true), e(0, 2, undefined, true), e(2, 0, undefined, true)],
        ),
      },
    ]),
    mkSection('constraints', [
      {
        id: 'euler-circuit-not-eulerian',
        label: { en: 'Non-Eulerian graph', fr: 'Graphe non eulerien' },
        description: { en: 'Degree imbalance expected', fr: 'Desequilibre des degres attendu' },
        build: (locale) => presetsByAlgorithm['eulerian-path'][2].items[0].build(locale),
      },
      {
        id: 'euler-circuit-disconnected',
        label: { en: 'Disconnected graph', fr: 'Graphe deconnecte' },
        description: { en: 'Disconnected components', fr: 'Composantes deconnectees' },
        build: (locale) => mkDraft(
          locale,
          'Eulerian Circuit - Disconnected',
          'Circuit eulerien - Deconnecte',
          'Disconnected directed graph.',
          'Graphe oriente deconnecte.',
          true,
          false,
          [n(0, 'A', 90, 120), n(1, 'B', 210, 80), n(2, 'C', 340, 120), n(3, 'D', 350, 250)],
          [e(0, 1, undefined, true), e(1, 0, undefined, true), e(2, 3, undefined, true), e(3, 2, undefined, true)],
        ),
      },
    ]),
    mkSection('complex', []),
    mkSection('extreme', []),
  ],
  'welsh-powell': [
    mkSection('default', [
      {
        id: 'wp-simple',
        label: { en: 'Simple graph', fr: 'Graphe simple' },
        description: { en: 'Basic coloring case', fr: 'Cas de coloration de base' },
        build: (locale) => mkDraft(
          locale,
          'Welsh-Powell - Simple',
          'Welsh-Powell - Simple',
          'Simple undirected graph for coloring.',
          'Graphe non oriente simple pour coloration.',
          false,
          false,
          [n(0, 'A', 100, 90), n(1, 'B', 220, 70), n(2, 'C', 340, 100), n(3, 'D', 170, 240), n(4, 'E', 300, 250)],
          [e(0, 1), e(1, 2), e(0, 3), e(1, 3), e(2, 4), e(3, 4)],
        ),
      },
    ]),
    mkSection('complex', [
      {
        id: 'wp-dense',
        label: { en: 'Dense graph', fr: 'Graphe dense' },
        description: { en: 'Higher adjacency pressure', fr: 'Pression de voisinage elevee' },
        build: (locale) => mkDraft(
          locale,
          'Welsh-Powell - Dense',
          'Welsh-Powell - Dense',
          'Dense graph for coloring.',
          'Graphe dense pour coloration.',
          false,
          false,
          [n(0, 'A', 90, 80), n(1, 'B', 220, 60), n(2, 'C', 340, 90), n(3, 'D', 120, 230), n(4, 'E', 260, 250), n(5, 'F', 380, 220)],
          [e(0, 1), e(0, 3), e(0, 4), e(1, 2), e(1, 3), e(1, 4), e(2, 4), e(2, 5), e(3, 4), e(4, 5)],
        ),
      },
      {
        id: 'wp-many-colors',
        label: { en: 'Many-color graph', fr: 'Graphe a plusieurs couleurs' },
        description: { en: 'K5-like pressure', fr: 'Pression type K5' },
        build: (locale) => mkDraft(
          locale,
          'Welsh-Powell - Many colors',
          'Welsh-Powell - Plusieurs couleurs',
          'Near-complete graph requiring many colors.',
          'Graphe quasi-complet necessitant plusieurs couleurs.',
          false,
          false,
          [n(0, 'A', 120, 80), n(1, 'B', 260, 70), n(2, 'C', 360, 160), n(3, 'D', 300, 270), n(4, 'E', 140, 250)],
          [e(0, 1), e(0, 2), e(0, 3), e(0, 4), e(1, 2), e(1, 3), e(1, 4), e(2, 3), e(2, 4), e(3, 4)],
        ),
      },
    ]),
    mkSection('extreme', []),
    mkSection('constraints', []),
  ],
  'edge-coloring': [
    mkSection('default', [
      {
        id: 'ec-standard',
        label: { en: 'Standard graph', fr: 'Graphe standard' },
        description: { en: 'Baseline edge-coloring case', fr: 'Cas de base de coloration des aretes' },
        build: (locale) => presetsByAlgorithm['welsh-powell'][0].items[0].build(locale),
      },
    ]),
    mkSection('complex', [
      {
        id: 'ec-dense',
        label: { en: 'Dense graph', fr: 'Graphe dense' },
        description: { en: 'Dense edge-coloring challenge', fr: 'Defi dense de coloration d aretes' },
        build: (locale) => presetsByAlgorithm['welsh-powell'][1].items[0].build(locale),
      },
      {
        id: 'ec-high-degree',
        label: { en: 'High-degree graph', fr: 'Graphe a fort degre' },
        description: { en: 'Star-like high central degree', fr: 'Type etoile avec degre central eleve' },
        build: (locale) => mkDraft(
          locale,
          'Edge Coloring - High degree',
          'Coloration d aretes - Fort degre',
          'Star graph to maximize local edge conflicts.',
          'Graphe etoile pour maximiser les conflits locaux.',
          false,
          false,
          [n(0, 'C', 240, 170), n(1, 'A', 110, 70), n(2, 'B', 370, 70), n(3, 'D', 100, 260), n(4, 'E', 380, 260), n(5, 'F', 240, 320)],
          [e(0, 1), e(0, 2), e(0, 3), e(0, 4), e(0, 5)],
        ),
      },
    ]),
    mkSection('extreme', []),
    mkSection('constraints', []),
  ],
  'ford-fulkerson': [
    mkSection('default', [
      {
        id: 'ff-simple',
        label: { en: 'Simple network', fr: 'Reseau simple' },
        description: { en: 'Baseline max-flow network', fr: 'Reseau de flot maximal de base' },
        build: (locale) => mkDraft(
          locale,
          'Ford-Fulkerson - Simple',
          'Ford-Fulkerson - Simple',
          'Simple capacity network.',
          'Reseau de capacites simple.',
          true,
          true,
          [n(0, 'S', 70, 170), n(1, 'A', 185, 85), n(2, 'B', 185, 250), n(3, 'T', 350, 170)],
          [e(0, 1, 3, true), e(0, 2, 2, true), e(1, 3, 2, true), e(2, 3, 3, true), e(1, 2, 1, true)],
        ),
      },
    ]),
    mkSection('complex', [
      {
        id: 'ff-complex',
        label: { en: 'Complex network', fr: 'Reseau complexe' },
        description: { en: 'Multiple augmenting paths', fr: 'Multiples chemins augmentants' },
        build: (locale) => mkDraft(
          locale,
          'Ford-Fulkerson - Complex',
          'Ford-Fulkerson - Complexe',
          'Larger network with alternate routes.',
          'Reseau plus grand avec routes alternatives.',
          true,
          true,
          [n(0, 'S', 50, 170), n(1, 'A', 140, 75), n(2, 'B', 140, 265), n(3, 'C', 250, 75), n(4, 'D', 250, 265), n(5, 'E', 360, 170), n(6, 'T', 450, 170)],
          [e(0, 1, 10, true), e(0, 2, 8, true), e(1, 3, 6, true), e(1, 4, 4, true), e(2, 4, 7, true), e(3, 5, 8, true), e(4, 5, 5, true), e(5, 6, 10, true), e(2, 3, 2, true), e(4, 6, 4, true)],
        ),
      },
      {
        id: 'ff-bottleneck',
        label: { en: 'Bottleneck network', fr: 'Reseau avec goulot' },
        description: { en: 'Single narrow capacity edge', fr: 'Une arete capacitaire limitante' },
        build: (locale) => mkDraft(
          locale,
          'Ford-Fulkerson - Bottleneck',
          'Ford-Fulkerson - Goulot',
          'Network with bottleneck edge.',
          'Reseau avec arete goulot.',
          true,
          true,
          [n(0, 'S', 70, 170), n(1, 'A', 190, 90), n(2, 'B', 190, 250), n(3, 'C', 320, 170), n(4, 'T', 440, 170)],
          [e(0, 1, 12, true), e(0, 2, 12, true), e(1, 3, 2, true), e(2, 3, 10, true), e(3, 4, 12, true)],
        ),
      },
    ]),
    mkSection('extreme', [
      {
        id: 'ff-zero-capacities',
        label: { en: 'Zero capacities', fr: 'Capacites nulles' },
        description: { en: 'Zero-capacity arcs mixed in', fr: 'Aretes de capacite nulle' },
        build: (locale) => mkDraft(
          locale,
          'Ford-Fulkerson - Zero capacities',
          'Ford-Fulkerson - Capacites nulles',
          'Contains arcs with capacity 0.',
          'Contient des aretes de capacite 0.',
          true,
          true,
          [n(0, 'S', 70, 170), n(1, 'A', 190, 90), n(2, 'B', 190, 250), n(3, 'T', 360, 170)],
          [e(0, 1, 0, true), e(0, 2, 5, true), e(1, 3, 7, true), e(2, 3, 3, true), e(1, 2, 0, true)],
        ),
      },
      {
        id: 'ff-extreme-flow',
        label: { en: 'Extreme max-flow case', fr: 'Cas extreme de flot' },
        description: { en: 'High capacities and many paths', fr: 'Grandes capacites et nombreux chemins' },
        build: (locale) => mkDraft(
          locale,
          'Ford-Fulkerson - Extreme',
          'Ford-Fulkerson - Extreme',
          'Stress network for max-flow.',
          'Reseau de stress pour flot maximal.',
          true,
          true,
          [n(0, 'S', 40, 170), n(1, 'A', 120, 70), n(2, 'B', 120, 270), n(3, 'C', 220, 70), n(4, 'D', 220, 270), n(5, 'E', 320, 70), n(6, 'F', 320, 270), n(7, 'T', 440, 170)],
          [e(0, 1, 30, true), e(0, 2, 25, true), e(1, 3, 20, true), e(1, 4, 10, true), e(2, 3, 10, true), e(2, 4, 18, true), e(3, 5, 15, true), e(4, 6, 16, true), e(5, 7, 20, true), e(6, 7, 22, true), e(3, 6, 8, true), e(4, 5, 7, true)],
        ),
      },
    ]),
    mkSection('constraints', []),
  ],
}

export function getAlgorithmPresetSections(algorithmId: string): AlgorithmPresetSection[] {
  return (presetsByAlgorithm[algorithmId] ?? []).filter((section) => section.items.length > 0)
}
