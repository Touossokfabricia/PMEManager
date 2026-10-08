export default function Select({ label, error, hint, required = false, options = [], placeholder, className = '', id, ...props }) {
  const selectId = id || props.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
          {label} {required && <span className="text-error-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full appearance-none rounded-md border bg-surface px-3.5 py-2.5 pr-9 text-sm text-text-primary
            transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20
            ${error ? 'border-error-500' : 'border-border focus:border-primary-500'}
            disabled:bg-secondary-50 disabled:text-text-muted ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none"></i>
      </div>
      {error && <p className="text-xs text-error-600">{error}</p>}
      {!error && hint && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}
