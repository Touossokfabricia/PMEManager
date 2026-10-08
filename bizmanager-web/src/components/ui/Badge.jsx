const STYLES = {
  neutral: 'bg-secondary-50 text-text-secondary border border-border',
  primary: 'bg-primary-50 text-primary-700 border border-primary-200',
  success: 'bg-success-50 text-success-700 border border-success-200',
  warning: 'bg-warning-50 text-warning-700 border border-warning-200',
  error: 'bg-error-50 text-error-700 border border-error-200',
  info: 'bg-info-50 text-info-700 border border-info-200',
}

const DOT = {
  neutral: 'bg-text-muted',
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-info-500',
}

export default function Badge({ children, variant = 'neutral', dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLES[variant]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT[variant]}`}></span>}
      {children}
    </span>
  )
}

/** Mappe un statut métier (facture, devis...) vers une variante de badge cohérente. */
export const STATUS_VARIANT = {
  draft: 'neutral', brouillon: 'neutral',
  sent: 'info', envoye: 'info',
  paid: 'success', paye: 'success', payee: 'success',
  overdue: 'error', retard: 'error',
  cancelled: 'error', annule: 'error',
  active: 'success', actif: 'success',
  inactive: 'neutral', inactif: 'neutral',
  suspended: 'warning', suspendu: 'warning',
}
