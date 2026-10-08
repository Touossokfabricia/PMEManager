import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

const ICONS = {
  success: 'fa-circle-check',
  error: 'fa-circle-exclamation',
  warning: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
}

const STYLES = {
  success: 'bg-success-600',
  error: 'bg-error-600',
  warning: 'bg-warning-600',
  info: 'bg-info-600',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration) setTimeout(() => remove(id), duration)
    return id
  }, [remove])

  const toast = {
    success: (msg, d) => push(msg, 'success', d),
    error: (msg, d) => push(msg, 'error', d),
    warning: (msg, d) => push(msg, 'warning', d),
    info: (msg, d) => push(msg, 'info', d),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-fade-in-up flex items-start gap-3 rounded-lg px-4 py-3 text-white shadow-floating ${STYLES[t.type]}`}
          >
            <i className={`fa-solid ${ICONS[t.type]} mt-0.5 shrink-0`}></i>
            <p className="text-sm font-medium leading-snug flex-1">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 opacity-80 hover:opacity-100"
              aria-label="Fermer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
