export function Checkbox({ label, checked, onChange, className = '', ...props }) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border-strong text-primary-600 focus:ring-2 focus:ring-primary-600 cursor-pointer transition-colors"
        {...props}
      />
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </label>
  )
}

export function Radio({ label, name, value, checked, onChange, className = '', ...props }) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-border-strong text-primary-600 focus:ring-2 focus:ring-primary-600 cursor-pointer transition-colors"
        {...props}
      />
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </label>
  )
}
