/**
 * Card — conteneur de base pour tout regroupement de contenu (stat, formulaire, tableau...)
 */
export default function Card({ title, subtitle, actions, children, className = '', padded = true, noBorder = false }) {
  return (
    <div className={`rounded-xl shadow-sm ${noBorder ? '' : 'border border-border'} transition-all duration-200 hover:shadow-md ${className.includes('bg-') ? '' : 'bg-surface'} ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            {title && <h3 className="font-semibold text-text-primary">{title}</h3>}
            {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'px-5 pb-5' + (title || actions ? '' : ' pt-5') : ''}>
        {children}
      </div>
    </div>
  )
}
