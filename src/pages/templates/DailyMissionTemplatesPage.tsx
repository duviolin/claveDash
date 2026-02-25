import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Send, ChevronDown, ChevronRight, HelpCircle, ArchiveRestore } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { QuizBuilder } from '@/components/ui/QuizBuilder'
import { AIButton } from '@/components/ui/AIButton'
import { generateQuiz } from '@/api/ai'
import { FileUpload } from '@/components/ui/FileUpload'
import { Pagination } from '@/components/ui/Pagination'
import type { AxiosError } from 'axios'
import {
  listDailyMissionTemplates,
  listDeletedDailyMissionTemplates,
  restoreDailyMissionTemplate,
  createDailyMissionTemplate,
  updateDailyMissionTemplate,
  deleteDailyMissionTemplate,
  publishDailyMissionTemplate,
  createDailyMissionQuiz,
  updateDailyMissionQuiz,
  deleteDailyMissionQuiz,
  listDailyMissionQuizzes,
  listDeletedDailyMissionQuizzes,
  restoreDailyMissionQuiz,
} from '@/api/dailyMissions'
import { listCourses } from '@/api/courses'
import { DAILY_MISSION_STATUS_LABELS, DAILY_MISSION_STATUS_VARIANT } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { DailyMissionTemplate, DailyMissionQuiz, Course, DeactivationErrorDetails, QuizQuestion } from '@/types'
import toast from 'react-hot-toast'

const DAILY_MISSION_PAGE_LIMIT = 10
const DAILY_MISSION_QUIZ_TRASH_PAGE_LIMIT = 100
const tabs = [
  { key: 'active', label: 'Ativos' },
  { key: 'TRASH', label: 'Lixeira' },
]

export function DailyMissionTemplatesPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DailyMissionTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DailyMissionTemplate | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<DailyMissionTemplate | null>(null)
  const [blockedInfo, setBlockedInfo] = useState<{ name: string; slug: string; details: DeactivationErrorDetails } | null>(null)
  const [courseFilter, setCourseFilter] = useState('')
  const [expandedMission, setExpandedMission] = useState<string | null>(null)
  const [form, setForm] = useState({ courseId: '', title: '', videoUrl: '' })
  const [activeTab, setActiveTab] = useState('active')
  const [page, setPage] = useState(1)

  const isTrash = activeTab === 'TRASH'

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => listCourses() })

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['daily-mission-templates', courseFilter],
    queryFn: () => listDailyMissionTemplates(courseFilter || undefined),
    enabled: !isTrash,
  })

  const { data: deletedResponse, isLoading: isLoadingDeleted } = useQuery({
    queryKey: ['daily-mission-templates', 'deleted', page],
    queryFn: () => listDeletedDailyMissionTemplates({ page, limit: DAILY_MISSION_PAGE_LIMIT }),
    enabled: isTrash,
  })
  const deletedMissions = deletedResponse?.data ?? []
  const pagination = deletedResponse?.pagination

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { title: form.title, videoUrl: form.videoUrl || undefined }
      return editing
        ? updateDailyMissionTemplate(editing.id, payload)
        : createDailyMissionTemplate({ ...payload, courseId: form.courseId })
    },
    onSuccess: () => {
      toast.success(editing ? 'Missão atualizada!' : 'Missão criada!')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-templates'] })
      closeModal()
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishDailyMissionTemplate(id),
    onSuccess: () => {
      toast.success('Missão publicada!')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-templates'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteDailyMissionTemplate(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Missão desativada!')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-templates'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ details: DeactivationErrorDetails }>
      if (err.response?.status === 409 && err.response?.data?.details) {
        setBlockedInfo({ name: deleteTarget!.title, slug: deleteTarget!.slug, details: err.response.data.details })
      }
      setDeleteTarget(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreDailyMissionTemplate(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Missão restaurada!')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-templates'] })
      setRestoreTarget(null)
    },
  })

  const openCreate = () => { setEditing(null); setForm({ courseId: '', title: '', videoUrl: '' }); setModalOpen(true) }
  const openEdit = (m: DailyMissionTemplate) => { setEditing(m); setForm({ courseId: m.courseId, title: m.title, videoUrl: m.videoUrl || '' }); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const trashColumns = [
    {
      key: 'title',
      header: 'Título',
      render: (m: DailyMissionTemplate) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">{m.title}</span>
          <Badge variant="error">Excluído</Badge>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Curso',
      render: (m: DailyMissionTemplate) => {
        const course = courses.find((c: Course) => c.id === m.courseId)
        return <span className="text-muted">{course?.name ?? '—'}</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (m: DailyMissionTemplate) => (
        <Badge variant={DAILY_MISSION_STATUS_VARIANT[m.status]}>{DAILY_MISSION_STATUS_LABELS[m.status]}</Badge>
      ),
    },
    {
      key: 'deletedAt',
      header: 'Excluído em',
      render: (m: DailyMissionTemplate) => <span className="text-muted">{formatDate(m.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (m: DailyMissionTemplate) => (
        <button
          onClick={() => setRestoreTarget(m)}
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
      title="Missões Diárias"
      count={isTrash ? (pagination?.total ?? deletedMissions.length) : missions.length}
      action={!isTrash ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Criar Missão</Button> : undefined}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={(key) => { setActiveTab(key); setPage(1) }} />
        {!isTrash && (
          <Select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            placeholder="Todos os cursos"
            options={courses.map((c: Course) => ({ value: c.id, label: c.name }))}
            className="w-full sm:max-w-xs"
          />
        )}
      </div>

      {isTrash ? (
        <>
          <Table
            columns={trashColumns}
            data={deletedMissions}
            keyExtractor={(m) => m.id}
            isLoading={isLoadingDeleted}
            emptyMessage="A lixeira está vazia"
          />
          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <>
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
      ) : (
        <div className="space-y-2">
          {missions.map((mission) => (
            <div key={mission.id} className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button className="cursor-pointer" onClick={() => setExpandedMission(expandedMission === mission.id ? null : mission.id)}>
                  {expandedMission === mission.id ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
                </button>
                <span className="text-xs text-muted font-mono w-6">{mission.order}</span>
                <span className="font-medium text-text flex-1">{mission.title}</span>
                <Badge variant={DAILY_MISSION_STATUS_VARIANT[mission.status]}>{DAILY_MISSION_STATUS_LABELS[mission.status]}</Badge>
                <div className="flex gap-1">
                  {mission.status === 'DRAFT' && (
                    <button onClick={() => publishMutation.mutate(mission.id)} className="rounded-lg p-1.5 text-muted hover:bg-success/10 hover:text-success transition-colors cursor-pointer" title="Publicar">
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => openEdit(mission)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTarget(mission)} className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {expandedMission === mission.id && (
                <div className="border-t border-border px-4 py-4 bg-surface-2/30">
                  <MissionQuizSection missionId={mission.id} mission={mission} />
                </div>
              )}
            </div>
          ))}
          {missions.length === 0 && <p className="text-center text-sm text-muted py-8">Nenhuma missão encontrada</p>}
        </div>
      )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Editar Missão' : 'Criar Missão'} footer={
        <><Button variant="secondary" onClick={closeModal}>Cancelar</Button><Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>{editing ? 'Salvar' : 'Criar'}</Button></>
      }>
        <div className="space-y-4">
          {!editing && <Select id="dmCourseId" label="Curso" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} placeholder="Selecionar..." options={courses.map((c: Course) => ({ value: c.id, label: c.name }))} />}
          <Input id="dmTitle" label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <FileUpload
            fileType="videos"
            entityType="daily-mission-template"
            entityId={editing?.id || 'draft'}
            currentValue={form.videoUrl || null}
            onUploadComplete={(key) => setForm({ ...form, videoUrl: key })}
            onRemove={() => setForm({ ...form, videoUrl: '' })}
            label="Vídeo da Missão"
            compact
          />
          <Input id="dmVideo" label="Ou insira URL manualmente" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://..." />
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate()} isLoading={deleteMutation.isPending} title="Desativar Missão" message={`Desativar "${deleteTarget?.title}"?`} />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar Missão"
        message={`Tem certeza que deseja restaurar "${restoreTarget?.title}"?`}
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

function MissionQuizSection({ missionId, mission }: { missionId: string; mission: DailyMissionTemplate }) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DailyMissionQuiz | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DailyMissionQuiz | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<DailyMissionQuiz | null>(null)
  const [form, setForm] = useState({ questions: [] as QuizQuestion[], maxAttemptsPerDay: 3, allowRecoveryAttempt: false })
  const isTrash = activeTab === 'TRASH'

  const { data: quizzes = [] } = useQuery({
    queryKey: ['daily-mission-quizzes', missionId],
    queryFn: () => listDailyMissionQuizzes(missionId),
    enabled: !isTrash,
  })

  const { data: deletedResponse, isLoading: isLoadingDeleted } = useQuery({
    queryKey: ['daily-mission-quizzes', 'deleted', missionId],
    queryFn: () => listDeletedDailyMissionQuizzes({ page: 1, limit: DAILY_MISSION_QUIZ_TRASH_PAGE_LIMIT }),
    enabled: isTrash,
  })
  const deletedQuizzes = (deletedResponse?.data ?? []).filter((quiz) => quiz.dailyMissionId === missionId)

  const createMut = useMutation({
    mutationFn: () => createDailyMissionQuiz(missionId, {
      questionsJson: form.questions.length > 0 ? form.questions : undefined,
      maxAttemptsPerDay: form.maxAttemptsPerDay,
      allowRecoveryAttempt: form.allowRecoveryAttempt,
    }),
    onSuccess: () => {
      toast.success('Quiz criado!')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-quizzes', missionId] })
      setModalOpen(false)
    },
  })

  const updateMut = useMutation({
    mutationFn: () => updateDailyMissionQuiz(editing!.id, {
      questionsJson: form.questions.length > 0 ? form.questions : undefined,
      maxAttemptsPerDay: form.maxAttemptsPerDay,
      allowRecoveryAttempt: form.allowRecoveryAttempt,
    }),
    onSuccess: () => {
      toast.success('Quiz atualizado!')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-quizzes', missionId] })
      setEditing(null)
      setModalOpen(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteDailyMissionQuiz(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Quiz excluído!')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-quizzes', missionId] })
      queryClient.invalidateQueries({ queryKey: ['daily-mission-quizzes', 'deleted', missionId] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ message?: string }>
      toast.error(err.response?.data?.message ?? 'Erro ao excluir quiz')
      setDeleteTarget(null)
    },
  })

  const restoreMut = useMutation({
    mutationFn: () => restoreDailyMissionQuiz(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Quiz restaurado!')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-quizzes', missionId] })
      queryClient.invalidateQueries({ queryKey: ['daily-mission-quizzes', 'deleted', missionId] })
      setRestoreTarget(null)
    },
  })

  const openCreate = () => { setEditing(null); setForm({ questions: [], maxAttemptsPerDay: 3, allowRecoveryAttempt: false }); setModalOpen(true) }
  const openEdit = (q: DailyMissionQuiz) => { setEditing(q); setForm({ questions: q.questionsJson || [], maxAttemptsPerDay: q.maxAttemptsPerDay, allowRecoveryAttempt: q.allowRecoveryAttempt }); setModalOpen(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-warning" /> Quiz da Missão</h3>
        {!isTrash && <Button size="sm" variant="ghost" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Adicionar Quiz</Button>}
      </div>

      <Tabs
        tabs={[
          { key: 'active', label: 'Ativos', count: quizzes.length },
          { key: 'TRASH', label: 'Lixeira', count: deletedQuizzes.length },
        ]}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
      />

      {!isTrash && (
        <>
          {quizzes.length > 0 ? (
            <div className="space-y-1 mt-2">
              {quizzes.map((q) => (
                <div key={q.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
                  <Badge variant="default" className="shrink-0">v{q.version}</Badge>
                  <span className="text-muted">{q.questionsJson?.length ?? 0} questões</span>
                  <span className="text-muted">{q.maxAttemptsPerDay} tentativas/dia</span>
                  <div className="flex-1" />
                  <button onClick={() => openEdit(q)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(q)} className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mt-2">Nenhum quiz ativo</p>
          )}
        </>
      )}

      {isTrash && (
        <>
          {isLoadingDeleted ? (
            <div className="flex justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : deletedQuizzes.length > 0 ? (
            <div className="space-y-1 mt-2">
              {deletedQuizzes.map((q) => (
                <div key={q.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
                  <Badge variant="default" className="shrink-0">v{q.version}</Badge>
                  <Badge variant="error" className="text-[10px]">Excluído</Badge>
                  <span className="text-muted">{q.questionsJson?.length ?? 0} questões</span>
                  <span className="text-muted">{q.maxAttemptsPerDay} tentativas/dia</span>
                  <div className="flex-1" />
                  <button onClick={() => setRestoreTarget(q)} className="rounded-lg p-1.5 text-muted hover:bg-success/10 hover:text-success transition-colors cursor-pointer" title="Restaurar"><ArchiveRestore className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mt-2">A lixeira está vazia</p>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Editar Quiz da Missão' : 'Criar Quiz da Missão'} size="lg" footer={
        <><Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancelar</Button><Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} isLoading={createMut.isPending || updateMut.isPending}>{editing ? 'Salvar' : 'Criar'}</Button></>
      }>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-text">Questões</label>
            <AIButton
              label="Gerar Quiz com IA"
              extraInputLabel="Instruções extras (opcional)"
              extraInputPlaceholder="Ex.: foco em prática diária, dificuldade iniciante..."
              onGenerate={(userExtra) => generateQuiz({
                title: mission.title,
                count: 5,
                project: { name: mission.title, description: `Missão diária do curso` },
                userExtra: userExtra || undefined,
              })}
              onAccept={(raw) => {
                try {
                  const parsed = JSON.parse(raw)
                  if (Array.isArray(parsed)) setForm({ ...form, questions: parsed })
                } catch { toast.error('Formato inválido retornado pela IA') }
              }}
            />
          </div>
          <QuizBuilder value={form.questions} onChange={(questions) => setForm({ ...form, questions })} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="mqAttempts" label="Tentativas por dia" type="number" value={String(form.maxAttemptsPerDay)} onChange={(e) => setForm({ ...form, maxAttemptsPerDay: Number(e.target.value) })} />
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer mt-6">
              <input type="checkbox" checked={form.allowRecoveryAttempt} onChange={(e) => setForm({ ...form, allowRecoveryAttempt: e.target.checked })} className="accent-accent" />
              Permitir tentativa de recuperação
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} title="Excluir Quiz" message="Tem certeza que deseja excluir este quiz?" />
      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMut.mutate()}
        isLoading={restoreMut.isPending}
        title="Restaurar Quiz"
        message="Tem certeza que deseja restaurar este quiz?"
        confirmLabel="Restaurar"
      />
    </div>
  )
}
