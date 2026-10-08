import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { EntrepriseProvider } from './context/EntrepriseContext'
import ProtectedRoute from './components/ProtectedRoute'
import { AdminRoute, EntrepreneurRoute } from './components/AdminRoute'
import EntrepriseGate from './components/EntrepriseGate'
import AppLayout from './components/layout/AppLayout'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import Dashboard from './pages/entrepreneur/Dashboard'
import Entreprise from './pages/entrepreneur/Entreprise'
import Clients from './pages/entrepreneur/clients/Clients'
import ClientDetail from './pages/entrepreneur/clients/ClientDetail'
import Produits from './pages/entrepreneur/produits/Produits'
import Services from './pages/entrepreneur/services/Services'
import Employes from './pages/entrepreneur/employes/Employes'
import Factures from './pages/entrepreneur/factures/Factures'
import FactureForm from './pages/entrepreneur/factures/FactureForm'
import FactureDetail from './pages/entrepreneur/factures/FactureDetail'
import Audits from './pages/entrepreneur/audits/Audits'
import Previsions from './pages/entrepreneur/previsions/Previsions'
import RuptureStock from './pages/entrepreneur/rupture-stock/RuptureStock'
import AuditVentes from './pages/entrepreneur/audit-ventes/AuditVentes'
import Profil from './pages/entrepreneur/Profil'
import Assistant from './pages/assistant/Assistant'

import AdminDashboard from './pages/admin/Dashboard'
import AdminEntreprises from './pages/admin/Entreprises'
import AdminUsers from './pages/admin/Users'

/** Layout de l'espace Entrepreneur : Sidebar/Navbar + contexte "entreprise active". */
function EntrepreneurLayout() {
  return (
    <EntrepriseProvider>
      <AppLayout />
    </EntrepriseProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              {/* --- Espace Entrepreneur --- */}
              <Route element={<EntrepreneurRoute />}>
                <Route element={<EntrepreneurLayout />}>
                  <Route path="/profil" element={<Profil />} />
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="/assistant/:id" element={<Assistant />} />
                  <Route element={<EntrepriseGate />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/entreprise" element={<Entreprise />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<ClientDetail />} />
                    <Route path="/produits" element={<Produits />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/employes" element={<Employes />} />
                    <Route path="/factures" element={<Factures />} />
                    <Route path="/factures/add" element={<FactureForm />} />
                    <Route path="/factures/:id/edit" element={<FactureForm />} />
                    <Route path="/factures/:id" element={<FactureDetail />} />
                    <Route path="/audit-ventes" element={<AuditVentes />} />
                    <Route path="/audits" element={<Audits />} />
                    <Route path="/previsions" element={<Previsions />} />
                    <Route path="/rupture-stock" element={<RuptureStock />} />
                  </Route>
                </Route>
              </Route>

              {/* --- Espace Admin --- */}
              <Route element={<AdminRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/profil" element={<Profil />} />
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="/assistant/:id" element={<Assistant />} />
                  <Route path="/sysadmin" element={<AdminDashboard />} />
                  <Route path="/sysadmin/entreprises" element={<AdminEntreprises />} />
                  <Route path="/sysadmin/users" element={<AdminUsers />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
