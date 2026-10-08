import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../ui/Logo'
import EntrepriseSwitcher from './EntrepriseSwitcher'

const ENTREPRENEUR_NAV = [
  { section: 'Général' },
  { to: '/dashboard', icon: 'fa-gauge-high', label: 'Tableau de bord', end: true },
  { to: '/assistant', icon: 'fa-sparkles', label: 'Assistant IA' },
  { section: 'Ventes' },
  { to: '/clients', icon: 'fa-address-book', label: 'Clients' },
  { to: '/produits', icon: 'fa-box', label: 'Produits' },
  { to: '/services', icon: 'fa-concierge-bell', label: 'Services' },
  { to: '/factures', icon: 'fa-file-invoice', label: 'Factures' },
  { section: 'Pilotage' },
  { to: '/audit-ventes', icon: 'fa-chart-column', label: 'Audit des ventes' },
  { to: '/audits', icon: 'fa-clock-rotate-left', label: 'Journal des ventes' },
  { to: '/previsions', icon: 'fa-chart-line', label: 'Prévisions de stock' },
  { to: '/rupture-stock', icon: 'fa-triangle-exclamation', label: 'Rupture de stock' },
  { section: 'Organisation' },
  { to: '/employes', icon: 'fa-id-badge', label: 'Employés' },
  { to: '/entreprise', icon: 'fa-building', label: 'Mon entreprise' },
]

const ADMIN_NAV = [
  { section: 'Administration' },
  { to: '/sysadmin', icon: 'fa-gauge-high', label: 'Tableau de bord', end: true },
  { to: '/assistant', icon: 'fa-sparkles', label: 'Assistant IA' },
  { to: '/sysadmin/entreprises', icon: 'fa-building', label: 'Entreprises' },
  { to: '/sysadmin/users', icon: 'fa-users', label: 'Utilisateurs' },
]

export default function Sidebar({ open, onClose }) {
  const { user, isAdmin, logout } = useAuth()
  const nav = isAdmin ? ADMIN_NAV : ENTREPRENEUR_NAV

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-secondary-900/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-[260px] shrink-0
          bg-surface text-text-primary flex flex-col border-r border-border
          transition-transform duration-200 ease-out shadow-sm
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center gap-2.5 px-4 h-16 shrink-0 border-b border-border bg-surface">
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <Logo size="text-xl" />
            <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted mt-1 font-semibold">
              {isAdmin ? 'Espace administrateur' : 'Espace entrepreneur'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-text-secondary hover:text-text-primary hover:bg-secondary-50 p-1.5 rounded-md transition-colors" aria-label="Fermer le menu">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {!isAdmin && (
          <div className="px-3 pt-3">
            <EntrepriseSwitcher />
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {nav.map((item, i) =>
            item.section ? (
              <p key={i} className="px-3 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted first:pt-0">
                {item.section}
              </p>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium mb-1 transition-all duration-200
                  ${isActive ? 'bg-primary-50 text-primary-600 border-l-4 border-accent-500 shadow-sm' : 'text-text-secondary border-l-4 border-transparent hover:bg-secondary-50 hover:text-text-primary hover:translate-x-0.5'}`
                }
              >
                <i className={`fa-solid ${item.icon} w-5 text-center text-[15px] ${item.end ? '' : 'opacity-80'}`}></i>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="p-3 border-t border-border shrink-0 bg-surface">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-secondary-50 border border-border shadow-sm hover:border-primary-200 transition-colors cursor-default">
            <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
              {user?.prenom?.[0]?.toUpperCase()}{user?.nom?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text-primary truncate leading-tight">{user?.prenom} {user?.nom}</p>
              <p className="text-[11px] text-text-secondary truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-2 py-2 mt-2 rounded-md text-[13px] font-semibold text-error-600 hover:bg-error-50 hover:text-error-700 transition-colors border border-transparent hover:border-error-100"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  )
}
