/**
 * Skeleton — placeholder animé pendant le chargement des données (évite le
 * flash de contenu vide et donne une impression de rapidité perçue).
 */
export function Skeleton({ className = '' }) {
  return <div className={`animate-skeleton rounded-md bg-secondary-200 ${className}`} />
}

/** Skeleton prêt à l'emploi pour un tableau de N lignes / M colonnes. */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-4 ${c === 0 ? 'w-1/4' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Skeleton pour une grille de stat-cards. */
export function StatCardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-3">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-7 w-1/2" />
        </div>
      ))}
    </div>
  )
}
