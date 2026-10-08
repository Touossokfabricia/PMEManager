import Button from './Button'

/**
 * EmptyState — affiché quand une liste est vide (aucun client, aucune facture...).
 * Guide l'utilisateur vers l'action suivante plutôt que de laisser un vide silencieux.
 */
export default function EmptyState({ icon = 'fa-inbox', title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-14 w-14 rounded-full bg-primary-50 flex items-center justify-center mb-4">
        <i className={`fa-solid ${icon} text-primary-500 text-xl`}></i>
      </div>
      <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary max-w-sm mb-5">{description}</p>}
      {actionLabel && onAction && (
        <Button icon="fa-plus" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
