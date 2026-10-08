import { Outlet } from 'react-router-dom'
import { useEntreprise } from '../context/EntrepriseContext'
import { PageLoader } from './ui/Loader'
import CreateEntreprise from '../pages/entrepreneur/CreateEntreprise'

/**
 * EntrepriseGate — s'assure qu'une entreprise "active" existe avant d'afficher
 * les pages qui en dépendent (clients, produits, factures...).
 * Cas limite : un entrepreneur qui aurait supprimé toutes ses entreprises
 * retombe sur un écran de création plutôt que sur des pages cassées.
 */
export default function EntrepriseGate() {
  const { loading, entreprises } = useEntreprise()

  if (loading) return <PageLoader label="Chargement de vos entreprises..." />
  if (entreprises.length === 0) return <CreateEntreprise onboarding />

  return <Outlet />
}
