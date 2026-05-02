import type { ReactNode, RefObject } from 'react'
import type { Locale } from '@i18n/translations'
import type { EditorDraft, EditorTool, Selection } from './graphEditorTypes'
import { hasSelection } from './graphEditorUtils'

interface GraphEditorToolbarProps {
  locale: Locale
  tool: EditorTool
  setTool: (tool: EditorTool) => void
  setEdgeStartId: (nodeId: number | null) => void
  history: { past: EditorDraft[]; future: EditorDraft[] }
  selection: Selection
  draft: EditorDraft
  fileInputRef: RefObject<HTMLInputElement | null>
  undo: () => void
  redo: () => void
  deleteSelected: () => void
  layoutCircle: () => void
  zoomBy: (factor: number) => void
  fitView: () => void
  importJson: (file: File) => void
  exportJson: () => void
  clearGraph: () => void
}

export function GraphEditorToolbar({
  locale,
  tool,
  setTool,
  setEdgeStartId,
  history,
  selection,
  draft,
  fileInputRef,
  undo,
  redo,
  deleteSelected,
  layoutCircle,
  zoomBy,
  fitView,
  importJson,
  exportJson,
  clearGraph,
}: GraphEditorToolbarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/8 px-3 py-2.5">
      <ToolButton
        active={tool === 'select'}
        label={locale === 'fr' ? 'Selectionner' : 'Select'}
        onClick={() => {
          setTool('select')
          setEdgeStartId(null)
        }}
      >
        <path d="M5 3.5 15 12l-5.1 1.1L8 18.5 5 3.5Z" />
      </ToolButton>
      <ToolButton
        active={tool === 'node'}
        label={locale === 'fr' ? 'Ajouter sommet' : 'Add node'}
        onClick={() => {
          setTool('node')
          setEdgeStartId(null)
        }}
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 9v6M9 12h6" />
      </ToolButton>
      <ToolButton
        active={tool === 'edge'}
        label={locale === 'fr' ? 'Connecter' : 'Connect'}
        onClick={() => {
          setTool('edge')
          setEdgeStartId(null)
        }}
      >
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <path d="m8 16 8-8" />
      </ToolButton>
      <ToolButton
        active={false}
        disabled={history.past.length === 0}
        label={locale === 'fr' ? 'Annuler' : 'Undo'}
        onClick={undo}
      >
        <path d="M9 7H4v5M4 12a7 7 0 1 0 2-5" />
      </ToolButton>
      <ToolButton
        active={false}
        disabled={history.future.length === 0}
        label={locale === 'fr' ? 'Retablir' : 'Redo'}
        onClick={redo}
      >
        <path d="M15 7h5v5M20 12a7 7 0 1 1-2-5" />
      </ToolButton>
      <ToolButton
        active={false}
        disabled={!hasSelection(selection)}
        label={locale === 'fr' ? 'Supprimer selection' : 'Delete selected'}
        onClick={deleteSelected}
      >
        <path d="M6 7h12M10 7V5h4v2M8 7l1 12h6l1-12" />
      </ToolButton>
      <ToolButton
        active={false}
        disabled={draft.nodes.length === 0}
        label={locale === 'fr' ? 'Disposition automatique' : 'Auto layout'}
        onClick={layoutCircle}
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </ToolButton>
      <ToolButton active={false} label={locale === 'fr' ? 'Zoom avant' : 'Zoom in'} onClick={() => zoomBy(0.82)}>
        <path d="M10 5v10M5 10h10M15 15l5 5" />
      </ToolButton>
      <ToolButton active={false} label={locale === 'fr' ? 'Zoom arriere' : 'Zoom out'} onClick={() => zoomBy(1.18)}>
        <path d="M5 10h10M15 15l5 5" />
      </ToolButton>
      <ToolButton active={false} label={locale === 'fr' ? 'Ajuster la vue' : 'Fit view'} onClick={fitView}>
        <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
      </ToolButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) importJson(file)
          event.currentTarget.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="h-8 rounded-md border border-white/10 bg-white/6 px-2 text-[11px] font-medium text-[var(--app-text-secondary)] transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/12 hover:text-[var(--app-accent)]"
      >
        {locale === 'fr' ? 'Importer' : 'Import'}
      </button>
      <button
        type="button"
        onClick={exportJson}
        className="h-8 rounded-md border border-white/10 bg-white/6 px-2 text-[11px] font-medium text-[var(--app-text-secondary)] transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/12 hover:text-[var(--app-accent)]"
      >
        {locale === 'fr' ? 'Exporter' : 'Export'}
      </button>
      <button
        type="button"
        onClick={clearGraph}
        disabled={draft.nodes.length === 0 && draft.edges.length === 0}
        className="ml-auto h-8 rounded-md border border-white/10 bg-white/6 px-2 text-[11px] font-medium text-[var(--app-text-secondary)] transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/12 hover:text-[var(--app-accent)] disabled:pointer-events-none disabled:opacity-35"
      >
        {locale === 'fr' ? 'Vider' : 'Clear'}
      </button>
    </div>
  )
}

function ToolButton({
  active,
  disabled = false,
  label,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:pointer-events-none disabled:opacity-35 ${
        active
          ? 'border-cyan-300 bg-cyan-300 text-slate-950 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
          : 'border-white/10 bg-white/6 text-[var(--app-text-secondary)] hover:border-cyan-300/55 hover:bg-cyan-300/12 hover:text-[var(--app-accent)]'
      }`}
      aria-label={label}
      title={label}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}
