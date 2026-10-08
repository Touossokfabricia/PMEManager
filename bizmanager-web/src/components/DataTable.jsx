import { TableSkeleton } from './ui/Skeleton'

/**
 * DataTable — tableau générique réutilisé par toutes les listes (Clients,
 * Produits, Employés, Factures, Audits, Prévisions, Entreprises, Users).
 *
 * Responsive réel (pas juste "rétréci") :
 * - Desktop/tablette (sm+) : vrai tableau HTML.
 * - Mobile (<sm) : chaque ligne devient une carte empilée avec paires
 *   label/valeur, plus lisible et plus facile à toucher qu'un tableau
 *   compressé sur petit écran.
 *
 * columns: [{ key, label, render?(row) }]
 * actions?(row): JSX des boutons d'action pour la ligne
 */
export default function DataTable({ columns, data, loading, keyField = 'id', actions, empty }) {
  if (loading) return <TableSkeleton rows={5} cols={columns.length} />
  if (!data || data.length === 0) return empty ?? null

  return (
    <>
      {/* Desktop / tablette */}
      <div className="hidden sm:block overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold text-text-muted uppercase tracking-widest bg-secondary-50 border-b border-border">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2.5 whitespace-nowrap">{c.label}</th>
              ))}
              {actions && <th className="px-4 py-2.5"></th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row[keyField]} className="border-b border-border last:border-0 hover:bg-primary-50 hover:shadow-sm transition-all duration-200">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2.5 text-text-primary text-[13px]">{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>
                ))}
                {actions && <td className="px-4 py-2.5 text-right">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile : cartes empilées */}
      <div className="sm:hidden flex flex-col gap-3">
        {data.map((row) => (
          <div key={row[keyField]} className="border border-border rounded-lg p-4 bg-surface hover:border-primary-300 transition-colors shadow-sm">
            {columns.map((c) => (
              <div key={c.key} className="flex items-start justify-between gap-3 py-1.5 text-sm">
                <span className="text-text-secondary shrink-0 font-medium">{c.label}</span>
                <span className="text-text-primary font-medium text-right">{c.render ? c.render(row) : (row[c.key] ?? '—')}</span>
              </div>
            ))}
            {actions && (
              <div className="flex justify-end gap-1 mt-2.5 pt-2.5 border-t border-border">{actions(row)}</div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
