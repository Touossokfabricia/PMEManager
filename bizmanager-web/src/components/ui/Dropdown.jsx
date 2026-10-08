import { useState, useRef, useEffect } from 'react'

/**
 * Dropdown — menu contextuel générique.
 * Usage : <Dropdown trigger={<Button>Actions</Button>} items={[{label, icon, onClick, danger}]} />
 */
export default function Dropdown({ trigger, items = [], align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-20 mt-1.5 w-48 rounded-md border border-border bg-surface py-1 shadow-elevated animate-fade-in-up
            ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick?.(); setOpen(false) }}
              className={`flex w-full items-center gap-2 px-3.5 py-2 text-sm text-left transition-colors
                ${item.danger ? 'text-error-600 hover:bg-error-50' : 'text-text-primary hover:bg-secondary-50'}`}
            >
              {item.icon && <i className={`fa-solid ${item.icon} w-4`}></i>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
