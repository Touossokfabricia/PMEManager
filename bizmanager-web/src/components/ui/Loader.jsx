const SIZES = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' }

/** Loader — indicateur de chargement ponctuel (bouton, section). */
export function Loader({ size = 'md', className = '' }) {
  return (
    <i className={`fa-solid fa-circle-notch fa-spin text-primary-600 ${SIZES[size]} ${className}`} aria-label="Chargement" />
  )
}

/** PageLoader — écran de chargement plein cadre (chargement initial d'une page). */
export function PageLoader({ label = 'Chargement...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-text-secondary">
      <Loader size="lg" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
