import type { ReactNode } from 'react'
import type { Locale } from '@i18n/translations'
import type { ContextMenuState, Selection } from './graphEditorTypes'
import { hasSelection } from './graphEditorUtils'

interface GraphEditorContextMenuProps {
  locale: Locale
  contextMenu: ContextMenuState
  selection: Selection
  hasClipboard: boolean
  copySelection: () => void
  duplicateSelection: () => void
  pasteClipboard: () => void
  deleteSelected: () => void
  selectAll: () => void
  fitView: () => void
  closeContextMenu: () => void
}

export function GraphEditorContextMenu({
  locale,
  contextMenu,
  selection,
  hasClipboard,
  copySelection,
  duplicateSelection,
  pasteClipboard,
  deleteSelected,
  selectAll,
  fitView,
  closeContextMenu,
}: GraphEditorContextMenuProps) {
  if (!contextMenu) return null

  return (
    <div
      className="fixed z-[120] w-44 overflow-hidden rounded-md border border-white/12 bg-black py-1 shadow-2xl shadow-black/60"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onPointerDown={(event) => event.stopPropagation()}
      role="menu"
    >
      <ContextMenuItem
        disabled={!hasSelection(selection)}
        onClick={() => {
          copySelection()
          closeContextMenu()
        }}
      >
        {locale === 'fr' ? 'Copier' : 'Copy'}
      </ContextMenuItem>
      <ContextMenuItem
        disabled={!hasSelection(selection)}
        onClick={() => {
          duplicateSelection()
          closeContextMenu()
        }}
      >
        {locale === 'fr' ? 'Dupliquer' : 'Duplicate'}
      </ContextMenuItem>
      <ContextMenuItem
        disabled={!hasClipboard}
        onClick={() => {
          pasteClipboard()
          closeContextMenu()
        }}
      >
        {locale === 'fr' ? 'Coller' : 'Paste'}
      </ContextMenuItem>
      <ContextMenuItem
        disabled={!hasSelection(selection)}
        onClick={() => {
          deleteSelected()
          closeContextMenu()
        }}
      >
        {locale === 'fr' ? 'Supprimer' : 'Delete'}
      </ContextMenuItem>
      <div className="my-1 border-t border-white/8" />
      <ContextMenuItem
        onClick={() => {
          selectAll()
          closeContextMenu()
        }}
      >
        {locale === 'fr' ? 'Tout selectionner' : 'Select all'}
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => {
          fitView()
          closeContextMenu()
        }}
      >
        {locale === 'fr' ? 'Ajuster la vue' : 'Fit view'}
      </ContextMenuItem>
    </div>
  )
}

function ContextMenuItem({
  disabled = false,
  onClick,
  children,
}: {
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="block h-8 w-full px-3 text-left text-xs text-neutral-300 transition-colors hover:bg-white/8 hover:text-white disabled:pointer-events-none disabled:text-neutral-700"
      role="menuitem"
    >
      {children}
    </button>
  )
}
