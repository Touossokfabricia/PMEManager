/**
 * Button — variantes : primary, secondary, outline, ghost, danger
 * Tailles : sm, md, lg
 */
const VARIANTS = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:bg-primary-800 active:shadow-sm focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:bg-secondary-200 disabled:text-secondary-400',
  secondary: 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 hover:border-primary-300 active:bg-primary-200 disabled:opacity-50',
  accent: 'bg-accent-500 text-primary-900 font-bold shadow-sm hover:bg-accent-600 hover:shadow-md active:bg-accent-700 active:shadow-sm focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:bg-secondary-200 disabled:text-secondary-400',
  outline: 'border border-border-strong text-text-primary bg-surface hover:bg-secondary-50 hover:border-primary-300 active:bg-secondary-100 disabled:opacity-50',
  ghost: 'text-primary-600 hover:bg-primary-50 active:bg-primary-100 disabled:opacity-50',
  danger: 'bg-error-600 text-white shadow-sm hover:bg-error-700 active:bg-error-800 focus-visible:ring-2 focus-visible:ring-error-600 focus-visible:ring-offset-2 disabled:bg-secondary-200 disabled:text-secondary-400',
}

const SIZES = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5',
  md: 'text-[13px] px-3.5 py-2 gap-1.5',
  lg: 'text-sm px-4 py-2.5 gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-md
        transition-all duration-200 ease-in-out disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0
        ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <i className="fa-solid fa-circle-notch fa-spin"></i>
      ) : icon ? (
        <i className={`fa-solid ${icon}`}></i>
      ) : null}
      {children}
    </button>
  )
}
