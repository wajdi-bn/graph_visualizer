import { useState, useEffect, useCallback, useRef } from 'react'
import type { Locale } from '@i18n/translations'
import {
  translations,
  getAlgorithmDescription,
  getAlgorithmMetaTitle,
  getAlgorithmMetaDescription,
} from '@i18n/translations'
import { algorithms, categories } from '@lib/algorithms'
import { usePlayback, SPEED_MAP } from '@hooks/usePlayback'
import { useResizablePanel } from '@hooks/useResizablePanel'
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts'
import Header from '@components/Header'
import Sidebar from '@components/Sidebar'
import WelcomeScreen from '@components/WelcomeScreen'
import GraphVisualizer from '@components/GraphVisualizer'
import CodePanel from '@components/CodePanel'
import GraphEditorModal from '@components/GraphEditorModal'
import type { Algorithm, Step } from '@lib/types'
import type { PropertyKey, PropertyDemoResult } from '@lib/algorithms/graphAlgorithmUtils'
import { buildPropertyDemo } from '@lib/algorithms/graphAlgorithmUtils'
import {
  getSessionGraphIdFromExampleId,
  makeSessionGraphExampleId,
  readSessionGraphs,
  SESSION_GRAPHS_CHANGED_EVENT,
  type SessionGraph,
} from '@lib/sessionGraphs'

const SIDEBAR_MAX = 260
const CODEPANEL_MAX = 420
const COLLAPSE_THRESHOLD = 100
const MOBILE_BREAKPOINT = 768

function getAlgorithmUrl(locale: string, algoId: string): string {
  return locale === 'fr' ? `/fr/${algoId}` : `/${algoId}`
}

function getAlgorithmIdFromPath(pathname: string): string | null {
  const cleaned = pathname.replace(/\/$/, '')
  if (cleaned === '' || cleaned === '/app' || cleaned === '/fr' || cleaned === '/fr/app') return null
  if (cleaned.startsWith('/fr/')) return cleaned.slice(4)
  return cleaned.slice(1)
}

interface AlgoVizProps {
  locale?: Locale
  initialAlgorithmId?: string
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}

export default function AlgoViz({ locale = 'en', initialAlgorithmId }: AlgoVizProps) {
  const t = translations[locale]
  const [activeTab, setActiveTab] = useState<'code' | 'about' | 'properties'>('code')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document === 'undefined') return 'dark'
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  })
  const [sessionGraphs, setSessionGraphs] = useState<SessionGraph[]>([])
  const [graphEditorOpen, setGraphEditorOpen] = useState(false)
  const [editingGraphId, setEditingGraphId] = useState<string | null>(null)
  const [propertyDemo, setPropertyDemo] = useState<PropertyDemoResult | null>(null)
  const [propertyDemoStep, setPropertyDemoStep] = useState(0)
  const [demoIsPlaying, setDemoIsPlaying] = useState(false)
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMobile = useIsMobile()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileCodePanelOpen, setMobileCodePanelOpen] = useState(false)

  const initialAlgorithm = initialAlgorithmId
    ? (algorithms.find((a) => a.id === initialAlgorithmId) ?? null)
    : null

  const {
    selectedAlgorithm,
    steps,
    currentStep,
    setCurrentStep,
    isPlaying,
    speed,
    setSpeed,
    selectAlgorithm: selectAlgorithmBase,
    selectExample,
    selectedExampleId,
    clearSelection,
    stepForward,
    stepBackward,
    togglePlay,
    pause,
    currentStepData,
    selectedSourceNodeId,
    setSelectedSourceNodeId,
  } = usePlayback(locale, initialAlgorithm)

  const sidebar = useResizablePanel({
    maxWidth: SIDEBAR_MAX,
    collapseThreshold: COLLAPSE_THRESHOLD,
    side: 'left',
  })

  const codePanel = useResizablePanel({
    maxWidth: CODEPANEL_MAX,
    collapseThreshold: COLLAPSE_THRESHOLD,
    side: 'right',
    initialCollapsed: !initialAlgorithmId,
  })

  useKeyboardShortcuts({ togglePlay, stepForward, stepBackward, onTabChange: setActiveTab })

  useEffect(() => {
    setSessionGraphs(readSessionGraphs())

    const handleGraphChange = () => setSessionGraphs(readSessionGraphs())
    window.addEventListener(SESSION_GRAPHS_CHANGED_EVENT, handleGraphChange)
    return () => window.removeEventListener(SESSION_GRAPHS_CHANGED_EVENT, handleGraphChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      localStorage.setItem('algoviz-theme', next)
      return next
    })
  }, [])

  useEffect(() => {
    if (!isMobile) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false)
        setMobileCodePanelOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isMobile])

  useEffect(() => {
    if (mobileSidebarOpen || mobileCodePanelOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileSidebarOpen, mobileCodePanelOpen])

  const updateMetaDescription = useCallback((description: string) => {
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description)
  }, [])

  const selectAlgorithm = useCallback(
    (algo: Algorithm) => {
      setPropertyDemo(null)
      setPropertyDemoStep(0)
      selectAlgorithmBase(algo)
      setActiveTab('code')
      setMobileSidebarOpen(false)
      codePanel.expand()
      const url = getAlgorithmUrl(locale, algo.id)
      window.history.pushState({ algorithmId: algo.id }, '', url)
      document.title = getAlgorithmMetaTitle(locale, algo.id, algo.name)
      updateMetaDescription(getAlgorithmMetaDescription(locale, algo.id))
    },
    [locale, selectAlgorithmBase, codePanel.expand, updateMetaDescription],
  )

  const openGraphEditor = useCallback((graphId: string | null = null) => {
    setEditingGraphId(graphId)
    setGraphEditorOpen(true)
  }, [])

  const handleSourceNodeClick = useCallback(
    (nodeId: number) => {
      if (!selectedAlgorithm || !selectedExampleId) return
      setSelectedSourceNodeId(nodeId)
      selectExample(selectedExampleId, nodeId)
    },
    [selectedAlgorithm, selectedExampleId, selectExample, setSelectedSourceNodeId],
  )

  const runPropertyDemo = useCallback(
    (property: PropertyKey) => {
      if (!currentStepData?.graph) return
      const graph = currentStepData.graph
      const demo = buildPropertyDemo(locale, graph.nodes, graph.edges, Boolean(graph.directed), property)
      if (!demo) return
      pause()
      setPropertyDemo(demo)
      setPropertyDemoStep(0)
      setDemoIsPlaying(true)
      setActiveTab('properties')
      codePanel.expand()
    },
    [locale, currentStepData?.graph, codePanel.expand, pause],
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('createGraph') !== '1') return
    openGraphEditor(null)
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [openGraphEditor])

  const handleGraphSaved = useCallback(
    (graph: SessionGraph) => {
      setSessionGraphs(readSessionGraphs())
      if (selectedAlgorithm) selectExample(makeSessionGraphExampleId(graph.id))
    },
    [selectedAlgorithm, selectExample],
  )

  const handleGraphDeleted = useCallback(
    (graphId: string) => {
      setSessionGraphs(readSessionGraphs())
      if (getSessionGraphIdFromExampleId(selectedExampleId) === graphId) {
        const fallbackExampleId = selectedAlgorithm?.examples?.[0]?.id
        if (fallbackExampleId) selectExample(fallbackExampleId)
      }
    },
    [selectedAlgorithm, selectedExampleId, selectExample],
  )

  useEffect(() => {
    const handlePopState = () => {
      const algoId = getAlgorithmIdFromPath(window.location.pathname)
      if (algoId) {
        const algo = algorithms.find((a) => a.id === algoId)
        if (algo) {
          selectAlgorithmBase(algo)
          setActiveTab('code')
          document.title = getAlgorithmMetaTitle(locale, algo.id, algo.name)
          updateMetaDescription(getAlgorithmMetaDescription(locale, algo.id))
          return
        }
      }
      clearSelection()
      document.title = t.siteTitle
      updateMetaDescription(t.siteDescription)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [
    locale,
    selectAlgorithmBase,
    clearSelection,
    t.siteTitle,
    t.siteDescription,
    updateMetaDescription,
  ])

  useEffect(() => {
    if (!propertyDemo) {
      setDemoIsPlaying(false)
      setPropertyDemoStep(0)
      return
    }

    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current)
      demoIntervalRef.current = null
    }

    if (demoIsPlaying && propertyDemo.steps.length > 0) {
      demoIntervalRef.current = setInterval(() => {
        setPropertyDemoStep((prev) => {
          if (prev >= propertyDemo.steps.length - 1) {
            setDemoIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, SPEED_MAP[speed] || 400)
    }

    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current)
        demoIntervalRef.current = null
      }
    }
  }, [propertyDemo, demoIsPlaying, speed])

  const getLocalizedDescription = (algo: Algorithm): string =>
    getAlgorithmDescription(locale, algo.id) ?? algo.description

  const isDemoActive = Boolean(propertyDemo)
  const demoSteps = propertyDemo?.steps ?? []
  const visualStep = propertyDemo ? propertyDemo.steps[propertyDemoStep] : currentStepData

  const demoStepForward = useCallback(() => {
    if (demoSteps.length === 0) return
    setPropertyDemoStep((prev) => Math.min(prev + 1, demoSteps.length - 1))
  }, [demoSteps.length])

  const demoStepBackward = useCallback(() => {
    if (demoSteps.length === 0) return
    setPropertyDemoStep((prev) => Math.max(prev - 1, 0))
  }, [demoSteps.length])

  const demoTogglePlay = useCallback(() => {
    if (demoSteps.length === 0) return
    setPropertyDemoStep((prev) => {
      if (prev >= demoSteps.length - 1) {
        setDemoIsPlaying(true)
        return 0
      }
      setDemoIsPlaying((playing) => !playing)
      return prev
    })
  }, [demoSteps.length])

  const demoStepChange = useCallback(
    (step: number) => {
      if (demoSteps.length === 0) return
      const next = Math.max(0, Math.min(step, demoSteps.length - 1))
      setPropertyDemoStep(next)
    },
    [demoSteps.length],
  )

  const displayCurrentStep = isDemoActive ? propertyDemoStep : currentStep
  const displayTotalSteps = isDemoActive ? demoSteps.length : steps.length
  const displayIsPlaying = isDemoActive ? demoIsPlaying : isPlaying
  const handleTogglePlay = isDemoActive ? demoTogglePlay : togglePlay
  const handleStepForward = isDemoActive ? demoStepForward : stepForward
  const handleStepBackward = isDemoActive ? demoStepBackward : stepBackward
  const handleStepChange = isDemoActive ? demoStepChange : setCurrentStep

  const renderVisualization = () => {
    if (!selectedAlgorithm || (!currentStepData && !propertyDemo)) {
      return <WelcomeScreen t={t} locale={locale} onSelectAlgorithm={selectAlgorithm} />
    }

    return (
      <div className="relative flex-1">
        {propertyDemo && (
          <div className="absolute left-3 top-3 z-20 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] text-neutral-200 backdrop-blur">
            {propertyDemo.title} · {propertyDemo.verdict}
          </div>
        )}
        {visualStep && (
          <GraphVisualizer
            step={visualStep}
            locale={locale}
            selectedSourceNodeId={selectedSourceNodeId}
            onSourceNodeClick={handleSourceNodeClick}
          />
        )}
      </div>
    )
  }

  const sidebarLabel = locale === 'fr' ? 'Categories d algorithmes' : 'Algorithm categories'
  const codePanelLabel = locale === 'fr' ? 'Panneau de code et details' : 'Code and details panel'

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--app-bg)]">
      <Header
        locale={locale}
        t={t}
        selectedAlgorithm={selectedAlgorithm}
        sidebarCollapsed={isMobile ? true : sidebar.collapsed}
        codePanelCollapsed={isMobile ? true : codePanel.collapsed}
        onExpandSidebar={isMobile ? () => setMobileSidebarOpen(true) : sidebar.expand}
        onExpandCodePanel={isMobile ? () => setMobileCodePanelOpen(true) : codePanel.expand}
        currentStep={displayCurrentStep}
        totalSteps={displayTotalSteps}
        isPlaying={displayIsPlaying}
        speed={speed}
        onTogglePlay={handleTogglePlay}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onSpeedChange={setSpeed}
        onStepChange={handleStepChange}
        isMobile={isMobile}
        onToggleMobileSidebar={() => setMobileSidebarOpen((value) => !value)}
        onToggleMobileCodePanel={() => setMobileCodePanelOpen((value) => !value)}
        theme={theme}
        onToggleTheme={toggleTheme}
        selectedExampleId={selectedExampleId}
        sessionGraphs={sessionGraphs}
        onExampleChange={selectExample}
        onCreateGraph={openGraphEditor}
        onEditGraph={(graphId) => openGraphEditor(graphId)}
      />

      <div className="flex-1 flex overflow-hidden relative bg-[var(--app-bg)]">
        {!isMobile && (
          <div className="relative shrink-0 flex">
            <aside
              className={`bg-black overflow-hidden ${
                sidebar.isDragging ? '' : 'transition-all duration-300 ease-in-out'
              }`}
              style={{
                width: sidebar.isDragging ? sidebar.width : sidebar.collapsed ? 0 : SIDEBAR_MAX,
              }}
              aria-label={sidebarLabel}
              aria-hidden={sidebar.collapsed}
              inert={sidebar.collapsed || undefined}
            >
              <div
                className="h-full flex flex-col"
                style={{
                  width: SIDEBAR_MAX,
                  opacity: sidebar.isDragging
                    ? Math.max(0, sidebar.width / SIDEBAR_MAX)
                    : sidebar.collapsed
                      ? 0
                      : 1,
                  transition: sidebar.isDragging ? 'none' : 'opacity 0.3s ease-in-out',
                }}
              >
                <Sidebar
                  categories={categories}
                  selectedId={selectedAlgorithm?.id ?? null}
                  onSelect={selectAlgorithm}
                  locale={locale}
                />
              </div>
            </aside>
            <DragHandle
              hidden={sidebar.collapsed && !sidebar.isDragging}
              dragging={sidebar.isDragging}
              onMouseDown={sidebar.handleDragStart}
              ariaLabel={t.resizeSidebar}
              onCollapse={sidebar.collapse}
              side="left"
            />
          </div>
        )}

        {isMobile && (
          <>
            <div
              className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
                mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside
              className={`fixed top-0 left-0 bottom-0 w-[280px] bg-black z-50 border-r border-white/8 transition-transform duration-300 ease-in-out ${
                mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              aria-label={sidebarLabel}
              aria-hidden={!mobileSidebarOpen}
              inert={!mobileSidebarOpen || undefined}
            >
              <div className="h-full flex flex-col">
                <DrawerHeader
                  title={locale === 'fr' ? 'Algorithmes' : 'Algorithms'}
                  closeLabel={locale === 'fr' ? 'Fermer le menu' : 'Close menu'}
                  onClose={() => setMobileSidebarOpen(false)}
                />
                <Sidebar
                  categories={categories}
                  selectedId={selectedAlgorithm?.id ?? null}
                  onSelect={selectAlgorithm}
                  locale={locale}
                />
              </div>
            </aside>
          </>
        )}

        <main
          id="main-content"
          className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[var(--app-bg)]"
          aria-label="Algorithm visualization"
        >
          <div className="flex-1 flex flex-col p-4 md:p-8 overflow-auto">
            {renderVisualization()}
          </div>

          <div className="px-4 pb-3 md:px-8 md:pb-5" aria-live="polite" aria-atomic="true">
            {visualStep?.description && (
              <div className="text-xs md:text-sm text-neutral-300 bg-white/5 rounded-lg px-3 py-2 md:px-5 md:py-3 border border-white/12">
                <span className="text-amber-300/90 font-medium mr-2">
                  {t.step.replace('{n}', String(displayCurrentStep + 1))}
                </span>
                {visualStep.description}
              </div>
            )}
          </div>
        </main>

        {!isMobile && (
          <div className="relative shrink-0 flex">
            <DragHandle
              hidden={codePanel.collapsed && !codePanel.isDragging}
              dragging={codePanel.isDragging}
              onMouseDown={codePanel.handleDragStart}
              ariaLabel={t.resizeCodePanel}
              onCollapse={codePanel.collapse}
              side="right"
            />
            <aside
              className={`bg-black overflow-hidden ${
                codePanel.isDragging ? '' : 'transition-all duration-300 ease-in-out'
              }`}
              style={{
                width: codePanel.isDragging
                  ? codePanel.width
                  : codePanel.collapsed
                    ? 0
                    : CODEPANEL_MAX,
              }}
              aria-label={codePanelLabel}
              aria-hidden={codePanel.collapsed}
              inert={codePanel.collapsed || undefined}
            >
              <div
                className="h-full flex flex-col"
                style={{
                  width: CODEPANEL_MAX,
                  opacity: codePanel.isDragging
                    ? Math.max(0, codePanel.width / CODEPANEL_MAX)
                    : codePanel.collapsed
                      ? 0
                      : 1,
                  transition: codePanel.isDragging ? 'none' : 'opacity 0.3s ease-in-out',
                }}
              >
                <CodePanelContent
                  selectedAlgorithm={selectedAlgorithm}
                  description={selectedAlgorithm ? getLocalizedDescription(selectedAlgorithm) : ''}
                  currentLine={visualStep?.codeLine}
                  variables={visualStep?.variables}
                  consoleOutput={visualStep?.consoleOutput}
                  graph={visualStep?.graph}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onPropertySelect={runPropertyDemo}
                  locale={locale}
                  theme={theme}
                  emptyText={t.selectAlgorithmCode}
                />
              </div>
            </aside>
          </div>
        )}

        {isMobile && (
          <>
            <div
              className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
                mobileCodePanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => setMobileCodePanelOpen(false)}
              aria-hidden="true"
            />
            <aside
              className={`fixed top-0 right-0 bottom-0 w-[min(360px,90vw)] bg-black z-50 border-l border-white/8 transition-transform duration-300 ease-in-out ${
                mobileCodePanelOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
              aria-label={codePanelLabel}
              aria-hidden={!mobileCodePanelOpen}
              inert={!mobileCodePanelOpen || undefined}
            >
              <div className="h-full flex flex-col">
                <DrawerHeader
                  title="Code"
                  closeLabel={locale === 'fr' ? 'Fermer le panneau' : 'Close panel'}
                  onClose={() => setMobileCodePanelOpen(false)}
                />
                <CodePanelContent
                  selectedAlgorithm={selectedAlgorithm}
                  description={selectedAlgorithm ? getLocalizedDescription(selectedAlgorithm) : ''}
                  currentLine={visualStep?.codeLine}
                  variables={visualStep?.variables}
                  consoleOutput={visualStep?.consoleOutput}
                  graph={visualStep?.graph}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onPropertySelect={runPropertyDemo}
                  locale={locale}
                  theme={theme}
                  emptyText={t.selectAlgorithmCode}
                />
              </div>
            </aside>
          </>
        )}
      </div>

      {isMobile && selectedAlgorithm && (
        <div className="shrink-0 flex items-center justify-between px-3 py-2 border-t border-white/8 bg-black z-10 gap-2">
          <MobileIconButton
            onClick={() => setMobileSidebarOpen(true)}
            label={locale === 'fr' ? 'Ouvrir le menu' : 'Open menu'}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </MobileIconButton>
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="flex items-center gap-1" role="group" aria-label={t.controlsLabel}>
              <ControlButton
                onClick={handleStepBackward}
                disabled={displayCurrentStep <= 0}
                label={t.stepBackward}
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.5 14.0607L9.96966 13.5303L5.14644 8.7071C4.75592 8.31658 4.75592 7.68341 5.14644 7.29289L9.96966 2.46966L10.5 1.93933L11.5607 2.99999L11.0303 3.53032L6.56065 7.99999L11.0303 12.4697L11.5607 13L10.5 14.0607Z"
                />
              </ControlButton>
              <button
                onClick={handleTogglePlay}
                className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 flex items-center justify-center transition-all active:scale-95"
                aria-label={t.playPause}
              >
                {displayIsPlaying ? (
                  <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-black" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M14.5528 7.77638C14.737 7.86851 14.737 8.13147 14.5528 8.2236L1.3618 14.8191C1.19558 14.9022 1 14.7813 1 14.5955L1 1.4045C1 1.21865 1.19558 1.09778 1.3618 1.18089L14.5528 7.77638Z"
                    />
                  </svg>
                )}
              </button>
              <ControlButton
                onClick={handleStepForward}
                disabled={displayCurrentStep >= displayTotalSteps - 1}
                label={t.stepForward}
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.50001 1.93933L6.03034 2.46966L10.8536 7.29288C11.2441 7.68341 11.2441 8.31657 10.8536 8.7071L6.03034 13.5303L5.50001 14.0607L4.43935 13L4.96968 12.4697L9.43935 7.99999L4.96968 3.53032L4.43935 2.99999L5.50001 1.93933Z"
                />
              </ControlButton>
            </div>
            <span className="text-[11px] text-neutral-600 font-mono tabular-nums ml-2">
              {displayTotalSteps > 0 ? `${displayCurrentStep + 1}/${displayTotalSteps}` : '-'}
            </span>
          </div>
          <MobileIconButton
            onClick={() => setMobileCodePanelOpen(true)}
            label={locale === 'fr' ? 'Voir le code' : 'View code'}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
            />
          </MobileIconButton>
        </div>
      )}

      <GraphEditorModal
        open={graphEditorOpen}
        locale={locale}
        graphs={sessionGraphs}
        initialGraphId={editingGraphId}
        onClose={() => setGraphEditorOpen(false)}
        onSaved={handleGraphSaved}
        onDeleted={handleGraphDeleted}
      />
    </div>
  )
}

function DragHandle({
  hidden,
  dragging,
  onMouseDown,
  ariaLabel,
  onCollapse,
  side,
}: {
  hidden: boolean
  dragging: boolean
  onMouseDown: (event: React.MouseEvent) => void
  ariaLabel: string
  onCollapse: () => void
  side: 'left' | 'right'
}) {
  return (
    <div
      className={`w-px shrink-0 cursor-col-resize group relative select-none ${hidden ? 'hidden' : ''}`}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      tabIndex={hidden ? -1 : 0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onCollapse()
        }
      }}
    >
      <div
        className={`absolute inset-y-0 ${side === 'left' ? '-left-0.5' : '-right-0.5'} w-[5px] z-20 ${
          dragging ? 'bg-blue-500/50' : 'hover:bg-white/10'
        } transition-colors`}
      />
      <div className="h-full bg-white/8" />
    </div>
  )
}

function DrawerHeader({
  title,
  closeLabel,
  onClose,
}: {
  title: string
  closeLabel: string
  onClose: () => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
      <span className="text-sm font-semibold text-white font-heading">{title}</span>
      <button
        onClick={onClose}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/6 text-neutral-400 hover:text-white transition-colors"
        aria-label={closeLabel}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function CodePanelContent({
  selectedAlgorithm,
  description,
  currentLine,
  variables,
  consoleOutput,
  graph,
  activeTab,
  onTabChange,
  onPropertySelect,
  locale,
  theme,
  emptyText,
}: {
  selectedAlgorithm: Algorithm | null
  description: string
  currentLine?: number
  variables?: Record<string, string | number | boolean | null>
  consoleOutput?: string[]
  graph?: Step['graph']
  activeTab: 'code' | 'about' | 'properties'
  onTabChange: (tab: 'code' | 'about' | 'properties') => void
  onPropertySelect?: (property: PropertyKey) => void
  locale: Locale
  theme: 'dark' | 'light'
  emptyText: string
}) {
  if (!selectedAlgorithm) {
    return <div className="h-full flex items-center justify-center text-neutral-600 text-sm">{emptyText}</div>
  }

  return (
    <CodePanel
      code={selectedAlgorithm.code}
      description={description}
      difficulty={selectedAlgorithm.difficulty}
      currentLine={currentLine}
      variables={variables}
      consoleOutput={consoleOutput}
      graph={graph}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onPropertySelect={onPropertySelect}
      locale={locale}
      theme={theme}
    />
  )
}

function MobileIconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/6 text-neutral-400 hover:text-white transition-colors shrink-0"
      aria-label={label}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}

function ControlButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-md hover:bg-white/8 disabled:opacity-20 text-neutral-500 hover:text-white transition-all active:scale-95"
      aria-label={label}
    >
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}
