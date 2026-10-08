import Button from './Button'

/**
 * ErrorState — affiché quand une requête échoue (erreur réseau, 500...).
 * Toujours proposer un moyen de s'en sortir (bouton "Réessayer").
 */
export default function ErrorState({ title = "Impossible de charger les données", description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-14 w-14 rounded-full bg-error-50 flex items-center justify-center mb-4">
        <i className="fa-solid fa-triangle-exclamation text-error-500 text-xl"></i>
      </div>
      <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary max-w-sm mb-5">{description}</p>}
      {onRetry && (
        <Button variant="outline" icon="fa-rotate-right" onClick={onRetry}>Réessayer</Button>
      )}
    </div>
  )
}
