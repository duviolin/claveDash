import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ArchiveRestore } from 'lucide-react'
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
import { listSeasons, createSeason, updateSeason, deleteSeason, listDeletedSeasons, restoreSeason } from '@/api/seasons'
import { listCourses } from '@/api/courses'
import { formatDate } from '@/lib/utils'
import { SEASON_STATUS_LABELS, SEASON_STATUS_VARIANT } from '@/lib/constants'
import type { Season, SeasonStatus, Course, DeactivationErrorDetails } from '@/types'
import toast from 'react-hot-toast'

const SEASONS_TRASH_LIMIT = 20
const tabs = [
  { key: 'active', label: 'Ativas' },
  { key: 'TRASH', label: 'Lixeira' },
]

export function SeasonsListPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Season | null>(null)
  const [courseFilter, setCourseFilter] = useState('')
  const [form, setForm] = useState({
    courseId: '',
    name: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED' as SeasonStatus,
  })
  const [deleteTarget, setDeleteTarget] = useState<Season | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<Season | null>(null)
  const [blockedInfo, setBlockedInfo] = useState<{ name: string; id: string; details: DeactivationErrorDetails } | null>(null)
  const [page, setPage] = useState(1)

  const isTrash = activeTab === 'TRASH'

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => listCourses() })

  const { data: seasons = [], isLoading: isLoadingActive } = useQuery({
    queryKey: ['seasons', courseFilter],
    queryFn: () => listSeasons(courseFilter || undefined),
    enabled: !isTrash && !!courseFilter,
  })

  const { data: deletedResponse, isLoading: isLoadingTrash } = useQuery({
    queryKey: ['seasons', 'deleted', page],
    queryFn: () => listDeletedSeasons({ page, limit: SEASONS_TRASH_LIMIT }),
    enabled: isTrash,
  })

  const deletedSeasons = deletedResponse?.data ?? []
  const pagination = deletedResponse?.pagination
  const isLoading = isTrash ? isLoadingTrash : isLoadingActive
  const displaySeasons = isTrash ? deletedSeasons : seasons

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editing) {
        return updateSeason(editing.id, {
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
        })
      }
      return createSeason(form)
    },
    onSuccess: () => {
      toast.success(editing ? 'Semestre atualizado!' : 'Semestre criado!')
      queryClient.invalidateQueries({ queryKey: ['seasons'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSeason(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Semestre desativado!')
      queryClient.invalidateQueries({ queryKey: ['seasons'] })
      setDeleteTarget(null)
    },
    onError: (error: any) => {
      const details = error.response?.data?.details
      if (error.response?.status === 409 && details) {
        setBlockedInfo({ name: deleteTarget!.name, id: deleteTarget!.id, details })
      }
      setDeleteTarget(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreSeason(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Semestre restaurado!')
      queryClient.invalidateQueries({ queryKey: ['seasons'] })
      setRestoreTarget(null)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ courseId: courseFilter, name: '', startDate: '', endDate: '', status: 'PLANNED' })
    setModalOpen(true)
  }

  const openEdit = (season: Season) => {
    setEditing(season)
    setForm({
      courseId: season.courseId,
      name: season.name,
      startDate: season.startDate.split('T')[0],
      endDate: season.endDate.split('T')[0],
      status: season.status,
    })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (s: Season) => <span className="font-medium text-text">{s.name}</span>,
    },
    {
      key: 'course',
      header: 'Curso',
      render: (s: Season) => {
        const course = courses.find((c: Course) => c.id === s.courseId)
        return <span className="text-muted">{course?.name || '—'}</span>
      },
    },
    {
      key: 'dates',
      header: 'Período',
      render: (s: Season) => (
        <span className="text-muted">{formatDate(s.startDate)} — {formatDate(s.endDate)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Season) => <Badge variant={SEASON_STATUS_VARIANT[s.status]}>{SEASON_STATUS_LABELS[s.status]}</Badge>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (s: Season) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer" title="Editar">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteTarget(s)} className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer" title="Excluir">
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
      render: (s: Season) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">{s.name}</span>
          <Badge variant="error">Excluída</Badge>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Curso',
      render: (s: Season) => {
        const course = courses.find((c: Course) => c.id === s.courseId)
        return <span className="text-muted">{course?.name || '—'}</span>
      },
    },
    {
      key: 'dates',
      header: 'Período',
      render: (s: Season) => (
        <span className="text-muted">{formatDate(s.startDate)} — {formatDate(s.endDate)}</span>
      ),
    },
    {
      key: 'deletedAt',
      header: 'Excluída em',
      render: (s: Season) => <span className="text-muted">{formatDate(s.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (s: Season) => (
        <button
          onClick={() => setRestoreTarget(s)}
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
      title="Semestres"
      count={pagination?.total ?? displaySeasons.length}
      action={
        !isTrash ? (
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Criar Semestre</Button>
        ) : undefined
      }
    >
      <Tabs tabs={tabs} activeKey={activeTab} onChange={(key) => { setActiveTab(key); setPage(1) }} />

      {!isTrash && (
        <Select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          placeholder="Todos os cursos"
          options={courses.map((c: Course) => ({ value: c.id, label: c.name }))}
          className="max-w-xs"
        />
      )}

      <Table
        columns={isTrash ? trashColumns : columns}
        data={displaySeasons}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia' : 'Nenhum semestre encontrado'}
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
        title={editing ? 'Editar Semestre' : 'Criar Semestre'}
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
              id="courseId"
              label="Curso"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              placeholder="Selecionar curso..."
              options={courses.map((c: Course) => ({ value: c.id, label: c.name }))}
            />
          )}
          <Input id="seasonName" label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input id="startDate" label="Início" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <Input id="endDate" label="Fim" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </div>
          <Select
            id="seasonStatus"
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as SeasonStatus })}
            options={[
              { value: 'PLANNED', label: 'Planejado' },
              { value: 'ACTIVE', label: 'Ativo' },
              { value: 'CLOSED', label: 'Encerrado' },
            ]}
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Excluir Semestre"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? O semestre será desativado.`}
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar Semestre"
        message={`Tem certeza que deseja restaurar "${restoreTarget?.name}"?`}
        confirmLabel="Restaurar"
      />

      <DeactivationBlockedModal
        isOpen={!!blockedInfo}
        onClose={() => setBlockedInfo(null)}
        entityName={blockedInfo?.name ?? ''}
        parentId={blockedInfo?.id ?? ''}
        details={blockedInfo?.details ?? null}
      />
    </PageContainer>
  )
}
