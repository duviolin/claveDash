import { useAuth } from '@/contexts/AuthContext'
import { LogOut, ChevronRight, Menu } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { getInitials } from '@/lib/utils'
import { ROLE_LABELS, ROLE_BADGE_VARIANT } from '@/lib/constants'
import { NotificationBell } from './NotificationBell'

const routeLabels: Record<string, string> = {
  dashboard: 'Painel',
  users: 'Equipe',
  schools: 'Unidades artísticas',
  courses: 'Núcleos artísticos',
  seasons: 'Temporadas',
  classes: 'Grupos artísticos',
  templates: 'Templates',
  projects: 'Projetos',
  'daily-missions': 'Missões Diárias',
  instances: 'Instanciação',
  storage: 'Armazenamento',
  settings: 'Configurações',
  new: 'Novo',
}

const uuidSegmentRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Slug-like: lowercase, digits, dashes (e.g. joao-silva, my-template). */
const slugLikeRegex = /^[a-z0-9-]+$/

const detailLabelsByParentSegment: Record<string, string> = {
  users: 'Detalhes da equipe',
  classes: 'Detalhes do grupo artístico',
  projects: 'Detalhes do Template',
}

function prettifySlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function getSegmentLabel(segment: string, segments: string[], index: number): string {
  if (uuidSegmentRegex.test(segment)) {
    const parentSegment = index > 0 ? segments[index - 1] : ''
    return detailLabelsByParentSegment[parentSegment] || 'Detalhes'
  }

  const isLast = index === segments.length - 1
  const knownLabel = routeLabels[segment]
  if (knownLabel) return knownLabel
  if (isLast && slugLikeRegex.test(segment)) return prettifySlug(segment)
  if (!knownLabel && segment.length > 20) return 'Detalhes'
  return segment
}

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  return (
    <nav className="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm">
      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/')
        const label = getSegmentLabel(segment, segments, index)
        const isLast = index === segments.length - 1

        return (
          <span key={path} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted" />}
            {isLast ? (
              <span className="max-w-40 truncate font-medium text-text sm:max-w-56" title={label}>
                {label}
              </span>
            ) : (
              <Link
                to={path}
                className="max-w-40 truncate text-muted transition-colors hover:text-text sm:max-w-56"
                title={label}
              >
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

interface HeaderProps {
  onOpenSidebar: () => void
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user, logout } = useAuth()

  const roleBadgeVariant = ROLE_BADGE_VARIANT

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-3 backdrop-blur-sm sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 pr-2 sm:pr-4">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text lg:hidden"
          aria-label="Abrir menu"
          title="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <Breadcrumb />
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {user && (
          <>
            <NotificationBell />
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                {getInitials(user.name)}
              </div>
              <div className="hidden text-right sm:block">
                <p className="max-w-40 truncate text-sm font-medium text-text">{user.name || user.email}</p>
                <Badge variant={roleBadgeVariant[user.role]} className="text-[10px]">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
              <button
                onClick={logout}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text cursor-pointer"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
