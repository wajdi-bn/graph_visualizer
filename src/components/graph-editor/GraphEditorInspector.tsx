import type { ReactNode } from 'react'
import type { Locale } from '@i18n/translations'
import type { GraphEdge, GraphNode } from '@lib/types'
import type { EditorDraft } from './graphEditorTypes'
import { DEFAULT_EDGE_COLOR, DEFAULT_NODE_COLOR, MAX_EDGE_CURVE, colorValue, getEdgeCurve } from './graphEditorUtils'

interface GraphEditorInspectorProps {
  locale: Locale
  draft: EditorDraft
  selectedNode: GraphNode | null
  selectedEdge: GraphEdge | null
  selectedEdgeIndex: number | null
  selectedCount: number
  updateDraft: (update: Partial<EditorDraft>) => void
  updateNode: (nodeId: number, update: Partial<GraphNode>) => void
  updateEdge: (index: number, update: Partial<GraphEdge>) => void
  setDirected: (directed: boolean) => void
  handleSave: (saveAsCopy?: boolean) => void
  handleDeleteGraph: () => void
}

export function GraphEditorInspector({
  locale,
  draft,
  selectedNode,
  selectedEdge,
  selectedEdgeIndex,
  selectedCount,
  updateDraft,
  updateNode,
  updateEdge,
  setDirected,
  handleSave,
  handleDeleteGraph,
}: GraphEditorInspectorProps) {
  const selectedEdgeCurve =
    selectedEdge && selectedEdgeIndex != null
      ? Math.round(getEdgeCurve(selectedEdge, selectedEdgeIndex, draft.edges))
      : 0

  return (
    <aside className="max-h-[280px] shrink-0 overflow-y-auto border-t border-white/8 bg-white/[0.02] p-3 lg:max-h-none lg:w-[290px] lg:border-l lg:border-t-0">
      <div className="space-y-4">
        <section>
          <div className="mb-2 text-xs font-semibold text-white font-heading">
            {locale === 'fr' ? 'Informations' : 'Graph info'}
          </div>
          <div className="space-y-2">
            <FieldLabel label={locale === 'fr' ? 'Nom' : 'Name'}>
              <input
                value={draft.name}
                onChange={(event) => updateDraft({ name: event.target.value })}
                className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
              />
            </FieldLabel>
            <FieldLabel label={locale === 'fr' ? 'Description' : 'Description'}>
              <textarea
                value={draft.description}
                onChange={(event) => updateDraft({ description: event.target.value })}
                rows={3}
                className="w-full resize-none rounded-md border border-white/10 bg-black px-2 py-1.5 text-xs text-white outline-none focus:border-white/24"
              />
            </FieldLabel>
            <label className="flex items-center justify-between rounded-md border border-white/10 bg-black px-2 py-2 text-xs text-neutral-300">
              <span>{locale === 'fr' ? 'Graphe oriente' : 'Directed graph'}</span>
              <input
                type="checkbox"
                checked={draft.directed}
                onChange={(event) => setDirected(event.target.checked)}
                className="h-4 w-4 accent-cyan-300"
              />
            </label>
          </div>
        </section>

        <section>
          <div className="mb-2 text-xs font-semibold text-white font-heading">
            {selectedNode
              ? locale === 'fr'
                ? 'Sommet'
                : 'Node'
              : selectedEdge
                ? locale === 'fr'
                  ? 'Arete'
                  : 'Edge'
                : locale === 'fr'
                  ? 'Selection'
                  : 'Selection'}
          </div>

          {!selectedNode && !selectedEdge && (
            <div className="rounded-md border border-white/8 bg-black p-3 text-xs leading-5 text-neutral-500">
              {selectedCount > 1
                ? locale === 'fr'
                  ? `${selectedCount} elements selectionnes.`
                  : `${selectedCount} elements selected.`
                : locale === 'fr'
                  ? 'Selectionnez un sommet ou une arete pour modifier ses details.'
                  : 'Select a node or edge to edit its details.'}
            </div>
          )}

          {selectedNode && (
            <div className="space-y-2">
              <FieldLabel label={locale === 'fr' ? 'Etiquette' : 'Label'}>
                <input
                  value={selectedNode.label}
                  onChange={(event) => updateNode(selectedNode.id, { label: event.target.value })}
                  className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                />
              </FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <FieldLabel label="X">
                  <input
                    type="number"
                    value={Math.round(selectedNode.x)}
                    onChange={(event) => updateNode(selectedNode.id, { x: Number(event.target.value) })}
                    className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                  />
                </FieldLabel>
                <FieldLabel label="Y">
                  <input
                    type="number"
                    value={Math.round(selectedNode.y)}
                    onChange={(event) => updateNode(selectedNode.id, { y: Number(event.target.value) })}
                    className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                  />
                </FieldLabel>
              </div>
              <FieldLabel label={locale === 'fr' ? 'Couleur' : 'Color'}>
                <input
                  type="color"
                  value={colorValue(selectedNode.color, DEFAULT_NODE_COLOR)}
                  onChange={(event) => updateNode(selectedNode.id, { color: event.target.value })}
                  className="h-8 w-full rounded-md border border-white/10 bg-black p-1"
                />
              </FieldLabel>
            </div>
          )}

          {selectedEdge && selectedEdgeIndex != null && (
            <div className="space-y-2">
              <FieldLabel label={locale === 'fr' ? 'Courbure' : 'Curve'}>
                <div className="grid grid-cols-[1fr_58px] gap-2">
                  <input
                    type="range"
                    min={-MAX_EDGE_CURVE}
                    max={MAX_EDGE_CURVE}
                    value={selectedEdgeCurve}
                    onChange={(event) => updateEdge(selectedEdgeIndex, { curve: Number(event.target.value) })}
                    className="h-8 w-full accent-cyan-300"
                  />
                  <input
                    type="number"
                    min={-MAX_EDGE_CURVE}
                    max={MAX_EDGE_CURVE}
                    value={selectedEdgeCurve}
                    onChange={(event) => updateEdge(selectedEdgeIndex, { curve: Number(event.target.value) })}
                    className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                  />
                </div>
              </FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <FieldLabel label={locale === 'fr' ? 'Source' : 'Source'}>
                  <select
                    value={selectedEdge.from}
                    onChange={(event) => updateEdge(selectedEdgeIndex, { from: Number(event.target.value) })}
                    className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                  >
                    {draft.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                </FieldLabel>
                <FieldLabel label={locale === 'fr' ? 'Cible' : 'Target'}>
                  <select
                    value={selectedEdge.to}
                    onChange={(event) => updateEdge(selectedEdgeIndex, { to: Number(event.target.value) })}
                    className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                  >
                    {draft.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                </FieldLabel>
              </div>
              <FieldLabel label={locale === 'fr' ? 'Poids' : 'Weight'}>
                <input
                  type="number"
                  value={selectedEdge.weight ?? ''}
                  onChange={(event) =>
                    updateEdge(selectedEdgeIndex, {
                      weight: event.target.value === '' ? undefined : Number(event.target.value),
                    })}
                  className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                />
              </FieldLabel>
              <FieldLabel label={locale === 'fr' ? 'Etiquette' : 'Label'}>
                <input
                  value={selectedEdge.label ?? ''}
                  onChange={(event) => updateEdge(selectedEdgeIndex, { label: event.target.value || undefined })}
                  className="h-8 w-full rounded-md border border-white/10 bg-black px-2 text-xs text-white outline-none focus:border-white/24"
                />
              </FieldLabel>
              <FieldLabel label={locale === 'fr' ? 'Couleur' : 'Color'}>
                <input
                  type="color"
                  value={colorValue(selectedEdge.color, DEFAULT_EDGE_COLOR)}
                  onChange={(event) => updateEdge(selectedEdgeIndex, { color: event.target.value })}
                  className="h-8 w-full rounded-md border border-white/10 bg-black p-1"
                />
              </FieldLabel>
            </div>
          )}
        </section>

        <section className="flex flex-wrap gap-2 border-t border-white/8 pt-3">
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="h-8 rounded-md border border-white/12 bg-white/6 px-2 text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
          >
            {locale === 'fr' ? 'Copie' : 'Save copy'}
          </button>
          {draft.id && (
            <button
              type="button"
              onClick={handleDeleteGraph}
              className="h-8 rounded-md border border-rose-500/35 bg-rose-500/10 px-2 text-xs text-rose-500 transition-colors hover:bg-rose-500/15"
            >
              {locale === 'fr' ? 'Supprimer' : 'Delete graph'}
            </button>
          )}
        </section>
      </div>
    </aside>
  )
}

function FieldLabel({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-neutral-500">{label}</span>
      {children}
    </label>
  )
}
