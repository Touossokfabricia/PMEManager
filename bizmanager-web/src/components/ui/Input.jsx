/**
 * Input — champ de formulaire avec label, erreur, aide, icône optionnelle,
 * et un slot optionnel à droite (rightElement, ex : bouton œil pour un mot de passe).
 */
export default function Input({
  label,
  error,
  hint,
  icon,
  rightElement,
  required = false,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label} {required && <span className="text-error-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <i className={`fa-solid ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm`}></i>
        )}
        <input
          id={inputId}
          className={`w-full rounded-md border bg-surface px-3 py-2 text-[13px] text-text-primary
            placeholder:text-text-muted transition-all duration-200 hover:border-primary-300
            ${icon ? 'pl-8' : ''}
            ${rightElement ? 'pr-9' : ''}
            ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : 'border-border-strong focus:border-primary-600 focus:ring-primary-600'}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-secondary-50 disabled:text-text-muted disabled:hover:border-border-strong
            ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p id={`${inputId}-error`} className="text-xs text-error-600">{error}</p>}
      {!error && hint && <p id={`${inputId}-hint`} className="text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}
