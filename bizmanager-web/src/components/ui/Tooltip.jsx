import { useState } from 'react'

/**
 * Tooltip — infobulle légère au survol. Usage : <Tooltip label="Modifier"><button>...</button></Tooltip>
 */
export default function Tooltip({ label, children, position = 'top' }) {
  const [visible, setVisible] = useState(false)

  const pos = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  }[position]

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute z-30 ${pos} whitespace-nowrap rounded-md bg-secondary-900 px-2.5 py-1.5 text-xs font-medium text-white animate-fade-in pointer-events-none`}
        >
          {label}
        </span>
      )}
    </span>
  )
}
