import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  School,
  BookOpen,
  Calendar,
  GraduationCap,
  FileText,
  Music,
  Layers,
  Target,
  FolderKanban,
  Cloud,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

interface CollapsibleGroup {
  label: string
  icon: React.ReactNode
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    items: [
      { label: 'Painel', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Usuários', path: '/users', icon: <Users className="h-4 w-4" /> },
      { label: 'Escolas', path: '/schools', icon: <School className="h-4 w-4" /> },
      { label: 'Cursos', path: '/courses', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'Semestres', path: '/seasons', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Turmas', path: '/classes', icon: <GraduationCap className="h-4 w-4" /> },
    ],
  },
]

const templatesGroup: CollapsibleGroup = {
  label: 'Templates',
  icon: <FileText className="h-4 w-4" />,
  items: [
    { label: 'Projetos', path: '/templates/projects', icon: <Music className="h-4 w-4" /> },
    { label: 'Missões Diárias', path: '/templates/daily-missions', icon: <Target className="h-4 w-4" /> },
    { label: 'Categorias de Trilha', path: '/templates/study-categories', icon: <Layers className="h-4 w-4" /> },
  ],
}

const instancesGroup: CollapsibleGroup = {
  label: 'Instanciação',
  icon: <FolderKanban className="h-4 w-4" />,
  items: [
    { label: 'Projetos Ativos', path: '/instances/projects', icon: <Music className="h-4 w-4" /> },
  ],
}

const bottomItems: NavItem[] = [
  { label: 'Armazenamento', path: '/storage', icon: <Cloud className="h-4 w-4" /> },
  { label: 'Configurações', path: '/settings', icon: <Settings className="h-4 w-4" /> },
]

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent/10 text-accent'
            : 'text-muted hover:bg-surface-2 hover:text-text'
        )
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  )
}

function CollapsibleSection({ group }: { group: CollapsibleGroup }) {
  const location = useLocation()
  const isChildActive = group.items.some((item) => location.pathname.startsWith(item.path))
  const [isOpen, setIsOpen] = useState(isChildActive)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
          isChildActive ? 'text-accent' : 'text-muted hover:bg-surface-2 hover:text-text'
        )}
      >
        <span className="flex items-center gap-3">
          {group.icon}
          {group.label}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
          {group.items.map((item) => (
            <SidebarLink key={item.path} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <Music className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-text">Clave Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navGroups.map((group, i) => (
            <div key={i}>
              {group.label && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarLink key={item.path} item={item} />
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted/60">
              Conteúdo
            </p>
            <div className="space-y-0.5">
              <CollapsibleSection group={templatesGroup} />
              <CollapsibleSection group={instancesGroup} />
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted/60">
              Sistema
            </p>
            <div className="space-y-0.5">
              {bottomItems.map((item) => (
                <SidebarLink key={item.path} item={item} />
              ))}
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}
