import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Ban, RotateCcw, Trash2, ArchiveRestore } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import { Pagination } from '@/components/ui/Pagination'
import { IconButton } from '@/components/ui/IconButton'
import { DetailFieldList } from '@/components/ui/DetailFieldList'
import { CrudListToolbar } from '@/components/ui/CrudListToolbar'
import { listUsers, suspendUser, reactivateUser, softDeleteUser, restoreUser, listDeletedUsers } from '@/api/users'
import { formatDate } from '@/lib/utils'
import { truncateText } from '@/lib/text'
import { ROLE_LABELS, ROLE_BADGE_VARIANT, USER_STATUS_LABELS } from '@/lib/constants'
import type { User, UserRole, PaginatedResponse } from '@/types'
import toast from 'react-hot-toast'
import { useTrashableListPage } from '@/hooks/useTrashableListPage'
import { useDeactivationBlockedHandler } from '@/hooks/useDeactivationBlockedHandler'

const roleTabs = [
  { key: 'ALL', label: 'Todos' },
  ...Object.entries(ROLE_LABELS).map(([key, label]) => ({ key, label })),
  { key: 'TRASH', label: 'Lixeira' },
]

const roleCreateLabel: Record<string, string> = {
  ALL: 'Cadastrar usuário',
  ...Object.fromEntries(Object.entries(ROLE_LABELS).map(([k, v]) => [k, `Cadastrar ${v}`])),
}

const USERS_PAGE_LIMIT = 10

export function UsersListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeTab: roleFilter, page, setPage, handleTabChange: setRoleFilterAndReset } = useTrashableListPage({ defaultTab: 'ALL' })
  const [search, setSearch] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ user: User; action: 'suspend' | 'reactivate' | 'delete' | 'restore' } | null>(null)
  const [previewTarget, setPreviewTarget] = useState<User | null>(null)
  const { blockedInfo, setBlockedInfo, handleBlockedError } = useDeactivationBlockedHandler()

  const isTrash = roleFilter === 'TRASH'

  const handleTabChange = (key: string) => {
    setRoleFilterAndReset(key)
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
          return 'Usuário suspenso.'
        case 'reactivate':
          await reactivateUser(user.id)
          return 'Usuário reativado.'
        case 'delete':
          await softDeleteUser(user.id)
          return 'Usuário movido para a lixeira.'
        case 'restore':
          await restoreUser(user.id)
          return 'Usuário restaurado.'
      }
    },
    onSuccess: (message, { user, action }) => {
      toast.success(message)

      if (action === 'delete' || action === 'restore') {
        optimisticRemove(user.id)
      }

      queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'all' })
    },
    onError: (error: unknown, { user, action }) => {
      if (action === 'delete') {
        const wasBlocked = handleBlockedError(error, user)
        if (!wasBlocked) {
          toast.error('Não foi possível remover o usuário.')
        }
      }
    },
    onSettled: () => {
      setConfirmAction(null)
    },
  })

  const handleAction = () => {
    if (!confirmAction) return
    mutation.mutate(confirmAction)
  }

  const activeColumns = [
    {
      key: 'name',
      header: 'Nome',
      render: (u: User) => <span className="font-medium text-text">{truncateText(u.name, 25)}</span>,
    },
    {
      key: 'email',
      header: 'E-mail',
      render: (u: User) => <span className="text-muted">{truncateText(u.email, 30)}</span>,
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
          <IconButton
            onClick={() => setPreviewTarget(u)}
            label="Visualizar usuário"
            icon={<Eye className="h-4 w-4" />}
          />
          <IconButton
            onClick={() => navigate(`/users/${u.slug}`)}
            label="Editar cadastro"
            icon={<Pencil className="h-4 w-4" />}
          />
          {u.status === 'ACTIVE' ? (
            <IconButton
              onClick={() => setConfirmAction({ user: u, action: 'suspend' })}
              label="Suspender"
              icon={<Ban className="h-4 w-4" />}
              variant="danger"
            />
          ) : (
            <IconButton
              onClick={() => setConfirmAction({ user: u, action: 'reactivate' })}
              label="Reativar"
              icon={<RotateCcw className="h-4 w-4" />}
              variant="success"
            />
          )}
          <IconButton
            onClick={() => setConfirmAction({ user: u, action: 'delete' })}
            label="Remover"
            icon={<Trash2 className="h-4 w-4" />}
            variant="danger"
          />
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
          <span className="font-medium text-text">{truncateText(u.name, 25)}</span>
          <Badge variant="error">Excluído</Badge>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'E-mail',
      render: (u: User) => <span className="text-muted">{truncateText(u.email, 30)}</span>,
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
        <IconButton
          onClick={() => setConfirmAction({ user: u, action: 'restore' })}
          label="Restaurar"
          icon={<ArchiveRestore className="h-4 w-4" />}
          variant="success"
        />
      ),
    },
  ]

  const confirmMessages: Record<string, { title: string; message: (name: string) => string; label: string; variant: 'danger' | 'primary' }> = {
    suspend: {
      title: 'Suspender usuário',
      message: (name) => `Confirma a suspensão de "${name}"? O acesso ao sistema será bloqueado.`,
      label: 'Suspender',
      variant: 'danger',
    },
    reactivate: {
      title: 'Reativar usuário',
      message: (name) => `Confirma a reativação de "${name}"?`,
      label: 'Reativar',
      variant: 'primary',
    },
    delete: {
      title: 'Remover usuário',
      message: (name) => `Confirma a remoção de "${name}"? O usuário será movido para a lixeira.`,
      label: 'Remover',
      variant: 'danger',
    },
    restore: {
      title: 'Restaurar usuário',
      message: (name) => `Confirma a restauração de "${name}"?`,
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
            {roleCreateLabel[roleFilter] ?? 'Cadastrar usuário'}
          </Button>
        ) : undefined
      }
    >
      <CrudListToolbar
        primary={<Tabs tabs={roleTabs} activeKey={roleFilter} onChange={handleTabChange} />}
        secondary={
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:min-w-[300px]"
          />
        }
      />

      <Table
        columns={isTrash ? trashColumns : activeColumns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia.' : 'Nenhum usuário encontrado.'}
      />

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        title="Dados do usuário"
        footer={<Button variant="secondary" onClick={() => setPreviewTarget(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <DetailFieldList
            items={[
              { label: 'Nome', value: previewTarget?.name ?? '—' },
              { label: 'E-mail', value: previewTarget?.email ?? '—' },
              { label: 'Criado em', value: previewTarget ? formatDate(previewTarget.createdAt) : '—' },
            ]}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Perfil</p>
            <div className="mt-1">
              {previewTarget ? (
                <Badge variant={ROLE_BADGE_VARIANT[previewTarget.role]}>{ROLE_LABELS[previewTarget.role]}</Badge>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>
            <div className="mt-1">
              {previewTarget ? (
                <Badge variant={previewTarget.status === 'ACTIVE' ? 'success' : 'error'}>
                  {USER_STATUS_LABELS[previewTarget.status]}
                </Badge>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          </div>
        </div>
      </Modal>

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

      <DeactivationBlockedModal
        isOpen={!!blockedInfo}
        onClose={() => setBlockedInfo(null)}
        entityName={blockedInfo?.name ?? ''}
        parentSlug={blockedInfo?.slug ?? ''}
        details={blockedInfo?.details ?? null}
      />
    </PageContainer>
  )
}
