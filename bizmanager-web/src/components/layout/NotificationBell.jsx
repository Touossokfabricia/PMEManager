import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useEntreprise } from '../../context/EntrepriseContext'

const ICONS = {
  stock_critique: 'fa-triangle-exclamation text-warning-600',
  facture_retard: 'fa-file-invoice text-error-600',
  promotion: 'fa-arrow-trend-up text-success-600',
  sanction: 'fa-triangle-exclamation text-error-600',
  salaire_a_payer: 'fa-sack-dollar text-primary-600',
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

export default function NotificationBell() {
  const { currentId } = useEntreprise()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const load = useCallback(() => {
    if (!currentId) return
    api.get(`/entreprises/${currentId}/notifications/`).then(({ data }) => setItems(data.results ?? data))
  }, [currentId])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000) // rafraîchit toutes les minutes
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const unreadCount = items.filter((n) => !n.lue).length

  const handleClickNotif = async (n) => {
    if (!n.lue) {
      await api.patch(`/entreprises/${currentId}/notifications/${n.id}/lue/`)
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, lue: true } : it)))
    }
    setOpen(false)
    if (n.lien) navigate(n.lien)
  }

  const markAllRead = async () => {
    await api.post(`/entreprises/${currentId}/notifications/tout-lire/`)
    setItems((prev) => prev.map((it) => ({ ...it, lue: true })))
  }

  if (!currentId) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-9 w-9 flex items-center justify-center rounded-full text-text-secondary hover:bg-secondary-100 transition-colors"
        aria-label="Notifications"
      >
        <i className="fa-solid fa-bell"></i>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-error-600 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-80 max-h-96 overflow-y-auto rounded-md border border-border bg-surface shadow-elevated animate-fade-in-up z-30">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
            <p className="text-sm font-semibold text-text-primary">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Tout marquer comme lu</button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">Aucune notification.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotif(n)}
                className={`flex items-start gap-2.5 w-full text-left px-3.5 py-3 border-b border-border last:border-0 hover:bg-secondary-50 transition-colors ${!n.lue ? 'bg-primary-50/40' : ''}`}
              >
                <i className={`fa-solid ${ICONS[n.type_notification] || 'fa-circle-info text-info-600'} mt-0.5`}></i>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary leading-snug">{n.message}</p>
                  <p className="text-xs text-text-muted mt-0.5">{timeAgo(n.date_creation)}</p>
                </div>
                {!n.lue && <span className="h-2 w-2 rounded-full bg-primary-600 mt-1.5 shrink-0"></span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
