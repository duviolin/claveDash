import { Outlet, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useTheme } from '@/hooks/useTheme'
import { SIDEBAR_WIDTH_CLASS } from '@/lib/layout'

export function AppLayout() {
  const { user, isLoading } = useAuth()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (!isMobileSidebarOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileSidebarOpen])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'ADMIN' && user.role !== 'TEACHER') {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text">Acesso negado</h1>
          <p className="mt-2 text-muted">Apenas administradores e professores podem acessar o portal.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <div className={`min-w-0 flex-1 ${SIDEBAR_WIDTH_CLASS}`}>
        <Header
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
