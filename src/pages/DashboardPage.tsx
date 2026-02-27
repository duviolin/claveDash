import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuth } from '@/contexts/AuthContext'
import {
  Users,
  School,
  BookOpen,
  GraduationCap,
  Calendar,
  Music,
  Target,
  FolderKanban,
  Activity,
  Shield,
} from 'lucide-react'
import { getDashboardStats, getRecentEvents } from '@/api/dashboard'
import { EVENT_TYPE_LABELS, EVENT_ACTION_COLORS, ACTOR_TYPE_LABELS, getEventAction } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { DomainEvent } from '@/types'

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 hover:border-accent/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-text">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}

function EventRow({ event }: { event: DomainEvent }) {
  const action = getEventAction(event.type)
  const color = EVENT_ACTION_COLORS[action]
  const label = EVENT_TYPE_LABELS[event.type] ?? event.type.replaceAll('_', ' ').toLowerCase()
  const isSystem = event.actorType !== 'USER'

  return (
    <div className="flex items-start gap-3 py-2.5 px-1 border-b border-border/50 last:border-0">
      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text truncate">{label}</p>
        <p className="text-xs text-muted truncate">
          {isSystem
            ? ACTOR_TYPE_LABELS[event.actorType] ?? event.actorType
            : event.actorName}
          {' · '}
          {timeAgo(event.createdAt)}
        </p>
      </div>
    </div>
  )
}

function ActivityFeed({ events, isLoading }: { events: DomainEvent[] | undefined; isLoading: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text">Atividade Recente</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Shield className="h-3.5 w-3.5" />
          <span>Auditoria</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : !events?.length ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-sm text-muted">Nenhum evento registrado ainda.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-h-[420px] -mx-1 pr-1 custom-scrollbar">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-xs text-muted text-center">
          Todos os eventos do sistema são registrados automaticamente.
          <br />
          Em breve: filtros, busca e relatórios completos de auditoria.
        </p>
      </div>
    </div>
  )
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.max(20, (value / Math.max(total, 1)) * 200)}px` }} />
        <span className="text-sm font-medium text-text">{value}</span>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats })
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['dashboard-events'],
    queryFn: () => getRecentEvents(25),
    refetchInterval: 30_000,
  })

  return (
    <PageContainer title="Painel">
      <p className="text-muted -mt-2">
        Bem-vindo, <span className="text-text font-medium">{user?.name || user?.email}</span>! Aqui está o resumo da plataforma.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 mt-2">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Users className="h-5 w-5 text-white" />} label="Total da equipe" value={stats?.users.total ?? '—'} color="bg-accent" />
            <StatCard icon={<School className="h-5 w-5 text-white" />} label="Unidades artísticas" value={stats?.schools.total ?? '—'} color="bg-info" />
            <StatCard icon={<BookOpen className="h-5 w-5 text-white" />} label="Núcleos artísticos" value={stats?.courses.total ?? '—'} color="bg-success" />
            <StatCard icon={<Calendar className="h-5 w-5 text-white" />} label="Temporadas" value={stats?.seasons.total ?? '—'} color="bg-warning" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<GraduationCap className="h-5 w-5 text-white" />} label="Grupos artísticos" value={stats?.classes.total ?? '—'} color="bg-error" />
            <StatCard icon={<Music className="h-5 w-5 text-white" />} label="Templates de Projeto" value={stats?.projectTemplates.total ?? '—'} color="bg-accent" />
            <StatCard icon={<Target className="h-5 w-5 text-white" />} label="Missões Diárias" value={stats?.dailyMissionTemplates.total ?? '—'} color="bg-info" />
            <StatCard icon={<FolderKanban className="h-5 w-5 text-white" />} label="Projetos Ativos" value={stats?.projects.active ?? '—'} color="bg-success" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-text mb-4">Composição de perfis</h2>
              <div className="space-y-3">
                <BarRow label="Artistas" value={stats?.users.students ?? 0} total={stats?.users.total ?? 1} color="bg-success" />
                <BarRow label="Produtores" value={stats?.users.teachers ?? 0} total={stats?.users.total ?? 1} color="bg-info" />
                <BarRow label="Diretores da unidade" value={stats?.users.directors ?? 0} total={stats?.users.total ?? 1} color="bg-warning" />
                <BarRow label="Admin" value={stats?.users.admins ?? 0} total={stats?.users.total ?? 1} color="bg-accent" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-text mb-4">Temporadas por status</h2>
              <div className="space-y-3">
                <BarRow label="Planejados" value={stats?.seasons.planned ?? 0} total={stats?.seasons.total ?? 1} color="bg-warning" />
                <BarRow label="Ativos" value={stats?.seasons.active ?? 0} total={stats?.seasons.total ?? 1} color="bg-success" />
                <BarRow label="Encerrados" value={stats?.seasons.closed ?? 0} total={stats?.seasons.total ?? 1} color="bg-muted" />
              </div>
            </div>
          </div>
        </div>

        <ActivityFeed events={events} isLoading={eventsLoading} />
      </div>
    </PageContainer>
  )
}
