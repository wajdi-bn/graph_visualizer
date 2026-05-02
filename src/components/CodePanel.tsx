import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import type { Monaco } from '@monaco-editor/react'
import type { Locale } from '@i18n/translations'
import { translations } from '@i18n/translations'
import type { Difficulty, GraphState } from '@lib/types'
import ComplexityChart from '@components/ComplexityChart'
import {
  bfsTraversal,
  degreeMap,
  dfsTraversal,
  hasDirectedCycle,
  hasUndirectedCycle,
  isBipartiteGraph,
  isConnectedGraph,
  isEulerianCircuitGraph,
  isTree,
  label,
  shortestUnweightedPath,
} from '@lib/algorithms/graphAlgorithmUtils'

const LazyEditor = lazy(() => import('@monaco-editor/react'))

const DIFFICULTY_CONFIG: Record<Difficulty, { en: string; fr: string; color: string; bg: string }> =
  {
    easy: {
      en: 'Easy',
      fr: 'Facile',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20',
    },
    intermediate: {
      en: 'Intermediate',
      fr: 'Intermediaire',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10 border-amber-400/20',
    },
    advanced: {
      en: 'Advanced',
      fr: 'Avance',
      color: 'text-red-400',
      bg: 'bg-red-400/10 border-red-400/20',
    },
  }

type PropertyKey =
  | 'bfs'
  | 'dfs'
  | 'path'
  | 'cycle'
  | 'circuit'
  | 'bipartite'
  | 'tree'
  | 'regular'

interface PropertyResult {
  title: string
  verdict: string
  description: string
  steps: string[]
  tags: string[]
}

interface CodePanelProps {
  code: string
  description: string
  difficulty?: Difficulty
  currentLine?: number
  variables?: Record<string, string | number | boolean | null>
  consoleOutput?: string[]
  graph?: GraphState
  activeTab: 'code' | 'about' | 'properties'
  onTabChange: (tab: 'code' | 'about' | 'properties') => void
  onPropertySelect?: (property: PropertyKey) => void
  locale?: Locale
  theme?: 'dark' | 'light'
}

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme('algoviz-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#000000',
      'editor.lineHighlightBackground': '#ffffff06',
      'editorLineNumber.foreground': '#333',
      'editorLineNumber.activeForeground': '#facc15',
      'editor.selectionBackground': '#ffffff15',
      'editorCursor.foreground': '#fff',
    },
  })
  monaco.editor.defineTheme('algoviz-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.lineHighlightBackground': '#0f172a08',
      'editorLineNumber.foreground': '#cbd5e1',
      'editorLineNumber.activeForeground': '#ca8a04',
      'editor.selectionBackground': '#0f172a18',
      'editorCursor.foreground': '#111827',
    },
  })
}

export default function CodePanel({
  code,
  description,
  difficulty,
  currentLine,
  variables,
  consoleOutput,
  graph,
  activeTab,
  onTabChange,
  onPropertySelect,
  locale = 'en',
  theme = 'dark',
}: CodePanelProps) {
  const t = translations[locale]
  const [isMounted, setIsMounted] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<PropertyKey>('bfs')
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const decorationsRef = useRef<string[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleEditorDidMount = useCallback(
    (editor: any, monacoInstance: Monaco) => {
      defineTheme(monacoInstance)
      monacoInstance.editor.setTheme(theme === 'light' ? 'algoviz-light' : 'algoviz-dark')
      editorRef.current = editor
      monacoRef.current = monacoInstance

      // Apply initial line highlight
      if (currentLine != null && currentLine > 0) {
        decorationsRef.current = editor.deltaDecorations(
          [],
          [
            {
              range: new monacoInstance.Range(currentLine, 1, currentLine, 1),
              options: {
                isWholeLine: true,
                className: 'algoviz-active-line',
                linesDecorationsClassName: 'algoviz-active-line-gutter',
              },
            },
          ],
        )
      }

      setEditorReady(true)
    },
    [currentLine, theme],
  )

  useEffect(() => {
    monacoRef.current?.editor.setTheme(theme === 'light' ? 'algoviz-light' : 'algoviz-dark')
  }, [theme])

  // Build inline variable annotation for the active line
  const inlineVarText = useMemo(() => {
    if (!variables || Object.keys(variables).length === 0) return ''
    const parts = Object.entries(variables).map(
      ([k, v]) => `${k} = ${typeof v === 'string' ? v : JSON.stringify(v)}`,
    )
    return '  // ' + parts.join(', ')
  }, [variables])

  const graphProperties = useMemo(() => {
    if (!graph) return null

    const nodes = graph.nodes
    const edges = graph.edges
    const directed = Boolean(graph.directed || edges.some((edge) => edge.directed))
    const degrees = degreeMap(nodes, edges, false)
    const connected = isConnectedGraph(nodes, edges, false)
    const cycle = directed ? hasDirectedCycle(nodes, edges) : hasUndirectedCycle(nodes, edges)
    const tree = !directed && isTree(nodes, edges)
    const regular = !directed ? Object.values(degrees).every((degree, _, arr) => degree === arr[0]) : null

    let bipartiteValue: boolean | null = null
    if (!directed) {
      const colors = new Map<number, 0 | 1>()
      let valid = true
      const adj = new Map<number, number[]>()
      for (const node of nodes) adj.set(node.id, [])
      for (const edge of edges) {
        adj.get(edge.from)?.push(edge.to)
        adj.get(edge.to)?.push(edge.from)
      }
      for (const node of nodes) {
        if (colors.has(node.id)) continue
        colors.set(node.id, 0)
        const queue = [node.id]
        while (queue.length > 0 && valid) {
          const current = queue.shift()!
          for (const neighbor of adj.get(current) ?? []) {
            const currentColor = colors.get(current)!
            const neighborColor = colors.get(neighbor)
            if (neighborColor == null) {
              colors.set(neighbor, currentColor === 0 ? 1 : 0)
              queue.push(neighbor)
            } else if (neighborColor === currentColor) {
              valid = false
              break
            }
          }
        }
        if (!valid) break
      }
      bipartiteValue = valid
    }

    return {
      nodesCount: nodes.length,
      edgesCount: edges.length,
      directed,
      connected,
      cycle,
      tree,
      bipartite: bipartiteValue,
      regular,
      degreeEntries: Object.entries(degrees),
    }
  }, [graph])

  const propertyResult = useMemo<PropertyResult | null>(() => {
    if (!graphProperties || !graph) return null

    const nodes = graph.nodes
    const edges = graph.edges
    const directed = graphProperties.directed
    const source = nodes[0]?.id
    const target = nodes[nodes.length - 1]?.id

    const makeVerdict = (value: boolean, yesLabel: string, noLabel: string) =>
      value ? yesLabel : noLabel

    switch (selectedProperty) {
      case 'bfs': {
        if (source == null) return null
        const result = bfsTraversal(nodes, edges, source, directed)
        return {
          title: locale === 'fr' ? 'Parcours en largeur' : 'Breadth-first traversal',
          verdict: locale === 'fr' ? 'Ordre de parcours calculé' : 'Traversal order computed',
          description:
            locale === 'fr'
              ? `La file visite d'abord les sommets les plus proches de ${label(nodes, source)}.`
              : `The queue visits the vertices closest to ${label(nodes, source)} first.`,
          steps: [
            locale === 'fr'
              ? `Ordre BFS : ${result.order.map((id) => label(nodes, id)).join(' -> ')}`
              : `BFS order: ${result.order.map((id) => label(nodes, id)).join(' -> ')}`,
            locale === 'fr'
              ? `Distances : ${nodes.map((node) => `${label(nodes, node.id)}=${result.distances[node.id]}`).join(', ')}`
              : `Distances: ${nodes.map((node) => `${label(nodes, node.id)}=${result.distances[node.id]}`).join(', ')}`,
          ],
          tags: [locale === 'fr' ? 'Parcours' : 'Traversal', locale === 'fr' ? 'File' : 'Queue'],
        }
      }
      case 'dfs': {
        if (source == null) return null
        const result = dfsTraversal(nodes, edges, source, directed)
        return {
          title: locale === 'fr' ? 'Parcours en profondeur' : 'Depth-first traversal',
          verdict: locale === 'fr' ? 'Ordre de parcours calculé' : 'Traversal order computed',
          description:
            locale === 'fr'
              ? `La pile descend avant de revenir en arrière depuis ${label(nodes, source)}.`
              : `The stack goes deep before backtracking from ${label(nodes, source)}.`,
          steps: [
            locale === 'fr'
              ? `Ordre DFS : ${result.order.map((id) => label(nodes, id)).join(' -> ')}`
              : `DFS order: ${result.order.map((id) => label(nodes, id)).join(' -> ')}`,
          ],
          tags: [locale === 'fr' ? 'Parcours' : 'Traversal', locale === 'fr' ? 'Pile' : 'Stack'],
        }
      }
      case 'path': {
        if (source == null || target == null) return null
        const result = shortestUnweightedPath(nodes, edges, source, target, directed)
        const pathText = result.path.length > 0 ? result.path.map((id) => label(nodes, id)).join(' -> ') : (locale === 'fr' ? 'Aucun chemin' : 'No path')
        return {
          title: locale === 'fr' ? 'Recherche de chemin' : 'Path search',
          verdict: result.path.length > 0 ? (locale === 'fr' ? 'Chemin trouvé' : 'Path found') : (locale === 'fr' ? 'Chemin introuvable' : 'Path not found'),
          description:
            locale === 'fr'
              ? `On cherche un chemin simple entre ${label(nodes, source)} et ${label(nodes, target)}.`
              : `We search for a simple path between ${label(nodes, source)} and ${label(nodes, target)}.`,
          steps: [
            locale === 'fr'
              ? `Chemin : ${pathText}`
              : `Path: ${pathText}`,
            locale === 'fr'
              ? `Prédecesseurs : ${nodes.map((node) => `${label(nodes, node.id)}=${result.predecessors[node.id] == null ? '-' : label(nodes, result.predecessors[node.id] as number)}`).join(', ')}`
              : `Predecessors: ${nodes.map((node) => `${label(nodes, node.id)}=${result.predecessors[node.id] == null ? '-' : label(nodes, result.predecessors[node.id] as number)}`).join(', ')}`,
          ],
          tags: [locale === 'fr' ? 'Chemin' : 'Path', locale === 'fr' ? 'BFS' : 'BFS'],
        }
      }
      case 'cycle': {
        const hasCycle = directed ? hasDirectedCycle(nodes, edges) : hasUndirectedCycle(nodes, edges)
        return {
          title: locale === 'fr' ? 'Détection de cycle' : 'Cycle detection',
          verdict: makeVerdict(hasCycle, locale === 'fr' ? 'Cycle trouvé' : 'Cycle found', locale === 'fr' ? 'Aucun cycle' : 'No cycle'),
          description:
            locale === 'fr'
              ? 'Un DFS suit les arêtes et détecte une remontée vers un sommet déjà actif.'
              : 'A DFS follows edges and detects a back-edge to an active vertex.',
          steps: [
            locale === 'fr'
              ? `Résultat : ${hasCycle ? 'le graphe contient un cycle' : 'le graphe est acyclique'}`
              : `Result: ${hasCycle ? 'the graph contains a cycle' : 'the graph is acyclic'}`,
          ],
          tags: [locale === 'fr' ? 'DFS' : 'DFS', locale === 'fr' ? 'Cycle' : 'Cycle'],
        }
      }
      case 'circuit': {
        const circuit = isEulerianCircuitGraph(nodes, edges, directed)
        return {
          title: locale === 'fr' ? 'Circuit eulérien' : 'Eulerian circuit',
          verdict: circuit.eulerianCircuit ? (locale === 'fr' ? 'Circuit possible' : 'Circuit possible') : (locale === 'fr' ? 'Circuit impossible' : 'Circuit impossible'),
          description:
            locale === 'fr'
              ? 'Le test vérifie la connexité et les degrés pairs pour savoir si l on peut parcourir toutes les arêtes une seule fois.'
              : 'The test checks connectivity and even degrees to see whether every edge can be traversed exactly once.',
          steps: [
            locale === 'fr'
              ? `Connexe : ${circuit.connected ? 'oui' : 'non'}`
              : `Connected: ${circuit.connected ? 'yes' : 'no'}`,
            locale === 'fr'
              ? `Tous les degrés pairs : ${circuit.allEven ? 'oui' : 'non'}`
              : `All degrees even: ${circuit.allEven ? 'yes' : 'no'}`,
          ],
          tags: [locale === 'fr' ? 'Eulerien' : 'Eulerian', locale === 'fr' ? 'Arêtes' : 'Edges'],
        }
      }
      case 'bipartite': {
        if (directed) {
          return {
            title: locale === 'fr' ? 'Bipartition' : 'Bipartite check',
            verdict: locale === 'fr' ? 'Non applicable' : 'Not applicable',
            description: locale === 'fr' ? 'Le test est appliqué aux graphes non orientés.' : 'The check is applied to undirected graphs.',
            steps: [],
            tags: [locale === 'fr' ? 'Non orienté' : 'Undirected'],
          }
        }
        const result = isBipartiteGraph(nodes, edges, directed)
        return {
          title: locale === 'fr' ? 'Bipartition' : 'Bipartite check',
          verdict: result.bipartite ? (locale === 'fr' ? 'Biparti' : 'Bipartite') : (locale === 'fr' ? 'Non biparti' : 'Not bipartite'),
          description:
            locale === 'fr'
              ? 'Une coloration à deux couleurs est propagée par BFS; un conflit prouve que le graphe n est pas biparti.'
              : 'A two-coloring is propagated by BFS; a conflict proves the graph is not bipartite.',
          steps: [
            locale === 'fr'
              ? `Coloration : ${nodes.map((node) => `${label(nodes, node.id)}=${result.color[node.id] == null ? '-' : result.color[node.id] === 0 ? 'A' : 'B'}`).join(', ')}`
              : `Coloring: ${nodes.map((node) => `${label(nodes, node.id)}=${result.color[node.id] == null ? '-' : result.color[node.id] === 0 ? 'A' : 'B'}`).join(', ')}`,
          ],
          tags: [locale === 'fr' ? '2 couleurs' : '2-coloring'],
        }
      }
      case 'tree': {
        const tree = isTree(nodes, edges)
        return {
          title: locale === 'fr' ? 'Test d arbre' : 'Tree check',
          verdict: tree ? (locale === 'fr' ? 'Arbre' : 'Tree') : (locale === 'fr' ? 'Pas un arbre' : 'Not a tree'),
          description:
            locale === 'fr'
              ? 'Un arbre est connexe et sans cycle, avec exactement V - 1 arêtes.'
              : 'A tree is connected and acyclic, with exactly V - 1 edges.',
          steps: [
            locale === 'fr'
              ? `Connexité : ${graphProperties.connected ? 'oui' : 'non'}`
              : `Connectivity: ${graphProperties.connected ? 'yes' : 'no'}`,
            locale === 'fr'
              ? `V - 1 arêtes : ${edges.length === nodes.length - 1 ? 'oui' : 'non'}`
              : `V - 1 edges: ${edges.length === nodes.length - 1 ? 'yes' : 'no'}`,
          ],
          tags: [locale === 'fr' ? 'Arbre' : 'Tree'],
        }
      }
      case 'regular': {
        if (directed) {
          return {
            title: locale === 'fr' ? 'Régularité' : 'Regularity',
            verdict: locale === 'fr' ? 'Non applicable' : 'Not applicable',
            description: locale === 'fr' ? 'Le test de régularité est ici interprété sur les graphes non orientés.' : 'Regularity is interpreted here on undirected graphs.',
            steps: [],
            tags: [locale === 'fr' ? 'Non orienté' : 'Undirected'],
          }
        }
        const first = graphProperties.degreeEntries[0]?.[1]
        const regular = graphProperties.degreeEntries.every(([, degree]) => degree === first)
        return {
          title: locale === 'fr' ? 'Régularité' : 'Regularity',
          verdict: regular ? (locale === 'fr' ? 'Graphe régulier' : 'Regular graph') : (locale === 'fr' ? 'Graphe non régulier' : 'Irregular graph'),
          description:
            locale === 'fr'
              ? 'Le graphe est régulier si tous les sommets ont le même degré.'
              : 'A graph is regular if every vertex has the same degree.',
          steps: [
            locale === 'fr'
              ? `Degrés : ${graphProperties.degreeEntries.map(([id, degree]) => `${id}=${degree}`).join(', ')}`
              : `Degrees: ${graphProperties.degreeEntries.map(([id, degree]) => `${id}=${degree}`).join(', ')}`,
          ],
          tags: [locale === 'fr' ? 'Degrés' : 'Degrees'],
        }
      }
    }
  }, [graph, graphProperties, locale, selectedProperty])

  // Update line highlight + inline variable annotation when currentLine/variables change
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    if (currentLine != null && currentLine > 0) {
      const decorations: any[] = [
        {
          range: new monaco.Range(currentLine, 1, currentLine, 1),
          options: {
            isWholeLine: true,
            className: 'algoviz-active-line',
            linesDecorationsClassName: 'algoviz-active-line-gutter',
          },
        },
      ]

      // Add inline variable annotation after the active line content
      if (inlineVarText) {
        decorations.push({
          range: new monaco.Range(
            currentLine,
            Number.MAX_SAFE_INTEGER,
            currentLine,
            Number.MAX_SAFE_INTEGER,
          ),
          options: {
            after: {
              content: inlineVarText,
              inlineClassName: 'algoviz-inline-vars',
            },
          },
        })
      }

      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations)

      // Scroll to the active line
      editor.revealLineInCenterIfOutsideViewport(currentLine)
    } else {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])
    }
  }, [currentLine, editorReady, inlineVarText])

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div
        className="flex border-b border-white/8 shrink-0"
        role="tablist"
        aria-label={locale === 'fr' ? 'Onglets code et details' : 'Code and details tabs'}
        onKeyDown={(e) => {
          const tabs = ['code', 'about', 'properties'] as const
          const currentIndex = tabs.indexOf(activeTab)
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            onTabChange(tabs[(currentIndex + 1) % tabs.length])
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            onTabChange(tabs[(currentIndex - 1 + tabs.length) % tabs.length])
          }
        }}
      >
        {(['code', 'about', 'properties'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`tabpanel-${tab}`}
            id={`tab-${tab}`}
            tabIndex={activeTab === tab ? 0 : -1}
            className={`px-3 py-2.5 md:px-5 md:py-3 text-xs font-medium transition-all relative capitalize ${
              activeTab === tab ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab === 'code' ? t.tabCode : tab === 'about' ? t.tabAbout : t.tabProperties}
              <kbd
                className={`code-panel-tab-kbd inline-flex items-center justify-center w-[18px] h-[18px] text-[10px] font-mono rounded border ${
                  activeTab === tab
                    ? 'border-white/20 text-white/60 bg-white/6'
                    : 'border-white/10 text-neutral-600 bg-white/3'
                }`}
                aria-hidden="true"
              >
                {tab === 'code' ? 'C' : tab === 'about' ? 'E' : 'P'}
              </kbd>
            </span>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-2 right-2 h-px bg-white" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'code' ? (
        <div
          className="flex-1 flex flex-col overflow-hidden"
          role="tabpanel"
          id="tabpanel-code"
          aria-labelledby="tab-code"
        >
          <div
            className="flex-1 overflow-hidden transition-opacity duration-500 ease-in-out"
            style={{ opacity: editorReady ? 1 : 0 }}
          >
            {isMounted && (
              <Suspense fallback={null}>
                <LazyEditor
                  defaultLanguage="javascript"
                  value={code}
                  theme="vs-dark"
                  onMount={handleEditorDidMount}
                  loading={null}
                  options={{
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    lineHeight: 28,
                    fontFamily: "'Geist Mono', ui-monospace, monospace",
                    fontLigatures: true,
                    renderLineHighlight: 'none',
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                    scrollbar: {
                      vertical: 'hidden',
                      horizontal: 'hidden',
                      handleMouseWheel: true,
                    },
                    lineNumbers: 'on',
                    lineDecorationsWidth: 12,
                    lineNumbersMinChars: 3,
                    glyphMargin: false,
                    folding: false,
                    contextmenu: false,
                    selectionHighlight: false,
                    occurrencesHighlight: 'off',
                    renderLineHighlightOnlyWhenFocus: false,
                    matchBrackets: 'never',
                    padding: { top: 12, bottom: 12 },
                    guides: { indentation: false },
                    wordWrap: 'off',
                    cursorStyle: 'line-thin',
                    cursorBlinking: 'solid',
                    fixedOverflowWidgets: true,
                    hover: { enabled: true },
                  }}
                />
              </Suspense>
            )}
          </div>

          {/* Console output panel */}
          {consoleOutput && consoleOutput.length > 0 && (
            <div
              className="shrink-0 border-t border-white/[0.08] max-h-[140px] flex flex-col"
              role="region"
              aria-label={locale === 'fr' ? 'Sortie console' : 'Console output'}
            >
              <div className="px-4 py-2 flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-neutral-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Console
                  </span>
                  <span className="text-[10px] text-neutral-600 tabular-nums">
                    ({consoleOutput.length})
                  </span>
                </div>
              </div>
              <div className="px-4 pb-3 overflow-auto flex-1 min-h-0" aria-live="polite">
                {consoleOutput.map((line, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 text-[11px] font-mono leading-[18px] ${
                      i === consoleOutput.length - 1 ? 'text-emerald-300/90' : 'text-neutral-500'
                    }`}
                  >
                    <span className="text-neutral-600 select-none shrink-0" aria-hidden="true">
                      {'›'}
                    </span>
                    <span className="break-all">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variables panel */}
          {variables && Object.keys(variables).length > 0 && (
            <div
              className="shrink-0 border-t border-white/8"
              role="region"
              aria-label={t.variables}
            >
              <div className="px-4 py-2 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-neutral-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.104.401l1.445-.889"
                    />
                  </svg>
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    {t.variables}
                  </span>
                </div>
              </div>
              <div className="px-4 pb-3 flex flex-wrap gap-x-3 gap-y-1.5" aria-live="polite">
                {Object.entries(variables).map(([name, value]) => (
                  <div
                    key={name}
                    className="inline-flex items-center gap-1.5 text-[12px] font-mono"
                  >
                    <span className="text-neutral-300">{name}</span>
                    <span className="text-neutral-600" aria-hidden="true">
                      =
                    </span>
                    <span className="sr-only">=</span>
                    <span
                      className={`font-medium ${
                        typeof value === 'number'
                          ? 'text-amber-300/90'
                          : typeof value === 'boolean'
                            ? value
                              ? 'text-emerald-400/90'
                              : 'text-red-400/90'
                            : value === null
                              ? 'text-neutral-600'
                              : 'text-sky-300/90'
                      }`}
                    >
                      {value === null
                        ? 'null'
                        : typeof value === 'boolean'
                          ? String(value)
                          : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'about' ? (
        <div
          className="flex-1 overflow-auto p-4 md:p-6"
          role="tabpanel"
          id="tabpanel-about"
          aria-labelledby="tab-about"
        >
          <article className="text-[13px] text-neutral-400 leading-relaxed whitespace-pre-wrap font-[inherit]">
            {(() => {
              const lines = description.split('\n')
              const elements: React.ReactElement[] = []
              let listItems: React.ReactElement[] = []

              const flushList = () => {
                if (listItems.length > 0) {
                  elements.push(
                    <ul key={`list-${elements.length}`} className="list-none m-0 p-0" role="list">
                      {listItems}
                    </ul>,
                  )
                  listItems = []
                }
              }

              lines.forEach((line, i) => {
                const isBullet = line.trim().startsWith('-') || line.trim().startsWith('\u2022')

                if (!isBullet) flushList()

                if (i === 0 && line.trim()) {
                  elements.push(
                    <div key={i} className="mb-4">
                      <h3 className="text-lg font-semibold text-white font-heading">{line}</h3>
                      {difficulty &&
                        (() => {
                          const cfg = DIFFICULTY_CONFIG[difficulty]
                          const label = locale === 'fr' ? cfg.fr : cfg.en
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${cfg.bg} ${cfg.color}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${difficulty === 'easy' ? 'bg-emerald-400' : difficulty === 'intermediate' ? 'bg-amber-400' : 'bg-red-400'}`}
                              />
                              {label}
                            </span>
                          )
                        })()}
                    </div>,
                  )
                } else if (
                  line.match(
                    /^[A-Z\u00C1-\u00DA][a-zA-Z\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\s]+:$/,
                  )
                ) {
                  elements.push(
                    <h4
                      key={i}
                      className="text-sm font-semibold text-neutral-200 mt-5 mb-2 font-heading"
                    >
                      {line}
                    </h4>,
                  )
                } else if (isBullet) {
                  listItems.push(
                    <li key={i} className="flex gap-2 ml-2 my-0.5">
                      <span className="text-neutral-600 shrink-0" aria-hidden="true">
                        {'\u2022'}
                      </span>
                      <span>{line.trim().replace(/^[-\u2022]\s*/, '')}</span>
                    </li>,
                  )
                } else if (line.match(/^\s{2,}/)) {
                  elements.push(
                    <div key={i} className="font-mono text-xs text-neutral-500 ml-4 my-0.5">
                      {line.trim()}
                    </div>,
                  )
                } else if (line.trim().match(/^\d+\./)) {
                  elements.push(
                    <div key={i} className="flex gap-2 ml-2 my-0.5">
                      <span>{line.trim()}</span>
                    </div>,
                  )
                } else if (!line.trim()) {
                  elements.push(<div key={i} className="h-2" />)
                } else {
                  elements.push(
                    <p key={i} className="my-1">
                      {line}
                    </p>,
                  )
                }
              })

              flushList()

              // Insert complexity chart right after the title
              if (elements.length > 0) {
                elements.splice(
                  1,
                  0,
                  <ComplexityChart
                    key="complexity-chart"
                    description={description}
                    locale={locale}
                  />,
                )
              }

              return elements
            })()}
          </article>
        </div>
      ) : (
        <div
          className="flex-1 overflow-auto p-4 md:p-6"
          role="tabpanel"
          id="tabpanel-properties"
          aria-labelledby="tab-properties"
        >
          {!graphProperties ? (
            <div className="h-full flex items-center justify-center text-neutral-600 text-sm">
              {locale === 'fr'
                ? 'Selectionnez un algorithme ou un graphe pour analyser ses proprietes.'
                : 'Select an algorithm or graph to analyze its properties.'}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white font-heading mb-1">
                  {locale === 'fr' ? 'Proprietes et traitements' : 'Properties and treatments'}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {locale === 'fr'
                    ? 'Cliquez une propriete pour lancer son calcul sur le graphe courant.'
                    : 'Click a property to run its calculation on the current graph.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {PROPERTY_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSelectedProperty(item.key)
                      onPropertySelect?.(item.key)
                    }}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      selectedProperty === item.key
                        ? 'border-white/20 bg-white/8 text-white'
                        : 'border-white/8 bg-white/3 text-neutral-400 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-[11px] text-neutral-600">{item.hint}</div>
                  </button>
                ))}
              </div>

              {propertyResult && (
                <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
                  <div>
                    <h4 className="text-base font-semibold text-white">{propertyResult.title}</h4>
                    <div className="text-sm text-emerald-300/90 font-medium">{propertyResult.verdict}</div>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed">{propertyResult.description}</p>
                  <div className="space-y-2">
                    {propertyResult.steps.map((line) => (
                      <div key={line} className="text-[12px] font-mono text-neutral-300 bg-black/20 rounded-md px-3 py-2 border border-white/8">
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {propertyResult.tags.map((tag) => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider rounded-full border border-white/8 bg-white/5 px-2 py-1 text-neutral-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <PropertyRow label={locale === 'fr' ? 'Type' : 'Type'} value={graphProperties.directed ? (locale === 'fr' ? 'Oriente' : 'Directed') : (locale === 'fr' ? 'Non oriente' : 'Undirected')} />
                <PropertyRow label={locale === 'fr' ? 'Sommets' : 'Vertices'} value={graphProperties.nodesCount} />
                <PropertyRow label={locale === 'fr' ? 'Aretes' : 'Edges'} value={graphProperties.edgesCount} />
                <PropertyRow label={locale === 'fr' ? 'Connexe' : 'Connected'} value={graphProperties.connected ? yesNo(locale, true) : yesNo(locale, false)} />
                <PropertyRow label={locale === 'fr' ? 'Cycle' : 'Cycle'} value={graphProperties.cycle ? yesNo(locale, true) : yesNo(locale, false)} />
                <PropertyRow label={locale === 'fr' ? 'Arbre' : 'Tree'} value={graphProperties.tree ? yesNo(locale, true) : graphProperties.directed ? (locale === 'fr' ? 'Non applique' : 'Not applicable') : yesNo(locale, false)} />
                <PropertyRow label={locale === 'fr' ? 'Biparti' : 'Bipartite'} value={graphProperties.bipartite == null ? (locale === 'fr' ? 'Non applique' : 'Not applicable') : yesNo(locale, graphProperties.bipartite)} />
                <PropertyRow label={locale === 'fr' ? 'Regulier' : 'Regular'} value={graphProperties.regular == null ? (locale === 'fr' ? 'Non applique' : 'Not applicable') : yesNo(locale, graphProperties.regular)} />
              </div>

              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  {locale === 'fr' ? 'Degrés' : 'Degrees'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {graphProperties.degreeEntries.map(([id, degree]) => (
                    <span key={id} className="text-xs font-mono bg-white/6 text-neutral-300 px-2 py-1 rounded-md border border-white/8">
                      {id}: {degree}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const PROPERTY_ITEMS: Array<{ key: PropertyKey; label: string; hint: string }> = [
  { key: 'bfs', label: 'BFS', hint: 'Parcours en largeur' },
  { key: 'dfs', label: 'DFS', hint: 'Parcours en profondeur' },
  { key: 'path', label: 'Path', hint: 'Chaîne / chemin' },
  { key: 'cycle', label: 'Cycle', hint: 'Détection de cycle' },
  { key: 'circuit', label: 'Circuit', hint: 'Circuit eulérien' },
  { key: 'bipartite', label: 'Bipartite', hint: '2-coloration' },
  { key: 'tree', label: 'Tree', hint: 'Arbre' },
  { key: 'regular', label: 'Regular', hint: 'Régularité' },
]

function yesNo(locale: Locale, value: boolean) {
  if (locale === 'fr') return value ? 'Oui' : 'Non'
  return value ? 'Yes' : 'No'
}

function PropertyRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-white/8 bg-white/3 px-3 py-2">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className="text-sm font-medium text-white tabular-nums">{value}</span>
    </div>
  )
}
