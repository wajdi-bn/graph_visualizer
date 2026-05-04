import type { Algorithm } from '@lib/types'
import type { Locale, Translations } from '@i18n/translations'
import { getAlgorithmName, getCategoryName, locales, localeNames } from '@i18n/translations'
import Controls from '@components/Controls'
import GraphExamplePicker from '@components/GraphExamplePicker'
import type { SessionGraph, SessionGraphDraft } from '@lib/sessionGraphs'
import type { FundamentalGraphKind } from '@lib/fundamentalGraphs'

interface HeaderProps {
  locale: Locale
  t: Translations
  selectedAlgorithm: Algorithm | null
  sidebarCollapsed: boolean
  codePanelCollapsed: boolean
  onExpandSidebar: () => void
  onExpandCodePanel: () => void
  currentStep: number
  totalSteps: number
  isPlaying: boolean
  speed: number
  onTogglePlay: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onSpeedChange: (speed: number) => void
  onStepChange: (step: number) => void
  isMobile?: boolean
  onToggleMobileSidebar?: () => void
  onToggleMobileCodePanel?: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  selectedExampleId: string | null
  sessionGraphs: SessionGraph[]
  onExampleChange: (exampleId: string) => void
  onCreateGraph: () => void
  onCreatePresetGraph: (draft: SessionGraphDraft) => void
  onCreateFundamentalGraph: (kind: FundamentalGraphKind, size: number) => void
  onEditGraph: (graphId: string) => void
}

function getLandingUrl(targetLocale: Locale) {
  return targetLocale === 'en' ? '/' : `/${targetLocale}/`
}

function getLocaleUrl(targetLocale: Locale, algorithmId?: string) {
  if (algorithmId) return targetLocale === 'en' ? `/${algorithmId}` : `/${targetLocale}/${algorithmId}`
  return targetLocale === 'en' ? '/app' : `/${targetLocale}/app`
}

export default function Header({
  locale,
  t,
  selectedAlgorithm,
  sidebarCollapsed,
  codePanelCollapsed,
  onExpandSidebar,
  onExpandCodePanel,
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onSpeedChange,
  onStepChange,
  isMobile = false,
  onToggleMobileSidebar,
  onToggleMobileCodePanel,
  theme,
  onToggleTheme,
  selectedExampleId,
  sessionGraphs,
  onExampleChange,
  onCreateGraph,
  onCreatePresetGraph,
  onCreateFundamentalGraph,
  onEditGraph,
}: HeaderProps) {
  const algorithmName = selectedAlgorithm
    ? getAlgorithmName(locale, selectedAlgorithm.id, selectedAlgorithm.name)
    : null

  return (
    <header
      className="relative z-[60] h-12 shrink-0 flex items-center justify-between px-3 md:px-5 border-b border-white/8 bg-black"
      role="banner"
    >
      <div className="flex items-center gap-2 md:gap-3 min-w-0 shrink-0">
        {isMobile ? (
          <HeaderIconButton
            onClick={onToggleMobileSidebar}
            label={locale === 'fr' ? 'Ouvrir le menu' : 'Open menu'}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </HeaderIconButton>
        ) : sidebarCollapsed ? (
          <button
            onClick={onExpandSidebar}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/6 transition-colors text-neutral-400 hover:text-white"
            aria-label={t.expandSidebar}
          >
            <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.245 2.5H14.5V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H6.245V2.5ZM4.995 2.5H1.5V12.5C1.5 13.0523 1.94772 13.5 2.5 13.5H4.995V2.5ZM0 1H1.5H14.5H16V2.5V12.5C16 13.8807 14.8807 15 13.5 15H2.5C1.11929 15 0 13.8807 0 12.5V2.5V1Z"
                fill="currentColor"
              />
            </svg>
          </button>
        ) : null}

        <a
          href={getLandingUrl(locale)}
          className="flex items-center gap-2 md:gap-2.5 hover:opacity-80 transition-opacity min-w-0"
          aria-label="GraphForce - Home"
        >
          <img src="/graphforce-logo.svg" alt="" className="h-7 w-7 shrink-0" />
          {!selectedAlgorithm && !isMobile && (
            <span className="font-semibold text-sm tracking-tight text-white font-heading">
              Graph<span className="text-[var(--app-accent)]">Force</span>
            </span>
          )}
        </a>

        {selectedAlgorithm && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <span className="text-neutral-600 shrink-0">/</span>
            <span className="text-xs text-neutral-500 hidden md:inline shrink-0">
              {getCategoryName(locale, selectedAlgorithm.category)}
            </span>
            <span className="text-neutral-600 hidden md:inline shrink-0">/</span>
            <span className="text-xs font-medium text-neutral-300 truncate" aria-current="page">
              {algorithmName}
            </span>
          </nav>
        )}
      </div>

      {!isMobile && (
        <div className="flex-1 flex justify-center min-w-0 mx-2">
          <Controls
            currentStep={currentStep}
            totalSteps={totalSteps}
            isPlaying={isPlaying}
            speed={speed}
            onTogglePlay={onTogglePlay}
            onStepForward={onStepForward}
            onStepBackward={onStepBackward}
            onSpeedChange={onSpeedChange}
            onStepChange={onStepChange}
            disabled={totalSteps === 0}
            locale={locale}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2 min-w-0 shrink-0">
        {isMobile && selectedAlgorithm && (
          <HeaderIconButton
            onClick={onToggleMobileCodePanel}
            label={locale === 'fr' ? 'Voir le code' : 'View code'}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </HeaderIconButton>
        )}

        {selectedAlgorithm && (
          <GraphExamplePicker
            locale={locale}
            selectedAlgorithm={selectedAlgorithm}
            selectedExampleId={selectedExampleId}
            sessionGraphs={sessionGraphs}
            onExampleChange={onExampleChange}
            onCreateGraph={onCreateGraph}
            onCreatePresetGraph={onCreatePresetGraph}
            onCreateFundamentalGraph={onCreateFundamentalGraph}
            onEditGraph={onEditGraph}
          />
        )}

        <button
          onClick={onToggleTheme}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/6 transition-colors text-neutral-400 hover:text-white"
          aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
          title={theme === 'dark' ? t.themeLight : t.themeDark}
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M12 18.75V21M4.22 4.22l1.59 1.59M18.19 18.19l1.59 1.59M3 12h2.25M18.75 12H21M4.22 19.78l1.59-1.59M18.19 5.81l1.59-1.59" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>

        {!isMobile && codePanelCollapsed && (
          <button
            onClick={onExpandCodePanel}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/6 transition-colors text-neutral-400 hover:text-white"
            aria-label={t.expandCodePanel}
          >
            <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9.755 2.5H1.5V12.5C1.5 13.0523 1.94772 13.5 2.5 13.5H9.755V2.5ZM11.005 2.5H14.5V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H11.005V2.5ZM16 1H14.5H1.5H0V2.5V12.5C0 13.8807 1.11929 15 2.5 15H13.5C14.8807 15 16 13.8807 16 12.5V2.5V1Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}

        <nav aria-label={locale === 'fr' ? 'Langue' : 'Language'} className="flex items-center gap-0.5 bg-white/6 rounded-lg p-0.5 border border-white/8">
          {locales.map((targetLocale) => (
            <a
              key={targetLocale}
              href={getLocaleUrl(targetLocale, selectedAlgorithm?.id)}
              className={`px-2 md:px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                targetLocale === locale
                  ? 'bg-white text-black'
                  : 'text-neutral-500 hover:text-white hover:bg-white/6'
              }`}
              aria-label={localeNames[targetLocale]}
              aria-current={targetLocale === locale ? 'page' : undefined}
              lang={targetLocale}
            >
              {targetLocale.toUpperCase()}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function HeaderIconButton({
  onClick,
  label,
  children,
}: {
  onClick?: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/6 transition-colors text-neutral-400 hover:text-white shrink-0"
      aria-label={label}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}
