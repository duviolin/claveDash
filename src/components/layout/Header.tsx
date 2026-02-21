import { useAuth } from '@/contexts/AuthContext'
import { LogOut, ChevronRight } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { getInitials } from '@/lib/utils'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Usuários',
  schools: 'Escolas',
  courses: 'Cursos',
  seasons: 'Semestres',
  classes: 'Turmas',
  templates: 'Templates',
  projects: 'Projetos',
  'daily-missions': 'Missões Diárias',
  'study-categories': 'Categorias de Trilha',
  instances: 'Instanciação',
  storage: 'Storage',
  settings: 'Configurações',
  new: 'Novo',
}

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/')
        const label = routeLabels[segment] || segment
        const isLast = index === segments.length - 1

        return (
          <span key={path} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted" />}
            {isLast ? (
              <span className="font-medium text-text">{label}</span>
            ) : (
              <Link to={path} className="text-muted hover:text-text transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export function Header() {
  const { user, logout } = useAuth()

  const roleBadgeVariant = {
    ADMIN: 'accent' as const,
    TEACHER: 'info' as const,
    STUDENT: 'success' as const,
    DIRECTOR: 'warning' as const,
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-sm px-6">
      <Breadcrumb />

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">
              {getInitials(user.name)}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-text">{user.name}</p>
              <Badge variant={roleBadgeVariant[user.role]} className="text-[10px]">
                {user.role}
              </Badge>
            </div>
            <button
              onClick={logout}
              className="ml-2 rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
