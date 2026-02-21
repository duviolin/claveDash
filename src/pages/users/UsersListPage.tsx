import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Ban, RotateCcw } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { ConfirmModal } from '@/components/ui/Modal'
import { listUsers, suspendUser, reactivateUser } from '@/api/users'
import { formatDate } from '@/lib/utils'
import type { User, UserRole } from '@/types'
import toast from 'react-hot-toast'

const roleTabs = [
  { key: 'ALL', label: 'Todos' },
  { key: 'ADMIN', label: 'Admin' },
  { key: 'DIRECTOR', label: 'Director' },
  { key: 'TEACHER', label: 'Teacher' },
  { key: 'STUDENT', label: 'Student' },
]

const roleVariant: Record<UserRole, 'accent' | 'info' | 'success' | 'warning'> = {
  ADMIN: 'accent',
  TEACHER: 'info',
  STUDENT: 'success',
  DIRECTOR: 'warning',
}

export function UsersListPage() {
  const navigate = useNavigate()
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ user: User; action: 'suspend' | 'reactivate' } | null>(null)
  const [isActioning, setIsActioning] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => listUsers(roleFilter !== 'ALL' ? { role: roleFilter as UserRole } : undefined),
  })

  const users: User[] = Array.isArray(data) ? data : data?.data ?? []

  const filteredUsers = users.filter((u) => {
    if (!search) return true
    const term = search.toLowerCase()
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
  })

  const handleAction = async () => {
    if (!confirmAction) return
    setIsActioning(true)
    try {
      if (confirmAction.action === 'suspend') {
        await suspendUser(confirmAction.user.id)
        toast.success('Usuário suspenso')
      } else {
        await reactivateUser(confirmAction.user.id)
        toast.success('Usuário reativado')
      }
      refetch()
    } catch {
      // handled by interceptor
    } finally {
      setIsActioning(false)
      setConfirmAction(null)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (u: User) => <span className="font-medium text-text">{u.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (u: User) => <span className="text-muted">{u.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: User) => <Badge variant={roleVariant[u.role]}>{u.role}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: User) => (
        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'error'}>{u.status}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Criado em',
      render: (u: User) => <span className="text-muted">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (u: User) => (
        <div className="flex gap-1">
          <button
            onClick={() => navigate(`/users/${u.id}`)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {u.status === 'ACTIVE' ? (
            <button
              onClick={() => setConfirmAction({ user: u, action: 'suspend' })}
              className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
              title="Suspender"
            >
              <Ban className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setConfirmAction({ user: u, action: 'reactivate' })}
              className="rounded-lg p-1.5 text-muted hover:bg-success/10 hover:text-success transition-colors cursor-pointer"
              title="Reativar"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="Usuários"
      count={filteredUsers.length}
      action={
        <Button onClick={() => navigate('/users/new')}>
          <Plus className="h-4 w-4" />
          Criar Usuário
        </Button>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={roleTabs} activeKey={roleFilter} onChange={setRoleFilter} />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Table
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="Nenhum usuário encontrado"
      />

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        isLoading={isActioning}
        title={confirmAction?.action === 'suspend' ? 'Suspender Usuário' : 'Reativar Usuário'}
        message={
          confirmAction?.action === 'suspend'
            ? `Tem certeza que deseja suspender "${confirmAction.user.name}"? O usuário perderá acesso ao sistema.`
            : `Tem certeza que deseja reativar "${confirmAction?.user.name}"?`
        }
        confirmLabel={confirmAction?.action === 'suspend' ? 'Suspender' : 'Reativar'}
        variant={confirmAction?.action === 'suspend' ? 'danger' : 'primary'}
      />
    </PageContainer>
  )
}
