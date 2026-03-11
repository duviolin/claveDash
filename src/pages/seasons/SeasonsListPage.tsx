import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { IconButton } from '@/components/ui/IconButton'
import { DetailFieldList } from '@/components/ui/DetailFieldList'
import { CrudListToolbar } from '@/components/ui/CrudListToolbar'
import { listSeasons, createSeason, updateSeason, deleteSeason, listDeletedSeasons, restoreSeason } from '@/api/seasons'
import { listCourses } from '@/api/courses'
import { formatDate } from '@/lib/utils'
import { SEASON_STATUS_LABELS, SEASON_STATUS_VARIANT } from '@/lib/constants'
import type { Season, SeasonStatus, Course } from '@/types'
import toast from 'react-hot-toast'
import { useTrashableListPage } from '@/hooks/useTrashableListPage'
import { useDeactivationBlockedHandler } from '@/hooks/useDeactivationBlockedHandler'

const SEASONS_TRASH_LIMIT = 20
const tabs = [
  { key: 'active', label: 'Ativas' },
  { key: 'TRASH', label: 'Lixeira' },
]

export function SeasonsListPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const filterFromUrl = searchParams.get('courseSlug') ?? searchParams.get('courseId') ?? ''
  const [courseFilter, setCourseFilter] = useState(filterFromUrl)
  const { activeTab, isTrash, page, setPage, handleTabChange } = useTrashableListPage()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Season | null>(null)
  const [form, setForm] = useState({
    courseId: '',
    name: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED' as SeasonStatus,
  })
  const [deleteTarget, setDeleteTarget] = useState<Season | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<Season | null>(null)
  const [previewTarget, setPreviewTarget] = useState<Season | null>(null)
  const { blockedInfo, setBlockedInfo, handleBlockedError } = useDeactivationBlockedHandler()

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => listCourses() })

  const { data: seasons = [], isLoading: isLoadingActive } = useQuery({
    queryKey: ['seasons', courseFilter],
    queryFn: () => listSeasons(courseFilter || undefined),
    enabled: !isTrash,
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
      toast.success(editing ? 'Semestre atualizado com sucesso.' : 'Semestre cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['seasons'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSeason(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Semestre desativado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['seasons'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      handleBlockedError(error, deleteTarget!)
      setDeleteTarget(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreSeason(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Semestre restaurado com sucesso.')
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
          <IconButton
            onClick={() => setPreviewTarget(s)}
            label="Visualizar semestre"
            icon={<Eye className="h-4 w-4" />}
          />
          <IconButton onClick={() => openEdit(s)} label="Editar cadastro" icon={<Pencil className="h-4 w-4" />} />
          <IconButton onClick={() => setDeleteTarget(s)} label="Desativar" icon={<Trash2 className="h-4 w-4" />} variant="danger" />
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
        <IconButton
          onClick={() => setRestoreTarget(s)}
          label="Restaurar"
          icon={<ArchiveRestore className="h-4 w-4" />}
          variant="success"
        />
      ),
    },
  ]

  return (
    <PageContainer
      title="Semestres"
      count={pagination?.total ?? displaySeasons.length}
      action={
        !isTrash ? (
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Cadastrar semestre</Button>
        ) : undefined
      }
    >
      <CrudListToolbar
        primary={<Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />}
        secondary={
          !isTrash ? (
            <Select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value)
                setPage(1)
              }}
              placeholder="Todos os cursos"
              options={courses.map((c: Course) => ({ value: c.id, label: c.name }))}
              className="w-full sm:min-w-[280px]"
            />
          ) : undefined
        }
      />

      <Table
        columns={isTrash ? trashColumns : columns}
        data={displaySeasons}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia.' : 'Nenhum semestre encontrado.'}
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
        title={editing ? 'Editar semestre' : 'Cadastrar semestre'}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <Modal
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        title="Dados do semestre"
        footer={<Button variant="secondary" onClick={() => setPreviewTarget(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <DetailFieldList
            items={[
              { label: 'Nome', value: previewTarget?.name ?? '—' },
              {
                label: 'Curso',
                value: previewTarget ? (courses.find((c: Course) => c.id === previewTarget.courseId)?.name || '—') : '—',
              },
              {
                label: 'Período',
                value: previewTarget ? `${formatDate(previewTarget.startDate)} - ${formatDate(previewTarget.endDate)}` : '—',
              },
            ]}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>
            <div className="mt-1">
              {previewTarget ? (
                <Badge variant={SEASON_STATUS_VARIANT[previewTarget.status]}>
                  {SEASON_STATUS_LABELS[previewTarget.status]}
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
        title="Desativar semestre"
        message={`Confirma a desativação de "${deleteTarget?.name}"?`}
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar semestre"
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
