export type Locale = 'en' | 'fr'

export const defaultLocale: Locale = 'en'
export const locales: Locale[] = ['en', 'fr']

export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Francais',
}

export interface Translations {
  siteTitle: string
  siteDescription: string
  welcomeTitle: string
  welcomeDescription: string
  playPauseShortcut: string
  stepShortcut: string
  searchPlaceholder: string
  algorithmsCount: string
  algorithmCountLabel: string
  expandSidebar: string
  collapseSidebar: string
  tabCode: string
  tabAbout: string
  tabProperties: string
  selectAlgorithmCode: string
  expandCodePanel: string
  collapseCodePanel: string
  variables: string
  speed: string
  skipToStart: string
  stepBackward: string
  playPause: string
  stepForward: string
  skipToEnd: string
  step: string
  controlsLabel: string
  progressStep: string
  speedLevel: string
  resizeSidebar: string
  resizeCodePanel: string
  queue: string
  stack: string
  empty: string
  distances: string
  predecessors: string
  order: string
  sets: string
  themeDark: string
  themeLight: string
  demoExample: string
  categories: Record<string, string>
  algorithmNames: Record<string, string>
  algorithmDescriptions: Record<string, string>
}

const enDescriptions: Record<string, string> = {
  dijkstra: `Dijkstra

Dijkstra finds shortest paths from one source in a weighted graph whose edge weights are non-negative.

How it works:
1. Set the source distance to 0 and all other distances to infinity
2. Repeatedly select the unvisited vertex with the smallest tentative distance
3. Relax every outgoing edge from that vertex
4. Stop when all reachable vertices are finalized

Time Complexity: O((V + E) log V)
Space Complexity: O(V)

Applications:
- Road networks with non-negative costs
- Routing and navigation
- Shortest-path trees`,

  'bellman-ford': `Bellman-Ford

Bellman-Ford solves single-source shortest paths on directed graphs that may contain negative edge weights, as long as no reachable negative cycle exists.

How it works:
1. Initialize distances from the source
2. Repeat V - 1 passes over every edge
3. Relax an edge when it improves the destination distance
4. A final extra pass can detect a negative cycle

Time Complexity: O(VE)
Space Complexity: O(V)

Applications:
- Graphs with negative costs
- Difference constraints
- Negative-cycle detection`,

  bellman: `Bellman

Bellman's dynamic-programming shortest-path recurrence computes the best distance using at most k edges, then increases k until every simple shortest path is covered.

How it works:
1. Let D[0][source] = 0 and every other value be infinity
2. For k = 1 to V - 1, copy the previous distance row
3. For every edge u -> v, test D[k - 1][u] + weight(u, v)
4. Keep the best value for each destination

Time Complexity: O(VE)
Space Complexity: O(V)

Applications:
- Dynamic-programming view of shortest paths
- Routing recurrences
- Teaching edge-count-limited paths`,

  kruskal: `Kruskal

Kruskal builds a minimum spanning tree by scanning edges from lightest to heaviest and accepting only edges that connect different components.

How it works:
1. Sort all edges by weight
2. Start with every vertex in its own component
3. Accept an edge if it connects two different components
4. Reject an edge if it would create a cycle

Time Complexity: O(E log E)
Space Complexity: O(V)

Applications:
- Minimum-cost network design
- Clustering
- Graph preprocessing`,

  prim: `Prim

Prim grows a minimum spanning tree from one start vertex, always adding the cheapest edge that connects the current tree to a new vertex.

How it works:
1. Start with one vertex in the tree
2. Track the cheapest known edge into each outside vertex
3. Add the outside vertex with the smallest key
4. Update frontier keys from the new vertex

Time Complexity: O(E log V)
Space Complexity: O(V)

Applications:
- Minimum spanning trees
- Network layout
- Greedy optimization examples`,

  'connected-components': `Connected Components

Connected components partition an undirected graph into maximal groups where every vertex is reachable from every other vertex in the same group.

How it works:
1. Scan every vertex
2. When an unvisited vertex is found, start a DFS or BFS
3. Mark every reachable vertex with the same component
4. Continue scanning for the next component

Time Complexity: O(V + E)
Space Complexity: O(V)

Applications:
- Network segmentation
- Island/group detection
- Preprocessing disconnected graphs`,

  kosaraju: `Kosaraju

Kosaraju finds strongly connected components in a directed graph with two DFS passes.

How it works:
1. Run DFS on the original graph and push vertices by finishing time
2. Reverse every edge
3. Process vertices in reverse finishing order
4. Each DFS on the reversed graph produces one strongly connected component

Time Complexity: O(V + E)
Space Complexity: O(V)

Applications:
- Strongly connected components
- Dependency analysis
- Directed graph condensation`,

  'eulerian-path': `Eulerian Path

An Eulerian path uses every edge exactly once. This visualization uses Hierholzer's algorithm on a graph where every vertex has even degree, so the result is an Eulerian circuit.

How it works:
1. Start from a valid vertex
2. Walk along unused edges until stuck
3. Backtrack vertices into the final circuit
4. The reversed backtracking order is the Eulerian traversal

Time Complexity: O(V + E)
Space Complexity: O(E)

Applications:
- Route inspection
- Drawing graphs without lifting the pen
- Edge-covering traversals`,

  'welsh-powell': `Welsh-Powell

Welsh-Powell greedily colors vertices in decreasing degree order, assigning the same color to as many non-adjacent vertices as possible.

How it works:
1. Sort vertices by decreasing degree
2. Give a new color to the first uncolored vertex
3. Reuse that color on later vertices that are not adjacent to the color group
4. Repeat until every vertex is colored

Time Complexity: O(V^2)
Space Complexity: O(V)

Applications:
- Scheduling
- Register allocation intuition
- Map and conflict coloring`,

  'ford-fulkerson': `Maximum Flow - Ford-Fulkerson

Ford-Fulkerson computes a maximum flow from a source to a sink in a directed capacity network.

How it works:
1. Start with zero flow on every edge
2. Search an augmenting path in the residual network
3. Push the path bottleneck through each edge
4. Repeat until no augmenting path remains

Time Complexity: O(E * maxFlow) with integral capacities
Space Complexity: O(V + E)

Applications:
- Network routing and bandwidth
- Bipartite matching reductions
- Source-sink capacity planning`,

  'union-find': `Union-Find

Union-Find maintains disjoint sets with near-constant find and union operations. It is the auxiliary structure behind Kruskal's cycle checks.

How it works:
1. makeSet creates one set per vertex
2. find returns the representative root of a set
3. union merges two sets when their roots differ
4. Path compression and rank keep trees shallow

Time Complexity: O(alpha(V)) amortized
Space Complexity: O(V)

Applications:
- Kruskal's algorithm
- Dynamic connectivity
- Cycle detection in undirected graphs`,
}

const frDescriptions: Record<string, string> = {
  dijkstra: `Dijkstra

Dijkstra trouve les plus courts chemins depuis une source dans un graphe pondere dont les poids sont non negatifs.

Fonctionnement:
1. Mettre la distance de la source a 0 et les autres a l'infini
2. Choisir a chaque etape le sommet non visite avec la plus petite distance temporaire
3. Relacher toutes ses aretes sortantes
4. Arreter quand tous les sommets atteignables sont fixes

Complexite temporelle: O((V + E) log V)
Complexite spatiale: O(V)

Applications:
- Reseaux routiers avec couts non negatifs
- Routage et navigation
- Arbres de plus courts chemins`,

  'bellman-ford': `Bellman-Ford

Bellman-Ford resout les plus courts chemins depuis une source dans des graphes orientes qui peuvent contenir des poids negatifs, sans cycle negatif atteignable.

Fonctionnement:
1. Initialiser les distances depuis la source
2. Faire V - 1 passages sur toutes les aretes
3. Relacher une arete si elle ameliore la distance d'arrivee
4. Un passage supplementaire peut detecter un cycle negatif

Complexite temporelle: O(VE)
Complexite spatiale: O(V)

Applications:
- Graphes avec couts negatifs
- Contraintes de difference
- Detection de cycles negatifs`,

  bellman: `Bellman

La recurrence de programmation dynamique de Bellman calcule la meilleure distance avec au plus k aretes, puis augmente k jusqu'a couvrir tout plus court chemin simple.

Fonctionnement:
1. Poser D[0][source] = 0 et les autres valeurs a l'infini
2. Pour k = 1 a V - 1, copier la ligne precedente
3. Pour chaque arete u -> v, tester D[k - 1][u] + poids(u, v)
4. Garder la meilleure valeur pour chaque destination

Complexite temporelle: O(VE)
Complexite spatiale: O(V)

Applications:
- Vue programmation dynamique des plus courts chemins
- Recurrences de routage
- Chemins limites par nombre d'aretes`,

  kruskal: `Kruskal

Kruskal construit un arbre couvrant minimal en parcourant les aretes de la plus legere a la plus lourde et en acceptant seulement celles qui relient deux composants differents.

Fonctionnement:
1. Trier toutes les aretes par poids
2. Commencer avec un composant par sommet
3. Accepter une arete si elle relie deux composants differents
4. Rejeter une arete si elle cree un cycle

Complexite temporelle: O(E log E)
Complexite spatiale: O(V)

Applications:
- Conception de reseaux a cout minimal
- Clustering
- Pretraitement de graphes`,

  prim: `Prim

Prim fait grandir un arbre couvrant minimal depuis un sommet initial, en ajoutant toujours l'arete la moins chere qui connecte l'arbre a un nouveau sommet.

Fonctionnement:
1. Demarrer avec un sommet dans l'arbre
2. Suivre l'arete la moins chere vers chaque sommet externe
3. Ajouter le sommet externe avec la plus petite cle
4. Mettre a jour les cles de frontiere

Complexite temporelle: O(E log V)
Complexite spatiale: O(V)

Applications:
- Arbres couvrants minimaux
- Disposition de reseaux
- Exemples d'optimisation gloutonne`,

  'connected-components': `Composantes connexes

Les composantes connexes decoupent un graphe non oriente en groupes maximaux ou chaque sommet est atteignable depuis tous les autres sommets du meme groupe.

Fonctionnement:
1. Parcourir tous les sommets
2. Quand un sommet non visite est trouve, lancer un DFS ou BFS
3. Marquer tous les sommets atteignables avec le meme composant
4. Continuer pour trouver le composant suivant

Complexite temporelle: O(V + E)
Complexite spatiale: O(V)

Applications:
- Segmentation de reseaux
- Detection de groupes
- Pretraitement de graphes non connexes`,

  kosaraju: `Kosaraju

Kosaraju trouve les composantes fortement connexes d'un graphe oriente avec deux passages DFS.

Fonctionnement:
1. Faire un DFS sur le graphe original et empiler les sommets par temps de fin
2. Inverser toutes les aretes
3. Traiter les sommets dans l'ordre inverse des temps de fin
4. Chaque DFS sur le graphe inverse donne une composante fortement connexe

Complexite temporelle: O(V + E)
Complexite spatiale: O(V)

Applications:
- Composantes fortement connexes
- Analyse de dependances
- Graphe condense oriente`,

  'eulerian-path': `Chemin eulerien

Un chemin eulerien utilise chaque arete exactement une fois. Cette visualisation utilise l'algorithme de Hierholzer sur un graphe ou tous les sommets ont un degre pair; le resultat est donc un circuit eulerien.

Fonctionnement:
1. Commencer depuis un sommet valide
2. Avancer sur des aretes non utilisees jusqu'a blocage
3. Ajouter les sommets au circuit final pendant le retour arriere
4. L'ordre inverse donne le parcours eulerien

Complexite temporelle: O(V + E)
Complexite spatiale: O(E)

Applications:
- Inspection de routes
- Dessiner un graphe sans lever le crayon
- Parcours couvrant toutes les aretes`,

  'welsh-powell': `Welsh-Powell

Welsh-Powell colorie les sommets de facon gloutonne dans l'ordre des degres decroissants, en reutilisant une couleur sur autant de sommets non adjacents que possible.

Fonctionnement:
1. Trier les sommets par degre decroissant
2. Donner une nouvelle couleur au premier sommet non colorie
3. Reutiliser cette couleur pour les sommets suivants non adjacents au groupe
4. Repeter jusqu'a colorier tous les sommets

Complexite temporelle: O(V^2)
Complexite spatiale: O(V)

Applications:
- Planification
- Allocation de registres
- Coloration de cartes et conflits`,

  'ford-fulkerson': `Flot maximum - Ford-Fulkerson

Ford-Fulkerson calcule un flot maximum d'une source vers un puits dans un reseau oriente avec capacites.

Fonctionnement:
1. Commencer avec un flot nul sur chaque arete
2. Chercher un chemin augmentant dans le reseau residuel
3. Pousser le goulot du chemin sur chaque arete
4. Repeter jusqu'a ce qu'il n'existe plus de chemin augmentant

Complexite temporelle: O(E * flot max) avec capacites entieres
Complexite spatiale: O(V + E)

Applications:
- Routage reseau et bande passante
- Reductions vers le couplage biparti
- Planification de capacites source-puits`,

  'union-find': `Union-Find

Union-Find maintient des ensembles disjoints avec des operations find et union presque constantes. C'est la structure auxiliaire derriere les tests de cycle de Kruskal.

Fonctionnement:
1. makeSet cree un ensemble par sommet
2. find retourne la racine representante d'un ensemble
3. union fusionne deux ensembles quand leurs racines different
4. Compression de chemin et rang gardent les arbres peu profonds

Complexite temporelle: O(alpha(V)) amortie
Complexite spatiale: O(V)

Applications:
- Algorithme de Kruskal
- Connectivite dynamique
- Detection de cycles dans les graphes non orientes`,
}

export const translations: Record<Locale, Translations> = {
  en: {
    siteTitle: 'GraphForce',
    siteDescription:
      'Interactive graph theory visualizations for shortest paths, spanning trees, connectivity, coloring, flows, and Union-Find.',
    welcomeTitle: 'GraphForce',
    welcomeDescription:
      'Select a graph algorithm from the sidebar to watch each step unfold.\nThe visualizer focuses on classic graph theory concepts and problems.',
    playPauseShortcut: 'Play / Pause',
    stepShortcut: 'Step',
    searchPlaceholder: 'Search graph algorithms...',
    algorithmsCount: '{count} algorithms',
    algorithmCountLabel: '{count} algorithms',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    tabCode: 'Code',
    tabAbout: 'Explanation',
    tabProperties: 'Properties',
    selectAlgorithmCode: 'Select an algorithm to view its code',
    expandCodePanel: 'Expand code panel',
    collapseCodePanel: 'Collapse code panel',
    variables: 'Variables',
    speed: 'Speed',
    skipToStart: 'Skip to start',
    stepBackward: 'Step backward',
    playPause: 'Play/Pause',
    stepForward: 'Step forward',
    skipToEnd: 'Skip to end',
    step: 'Step {n}:',
    controlsLabel: 'Playback controls',
    progressStep: 'Step {current} of {total}',
    speedLevel: 'Speed level {n} of 5',
    resizeSidebar: 'Resize sidebar',
    resizeCodePanel: 'Resize code panel',
    queue: 'Queue',
    stack: 'Stack',
    empty: 'empty',
    distances: 'Distances',
    predecessors: 'Predecessors',
    order: 'Order',
    sets: 'Sets',
    themeDark: 'Dark mode',
    themeLight: 'Light mode',
    demoExample: 'Demo example',
    categories: {
      'Shortest Paths': 'Shortest Paths',
      'Spanning Trees': 'Spanning Trees',
      Connectivity: 'Connectivity',
      'Traversal / Properties': 'Traversal / Properties',
      Coloring: 'Coloring',
      Flows: 'Flows',
      'Auxiliary Structures': 'Auxiliary Structures',
    },
    algorithmNames: {
      dijkstra: 'Dijkstra',
      'bellman-ford': 'Bellman-Ford',
      bellman: 'Bellman',
      kruskal: 'Kruskal',
      prim: 'Prim',
      'connected-components': 'Connected Components',
      kosaraju: 'Kosaraju',
      'eulerian-path': 'Eulerian Path',
      'welsh-powell': 'Welsh-Powell',
      'ford-fulkerson': 'Maximum Flow',
      'union-find': 'Union-Find',
    },
    algorithmDescriptions: enDescriptions,
  },
  fr: {
    siteTitle: 'GraphForce',
    siteDescription:
      'Visualisations interactives de theorie des graphes : plus courts chemins, arbres couvrants, connectivite, coloration, flots et Union-Find.',
    welcomeTitle: 'GraphForce',
    welcomeDescription:
      'Selectionnez un algorithme de graphe dans la barre laterale pour suivre chaque etape.\nLe visualiseur se concentre sur les concepts classiques de theorie des graphes.',
    playPauseShortcut: 'Lecture / Pause',
    stepShortcut: 'Etape',
    searchPlaceholder: 'Rechercher un algorithme...',
    algorithmsCount: '{count} algorithmes',
    algorithmCountLabel: '{count} algorithmes',
    expandSidebar: 'Afficher la barre laterale',
    collapseSidebar: 'Masquer la barre laterale',
    tabCode: 'Code',
    tabAbout: 'Explication',
    tabProperties: 'Proprietes',
    selectAlgorithmCode: 'Selectionnez un algorithme pour voir son code',
    expandCodePanel: 'Afficher le panneau de code',
    collapseCodePanel: 'Masquer le panneau de code',
    variables: 'Variables',
    speed: 'Vitesse',
    skipToStart: 'Aller au debut',
    stepBackward: 'Etape precedente',
    playPause: 'Lecture/Pause',
    stepForward: 'Etape suivante',
    skipToEnd: 'Aller a la fin',
    step: 'Etape {n} :',
    controlsLabel: 'Controles de lecture',
    progressStep: 'Etape {current} sur {total}',
    speedLevel: 'Vitesse {n} sur 5',
    resizeSidebar: 'Redimensionner la barre laterale',
    resizeCodePanel: 'Redimensionner le panneau de code',
    queue: 'File',
    stack: 'Pile',
    empty: 'vide',
    distances: 'Distances',
    predecessors: 'Predecesseurs',
    order: 'Ordre',
    sets: 'Ensembles',
    themeDark: 'Mode sombre',
    themeLight: 'Mode clair',
    demoExample: 'Cas de demo',
    categories: {
      'Shortest Paths': 'Plus courts chemins',
      'Spanning Trees': 'Arbres couvrants',
      Connectivity: 'Connectivite',
      'Traversal / Properties': 'Parcours / proprietes',
      Coloring: 'Coloration',
      Flows: 'Flots',
      'Auxiliary Structures': 'Structures auxiliaires',
    },
    algorithmNames: {
      dijkstra: 'Dijkstra',
      'bellman-ford': 'Bellman-Ford',
      bellman: 'Bellman',
      kruskal: 'Kruskal',
      prim: 'Prim',
      'connected-components': 'Composantes connexes',
      kosaraju: 'Kosaraju',
      'eulerian-path': 'Chemin eulerien',
      'welsh-powell': 'Welsh-Powell',
      'ford-fulkerson': 'Flot maximum',
      'union-find': 'Union-Find',
    },
    algorithmDescriptions: frDescriptions,
  },
}

export function t(locale: Locale, key: keyof Translations): string {
  return translations[locale][key] as string
}

export function getAlgorithmName(locale: Locale, algorithmId: string, fallbackName: string): string {
  return translations[locale].algorithmNames[algorithmId] ?? fallbackName
}

export function getAlgorithmDescription(locale: Locale, algorithmId: string): string | undefined {
  return translations[locale].algorithmDescriptions[algorithmId]
}

export function getCategoryName(locale: Locale, categoryKey: string): string {
  return translations[locale].categories[categoryKey] || categoryKey
}

export function getAlgorithmMetaTitle(locale: Locale, algorithmId: string, fallbackName: string): string {
  const desc = translations[locale].algorithmDescriptions[algorithmId]
  const name = getAlgorithmName(locale, algorithmId, fallbackName)
  if (!desc) return `${name} | GraphForce`
  const firstLine = desc.split('\n')[0].trim()
  return `${firstLine || name} | GraphForce`
}

export function getAlgorithmMetaDescription(locale: Locale, algorithmId: string): string {
  const desc = translations[locale].algorithmDescriptions[algorithmId]
  if (!desc) return translations[locale].siteDescription
  const paragraphs = desc.split('\n\n')
  const content = paragraphs.length > 1 ? paragraphs[1] : paragraphs[0]
  const cleaned = content.replace(/\n/g, ' ').trim()
  if (cleaned.length <= 160) return cleaned
  return cleaned.slice(0, 157) + '...'
}
