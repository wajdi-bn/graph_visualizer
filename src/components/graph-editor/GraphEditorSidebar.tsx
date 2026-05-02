import type { Locale } from '@i18n/translations'
import type { SessionGraph } from '@lib/sessionGraphs'
import { displayDate } from './graphEditorUtils'

interface GraphEditorSidebarProps {
  locale: Locale
  graphs: SessionGraph[]
  activeGraphId?: string
  query: string
  setQuery: (query: string) => void
  createNewGraph: () => void
  selectGraph: (graph: SessionGraph) => void
}

export function GraphEditorSidebar({
  locale,
  graphs,
  activeGraphId,
  query,
  setQuery,
  createNewGraph,
  selectGraph,
}: GraphEditorSidebarProps) {
  return (
    <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/8 bg-white/[0.02] md:flex">
      <div className="border-b border-white/8 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-white font-heading">
            {locale === 'fr' ? 'Graphes de session' : 'Session graphs'}
          </div>
          <button
            type="button"
            onClick={createNewGraph}
            className="h-7 rounded-md border border-white/10 bg-white/6 px-2 text-[11px] text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {locale === 'fr' ? 'Nouveau' : 'New'}
          </button>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder={locale === 'fr' ? 'Chercher...' : 'Search...'}
          className="mt-2 h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-white/22"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {graphs.length === 0 ? (
          <div className="p-3 text-xs leading-5 text-neutral-500">
            {locale === 'fr' ? 'Aucun graphe enregistre.' : 'No saved graphs yet.'}
          </div>
        ) : (
          <div className="space-y-2">
            {graphs.map((graph) => (
              <button
                key={graph.id}
                type="button"
                onClick={() => selectGraph(graph)}
                className={`w-full rounded-md border p-2 text-left transition-colors ${
                  graph.id === activeGraphId
                    ? 'border-cyan-300/60 bg-cyan-300/10'
                    : 'border-white/8 bg-white/[0.03] hover:border-white/18 hover:bg-white/8'
                }`}
              >
                <div className="truncate text-xs font-semibold text-white">{graph.name}</div>
                <div className="mt-1 text-[10px] text-neutral-500">
                  {graph.nodes.length} {locale === 'fr' ? 'sommets' : 'nodes'} / {graph.edges.length}{' '}
                  {locale === 'fr' ? 'aretes' : 'edges'}
                </div>
                <div className="mt-1 text-[10px] text-neutral-600">
                  {displayDate(graph.updatedAt, locale)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
