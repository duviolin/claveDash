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
} from 'lucide-react'
import { getDashboardStats } from '@/api/dashboard'

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

  return (
    <PageContainer title="Dashboard">
      <p className="text-muted -mt-2">
        Bem-vindo, <span className="text-text font-medium">{user?.name || user?.email}</span>! Aqui está o resumo da plataforma.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
        <StatCard icon={<Users className="h-5 w-5 text-white" />} label="Total de Usuários" value={stats?.users.total ?? '—'} color="bg-accent" />
        <StatCard icon={<School className="h-5 w-5 text-white" />} label="Escolas" value={stats?.schools.total ?? '—'} color="bg-info" />
        <StatCard icon={<BookOpen className="h-5 w-5 text-white" />} label="Cursos" value={stats?.courses.total ?? '—'} color="bg-success" />
        <StatCard icon={<Calendar className="h-5 w-5 text-white" />} label="Semestres" value={stats?.seasons.total ?? '—'} color="bg-warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<GraduationCap className="h-5 w-5 text-white" />} label="Turmas" value={stats?.classes.total ?? '—'} color="bg-error" />
        <StatCard icon={<Music className="h-5 w-5 text-white" />} label="Templates de Projeto" value={stats?.projectTemplates.total ?? '—'} color="bg-accent" />
        <StatCard icon={<Target className="h-5 w-5 text-white" />} label="Missões Diárias" value={stats?.dailyMissionTemplates.total ?? '—'} color="bg-info" />
        <StatCard icon={<FolderKanban className="h-5 w-5 text-white" />} label="Projetos Ativos" value={stats?.projects.active ?? '—'} color="bg-success" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Composição de Usuários</h2>
          <div className="space-y-3">
            <BarRow label="Alunos" value={stats?.users.students ?? 0} total={stats?.users.total ?? 1} color="bg-success" />
            <BarRow label="Professores" value={stats?.users.teachers ?? 0} total={stats?.users.total ?? 1} color="bg-info" />
            <BarRow label="Diretores" value={stats?.users.directors ?? 0} total={stats?.users.total ?? 1} color="bg-warning" />
            <BarRow label="Admin" value={stats?.users.admins ?? 0} total={stats?.users.total ?? 1} color="bg-accent" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Semestres por Status</h2>
          <div className="space-y-3">
            <BarRow label="Planejados" value={stats?.seasons.planned ?? 0} total={stats?.seasons.total ?? 1} color="bg-warning" />
            <BarRow label="Ativos" value={stats?.seasons.active ?? 0} total={stats?.seasons.total ?? 1} color="bg-success" />
            <BarRow label="Encerrados" value={stats?.seasons.closed ?? 0} total={stats?.seasons.total ?? 1} color="bg-muted" />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
