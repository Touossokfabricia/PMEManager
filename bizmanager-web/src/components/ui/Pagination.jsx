/**
 * Pagination — navigation de pages pour les listes (clients, produits, factures...).
 * S'aligne sur la pagination DRF (PageNumberPagination) : count, page, pageSize, onChange.
 */
export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const pages = []
  const start = Math.max(1, page - 1)
  const end = Math.min(totalPages, page + 1)
  for (let p = start; p <= end; p++) pages.push(p)

  const btn = (active) => `h-8 min-w-8 px-2 rounded-md text-sm font-medium transition-colors
    ${active ? 'bg-primary-600 text-white' : 'text-text-secondary hover:bg-secondary-100'}`

  return (
    <nav className="flex items-center justify-between pt-4" aria-label="Pagination">
      <p className="text-xs text-text-secondary">
        {total} résultat{total > 1 ? 's' : ''} — page {page}/{totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)} className={`${btn(false)} disabled:opacity-30`} aria-label="Page précédente">
          <i className="fa-solid fa-chevron-left text-xs"></i>
        </button>
        {start > 1 && <span className="px-1 text-text-muted text-sm">…</span>}
        {pages.map((p) => (
          <button key={p} onClick={() => onChange(p)} className={btn(p === page)}>{p}</button>
        ))}
        {end < totalPages && <span className="px-1 text-text-muted text-sm">…</span>}
        <button disabled={page === totalPages} onClick={() => onChange(page + 1)} className={`${btn(false)} disabled:opacity-30`} aria-label="Page suivante">
          <i className="fa-solid fa-chevron-right text-xs"></i>
        </button>
      </div>
    </nav>
  )
}
