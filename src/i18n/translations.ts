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
  shortestPathResults: string
  unreachable: string
  resultPath: string
  components: string
  componentLabel: string
  processingNode: string
  treeNodes: string
  treeEdges: string
  remainingNodes: string
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

Bellman-Ford solves shortest paths from a chosen source. Directed graphs may contain positive or negative weights, but no negative-weight cycle. Undirected graphs are accepted only with strictly positive weights.

How it works:
1. Initialize distances from the source
2. Repeat V - 1 passes over every edge
3. Relax an edge when it improves the destination distance
4. A final extra pass detects a negative cycle before the run is accepted

Time Complexity: O(VE)
Space Complexity: O(V)

Applications:
- Graphs with negative costs
- Difference constraints
- Negative-cycle detection`,

  bellman: `Bellman

This Bellman variant computes shortest paths in a directed acyclic graph by relaxing edges in topological order from a chosen source.

How it works:
1. Verify that the graph is directed and acyclic
2. Compute a topological order
3. Set the source distance to 0
4. Relax outgoing edges following that order

Time Complexity: O(V + E)
Space Complexity: O(V)

Applications:
- DAG shortest paths
- Project scheduling graphs
- Dependency networks`,

  kruskal: `Kruskal

Kruskal builds a minimum spanning tree on a connected, weighted, undirected graph by scanning edges from lightest to heaviest and accepting only edges that connect different components.

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

Prim grows a minimum spanning tree on a connected, weighted, undirected graph, always adding the cheapest edge that connects the current tree to a new vertex.

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

A directed Eulerian path uses every directed edge exactly once. This visualization uses Hierholzer's algorithm after checking in-degree/out-degree conditions.

How it works:
1. Start from a valid vertex
2. Walk along unused outgoing edges until stuck
3. Backtrack vertices into the final path
4. The reversed backtracking order is the Eulerian traversal

Time Complexity: O(V + E)
Space Complexity: O(E)

Applications:
- Route inspection
- Drawing graphs without lifting the pen
- Edge-covering traversals`,

  'eulerian-circuit': `Eulerian Circuit

A directed Eulerian circuit uses every directed edge exactly once and returns to its start. Every non-isolated vertex must be connected and have equal in-degree and out-degree.

How it works:
1. Verify the directed circuit conditions
2. Start from a non-isolated vertex
3. Walk along unused outgoing edges
4. Backtrack to produce the final circuit

Time Complexity: O(V + E)
Space Complexity: O(E)

Applications:
- Directed route inspection
- Circuit reconstruction
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

  'edge-coloring': `Edge Coloring

Edge coloring assigns colors to edges so that two edges sharing a vertex do not use the same color.

How it works:
1. Order edges by how many other edges touch them
2. Inspect colors already used on adjacent edges
3. Assign the first available color to the current edge
4. Repeat until every edge is colored

Time Complexity: O(E^2)
Space Complexity: O(E)

Applications:
- Timetabling with pair conflicts
- Frequency assignment intuition
- Edge-conflict visualization`,

  'ford-fulkerson': `Maximum Flow - Ford-Fulkerson

Ford-Fulkerson computes a maximum flow from a source to a sink in a directed capacity network.

How it works:
1. Start with zero flow on every edge
2. Search an augmenting path in the residual network
3. Push the path bottleneck through each edge
4. Repeat until no augmenting path remains

Time Complexity: O(VE^2) with Edmonds-Karp BFS augmenting paths
Space Complexity: O(V + E)

Applications:
- Network routing and bandwidth
- Bipartite matching reductions
- Source-sink capacity planning`,

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

Bellman-Ford resout les plus courts chemins depuis une source choisie. Les graphes orientes peuvent contenir des poids positifs ou negatifs, mais aucun circuit absorbant. Les graphes non orientes sont acceptes seulement avec des poids strictement positifs.

Fonctionnement:
1. Initialiser les distances depuis la source
2. Faire V - 1 passages sur toutes les aretes
3. Relacher une arete si elle ameliore la distance d'arrivee
4. Un passage supplementaire detecte un circuit absorbant avant d accepter l execution

Complexite temporelle: O(VE)
Complexite spatiale: O(V)

Applications:
- Graphes avec couts negatifs
- Contraintes de difference
- Detection de cycles negatifs`,

  bellman: `Bellman

Cette variante de Bellman calcule les plus courts chemins dans un graphe oriente acyclique en relachant les aretes selon un ordre topologique depuis une source choisie.

Fonctionnement:
1. Verifier que le graphe est oriente et sans cycle
2. Calculer un ordre topologique
3. Mettre la distance de la source a 0
4. Relacher les aretes sortantes dans cet ordre

Complexite temporelle: O(V + E)
Complexite spatiale: O(V)

Applications:
- Plus courts chemins dans les DAG
- Graphes de planification
- Reseaux de dependances`,

  kruskal: `Kruskal

Kruskal construit un arbre couvrant minimal sur un graphe connexe, pondere et non oriente en parcourant les aretes de la plus legere a la plus lourde et en acceptant seulement celles qui relient deux composants differents.

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

Prim fait grandir un arbre couvrant minimal sur un graphe connexe, pondere et non oriente, en ajoutant toujours l'arete la moins chere qui connecte l'arbre a un nouveau sommet.

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

Un chemin eulerien oriente utilise chaque arete orientee exactement une fois. Cette visualisation utilise Hierholzer apres verification des degres entrants/sortants.

Fonctionnement:
1. Commencer depuis un sommet valide
2. Avancer sur des aretes sortantes non utilisees jusqu'au blocage
3. Ajouter les sommets au chemin final pendant le retour arriere
4. L'ordre inverse donne le parcours eulerien

Complexite temporelle: O(V + E)
Complexite spatiale: O(E)

Applications:
- Inspection de routes
- Dessiner un graphe sans lever le crayon
- Parcours couvrant toutes les aretes`,

  'eulerian-circuit': `Circuit eulerien

Un circuit eulerien oriente utilise chaque arete orientee exactement une fois et revient a son sommet de depart. Chaque sommet non isole doit etre connecte et avoir degre entrant = degre sortant.

Fonctionnement:
1. Verifier les conditions du circuit oriente
2. Commencer depuis un sommet non isole
3. Avancer sur les aretes sortantes non utilisees
4. Revenir en arriere pour produire le circuit final

Complexite temporelle: O(V + E)
Complexite spatiale: O(E)

Applications:
- Inspection de routes orientees
- Reconstruction de circuits
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

  'edge-coloring': `Coloration des aretes

La coloration des aretes attribue des couleurs aux aretes pour que deux aretes partageant un sommet n utilisent pas la meme couleur.

Fonctionnement:
1. Ordonner les aretes selon le nombre d autres aretes qui les touchent
2. Observer les couleurs deja utilisees sur les aretes adjacentes
3. Attribuer la premiere couleur disponible a l arete courante
4. Repeter jusqu a colorier toutes les aretes

Complexite temporelle: O(E^2)
Complexite spatiale: O(E)

Applications:
- Planification avec conflits par paire
- Attribution de frequences
- Visualisation des conflits entre aretes`,

  'ford-fulkerson': `Flot maximum - Ford-Fulkerson

Ford-Fulkerson calcule un flot maximum d'une source vers un puits dans un reseau oriente avec capacites.

Fonctionnement:
1. Commencer avec un flot nul sur chaque arete
2. Chercher un chemin augmentant dans le reseau residuel
3. Pousser le goulot du chemin sur chaque arete
4. Repeter jusqu'a ce qu'il n'existe plus de chemin augmentant

Complexite temporelle: O(VE^2) avec chemins augmentants BFS Edmonds-Karp
Complexite spatiale: O(V + E)

Applications:
- Routage reseau et bande passante
- Reductions vers le couplage biparti
- Planification de capacites source-puits`,

}

export const translations: Record<Locale, Translations> = {
  en: {
    siteTitle: 'GraphForce',
    siteDescription:
      'Interactive graph theory visualizations for shortest paths, spanning trees, connectivity, coloring, and flows.',
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
    shortestPathResults: 'Shortest path results',
    unreachable: 'unreachable',
    resultPath: 'Result path',
    components: 'Components',
    componentLabel: 'Component {n}',
    processingNode: 'Processing node',
    treeNodes: 'Tree nodes',
    treeEdges: 'Tree edges',
    remainingNodes: 'Remaining nodes',
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
      'eulerian-circuit': 'Eulerian Circuit',
      'welsh-powell': 'Welsh-Powell',
      'edge-coloring': 'Edge Coloring',
      'ford-fulkerson': 'Maximum Flow',
    },
    algorithmDescriptions: enDescriptions,
  },
  fr: {
    siteTitle: 'GraphForce',
    siteDescription:
      'Visualisations interactives de theorie des graphes : plus courts chemins, arbres couvrants, connectivite, coloration et flots.',
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
    shortestPathResults: 'Resultats des plus courts chemins',
    unreachable: 'inatteignable',
    resultPath: 'Chemin resultat',
    components: 'Composantes',
    componentLabel: 'Composante {n}',
    processingNode: 'Sommet en cours',
    treeNodes: 'Sommets dans l arbre',
    treeEdges: 'Aretes de l arbre',
    remainingNodes: 'Sommets restants',
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
      'eulerian-circuit': 'Circuit eulerien',
      'welsh-powell': 'Welsh-Powell',
      'edge-coloring': 'Coloration des aretes',
      'ford-fulkerson': 'Flot maximum',
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
