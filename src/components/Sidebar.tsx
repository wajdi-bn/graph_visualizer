import { useState, useRef, useEffect } from 'react'
import type { Algorithm, Category } from '@lib/types'
import type { Locale } from '@i18n/translations'
import { translations, getAlgorithmName, getCategoryName } from '@i18n/translations'

interface SidebarProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (algo: Algorithm) => void
  locale?: Locale
}

const categoryColors: Record<string, { icon: string; badge: string; line: string; active: string }> = {
  'Shortest Paths': {
    icon: 'text-sky-400',
    badge: 'bg-sky-500/10 text-sky-400/70',
    line: 'border-sky-500/20',
    active: 'border-l-sky-400',
  },
  'Spanning Trees': {
    icon: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400/70',
    line: 'border-emerald-500/20',
    active: 'border-l-emerald-400',
  },
  Connectivity: {
    icon: 'text-violet-400',
    badge: 'bg-violet-500/10 text-violet-400/70',
    line: 'border-violet-500/20',
    active: 'border-l-violet-400',
  },
  'Traversal / Properties': {
    icon: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400/70',
    line: 'border-amber-500/20',
    active: 'border-l-amber-400',
  },
  Coloring: {
    icon: 'text-rose-400',
    badge: 'bg-rose-500/10 text-rose-400/70',
    line: 'border-rose-500/20',
    active: 'border-l-rose-400',
  },
  'Auxiliary Structures': {
    icon: 'text-cyan-400',
    badge: 'bg-cyan-500/10 text-cyan-400/70',
    line: 'border-cyan-500/20',
    active: 'border-l-cyan-400',
  },
}

const defaultCategoryColor = {
  icon: 'text-neutral-400',
  badge: 'bg-white/[0.04] text-neutral-600',
  line: 'border-white/[0.08]',
  active: 'border-l-neutral-400',
}

export default function Sidebar({ categories, selectedId, onSelect, locale = 'en' }: SidebarProps) {
  const t = translations[locale]
  const [expanded, setExpanded] = useState<Set<string>>(new Set(categories.map((c) => c.name)))
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === '/') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggle = (name: string) => {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const filtered = categories
    .map((category) => ({
      ...category,
      algorithms: category.algorithms.filter(
        (algorithm) =>
          getAlgorithmName(locale, algorithm.id, algorithm.name)
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          getCategoryName(locale, category.name).toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((category) => category.algorithms.length > 0)

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 pb-2">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label={t.searchPlaceholder}
            className="w-full bg-white/3 border border-white/8 rounded-lg pl-9 pr-8 py-2 text-xs text-neutral-300 placeholder-neutral-600 outline-none focus:border-white/20 focus:bg-white/5 transition-all"
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                searchInputRef.current?.focus()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-[18px] h-[18px] rounded border border-white/10 bg-white/3 text-neutral-600 hover:text-neutral-300 hover:border-white/20 hover:bg-white/6 transition-all"
              aria-label={locale === 'fr' ? 'Effacer la recherche' : 'Clear search'}
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            !searchFocused && (
              <kbd
                className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-[18px] h-[18px] text-[10px] font-mono rounded border border-white/10 text-neutral-600 bg-white/3"
                aria-hidden="true"
              >
                /
              </kbd>
            )
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Algorithm list">
        {filtered.map((category) => {
          const isExpanded = expanded.has(category.name)
          const categoryId = `category-${category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          const colors = categoryColors[category.name] ?? defaultCategoryColor

          return (
            <div key={category.name} className="mb-1">
              <button
                onClick={() => toggle(category.name)}
                aria-expanded={isExpanded}
                aria-controls={categoryId}
                className="w-full flex items-center justify-between px-2.5 py-2 text-[11px] font-semibold text-neutral-500 hover:text-neutral-400 transition-colors rounded-md hover:bg-white/3 uppercase tracking-widest"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 text-neutral-600 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                  <span className="flex items-center gap-1.5">
                    <GraphIcon className={colors.icon} />
                    {getCategoryName(locale, category.name)}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full tabular-nums ${colors.badge}`}
                  aria-label={t.algorithmCountLabel.replace('{count}', String(category.algorithms.length))}
                >
                  {category.algorithms.length}
                </span>
              </button>

              <div
                id={categoryId}
                role="group"
                aria-label={`${getCategoryName(locale, category.name)} algorithms`}
                className="overflow-hidden transition-all duration-200"
                style={{
                  maxHeight: isExpanded ? `${category.algorithms.length * 36}px` : '0px',
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className={`ml-4 mt-0.5 space-y-0.5 border-l pl-2 ${colors.line}`}>
                  {category.algorithms.map((algorithm) => (
                    <a
                      key={algorithm.id}
                      href={locale === 'fr' ? `/fr/${algorithm.id}` : `/${algorithm.id}`}
                      onClick={(event) => {
                        event.preventDefault()
                        onSelect(algorithm)
                      }}
                      aria-current={selectedId === algorithm.id ? 'page' : undefined}
                      className={`block px-3 py-1.5 text-[13px] rounded-md transition-all duration-150 border-l-2 ${
                        selectedId === algorithm.id
                          ? `${colors.active} bg-white/8 text-white font-medium`
                          : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-white/4'
                      }`}
                    >
                      {getAlgorithmName(locale, algorithm.id, algorithm.name)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/6">
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-700">
          <span>
            {t.algorithmsCount.replace(
              '{count}',
              String(categories.reduce((sum, category) => sum + category.algorithms.length, 0)),
            )}
          </span>
          <span className="text-neutral-800">/</span>
          <span>{locale === 'fr' ? 'theorie des graphes' : 'graph theory'}</span>
        </div>
      </div>
    </div>
  )
}

function GraphIcon({ className }: { className: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="6" cy="18" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.2 16.3 10.8 7.7M13.2 7.7l3.6 8.6M8 18h8" />
    </svg>
  )
}
