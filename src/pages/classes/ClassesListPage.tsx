import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Eye, Trash2, ArchiveRestore } from 'lucide-react'
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
import { listClasses, createClass, updateClass, deleteClass, listDeletedClasses, restoreClass } from '@/api/classes'
import { listSeasons } from '@/api/seasons'
import { formatDate } from '@/lib/utils'
import type { Class, Season, DeactivationErrorDetails } from '@/types'
import toast from 'react-hot-toast'

const CLASSES_PAGE_LIMIT = 20

const tabs = [
  { key: 'active', label: 'Ativas' },
  { key: 'TRASH', label: 'Lixeira' },
]

export function ClassesListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const filterFromUrl = searchParams.get('seasonSlug') ?? searchParams.get('seasonId') ?? ''
  const [seasonFilter, setSeasonFilter] = useState(filterFromUrl)
  const [activeTab, setActiveTab] = useState('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Class | null>(null)
  const [form, setForm] = useState({ seasonId: '', name: '', maxStudents: 30 })
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<Class | null>(null)
  const [blockedInfo, setBlockedInfo] = useState<{ name: string; slug: string; details: DeactivationErrorDetails } | null>(null)
  const [page, setPage] = useState(1)

  const isTrash = activeTab === 'TRASH'

  const { data: seasons = [] } = useQuery({ queryKey: ['seasons'], queryFn: () => listSeasons() })

  const { data: classes = [], isLoading: isLoadingActive } = useQuery({
    queryKey: ['classes', seasonFilter],
    queryFn: () => listClasses(seasonFilter || undefined),
    enabled: !isTrash,
  })

  const { data: deletedResponse, isLoading: isLoadingTrash } = useQuery({
    queryKey: ['classes', 'deleted', page],
    queryFn: () => listDeletedClasses({ page, limit: CLASSES_PAGE_LIMIT }),
    enabled: isTrash,
  })
  const deletedClasses = deletedResponse?.data ?? []
  const pagination = deletedResponse?.pagination
  const isLoading = isTrash ? isLoadingTrash : isLoadingActive
  const displayData = isTrash ? deletedClasses : classes

  const saveMutation = useMutation({
    mutationFn: () => {
      return editing
        ? updateClass(editing.id, { name: form.name, maxStudents: form.maxStudents })
        : createClass(form)
    },
    onSuccess: () => {
      toast.success(editing ? 'Grupo artístico atualizado!' : 'Grupo artístico criado!')
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteClass(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Grupo artístico desativado!')
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { status?: number; data?: { details?: DeactivationErrorDetails } } }
      const details = axiosError.response?.data?.details
      if (axiosError.response?.status === 409 && details) {
        setBlockedInfo({ name: deleteTarget!.name, slug: deleteTarget!.slug, details })
      }
      setDeleteTarget(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreClass(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Grupo artístico restaurado!')
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setRestoreTarget(null)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ seasonId: seasonFilter, name: '', maxStudents: 30 })
    setModalOpen(true)
  }

  const openEdit = (cls: Class) => {
    setEditing(cls)
    setForm({ seasonId: cls.seasonId, name: cls.name, maxStudents: cls.maxStudents })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (c: Class) => <span className="font-medium text-text">{c.name}</span>,
    },
    {
      key: 'season',
      header: 'Temporada',
      render: (c: Class) => {
        const season = seasons.find((s: Season) => s.id === c.seasonId)
        return <span className="text-muted">{season?.name || '—'}</span>
      },
    },
    {
      key: 'maxStudents',
      header: 'Máx. Artistas',
      render: (c: Class) => <span className="text-muted">{c.maxStudents}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: Class) => <Badge variant={c.isActive ? 'success' : 'error'}>{c.isActive ? 'Ativa' : 'Inativa'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (c: Class) => (
        <div className="flex gap-1">
          <button
            onClick={() => navigate(`/classes/${c.slug}`)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
            title="Visualizar grupo artístico"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEdit(c)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(c)}
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
      render: (c: Class) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">{c.name}</span>
          <Badge variant="error">Excluída</Badge>
        </div>
      ),
    },
    {
      key: 'season',
      header: 'Temporada',
      render: (c: Class) => {
        const season = seasons.find((s: Season) => s.id === c.seasonId)
        return <span className="text-muted">{season?.name || '—'}</span>
      },
    },
    {
      key: 'maxStudents',
      header: 'Máx. Artistas',
      render: (c: Class) => <span className="text-muted">{c.maxStudents}</span>,
    },
    {
      key: 'deletedAt',
      header: 'Excluída em',
      render: (c: Class) => <span className="text-muted">{formatDate(c.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (c: Class) => (
        <button
          onClick={() => setRestoreTarget(c)}
          className="rounded-lg p-1.5 text-muted hover:bg-success/10 hover:text-success transition-colors cursor-pointer"
          title="Restaurar"
        >
          <ArchiveRestore className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <PageContainer
      title="Grupos artísticos"
      count={pagination?.total ?? displayData.length}
      action={
        !isTrash ? (
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Criar Grupo artístico</Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={(key) => { setActiveTab(key); setPage(1) }} />

        {!isTrash && (
          <Select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            placeholder="Todas as temporadas"
            options={seasons.map((s: Season) => ({ value: s.id, label: s.name }))}
            className="w-full sm:max-w-xs"
          />
        )}
      </div>

      <Table
        columns={isTrash ? trashColumns : columns}
        data={displayData}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia' : 'Nenhum grupo artístico encontrado'}
      />

      {isTrash && pagination && (
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
        title={editing ? 'Editar Grupo artístico' : 'Criar Grupo artístico'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!editing && (
            <Select
              id="seasonId"
              label="Temporada"
              value={form.seasonId}
              onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
              placeholder="Selecionar temporada..."
              options={seasons.map((s: Season) => ({ value: s.id, label: s.name }))}
            />
          )}
          <Input id="className" label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input id="maxStudents" label="Máximo de Artistas" type="number" value={String(form.maxStudents)} onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })} required />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Excluir Grupo artístico"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? O grupo artístico será desativado.`}
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar Grupo artístico"
        message={`Tem certeza que deseja restaurar "${restoreTarget?.name}"?`}
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
