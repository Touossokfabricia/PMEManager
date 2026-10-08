const STYLES = {
  success: { wrap: 'bg-success-50 text-success-700 border-success-500/20', icon: 'fa-circle-check' },
  warning: { wrap: 'bg-warning-50 text-warning-700 border-warning-500/20', icon: 'fa-triangle-exclamation' },
  error: { wrap: 'bg-error-50 text-error-700 border-error-500/20', icon: 'fa-circle-exclamation' },
  info: { wrap: 'bg-info-50 text-info-700 border-info-500/20', icon: 'fa-circle-info' },
}

/**
 * Alert — bandeau inline (distinct du Toast qui est flottant/temporaire).
 * Utilisé pour les erreurs de formulaire, avertissements persistants dans une page.
 */
export default function Alert({ type = 'info', title, children, onClose, className = '' }) {
  const s = STYLES[type]
  return (
    <div className={`flex items-start gap-3 rounded-md border px-4 py-3 ${s.wrap} ${className}`} role="alert">
      <i className={`fa-solid ${s.icon} mt-0.5 shrink-0`}></i>
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Fermer">
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
    </div>
  )
}
