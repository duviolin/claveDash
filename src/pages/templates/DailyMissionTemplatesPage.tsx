import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Send, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  listDailyMissionTemplates,
  createDailyMissionTemplate,
  updateDailyMissionTemplate,
  deleteDailyMissionTemplate,
  publishDailyMissionTemplate,
  createDailyMissionQuiz,
} from '@/api/dailyMissions'
import { listCourses } from '@/api/courses'
import { DAILY_MISSION_STATUS_LABELS, DAILY_MISSION_STATUS_VARIANT } from '@/lib/constants'
import type { DailyMissionTemplate, Course } from '@/types'
import toast from 'react-hot-toast'

export function DailyMissionTemplatesPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DailyMissionTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DailyMissionTemplate | null>(null)
  const [courseFilter, setCourseFilter] = useState('')
  const [expandedMission, setExpandedMission] = useState<string | null>(null)
  const [form, setForm] = useState({ courseId: '', title: '', videoUrl: '' })

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => listCourses() })

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['daily-mission-templates', courseFilter],
    queryFn: () => listDailyMissionTemplates(courseFilter || undefined),
    enabled: !!courseFilter,
  })

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
  })

  const openCreate = () => { setEditing(null); setForm({ courseId: '', title: '', videoUrl: '' }); setModalOpen(true) }
  const openEdit = (m: DailyMissionTemplate) => { setEditing(m); setForm({ courseId: m.courseId, title: m.title, videoUrl: m.videoUrl || '' }); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  return (
    <PageContainer
      title="Missões Diárias"
      count={missions.length}
      action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Criar Missão</Button>}
    >
      <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} placeholder="Todos os cursos" options={courses.map((c: Course) => ({ value: c.id, label: c.name }))} className="max-w-xs" />

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
                  <MissionQuizSection missionId={mission.id} />
                </div>
              )}
            </div>
          ))}
          {missions.length === 0 && <p className="text-center text-sm text-muted py-8">Nenhuma missão encontrada</p>}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Editar Missão' : 'Criar Missão'} footer={
        <><Button variant="secondary" onClick={closeModal}>Cancelar</Button><Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>{editing ? 'Salvar' : 'Criar'}</Button></>
      }>
        <div className="space-y-4">
          {!editing && <Select id="dmCourseId" label="Curso" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} placeholder="Selecionar..." options={courses.map((c: Course) => ({ value: c.id, label: c.name }))} />}
          <Input id="dmTitle" label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input id="dmVideo" label="URL do Vídeo" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate()} isLoading={deleteMutation.isPending} title="Desativar Missão" message={`Desativar "${deleteTarget?.title}"?`} />
    </PageContainer>
  )
}

function MissionQuizSection({ missionId }: { missionId: string }) {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ questionsJson: '', maxAttemptsPerDay: 3, allowRecoveryAttempt: false })

  const createMut = useMutation({
    mutationFn: () => {
      let questions
      try { questions = form.questionsJson ? JSON.parse(form.questionsJson) : undefined } catch { toast.error('JSON inválido'); throw new Error('Invalid JSON') }
      return createDailyMissionQuiz(missionId, { questionsJson: questions, maxAttemptsPerDay: form.maxAttemptsPerDay, allowRecoveryAttempt: form.allowRecoveryAttempt })
    },
    onSuccess: () => {
      toast.success('Quiz criado!')
      queryClient.invalidateQueries({ queryKey: ['daily-mission-templates'] })
      setModalOpen(false)
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-warning" /> Quiz da Missão</h3>
        <Button size="sm" variant="ghost" onClick={() => { setForm({ questionsJson: '', maxAttemptsPerDay: 3, allowRecoveryAttempt: false }); setModalOpen(true) }}><Plus className="h-3.5 w-3.5" /> Adicionar Quiz</Button>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Criar Quiz da Missão" size="lg" footer={
        <><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={() => createMut.mutate()} isLoading={createMut.isPending}>Criar</Button></>
      }>
        <div className="space-y-4">
          <Textarea id="mqJson" label="Questões (JSON)" value={form.questionsJson} onChange={(e) => setForm({ ...form, questionsJson: e.target.value })} className="font-mono text-xs min-h-[200px]" />
          <p className="text-xs text-muted">Formato: [{"{"}"question": "...", "options": ["A","B","C","D"], "correctIndex": 0{"}"}]</p>
          <div className="grid grid-cols-2 gap-4">
            <Input id="mqAttempts" label="Tentativas por dia" type="number" value={String(form.maxAttemptsPerDay)} onChange={(e) => setForm({ ...form, maxAttemptsPerDay: Number(e.target.value) })} />
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer mt-6">
              <input type="checkbox" checked={form.allowRecoveryAttempt} onChange={(e) => setForm({ ...form, allowRecoveryAttempt: e.target.checked })} className="accent-accent" />
              Permitir tentativa de recuperação
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
