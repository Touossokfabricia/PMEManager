import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Dropdown } from '../ui'
import NotificationBell from './NotificationBell'

const TITLES = {
  '/dashboard': 'Tableau de bord',
  '/assistant': 'Assistant IA',
  '/clients': 'Clients',
  '/produits': 'Produits',
  '/services': 'Services',
  '/factures': 'Factures',
  '/audit-ventes': 'Audit des ventes',
  '/audits': 'Journal des ventes',
  '/previsions': 'Prévisions de stock',
  '/rupture-stock': 'Rupture de stock',
  '/employes': 'Employés',
  '/entreprise': 'Mon entreprise',
  '/profil': 'Mon profil',
  '/sysadmin': 'Tableau de bord administrateur',
  '/sysadmin/entreprises': 'Entreprises',
  '/sysadmin/users': 'Utilisateurs',
}

function pageTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname]
  const base = '/' + pathname.split('/')[1]
  if (pathname.includes('/add')) return (TITLES[base] || '') + ' \u00b7 Ajouter'
  if (pathname.match(/\/edit$/)) return (TITLES[base] || '') + ' \u00b7 Modifier'
  return TITLES[base] || 'PMEManager'
}

export default function Navbar({ onOpenSidebar }) {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 h-16 px-4 sm:px-6 border-b border-[#e7e0d5] bg-[#f8f5f0]/90 backdrop-blur-sm shadow-[0_1px_0_rgba(27,67,50,0.04)]">
      <button
        onClick={onOpenSidebar}
        className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-[#1B4332] hover:bg-[#edf5f1]"
        aria-label="Ouvrir le menu"
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b877d]">PMEManager</p>
        <h1 className="text-base sm:text-lg font-semibold text-[#1a2933] truncate">
          {pageTitle(location.pathname)}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {!isAdmin && <NotificationBell />}

        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-[#edf5f1] transition-colors">
              <div className="h-8 w-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-semibold text-xs shadow-sm">
                {user?.prenom?.[0]?.toUpperCase()}{user?.nom?.[0]?.toUpperCase()}
              </div>
              <i className="fa-solid fa-chevron-down text-[10px] text-[#7b877d] hidden sm:inline"></i>
            </button>
          }
          items={[
            { label: 'Mon profil', icon: 'fa-user', onClick: () => (window.location.href = '/profil') },
            ...(!isAdmin ? [{ label: 'Mon entreprise', icon: 'fa-building', onClick: () => (window.location.href = '/entreprise') }] : []),
            { label: 'Déconnexion', icon: 'fa-arrow-right-from-bracket', onClick: logout, danger: true },
          ]}
        />
      </div>
    </header>
  )
}
