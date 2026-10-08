import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AdminRoute() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export function EntrepreneurRoute() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Navigate to="/sysadmin" replace /> : <Outlet />
}
