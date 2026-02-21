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
import { listUsers } from '@/api/users'
import { listSchools } from '@/api/schools'
import { listCourses } from '@/api/courses'
import { listSeasons } from '@/api/seasons'
import { listClasses } from '@/api/classes'
import { listProjectTemplates } from '@/api/templates'
import { listDailyMissionTemplates } from '@/api/dailyMissions'
import { listProjects } from '@/api/instances'

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

export function DashboardPage() {
  const { user } = useAuth()

  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: () => listUsers() })
  const { data: schools = [] } = useQuery({ queryKey: ['schools'], queryFn: listSchools })
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => listCourses() })
  const { data: seasons = [] } = useQuery({ queryKey: ['seasons'], queryFn: () => listSeasons() })
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => listClasses() })
  const { data: templates = [] } = useQuery({ queryKey: ['project-templates'], queryFn: () => listProjectTemplates() })
  const { data: missions = [] } = useQuery({ queryKey: ['daily-mission-templates'], queryFn: () => listDailyMissionTemplates() })
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => listProjects() })

  const users = Array.isArray(usersData) ? usersData : usersData?.data ?? []
  const totalStudents = users.filter((u: { role: string }) => u.role === 'STUDENT').length
  const totalTeachers = users.filter((u: { role: string }) => u.role === 'TEACHER').length

  return (
    <PageContainer title="Dashboard">
      <p className="text-muted -mt-2">
        Bem-vindo, <span className="text-text font-medium">{user?.name}</span>! Aqui está o resumo da plataforma.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
        <StatCard icon={<Users className="h-5 w-5 text-white" />} label="Total de Usuários" value={users.length} color="bg-accent" />
        <StatCard icon={<School className="h-5 w-5 text-white" />} label="Escolas" value={schools.length} color="bg-info" />
        <StatCard icon={<BookOpen className="h-5 w-5 text-white" />} label="Cursos" value={courses.length} color="bg-success" />
        <StatCard icon={<Calendar className="h-5 w-5 text-white" />} label="Semestres" value={seasons.length} color="bg-warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<GraduationCap className="h-5 w-5 text-white" />} label="Turmas" value={classes.length} color="bg-error" />
        <StatCard icon={<Music className="h-5 w-5 text-white" />} label="Templates de Projeto" value={templates.length} color="bg-accent" />
        <StatCard icon={<Target className="h-5 w-5 text-white" />} label="Missões Diárias" value={missions.length} color="bg-info" />
        <StatCard icon={<FolderKanban className="h-5 w-5 text-white" />} label="Projetos Ativos" value={projects.length} color="bg-success" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Composição de Usuários</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Alunos</span>
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-success" style={{ width: `${Math.max(20, (totalStudents / Math.max(users.length, 1)) * 200)}px` }} />
                <span className="text-sm font-medium text-text">{totalStudents}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Professores</span>
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-info" style={{ width: `${Math.max(20, (totalTeachers / Math.max(users.length, 1)) * 200)}px` }} />
                <span className="text-sm font-medium text-text">{totalTeachers}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Admin/Diretores</span>
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(20, ((users.length - totalStudents - totalTeachers) / Math.max(users.length, 1)) * 200)}px` }} />
                <span className="text-sm font-medium text-text">{users.length - totalStudents - totalTeachers}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Semestres por Status</h2>
          <div className="space-y-3">
            {(['PLANNED', 'ACTIVE', 'CLOSED'] as const).map((status) => {
              const count = seasons.filter((s: { status: string }) => s.status === status).length
              const colors = { PLANNED: 'bg-warning', ACTIVE: 'bg-success', CLOSED: 'bg-muted' }
              const labels = { PLANNED: 'Planejados', ACTIVE: 'Ativos', CLOSED: 'Encerrados' }
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-muted">{labels[status]}</span>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 rounded-full ${colors[status]}`} style={{ width: `${Math.max(20, (count / Math.max(seasons.length, 1)) * 200)}px` }} />
                    <span className="text-sm font-medium text-text">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
