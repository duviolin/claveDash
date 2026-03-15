import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { ResponsiveDataView } from '@/components/ui/ResponsiveDataView'
import { ResponsiveRowActions } from '@/components/ui/ResponsiveRowActions'
import { DetailFieldList } from '@/components/ui/DetailFieldList'
import { listSeasons } from '@/api/seasons'
import { listUsers } from '@/api/users'
import { listDailyMissionTemplates } from '@/api/dailyMissions'
import {
  createDailyMissionInstance,
  deleteDailyMissionInstance,
  listDailyMissionInstancesPaginated,
  updateDailyMissionInstance,
} from '@/api/dailyMissionInstances'
import { DAILY_MISSION_INSTANCE_STATUS_LABELS, DAILY_MISSION_INSTANCE_STATUS_VARIANT } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { DailyMissionInstance, DailyMissionStatus, Season, User, DailyMissionTemplate } from '@/types'
import toast from 'react-hot-toast'

const PAGE_LIMIT = 20

const STATUS_OPTIONS: Array<{ value: DailyMissionStatus; label: string }> = [
  { value: 'DONE', label: DAILY_MISSION_INSTANCE_STATUS_LABELS.DONE },
  { value: 'DONE_WITH_PENALTY', label: DAILY_MISSION_INSTANCE_STATUS_LABELS.DONE_WITH_PENALTY },
  { value: 'SKIPPED', label: DAILY_MISSION_INSTANCE_STATUS_LABELS.SKIPPED },
]

export function DailyMissionInstancesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [seasonFilter, setSeasonFilter] = useState('')
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [previewTarget, setPreviewTarget] = useState<DailyMissionInstance | null>(null)
  const [editTarget, setEditTarget] = useState<DailyMissionInstance | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DailyMissionInstance | null>(null)

  const [createForm, setCreateForm] = useState({
    seasonId: '',
    templateId: '',
    studentId: '',
    date: '',
    status: 'SKIPPED' as DailyMissionStatus,
    attemptsCount: 0,
  })
  const [editForm, setEditForm] = useState({
    date: '',
    status: 'SKIPPED' as DailyMissionStatus,
    attemptsCount: 0,
  })

  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => listSeasons(),
  })

  const { data: studentsResponse } = useQuery({
    queryKey: ['users', 'students', 1, 200],
    queryFn: () => listUsers({ role: 'STUDENT', page: 1, limit: 200 }),
  })
  const students = studentsResponse?.data ?? []

  const selectedCreateSeason = useMemo(
    () => seasons.find((season) => season.id === createForm.seasonId),
    [createForm.seasonId, seasons]
  )

  const { data: templateOptions = [] } = useQuery({
    queryKey: ['daily-mission-templates', 'for-instance', selectedCreateSeason?.courseId ?? ''],
    enabled: Boolean(selectedCreateSeason?.courseId),
    queryFn: async () => {
      if (!selectedCreateSeason?.courseId) return []
      return listDailyMissionTemplates(selectedCreateSeason.courseId)
    },
  })

  const { data: instancesResponse, isLoading } = useQuery({
    queryKey: ['daily-mission-instances', seasonFilter, search, page],
    queryFn: () =>
      listDailyMissionInstancesPaginated({
        seasonId: seasonFilter || undefined,
        search: search.trim() || undefined,
        page,
        limit: PAGE_LIMIT,
      }),
    placeholderData: (previousData) => previousData,
  })

  const instances = instancesResponse?.data ?? []
  const pagination = instancesResponse?.pagination

  const createMutation = useMutation({
    mutationFn: () =>
      createDailyMissionInstance({
        templateId: createForm.templateId,
        studentId: createForm.studentId,
        seasonId: createForm.seasonId,
        date: createForm.date,
        status: createForm.status,
        attemptsCount: createForm.attemptsCount,
      }),
    onSuccess: () => {
      toast.success('Instância de missão criada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-instances'] })
      setCreateOpen(false)
      setCreateForm({
        seasonId: '',
        templateId: '',
        studentId: '',
        date: '',
        status: 'SKIPPED',
        attemptsCount: 0,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateDailyMissionInstance(editTarget!.id, {
        status: editForm.status,
        date: editForm.date,
        attemptsCount: editForm.attemptsCount,
      }),
    onSuccess: () => {
      toast.success('Instância de missão atualizada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-instances'] })
      setEditTarget(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteDailyMissionInstance(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Instância removida com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-instances'] })
      setDeleteTarget(null)
    },
  })

  const columns = [
    {
      key: 'template',
      header: 'Missão',
      className: 'w-[40%] min-w-[300px]',
      render: (row: DailyMissionInstance) => (
        <div>
          <p className="truncate text-sm font-medium text-text">{row.templateTitle}</p>
          <p className="text-xs text-muted">Aluno: {row.studentName}</p>
        </div>
      ),
    },
    {
      key: 'context',
      header: 'Semestre',
      className: 'w-[20%]',
      render: (row: DailyMissionInstance) => (
        <span className="text-sm text-muted">{row.seasonName}</span>
      ),
    },
    {
      key: 'date',
      header: 'Data',
      className: 'w-[14%]',
      render: (row: DailyMissionInstance) => (
        <span className="text-sm text-muted">{formatDate(row.date)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[14%]',
      render: (row: DailyMissionInstance) => (
        <Badge variant={DAILY_MISSION_INSTANCE_STATUS_VARIANT[row.status]}>
          {DAILY_MISSION_INSTANCE_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-[12%] text-right',
      render: (row: DailyMissionInstance) => (
        <ResponsiveRowActions
          actions={[
            {
              key: 'preview',
              label: 'Visualizar',
              icon: <Eye className="h-4 w-4" />,
              onClick: () => setPreviewTarget(row),
            },
            {
              key: 'edit',
              label: 'Editar',
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => {
                setEditTarget(row)
                setEditForm({
                  date: row.date.slice(0, 10),
                  status: row.status,
                  attemptsCount: row.attemptsCount,
                })
              },
            },
            {
              key: 'delete',
              label: 'Excluir',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => setDeleteTarget(row),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <PageContainer title="Instâncias de missões diárias" count={pagination?.total ?? instances.length}>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Select
            value={seasonFilter}
            onChange={(event) => {
              setSeasonFilter(event.target.value)
              setPage(1)
            }}
            placeholder="Todos os semestres"
            options={seasons.map((season: Season) => ({ value: season.id, label: season.name }))}
            className="w-full sm:min-w-[260px]"
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Buscar por missão ou aluno"
            className="w-full sm:min-w-[260px]"
          />
        </div>
        <Button
          onClick={() => {
            setCreateForm({
              seasonId: seasonFilter || '',
              templateId: '',
              studentId: '',
              date: '',
              status: 'SKIPPED',
              attemptsCount: 0,
            })
            setCreateOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Criar instância
        </Button>
      </div>

      <ResponsiveDataView
        columns={columns}
        data={instances}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="Nenhuma instância de missão diária encontrada."
        mobileCardRender={(row) => (
          <div className="space-y-2 rounded-xl border border-border bg-surface px-3.5 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{row.templateTitle}</p>
                <p className="truncate text-xs text-muted">Aluno: {row.studentName}</p>
              </div>
              <Badge variant={DAILY_MISSION_INSTANCE_STATUS_VARIANT[row.status]}>
                {DAILY_MISSION_INSTANCE_STATUS_LABELS[row.status]}
              </Badge>
            </div>
            <p className="text-xs text-muted">{row.seasonName} • {formatDate(row.date)}</p>
            <ResponsiveRowActions
              className="pt-1"
              actions={[
                {
                  key: 'preview-mobile',
                  label: 'Visualizar',
                  icon: <Eye className="h-4 w-4" />,
                  onClick: () => setPreviewTarget(row),
                },
                {
                  key: 'edit-mobile',
                  label: 'Editar',
                  icon: <Pencil className="h-4 w-4" />,
                  onClick: () => {
                    setEditTarget(row)
                    setEditForm({
                      date: row.date.slice(0, 10),
                      status: row.status,
                      attemptsCount: row.attemptsCount,
                    })
                  },
                },
                {
                  key: 'delete-mobile',
                  label: 'Excluir',
                  icon: <Trash2 className="h-4 w-4" />,
                  variant: 'danger',
                  onClick: () => setDeleteTarget(row),
                },
              ]}
            />
          </div>
        )}
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
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Criar instância de missão diária"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
              disabled={!createForm.seasonId || !createForm.templateId || !createForm.studentId || !createForm.date}
            >
              Criar
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <Select
            label="Semestre"
            value={createForm.seasonId}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, seasonId: event.target.value, templateId: '' }))}
            placeholder="Selecione um semestre"
            options={seasons.map((season: Season) => ({ value: season.id, label: season.name }))}
          />
          <Select
            label="Template da missão"
            value={createForm.templateId}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, templateId: event.target.value }))}
            placeholder={createForm.seasonId ? 'Selecione um template' : 'Selecione um semestre primeiro'}
            disabled={!createForm.seasonId}
            options={templateOptions.map((template: DailyMissionTemplate) => ({ value: template.id, label: template.title }))}
          />
          <Select
            label="Aluno"
            value={createForm.studentId}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, studentId: event.target.value }))}
            placeholder="Selecione um aluno"
            options={students.map((student: User) => ({ value: student.id, label: student.name }))}
          />
          <Input
            label="Data da missão"
            type="date"
            value={createForm.date}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, date: event.target.value }))}
          />
          <Select
            label="Status"
            value={createForm.status}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as DailyMissionStatus }))}
            options={STATUS_OPTIONS}
          />
          <Input
            label="Tentativas"
            type="number"
            min={0}
            value={String(createForm.attemptsCount)}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, attemptsCount: Number(event.target.value) || 0 }))}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Editar instância de missão diária"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={() => updateMutation.mutate()} isLoading={updateMutation.isPending}>Salvar</Button>
          </>
        )}
      >
        <div className="space-y-4">
          <Input
            label="Data da missão"
            type="date"
            value={editForm.date}
            onChange={(event) => setEditForm((prev) => ({ ...prev, date: event.target.value }))}
          />
          <Select
            label="Status"
            value={editForm.status}
            onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value as DailyMissionStatus }))}
            options={STATUS_OPTIONS}
          />
          <Input
            label="Tentativas"
            type="number"
            min={0}
            value={String(editForm.attemptsCount)}
            onChange={(event) => setEditForm((prev) => ({ ...prev, attemptsCount: Number(event.target.value) || 0 }))}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        title="Detalhes da instância"
        footer={<Button variant="secondary" onClick={() => setPreviewTarget(null)}>Fechar</Button>}
      >
        <DetailFieldList
          items={[
            { label: 'Missão', value: previewTarget?.templateTitle ?? '—' },
            { label: 'Aluno', value: previewTarget?.studentName ?? '—' },
            { label: 'Semestre', value: previewTarget?.seasonName ?? '—' },
            { label: 'Data', value: previewTarget ? formatDate(previewTarget.date) : '—' },
            { label: 'Status', value: previewTarget ? DAILY_MISSION_INSTANCE_STATUS_LABELS[previewTarget.status] : '—' },
            { label: 'Tentativas', value: previewTarget ? String(previewTarget.attemptsCount) : '—' },
          ]}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Excluir instância"
        message={`Confirma a exclusão da instância "${deleteTarget?.templateTitle}" de ${deleteTarget?.studentName}?`}
        confirmLabel="Excluir"
        variant="danger"
      />
    </PageContainer>
  )
}
