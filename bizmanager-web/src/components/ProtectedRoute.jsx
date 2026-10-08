import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './ui/Loader'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader label="Chargement de votre espace..." />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
