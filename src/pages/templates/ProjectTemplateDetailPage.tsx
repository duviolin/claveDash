import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, GripVertical, Music, FileText, BookOpen, HelpCircle } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { FileUpload } from '@/components/ui/FileUpload'
import { QuizBuilder } from '@/components/ui/QuizBuilder'
import { AIButton } from '@/components/ui/AIButton'
import { generateQuiz } from '@/api/ai'
import { presignDownload } from '@/api/storage'
import {
  getProjectTemplate,
  updateProjectTemplate,
  listTrackTemplates,
  createTrackTemplate,
  updateTrackTemplate,
  deleteTrackTemplate,
  listMaterialTemplates,
  createMaterialTemplate,
  updateMaterialTemplate,
  deleteMaterialTemplate,
  listStudyTrackTemplates,
  createStudyTrackTemplate,
  updateStudyTrackTemplate,
  deleteStudyTrackTemplate,
  listStudyTrackCategories,
  listPressQuizTemplates,
  createPressQuizTemplate,
  updatePressQuizTemplate,
  deletePressQuizTemplate,
} from '@/api/templates'
import type { AxiosError } from 'axios'
import { TRACK_MATERIAL_TYPE_LABELS, TRACK_MATERIAL_TYPE_VARIANT } from '@/lib/constants'
import type { TrackSceneTemplate, TrackMaterialTemplate, TrackMaterialType, StudyTrackTemplate, StudyTrackCategory, PressQuizTemplate, DeactivationErrorDetails, QuizQuestion } from '@/types'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import toast from 'react-hot-toast'

export function ProjectTemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [editingProject, setEditingProject] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: '', description: '', coverImage: '' })

  const { data: template } = useQuery({
    queryKey: ['project-template', id],
    queryFn: () => getProjectTemplate(id!),
    enabled: !!id,
  })

  const { data: tracks = [] } = useQuery({
    queryKey: ['track-templates', id],
    queryFn: () => listTrackTemplates(id!),
    enabled: !!id,
  })

  const { data: coverImageUrl } = useQuery({
    queryKey: ['project-template-cover-image', template?.coverImage],
    queryFn: async () => {
      if (!template?.coverImage) return null
      const { downloadUrl } = await presignDownload(template.coverImage)
      return downloadUrl
    },
    enabled: !!template?.coverImage,
    staleTime: 5 * 60 * 1000,
  })

  const updateProjectMutation = useMutation({
    mutationFn: () => updateProjectTemplate(id!, { name: projectForm.name, description: projectForm.description || undefined, coverImage: projectForm.coverImage || undefined }),
    onSuccess: () => {
      toast.success('Template atualizado!')
      queryClient.invalidateQueries({ queryKey: ['project-template', id] })
      setEditingProject(false)
    },
  })

  if (!template) {
    return <PageContainer title="Carregando..."><div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div></PageContainer>
  }

  return (
    <PageContainer
      title={
        <div className="flex items-center gap-3">
          {template.coverImage && (
            <div className="overflow-hidden rounded-md border border-border bg-surface-2">
              {coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt={`Capa do template ${template.name}`}
                  className="h-10 w-14 object-cover"
                />
              ) : (
                <div className="flex h-10 w-14 items-center justify-center text-[10px] text-muted">
                  ...
                </div>
              )}
            </div>
          )}
          <span>{template.name}</span>
        </div>
      }
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={template.type === 'ALBUM' ? 'accent' : 'info'}>{template.type}</Badge>
          <Badge variant="default">v{template.version}</Badge>
          <Button size="sm" variant="secondary" onClick={() => { setProjectForm({ name: template.name, description: template.description || '', coverImage: template.coverImage || '' }); setEditingProject(true) }}>
            <Pencil className="h-3.5 w-3.5" /> Editar Info
          </Button>
        </div>
      }
    >
      {template.description && <p className="text-sm text-muted -mt-4 mb-4">{template.description}</p>}

      <TracksList projectTemplateId={id!} tracks={tracks} courseId={template!.courseId} />

      <Modal
        isOpen={editingProject}
        onClose={() => setEditingProject(false)}
        title="Editar Template"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingProject(false)}>Cancelar</Button>
            <Button onClick={() => updateProjectMutation.mutate()} isLoading={updateProjectMutation.isPending}>Salvar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input id="ptName" label="Nome" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
          <Textarea id="ptDesc" label="Descrição" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
          <FileUpload
            fileType="images"
            entityType="project-template"
            entityId={id || 'draft'}
            currentValue={projectForm.coverImage || null}
            onUploadComplete={(key) => setProjectForm({ ...projectForm, coverImage: key })}
            onRemove={() => setProjectForm({ ...projectForm, coverImage: '' })}
            label="Imagem de Capa"
          />
        </div>
      </Modal>
    </PageContainer>
  )
}

// ---- Tracks List ----
function TracksList({ projectTemplateId, tracks, courseId }: { projectTemplateId: string; tracks: TrackSceneTemplate[]; courseId: string }) {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null)
  const [editingTrack, setEditingTrack] = useState<TrackSceneTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrackSceneTemplate | null>(null)
  const [blockedInfo, setBlockedInfo] = useState<{ name: string; id: string; details: DeactivationErrorDetails } | null>(null)
  const [form, setForm] = useState({ title: '', artist: '', description: '', technicalInstruction: '', lyrics: '', unlockAfterTrackId: '' })

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order)

  const createMutation = useMutation({
    mutationFn: () => createTrackTemplate(projectTemplateId, {
      title: form.title,
      artist: form.artist || undefined,
      description: form.description || undefined,
      technicalInstruction: form.technicalInstruction || undefined,
      lyrics: form.lyrics || undefined,
      unlockAfterTrackId: form.unlockAfterTrackId || undefined,
    }),
    onSuccess: () => {
      toast.success('Faixa criada!')
      queryClient.invalidateQueries({ queryKey: ['track-templates', projectTemplateId] })
      setCreateOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => updateTrackTemplate(editingTrack!.id, {
      title: form.title,
      artist: form.artist || null,
      description: form.description || null,
      technicalInstruction: form.technicalInstruction || null,
      lyrics: form.lyrics || null,
      unlockAfterTrackId: form.unlockAfterTrackId || null,
    }),
    onSuccess: () => {
      toast.success('Faixa atualizada!')
      queryClient.invalidateQueries({ queryKey: ['track-templates', projectTemplateId] })
      setEditingTrack(null)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTrackTemplate(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Faixa desativada!')
      queryClient.invalidateQueries({ queryKey: ['track-templates', projectTemplateId] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ details: DeactivationErrorDetails }>
      if (err.response?.status === 409 && err.response?.data?.details) {
        setBlockedInfo({ name: deleteTarget!.title, id: deleteTarget!.id, details: err.response.data.details })
      }
      setDeleteTarget(null)
    },
  })

  const resetForm = () => setForm({ title: '', artist: '', description: '', technicalInstruction: '', lyrics: '', unlockAfterTrackId: '' })

  const openEdit = (t: TrackSceneTemplate) => {
    setEditingTrack(t)
    setForm({
      title: t.title,
      artist: t.artist || '',
      description: t.description || '',
      technicalInstruction: t.technicalInstruction || '',
      lyrics: t.lyrics || '',
      unlockAfterTrackId: t.unlockAfterTrackId || '',
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text flex items-center gap-2">
          <Music className="h-5 w-5 text-accent" /> Faixas ({sortedTracks.length})
        </h2>
        <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true) }}>
          <Plus className="h-3.5 w-3.5" /> Adicionar Faixa
        </Button>
      </div>

      {sortedTracks.map((track) => (
        <div key={track.id} className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-2/50 transition-colors" onClick={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}>
            <GripVertical className="h-4 w-4 text-muted/50" />
            <span className="text-xs text-muted font-mono w-6">{track.order}</span>
            {expandedTrack === track.id ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
            <span className="font-medium text-text flex-1">{track.title}</span>
            {track.artist && <span className="text-sm text-muted">{track.artist}</span>}
            <Badge variant="warning">Demo</Badge>
            <Badge variant="info">Quiz</Badge>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => openEdit(track)} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDeleteTarget(track)} className="rounded-lg p-1 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          {expandedTrack === track.id && (
            <div className="border-t border-border px-4 py-4 space-y-4 bg-surface-2/30">
              {track.description && <div><p className="text-xs font-medium text-muted uppercase">Descrição</p><p className="text-sm text-text mt-1">{track.description}</p></div>}
              {track.technicalInstruction && <div><p className="text-xs font-medium text-muted uppercase">Instrução Técnica</p><p className="text-sm text-text mt-1">{track.technicalInstruction}</p></div>}
              {track.lyrics && <div><p className="text-xs font-medium text-muted uppercase">Letra</p><p className="text-sm text-text mt-1 whitespace-pre-wrap">{track.lyrics}</p></div>}
              {track.unlockAfterTrackId && (() => {
                const prereq = sortedTracks.find(t => t.id === track.unlockAfterTrackId)
                return prereq ? <div><p className="text-xs font-medium text-muted uppercase">Pré-requisito</p><p className="text-sm text-text mt-1">Desbloqueia após: {prereq.title}</p></div> : null
              })()}

              <MaterialsSection trackTemplateId={track.id} />
              <StudyTracksSection trackTemplateId={track.id} courseId={courseId} />
              <PressQuizzesSection trackTemplateId={track.id} />
            </div>
          )}
        </div>
      ))}

      <TrackFormModal
        isOpen={createOpen || !!editingTrack}
        onClose={() => { setCreateOpen(false); setEditingTrack(null); resetForm() }}
        title={editingTrack ? 'Editar Faixa' : 'Criar Faixa'}
        form={form}
        setForm={setForm}
        onSubmit={() => editingTrack ? updateMutation.mutate() : createMutation.mutate()}
        isLoading={createMutation.isPending || updateMutation.isPending}
        submitLabel={editingTrack ? 'Salvar' : 'Criar'}
        tracks={sortedTracks}
        editingTrackId={editingTrack?.id}
      />

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate()} isLoading={deleteMutation.isPending} title="Desativar Faixa" message={`Tem certeza que deseja desativar "${deleteTarget?.title}"?`} />
      <DeactivationBlockedModal
        isOpen={!!blockedInfo}
        onClose={() => setBlockedInfo(null)}
        entityName={blockedInfo?.name ?? ''}
        parentId={blockedInfo?.id ?? ''}
        details={blockedInfo?.details ?? null}
      />
    </div>
  )
}

function TrackFormModal({ isOpen, onClose, title, form, setForm, onSubmit, isLoading, submitLabel, tracks, editingTrackId }: {
  isOpen: boolean; onClose: () => void; title: string
  form: { title: string; artist: string; description: string; technicalInstruction: string; lyrics: string; unlockAfterTrackId: string }
  setForm: (f: typeof form) => void; onSubmit: () => void; isLoading: boolean; submitLabel: string
  tracks: TrackSceneTemplate[]; editingTrackId?: string
}) {
  const availableTracks = tracks.filter(t => t.id !== editingTrackId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" footer={
      <><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={onSubmit} isLoading={isLoading}>{submitLabel}</Button></>
    }>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="ttTitle" label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input id="ttArtist" label="Artista" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
        </div>
        <Textarea id="ttDesc" label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Textarea id="ttTech" label="Instrução Técnica" value={form.technicalInstruction} onChange={(e) => setForm({ ...form, technicalInstruction: e.target.value })} />
        <Textarea id="ttLyrics" label="Letra" value={form.lyrics} onChange={(e) => setForm({ ...form, lyrics: e.target.value })} />
        {availableTracks.length > 0 && (
          <Select
            id="ttUnlock"
            label="Desbloqueia após (pré-requisito)"
            value={form.unlockAfterTrackId}
            onChange={(e) => setForm({ ...form, unlockAfterTrackId: e.target.value })}
            placeholder="Sem pré-requisito"
            options={availableTracks.map(t => ({ value: t.id, label: `${t.order}. ${t.title}` }))}
          />
        )}
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          Demo e Quiz da coletiva são obrigatórios para todas as faixas.
        </div>
      </div>
    </Modal>
  )
}

// ---- Materials Section ----
function MaterialsSection({ trackTemplateId }: { trackTemplateId: string }) {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TrackMaterialTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrackMaterialTemplate | null>(null)
  const [form, setForm] = useState({ type: 'TEXT' as TrackMaterialType, title: '', defaultContentUrl: '', defaultTextContent: '' })

  const { data: materials = [] } = useQuery({
    queryKey: ['material-templates', trackTemplateId],
    queryFn: () => listMaterialTemplates(trackTemplateId),
  })

  const createMut = useMutation({
    mutationFn: () => createMaterialTemplate(trackTemplateId, { type: form.type, title: form.title, defaultContentUrl: form.defaultContentUrl || undefined, defaultTextContent: form.defaultTextContent || undefined }),
    onSuccess: () => { toast.success('Material criado!'); queryClient.invalidateQueries({ queryKey: ['material-templates', trackTemplateId] }); setModalOpen(false) },
  })

  const updateMut = useMutation({
    mutationFn: () => updateMaterialTemplate(editing!.id, { title: form.title, defaultContentUrl: form.defaultContentUrl || undefined, defaultTextContent: form.defaultTextContent || undefined }),
    onSuccess: () => { toast.success('Material atualizado!'); queryClient.invalidateQueries({ queryKey: ['material-templates', trackTemplateId] }); setEditing(null); setModalOpen(false) },
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteMaterialTemplate(deleteTarget!.id),
    onSuccess: () => { toast.success('Material desativado!'); queryClient.invalidateQueries({ queryKey: ['material-templates', trackTemplateId] }); setDeleteTarget(null) },
  })

  const openCreate = () => { setEditing(null); setForm({ type: 'TEXT', title: '', defaultContentUrl: '', defaultTextContent: '' }); setModalOpen(true) }
  const openEdit = (m: TrackMaterialTemplate) => { setEditing(m); setForm({ type: m.type, title: m.title, defaultContentUrl: m.defaultContentUrl || '', defaultTextContent: m.defaultTextContent || '' }); setModalOpen(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text flex items-center gap-1.5"><FileText className="h-4 w-4 text-info" /> Materiais ({materials.length})</h3>
        <Button size="sm" variant="ghost" onClick={openCreate}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      {materials.length > 0 && (
        <div className="space-y-1">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
              <Badge variant={TRACK_MATERIAL_TYPE_VARIANT[m.type]} className="text-[10px]">{TRACK_MATERIAL_TYPE_LABELS[m.type]}</Badge>
              <span className="flex-1 text-text">{m.title}</span>
              <button onClick={() => openEdit(m)} className="text-muted hover:text-text cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDeleteTarget(m)} className="text-muted hover:text-error cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Editar Material' : 'Criar Material'} footer={
        <><Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancelar</Button>
        <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} isLoading={createMut.isPending || updateMut.isPending}>{editing ? 'Salvar' : 'Criar'}</Button></>
      }>
        <div className="space-y-4">
          {!editing && <Select id="matType" label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TrackMaterialType })} options={Object.entries(TRACK_MATERIAL_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />}
          <Input id="matTitle" label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          {(['PDF', 'AUDIO', 'VIDEO'].includes(form.type)) && (
            <FileUpload
              fileType="materials"
              entityType="material-template"
              entityId={editing?.id || 'draft'}
              currentValue={form.defaultContentUrl || null}
              onUploadComplete={(key) => setForm({ ...form, defaultContentUrl: key })}
              onRemove={() => setForm({ ...form, defaultContentUrl: '' })}
              label="Arquivo do Material"
            />
          )}
          {form.type === 'LINK' && <Input id="matUrl" label="URL do Link" value={form.defaultContentUrl} onChange={(e) => setForm({ ...form, defaultContentUrl: e.target.value })} placeholder="https://..." />}
          {form.type === 'TEXT' && <Textarea id="matText" label="Conteúdo" value={form.defaultTextContent} onChange={(e) => setForm({ ...form, defaultTextContent: e.target.value })} />}
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} title="Desativar Material" message={`Desativar "${deleteTarget?.title}"?`} />
    </div>
  )
}

// ---- Study Tracks Section ----
function StudyTracksSection({ trackTemplateId, courseId }: { trackTemplateId: string; courseId: string }) {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StudyTrackTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudyTrackTemplate | null>(null)
  const [form, setForm] = useState({ title: '', categoryId: '', description: '', technicalNotes: '', videoUrl: '', audioUrl: '', pdfUrl: '', estimatedMinutes: 15, isRequired: false, isVisible: true })

  const { data: studyTracks = [] } = useQuery({
    queryKey: ['study-track-templates', trackTemplateId],
    queryFn: () => listStudyTrackTemplates(trackTemplateId),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['study-track-categories', courseId],
    queryFn: () => listStudyTrackCategories(courseId),
  })

  const createMut = useMutation({
    mutationFn: () => createStudyTrackTemplate(trackTemplateId, {
      title: form.title, categoryId: form.categoryId || undefined, description: form.description || undefined, technicalNotes: form.technicalNotes || undefined,
      videoUrl: form.videoUrl || undefined, audioUrl: form.audioUrl || undefined, pdfUrl: form.pdfUrl || undefined,
      estimatedMinutes: form.estimatedMinutes, isRequired: form.isRequired, isVisible: form.isVisible,
    }),
    onSuccess: () => { toast.success('Trilha criada!'); queryClient.invalidateQueries({ queryKey: ['study-track-templates', trackTemplateId] }); setModalOpen(false) },
  })

  const updateMut = useMutation({
    mutationFn: () => updateStudyTrackTemplate(editing!.id, {
      title: form.title, categoryId: form.categoryId || undefined, description: form.description || undefined, technicalNotes: form.technicalNotes || undefined,
      videoUrl: form.videoUrl || undefined, audioUrl: form.audioUrl || undefined, pdfUrl: form.pdfUrl || undefined,
      estimatedMinutes: form.estimatedMinutes, isRequired: form.isRequired, isVisible: form.isVisible,
    }),
    onSuccess: () => { toast.success('Trilha atualizada!'); queryClient.invalidateQueries({ queryKey: ['study-track-templates', trackTemplateId] }); setEditing(null); setModalOpen(false) },
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteStudyTrackTemplate(deleteTarget!.id),
    onSuccess: () => { toast.success('Trilha desativada!'); queryClient.invalidateQueries({ queryKey: ['study-track-templates', trackTemplateId] }); setDeleteTarget(null) },
  })

  const openCreate = () => { setEditing(null); setForm({ title: '', categoryId: '', description: '', technicalNotes: '', videoUrl: '', audioUrl: '', pdfUrl: '', estimatedMinutes: 15, isRequired: false, isVisible: true }); setModalOpen(true) }
  const openEdit = (st: StudyTrackTemplate) => { setEditing(st); setForm({ title: st.title, categoryId: st.categoryId || '', description: st.description || '', technicalNotes: st.technicalNotes || '', videoUrl: st.videoUrl || '', audioUrl: st.audioUrl || '', pdfUrl: st.pdfUrl || '', estimatedMinutes: st.estimatedMinutes, isRequired: st.isRequired, isVisible: st.isVisible }); setModalOpen(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-success" /> Trilhas de Estudo ({studyTracks.length})</h3>
        <Button size="sm" variant="ghost" onClick={openCreate}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      {studyTracks.length > 0 && (
        <div className="space-y-1">
          {studyTracks.map((st) => {
            const category = st.categoryId ? categories.find((c: StudyTrackCategory) => c.id === st.categoryId) : null
            return (
              <div key={st.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
                <span className="flex-1 text-text">{st.title}</span>
                {category && <Badge variant="default" className="text-[10px]">{category.name}</Badge>}
                <span className="text-xs text-muted">{st.estimatedMinutes}min</span>
                {st.isRequired && <Badge variant="warning">Obrigatória</Badge>}
                <button onClick={() => openEdit(st)} className="text-muted hover:text-text cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteTarget(st)} className="text-muted hover:text-error cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Editar Trilha' : 'Criar Trilha'} size="lg" footer={
        <><Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancelar</Button>
        <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} isLoading={createMut.isPending || updateMut.isPending}>{editing ? 'Salvar' : 'Criar'}</Button></>
      }>
        <div className="space-y-4">
          <Select
            id="stCat"
            label="Categoria"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            placeholder="Sem categoria"
            options={categories.map((c: StudyTrackCategory) => ({ value: c.id, label: c.name }))}
          />
          <Input id="stTitle" label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea id="stDesc" label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Textarea id="stNotes" label="Notas Técnicas" value={form.technicalNotes} onChange={(e) => setForm({ ...form, technicalNotes: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input id="stVideo" label="URL Vídeo" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
            <Input id="stAudio" label="URL Áudio" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} />
            <Input id="stPdf" label="URL PDF" value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} />
          </div>
          <Input id="stMin" label="Tempo estimado (min)" type="number" value={String(form.estimatedMinutes)} onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) })} />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer"><input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} className="accent-accent" /> Obrigatória</label>
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer"><input type="checkbox" checked={form.isVisible} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} className="accent-accent" /> Visível</label>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} title="Desativar Trilha" message={`Desativar "${deleteTarget?.title}"?`} />
    </div>
  )
}

// ---- Press Quizzes Section ----
function PressQuizzesSection({ trackTemplateId }: { trackTemplateId: string }) {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PressQuizTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PressQuizTemplate | null>(null)
  const [form, setForm] = useState({ title: '', description: '', questions: [] as QuizQuestion[], maxAttempts: 3, passingScore: 70 })

  const { data: quizzes = [] } = useQuery({
    queryKey: ['press-quiz-templates', trackTemplateId],
    queryFn: () => listPressQuizTemplates(trackTemplateId),
  })

  const createMut = useMutation({
    mutationFn: () => createPressQuizTemplate(trackTemplateId, {
      title: form.title,
      description: form.description || undefined,
      questionsJson: form.questions.length > 0 ? form.questions : undefined,
      maxAttempts: form.maxAttempts,
      passingScore: form.passingScore,
    }),
    onSuccess: () => { toast.success('Quiz criado!'); queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', trackTemplateId] }); setModalOpen(false) },
  })

  const updateMut = useMutation({
    mutationFn: () => updatePressQuizTemplate(editing!.id, {
      title: form.title,
      description: form.description || undefined,
      questionsJson: form.questions.length > 0 ? form.questions : undefined,
      maxAttempts: form.maxAttempts,
      passingScore: form.passingScore,
    }),
    onSuccess: () => { toast.success('Quiz atualizado!'); queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', trackTemplateId] }); setEditing(null); setModalOpen(false) },
  })

  const deleteMut = useMutation({
    mutationFn: () => deletePressQuizTemplate(deleteTarget!.id),
    onSuccess: () => { toast.success('Quiz desativado!'); queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', trackTemplateId] }); setDeleteTarget(null) },
  })

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', questions: [], maxAttempts: 3, passingScore: 70 }); setModalOpen(true) }
  const openEdit = (q: PressQuizTemplate) => { setEditing(q); setForm({ title: q.title, description: q.description || '', questions: q.questionsJson || [], maxAttempts: q.maxAttempts, passingScore: q.passingScore }); setModalOpen(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-warning" /> Quizzes ({quizzes.length})</h3>
        <Button size="sm" variant="ghost" onClick={openCreate}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      {quizzes.length > 0 && (
        <div className="space-y-1">
          {quizzes.map((q) => (
            <div key={q.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
              <span className="flex-1 text-text">{q.title}</span>
              <span className="text-xs text-muted">{q.questionsJson?.length || 0} questões</span>
              <span className="text-xs text-muted">{q.passingScore}%</span>
              <button onClick={() => openEdit(q)} className="text-muted hover:text-text cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDeleteTarget(q)} className="text-muted hover:text-error cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Editar Quiz' : 'Criar Quiz'} size="lg" footer={
        <><Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancelar</Button>
        <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} isLoading={createMut.isPending || updateMut.isPending}>{editing ? 'Salvar' : 'Criar'}</Button></>
      }>
        <div className="space-y-4">
          <Input id="pqTitle" label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea id="pqDesc" label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-text">Questões</label>
            <AIButton
              label="Gerar Quiz com IA"
              onGenerate={() => generateQuiz({ title: form.title, description: form.description, count: 5 })}
              onAccept={(raw) => {
                try {
                  const parsed = JSON.parse(raw)
                  if (Array.isArray(parsed)) setForm({ ...form, questions: parsed })
                } catch { toast.error('Formato inválido retornado pela IA') }
              }}
            />
          </div>
          <QuizBuilder value={form.questions} onChange={(questions) => setForm({ ...form, questions })} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="pqAttempts" label="Máximo de tentativas" type="number" value={String(form.maxAttempts)} onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })} />
            <Input id="pqScore" label="Nota de aprovação (%)" type="number" value={String(form.passingScore)} onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })} />
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} title="Desativar Quiz" message={`Desativar "${deleteTarget?.title}"?`} />
    </div>
  )
}
