import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'

/**
 * AppLayout — structure responsive de l'application connectée.
 * Desktop (lg+) : sidebar fixe visible + contenu.
 * Mobile/Tablette (<lg) : sidebar en tiroir (overlay), ouverte via le hamburger de la Navbar.
 */
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 py-5 sm:py-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
