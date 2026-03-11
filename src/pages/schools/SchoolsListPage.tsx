import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Pencil, Trash2, ArchiveRestore } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Pagination'
import { ResponsiveRowActions } from '@/components/ui/ResponsiveRowActions'
import { DetailFieldList } from '@/components/ui/DetailFieldList'
import { CrudListToolbar } from '@/components/ui/CrudListToolbar'
import { listSchools, createSchool, updateSchool, deleteSchool, listDeletedSchools, restoreSchool } from '@/api/schools'
import { listUsers } from '@/api/users'
import { formatDate } from '@/lib/utils'
import type { School, User } from '@/types'
import toast from 'react-hot-toast'
import { useTrashableListPage } from '@/hooks/useTrashableListPage'
import { useDeactivationBlockedHandler } from '@/hooks/useDeactivationBlockedHandler'

const SCHOOLS_PAGE_LIMIT = 10

const tabs = [
  { key: 'active', label: 'Ativas' },
  { key: 'TRASH', label: 'Lixeira' },
]

export function SchoolsListPage() {
  const queryClient = useQueryClient()
  const { activeTab, isTrash, page, setPage, handleTabChange } = useTrashableListPage()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<School | null>(null)
  const [form, setForm] = useState({ name: '', directorId: '' })
  const [deleteTarget, setDeleteTarget] = useState<School | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<School | null>(null)
  const [previewTarget, setPreviewTarget] = useState<School | null>(null)
  const { blockedInfo, setBlockedInfo, handleBlockedError } = useDeactivationBlockedHandler()

  const { data: schoolsResponse, isLoading } = useQuery({
    queryKey: ['schools', activeTab, page],
    queryFn: () =>
      isTrash
        ? listDeletedSchools({ page, limit: SCHOOLS_PAGE_LIMIT })
        : listSchools({ page, limit: SCHOOLS_PAGE_LIMIT }),
  })
  const schools = schoolsResponse?.data ?? []
  const pagination = schoolsResponse?.pagination

  const { data: directorsData } = useQuery({
    queryKey: ['users', 'DIRECTOR'],
    queryFn: () => listUsers({ role: 'DIRECTOR' }),
  })

  const allDirectors: User[] = Array.isArray(directorsData) ? directorsData : directorsData?.data ?? []

  const assignedDirectorIds = new Set(
    schools.filter((s) => s.directorId && s.id !== editing?.id).map((s) => s.directorId)
  )
  const directors = allDirectors.filter((d) => !assignedDirectorIds.has(d.id))

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name: form.name, directorId: form.directorId || undefined }
      return editing ? updateSchool(editing.id, payload) : createSchool(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Escola atualizada com sucesso.' : 'Escola cadastrada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSchool(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Escola desativada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      handleBlockedError(error, deleteTarget!)
      setDeleteTarget(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreSchool(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Escola restaurada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      setRestoreTarget(null)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', directorId: '' })
    setModalOpen(true)
  }

  const openEdit = (school: School) => {
    setEditing(school)
    setForm({ name: school.name, directorId: school.directorId || '' })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (s: School) => <span className="font-medium text-text">{s.name}</span>,
    },
    {
      key: 'director',
      header: 'Diretor escolar',
      render: (s: School) => {
        const director = allDirectors.find((d) => d.id === s.directorId)
        return <span className="text-muted">{director?.name || '—'}</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: School) => (
        <Badge variant={s.isActive ? 'success' : 'error'}>{s.isActive ? 'Ativa' : 'Inativa'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (s: School) => (
        <ResponsiveRowActions
          actions={[
            {
              key: 'preview',
              label: 'Visualizar escola',
              icon: <Eye className="h-4 w-4" />,
              onClick: () => setPreviewTarget(s),
            },
            {
              key: 'edit',
              label: 'Editar cadastro',
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => openEdit(s),
            },
            {
              key: 'delete',
              label: 'Desativar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => setDeleteTarget(s),
            },
          ]}
        />
      ),
    },
  ]

  const trashColumns = [
    {
      key: 'name',
      header: 'Nome',
      render: (s: School) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">{s.name}</span>
          <Badge variant="error">Excluída</Badge>
        </div>
      ),
    },
    {
      key: 'director',
      header: 'Diretor escolar',
      render: (s: School) => {
        const director = allDirectors.find((d) => d.id === s.directorId)
        return <span className="text-muted">{director?.name || '—'}</span>
      },
    },
    {
      key: 'deletedAt',
      header: 'Excluída em',
      render: (s: School) => <span className="text-muted">{formatDate(s.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (s: School) => (
        <ResponsiveRowActions
          actions={[
            {
              key: 'restore',
              label: 'Restaurar',
              icon: <ArchiveRestore className="h-4 w-4" />,
              variant: 'success',
              onClick: () => setRestoreTarget(s),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <PageContainer
      title="Escolas"
      count={pagination?.total ?? schools.length}
      action={
        !isTrash ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Cadastrar escola
          </Button>
        ) : undefined
      }
    >
      <CrudListToolbar primary={<Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />} />
      <Table
        columns={isTrash ? trashColumns : columns}
        data={schools}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia.' : 'Nenhuma escola encontrada.'}
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
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar escola' : 'Cadastrar escola'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
              {editing ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            id="schoolName"
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            id="directorId"
            label="Diretor escolar"
            value={form.directorId}
            onChange={(e) => setForm({ ...form, directorId: e.target.value })}
            placeholder="Selecionar diretor escolar..."
            options={directors.map((d) => ({ value: d.id, label: d.name }))}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        title="Dados da escola"
        footer={<Button variant="secondary" onClick={() => setPreviewTarget(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <DetailFieldList
            items={[
              { label: 'Nome', value: previewTarget?.name ?? '—' },
              {
                label: 'Diretor escolar',
                value: previewTarget ? (allDirectors.find((d) => d.id === previewTarget.directorId)?.name || '—') : '—',
              },
              { label: 'Atualizado em', value: previewTarget ? formatDate(previewTarget.updatedAt) : '—' },
            ]}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>
            <div className="mt-1">
              {previewTarget ? (
                <Badge variant={previewTarget.isActive ? 'success' : 'error'}>
                  {previewTarget.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Desativar escola"
        message={`Confirma a desativação de "${deleteTarget?.name}"?`}
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar escola"
        message={`Confirma a restauração de "${restoreTarget?.name}"?`}
        confirmLabel="Restaurar"
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
