import { PageContainer } from '@/components/layout/PageContainer'
import { useAuth } from '@/contexts/AuthContext'
import { LayoutDashboard, Users, School, BookOpen, GraduationCap } from 'lucide-react'

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
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

  return (
    <PageContainer title="Dashboard">
      <p className="text-muted">
        Bem-vindo, <span className="text-text font-medium">{user?.name}</span>!
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
        <StatCard icon={<LayoutDashboard className="h-5 w-5" />} label="Visão geral" value="—" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Usuários" value="—" />
        <StatCard icon={<School className="h-5 w-5" />} label="Escolas" value="—" />
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Cursos" value="—" />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Turmas" value="—" />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 text-center text-muted">
        <p>O dashboard será populado com métricas reais nas próximas etapas.</p>
      </div>
    </PageContainer>
  )
}
