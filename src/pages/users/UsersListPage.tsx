import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Ban, RotateCcw, Trash2, ArchiveRestore } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { ConfirmModal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { listUsers, suspendUser, reactivateUser, softDeleteUser, restoreUser, listDeletedUsers } from '@/api/users'
import { formatDate } from '@/lib/utils'
import { ROLE_LABELS, ROLE_BADGE_VARIANT, USER_STATUS_LABELS } from '@/lib/constants'
import type { User, UserRole, PaginatedResponse } from '@/types'
import toast from 'react-hot-toast'

const roleTabs = [
  { key: 'ALL', label: 'Todos' },
  ...Object.entries(ROLE_LABELS).map(([key, label]) => ({ key, label })),
  { key: 'TRASH', label: 'Lixeira' },
]

const roleCreateLabel: Record<string, string> = {
  ALL: 'Criar Usuário',
  ...Object.fromEntries(Object.entries(ROLE_LABELS).map(([k, v]) => [k, `Criar ${v}`])),
}

const USERS_PAGE_LIMIT = 10

export function UsersListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ user: User; action: 'suspend' | 'reactivate' | 'delete' | 'restore' } | null>(null)

  const isTrash = roleFilter === 'TRASH'

  const handleTabChange = (key: string) => {
    setRoleFilter(key)
    setPage(1)
    setSearch('')
  }

  const params =
    roleFilter === 'ALL' || isTrash
      ? { page, limit: USERS_PAGE_LIMIT }
      : { role: roleFilter as UserRole, page, limit: USERS_PAGE_LIMIT }

  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter, page],
    queryFn: () => isTrash ? listDeletedUsers(params) : listUsers(params),
  })

  const users: User[] = data?.data ?? []
  const pagination = data?.pagination

  const filteredUsers = users.filter((u) => {
    if (!search) return true
    const term = search.toLowerCase()
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
  })

  function optimisticRemove(userId: string) {
    queryClient.setQueriesData<PaginatedResponse<User>>(
      { queryKey: ['users', roleFilter, page] },
      (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.filter((u) => u.id !== userId),
          pagination: { ...old.pagination, total: old.pagination.total - 1 },
        }
      },
    )
  }

  const mutation = useMutation({
    mutationFn: async ({ user, action }: { user: User; action: 'suspend' | 'reactivate' | 'delete' | 'restore' }) => {
      switch (action) {
        case 'suspend':
          await suspendUser(user.id)
          return 'Usuário suspenso'
        case 'reactivate':
          await reactivateUser(user.id)
          return 'Usuário reativado'
        case 'delete':
          await softDeleteUser(user.id)
          return 'Usuário movido para a lixeira'
        case 'restore':
          await restoreUser(user.id)
          return 'Usuário restaurado'
      }
    },
    onSuccess: (message, { user, action }) => {
      toast.success(message)

      if (action === 'delete' || action === 'restore') {
        optimisticRemove(user.id)
      }

      queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'all' })
    },
    onSettled: () => {
      setConfirmAction(null)
    },
  })

  const handleAction = () => {
    if (!confirmAction) return
    mutation.mutate(confirmAction)
  }

  const truncate = (text: string, max: number) => text.length > max ? `${text.slice(0, max)}…` : text

  const activeColumns = [
    {
      key: 'name',
      header: 'Nome',
      render: (u: User) => <span className="font-medium text-text">{truncate(u.name, 25)}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (u: User) => <span className="text-muted">{truncate(u.email, 30)}</span>,
    },
    {
      key: 'role',
      header: 'Perfil',
      render: (u: User) => <Badge variant={ROLE_BADGE_VARIANT[u.role]}>{ROLE_LABELS[u.role]}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: User) => (
        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'error'}>{USER_STATUS_LABELS[u.status]}</Badge>
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
          <button
            onClick={() => setConfirmAction({ user: u, action: 'delete' })}
            className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const trashColumns = [
    {
      key: 'name',
      header: 'Nome',
      render: (u: User) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">{truncate(u.name, 25)}</span>
          <Badge variant="error">Excluído</Badge>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (u: User) => <span className="text-muted">{truncate(u.email, 30)}</span>,
    },
    {
      key: 'role',
      header: 'Perfil',
      render: (u: User) => <Badge variant={ROLE_BADGE_VARIANT[u.role]}>{ROLE_LABELS[u.role]}</Badge>,
    },
    {
      key: 'deletedAt',
      header: 'Excluído em',
      render: (u: User) => <span className="text-muted">{formatDate(u.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (u: User) => (
        <button
          onClick={() => setConfirmAction({ user: u, action: 'restore' })}
          className="rounded-lg p-1.5 text-muted hover:bg-success/10 hover:text-success transition-colors cursor-pointer"
          title="Restaurar"
        >
          <ArchiveRestore className="h-4 w-4" />
        </button>
      ),
    },
  ]

  const confirmMessages: Record<string, { title: string; message: (name: string) => string; label: string; variant: 'danger' | 'primary' }> = {
    suspend: {
      title: 'Suspender Usuário',
      message: (name) => `Tem certeza que deseja suspender "${name}"? O usuário perderá acesso ao sistema.`,
      label: 'Suspender',
      variant: 'danger',
    },
    reactivate: {
      title: 'Reativar Usuário',
      message: (name) => `Tem certeza que deseja reativar "${name}"?`,
      label: 'Reativar',
      variant: 'primary',
    },
    delete: {
      title: 'Excluir Usuário',
      message: (name) => `Tem certeza que deseja excluir "${name}"? O usuário será movido para a lixeira.`,
      label: 'Excluir',
      variant: 'danger',
    },
    restore: {
      title: 'Restaurar Usuário',
      message: (name) => `Tem certeza que deseja restaurar "${name}"?`,
      label: 'Restaurar',
      variant: 'primary',
    },
  }

  const currentConfirm = confirmAction ? confirmMessages[confirmAction.action] : null

  return (
    <PageContainer
      title="Usuários"
      count={pagination?.total ?? filteredUsers.length}
      action={
        !isTrash ? (
          <Button onClick={() => navigate(roleFilter === 'ALL' ? '/users/new' : `/users/new?role=${roleFilter}`)}>
            <Plus className="h-4 w-4" />
            {roleCreateLabel[roleFilter] ?? 'Criar Usuário'}
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={roleTabs} activeKey={roleFilter} onChange={handleTabChange} />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Table
        columns={isTrash ? trashColumns : activeColumns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia' : 'Nenhum usuário encontrado'}
      />

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={setPage}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        isLoading={mutation.isPending}
        title={currentConfirm?.title ?? ''}
        message={currentConfirm?.message(confirmAction?.user.name ?? '') ?? ''}
        confirmLabel={currentConfirm?.label ?? ''}
        variant={currentConfirm?.variant ?? 'primary'}
      />
    </PageContainer>
  )
}
