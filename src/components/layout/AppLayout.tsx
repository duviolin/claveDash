import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  const { user, isLoading } = useAuth()

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
          <h1 className="text-2xl font-bold text-text">Acesso Negado</h1>
          <p className="mt-2 text-muted">Apenas ADMIN e TEACHER podem acessar o portal.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
