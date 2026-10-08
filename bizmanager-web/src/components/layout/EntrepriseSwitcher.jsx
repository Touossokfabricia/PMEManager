import { useState } from 'react'
import { useEntreprise } from '../../context/EntrepriseContext'
import { Modal } from '../ui'
import CreateEntreprise from '../../pages/entrepreneur/CreateEntreprise'

/**
 * EntrepriseSwitcher — affiche l'entreprise active et permet de basculer
 * vers une autre, ou d'en créer une nouvelle. Placé dans le header de la Sidebar.
 */
export default function EntrepriseSwitcher() {
  const { entreprises, current, switchEntreprise } = useEntreprise()
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  if (!current) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left px-2.5 py-2 -mx-2.5 rounded-md hover:bg-white/5 transition-colors"
      >
        <div className="h-7 w-7 rounded-md bg-primary-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {current.nom?.[0]?.toUpperCase()}
        </div>
        <span className="text-xs text-secondary-300 truncate flex-1">{current.nom}</span>
        <i className="fa-solid fa-chevron-down text-[10px] text-secondary-500"></i>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 top-full left-0 mt-1.5 w-64 rounded-md border border-secondary-700 bg-secondary-800 py-1 shadow-floating animate-fade-in-up">
            <p className="px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
              Mes entreprises
            </p>
            {entreprises.map((e) => (
              <button
                key={e.id}
                onClick={() => { switchEntreprise(e.id); setOpen(false) }}
                className={`flex items-center gap-2 w-full px-3.5 py-2 text-sm text-left transition-colors
                  ${String(e.id) === String(current.id) ? 'text-white bg-white/5' : 'text-secondary-300 hover:bg-white/5 hover:text-white'}`}
              >
                <i className={`fa-solid ${String(e.id) === String(current.id) ? 'fa-circle-check text-primary-400' : 'fa-building text-secondary-500'} w-4`}></i>
                <span className="truncate">{e.nom}</span>
              </button>
            ))}
            <div className="border-t border-secondary-700 mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); setCreateOpen(true) }}
                className="flex items-center gap-2 w-full px-3.5 py-2 text-sm text-left text-primary-400 hover:bg-white/5"
              >
                <i className="fa-solid fa-plus w-4"></i>
                Nouvelle entreprise
              </button>
            </div>
          </div>
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouvelle entreprise">
        <CreateEntreprise onCreated={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}
