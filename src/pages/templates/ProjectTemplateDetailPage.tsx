import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, GripVertical, Music, FileText, BookOpen, HelpCircle, ArchiveRestore, Eye } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { Pagination } from '@/components/ui/Pagination'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { IconButton } from '@/components/ui/IconButton'
import { LoadingState } from '@/components/ui/LoadingState'
import { FileUpload } from '@/components/ui/FileUpload'
import { FilePreview } from '@/components/ui/FilePreview'
import { QuizBuilder } from '@/components/ui/QuizBuilder'
import { AIButton } from '@/components/ui/AIButton'
import { generateQuiz, generateQuizQuestion } from '@/api/ai'
import { presignDownload } from '@/api/storage'
import {
  getProjectTemplate,
  listTrackTemplates,
  createTrackTemplate,
  updateTrackTemplate,
  deleteTrackTemplate,
  listDeletedTrackTemplates,
  restoreTrackTemplate,
  listMaterialTemplates,
  createMaterialTemplate,
  updateMaterialTemplate,
  deleteMaterialTemplate,
  listDeletedMaterialTemplates,
  restoreMaterialTemplate,
  listStudyTrackTemplates,
  listDeletedStudyTrackTemplates,
  createStudyTrackTemplate,
  updateStudyTrackTemplate,
  deleteStudyTrackTemplate,
  restoreStudyTrackTemplate,
  listPressQuizTemplates,
  listDeletedPressQuizTemplates,
  createPressQuizTemplate,
  updatePressQuizTemplate,
  deletePressQuizTemplate,
  restorePressQuizTemplate,
} from '@/api/templates'
import type { AxiosError } from 'axios'
import { TRACK_MATERIAL_TYPE_LABELS, TRACK_MATERIAL_TYPE_VARIANT } from '@/lib/constants'
import type {
  ProjectTemplate,
  TrackSceneTemplate,
  TrackMaterialTemplate,
  TrackMaterialType,
  StudyTrackTemplate,
  PressQuizTemplate,
  DeactivationErrorDetails,
  QuizQuestion,
} from '@/types'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import toast from 'react-hot-toast'

const TRACK_TRASH_PAGE_LIMIT = 20

export function ProjectTemplateDetailPage() {
  const { slug, trackSlug } = useParams<{ slug: string; trackSlug?: string }>()
  const location = useLocation()
  const isTracksRoute = location.pathname.includes('/tracks')
  const isTrackDetailRoute = Boolean(trackSlug)

  const { data: template } = useQuery({
    queryKey: ['project-template', slug],
    queryFn: () => getProjectTemplate(slug!),
    enabled: !!slug,
  })

  const { data: tracks = [] } = useQuery({
    queryKey: ['track-templates', template?.id],
    queryFn: () => listTrackTemplates(template!.id),
    enabled: !!template?.id,
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

  if (!template) {
    return (
      <PageContainer title="Carregando dados...">
        <LoadingState />
      </PageContainer>
    )
  }
  return (
    <PageContainer
      title={
        <div className="flex min-w-0 items-center gap-3">
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
          <span className="truncate" title={template.name}>
            {template.name}
          </span>
        </div>
      }
    >
      {!isTracksRoute && template.description && <p className="text-sm text-muted -mt-4 mb-4">{template.description}</p>}

      {isTracksRoute && !isTrackDetailRoute && (
        <TracksList projectTemplateSlug={slug!} projectTemplateId={template.id} tracks={tracks} template={template} />
      )}
      {isTracksRoute && isTrackDetailRoute && (
        <TrackDetailView
          projectTemplateSlug={slug!}
          trackSlug={trackSlug!}
          tracks={tracks}
          template={template}
        />
      )}

    </PageContainer>
  )
}

// ---- Tracks List ----
function TracksList({ projectTemplateSlug, projectTemplateId, tracks, template }: { projectTemplateSlug: string; projectTemplateId: string; tracks: TrackSceneTemplate[]; template?: ProjectTemplate }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [trashPage, setTrashPage] = useState(1)
  const [editingTrack, setEditingTrack] = useState<TrackSceneTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrackSceneTemplate | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<TrackSceneTemplate | null>(null)
  const [blockedInfo, setBlockedInfo] = useState<{ name: string; slug: string; details: DeactivationErrorDetails } | null>(null)
  const [form, setForm] = useState({ title: '', artist: '', description: '', technicalInstruction: '', lyrics: '', unlockAfterTrackId: '' })
  const isTrash = activeTab === 'TRASH'
  const trackLabelSingular = template?.type === 'PLAY' ? 'Cena' : 'Faixa'
  const trackLabelPlural = template?.type === 'PLAY' ? 'Cenas' : 'Faixas'
  const trackLabelLower = template?.type === 'PLAY' ? 'cena' : 'faixa'

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order)
  const { data: deletedResponse } = useQuery({
    queryKey: ['track-templates', 'deleted', projectTemplateSlug, trashPage],
    queryFn: () => listDeletedTrackTemplates({ page: trashPage, limit: TRACK_TRASH_PAGE_LIMIT }),
    enabled: isTrash,
  })
  const deletedTracks = (deletedResponse?.data ?? [])
    .filter((trackItem) => trackItem.projectTemplateId === projectTemplateId)
    .sort((a, b) => a.order - b.order)
  const trashTotal = deletedResponse?.pagination.total ?? deletedTracks.length
  const refreshTemplateVersion = async () => {
    queryClient.setQueryData<ProjectTemplate>(['project-template', projectTemplateSlug], (current) => {
      if (!current) return current
      return { ...current, version: current.version + 1 }
    })
    await queryClient.refetchQueries({ queryKey: ['project-template', projectTemplateSlug], exact: true, type: 'active' })
    queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    queryClient.invalidateQueries({ queryKey: ['project-template-readiness', projectTemplateSlug] })
  }

  const createMutation = useMutation({
    mutationFn: () => createTrackTemplate(projectTemplateId, {
      title: form.title,
      artist: form.artist || undefined,
      description: form.description || undefined,
      technicalInstruction: form.technicalInstruction || undefined,
      lyrics: form.lyrics || undefined,
      unlockAfterTrackId: form.unlockAfterTrackId || undefined,
    }),
    onSuccess: async () => {
      toast.success(`${trackLabelSingular} cadastrada com sucesso.`)
      queryClient.invalidateQueries({ queryKey: ['track-templates', projectTemplateSlug] })
      await refreshTemplateVersion()
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
    onSuccess: async () => {
      toast.success(`${trackLabelSingular} atualizada com sucesso.`)
      queryClient.invalidateQueries({ queryKey: ['track-templates', projectTemplateSlug] })
      await refreshTemplateVersion()
      setEditingTrack(null)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTrackTemplate(deleteTarget!.id),
    onSuccess: async () => {
      toast.success(`${trackLabelSingular} desativada com sucesso.`)
      queryClient.invalidateQueries({ queryKey: ['track-templates', projectTemplateSlug] })
      queryClient.invalidateQueries({ queryKey: ['track-templates', 'deleted', projectTemplateSlug] })
      await refreshTemplateVersion()
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
    mutationFn: () => restoreTrackTemplate(restoreTarget!.id),
    onSuccess: async () => {
      toast.success(`${trackLabelSingular} restaurada com sucesso.`)
      queryClient.invalidateQueries({ queryKey: ['track-templates', projectTemplateSlug] })
      queryClient.invalidateQueries({ queryKey: ['track-templates', 'deleted', projectTemplateSlug] })
      await refreshTemplateVersion()
      setRestoreTarget(null)
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
          <Music className="h-5 w-5 text-accent" /> {trackLabelPlural} ({sortedTracks.length})
        </h2>
        {!isTrash && (
          <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true) }}>
            <Plus className="h-3.5 w-3.5" /> Adicionar {trackLabelSingular}
          </Button>
        )}
      </div>

      <Tabs
        tabs={[
          { key: 'active', label: 'Ativas', count: sortedTracks.length },
          { key: 'TRASH', label: 'Lixeira', count: trashTotal },
        ]}
        activeKey={activeTab}
        onChange={(key) => { setActiveTab(key); setTrashPage(1) }}
      />

      {!isTrash && (
        <>
          {sortedTracks.map((track) => (
            <div key={track.id} className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 transition-colors">
                <GripVertical className="h-4 w-4 text-muted/50" />
                <span className="text-xs text-muted font-mono w-6">{track.order}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-text" title={track.title}>{track.title}</span>
                {track.artist && <span className="max-w-40 truncate text-sm text-muted sm:max-w-56" title={track.artist}>{track.artist}</span>}
                <div className="flex gap-1">
                  <IconButton
                    onClick={() => navigate(`/templates/projects/${projectTemplateSlug}/tracks/${track.slug}`)}
                    label={`Ver detalhes da ${trackLabelLower}`}
                    icon={<Eye className="h-3.5 w-3.5" />}
                    size="sm"
                  />
                  <IconButton onClick={() => openEdit(track)} label="Editar cadastro" icon={<Pencil className="h-3.5 w-3.5" />} size="sm" />
                  <IconButton onClick={() => setDeleteTarget(track)} label="Desativar" icon={<Trash2 className="h-3.5 w-3.5" />} variant="danger" size="sm" />
                </div>
              </div>
            </div>
          ))}
          {sortedTracks.length === 0 && (
            <p className="text-sm text-muted">Nenhuma {trackLabelLower} ativa.</p>
          )}
        </>
      )}

      {isTrash && (
        <>
          {deletedTracks.length > 0 ? (
            <>
              <div className="space-y-1">
                {deletedTracks.map((track) => (
                  <div key={track.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                    <span className="text-xs text-muted font-mono w-6">{track.order}</span>
                    <span className="min-w-0 flex-1 truncate text-text" title={track.title}>{track.title}</span>
                    <Badge variant="error" className="text-[10px]">Excluída</Badge>
                    <IconButton onClick={() => setRestoreTarget(track)} label="Restaurar" icon={<ArchiveRestore className="h-3.5 w-3.5" />} variant="success" size="sm" />
                  </div>
                ))}
              </div>
              {deletedResponse?.pagination && deletedResponse.pagination.totalPages > 1 && (
                <Pagination
                  page={trashPage}
                  totalPages={deletedResponse.pagination.totalPages}
                  total={deletedResponse.pagination.total}
                  onPageChange={setTrashPage}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-muted">A lixeira está vazia.</p>
          )}
        </>
      )}

      <TrackFormModal
        isOpen={createOpen || !!editingTrack}
        onClose={() => { setCreateOpen(false); setEditingTrack(null); resetForm() }}
        title={editingTrack ? `Editar ${trackLabelSingular}` : `Cadastrar ${trackLabelSingular}`}
        form={form}
        setForm={setForm}
        onSubmit={() => editingTrack ? updateMutation.mutate() : createMutation.mutate()}
        isLoading={createMutation.isPending || updateMutation.isPending}
        submitLabel={editingTrack ? 'Salvar alterações' : 'Cadastrar'}
        tracks={sortedTracks}
        editingTrackId={editingTrack?.id}
        trackLabelLowerPlural={template?.type === 'PLAY' ? 'cenas' : 'faixas'}
      />

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate()} isLoading={deleteMutation.isPending} title={`Desativar ${trackLabelSingular}`} message={`Confirma a desativação de "${deleteTarget?.title}"?`} />
      <ConfirmModal isOpen={!!restoreTarget} onClose={() => setRestoreTarget(null)} onConfirm={() => restoreMutation.mutate()} isLoading={restoreMutation.isPending} title={`Restaurar ${trackLabelSingular}`} message={`Confirma a restauração de "${restoreTarget?.title}"?`} confirmLabel="Restaurar" />
      <DeactivationBlockedModal
        isOpen={!!blockedInfo}
        onClose={() => setBlockedInfo(null)}
        entityName={blockedInfo?.name ?? ''}
        parentSlug={blockedInfo?.slug ?? ''}
        details={blockedInfo?.details ?? null}
      />
    </div>
  )
}

function TrackDetailView({
  projectTemplateSlug,
  trackSlug,
  tracks,
  template,
}: {
  projectTemplateSlug: string
  trackSlug: string
  tracks: TrackSceneTemplate[]
  template?: ProjectTemplate
}) {
  const navigate = useNavigate()
  const track = tracks.find((item) => item.slug === trackSlug)
  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order)
  const trackLabelSingular = template?.type === 'PLAY' ? 'Cena' : 'Faixa'

  if (!track) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-muted">Não foi possível encontrar esta faixa.</p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-3"
          onClick={() => navigate(`/templates/projects/${projectTemplateSlug}/tracks`)}
        >
          Voltar para faixas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text flex items-center gap-2">
          <Music className="h-5 w-5 text-accent" /> Detalhes da {trackLabelSingular.toLowerCase()}
        </h2>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(`/templates/projects/${projectTemplateSlug}/tracks`)}
        >
          Voltar para faixas
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted">{trackLabelSingular} #{track.order}</p>
          <h3 className="text-lg font-semibold text-text">{track.title}</h3>
          {track.artist && <p className="text-sm text-muted">{track.artist}</p>}
        </div>

        <div>
          <p className="text-xs font-medium text-muted uppercase">Descrição</p>
          <p className="text-sm text-text mt-1">{track.description || 'Não informado'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase">Instrução Técnica</p>
          <p className="text-sm text-text mt-1">{track.technicalInstruction || 'Não informado'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase">Letra</p>
          <p className="text-sm text-text mt-1 whitespace-pre-wrap">{track.lyrics || 'Não informado'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase">Pré-requisito</p>
          <p className="text-sm text-text mt-1">
            {(() => {
              const prereq = track.unlockAfterTrackId
                ? sortedTracks.find((t) => t.id === track.unlockAfterTrackId)
                : null
              return prereq ? `Desbloqueia após: ${prereq.title}` : 'Sem pré-requisito'
            })()}
          </p>
        </div>

        <MaterialsSection trackTemplateId={track.id} projectTemplateSlug={projectTemplateSlug} />
        <StudyTracksSection trackTemplateId={track.id} projectTemplateSlug={projectTemplateSlug} />
        <PressQuizzesSection trackTemplateId={track.id} projectTemplateSlug={projectTemplateSlug} track={track} template={template} />
      </div>
    </div>
  )
}

function TrackFormModal({ isOpen, onClose, title, form, setForm, onSubmit, isLoading, submitLabel, tracks, editingTrackId, trackLabelLowerPlural }: {
  isOpen: boolean; onClose: () => void; title: string
  form: { title: string; artist: string; description: string; technicalInstruction: string; lyrics: string; unlockAfterTrackId: string }
  setForm: (f: typeof form) => void; onSubmit: () => void; isLoading: boolean; submitLabel: string
  tracks: TrackSceneTemplate[]; editingTrackId?: string; trackLabelLowerPlural: string
}) {
  const availableTracks = tracks.filter(t => t.id !== editingTrackId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" footer={
      <><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={onSubmit} isLoading={isLoading}>{submitLabel}</Button></>
    }>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="ttTitle" label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input id="ttArtist" label="Responsável" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
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
          Demo e coletiva de imprensa são obrigatórios para todas as {trackLabelLowerPlural}.
        </div>
      </div>
    </Modal>
  )
}

// ---- Materials Section ----
function MaterialsSection({ trackTemplateId, projectTemplateSlug }: { trackTemplateId: string; projectTemplateSlug: string }) {
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [panelMode, setPanelMode] = useState<'list' | 'detail'>('list')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewing, setViewing] = useState<TrackMaterialTemplate | null>(null)
  const [editing, setEditing] = useState<TrackMaterialTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrackMaterialTemplate | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<TrackMaterialTemplate | null>(null)
  const [form, setForm] = useState({ type: 'TEXT' as TrackMaterialType, title: '', defaultContentUrl: '', defaultTextContent: '' })
  const isTrash = activeTab === 'TRASH'
  const refreshTemplateVersion = async () => {
    queryClient.setQueryData<ProjectTemplate>(['project-template', projectTemplateSlug], (current) => {
      if (!current) return current
      return { ...current, version: current.version + 1 }
    })
    await queryClient.refetchQueries({ queryKey: ['project-template', projectTemplateSlug], exact: true, type: 'active' })
    queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    queryClient.invalidateQueries({ queryKey: ['project-template-readiness', projectTemplateSlug] })
  }

  const { data: materials = [] } = useQuery({
    queryKey: ['material-templates', trackTemplateId],
    queryFn: () => listMaterialTemplates(trackTemplateId),
    enabled: !isTrash,
  })

  const { data: deletedResponse } = useQuery({
    queryKey: ['material-templates', 'deleted', trackTemplateId],
    queryFn: () => listDeletedMaterialTemplates({ page: 1, limit: 100 }),
    enabled: isTrash,
  })
  const deletedMaterials = (deletedResponse?.data ?? []).filter((material) => material.trackSceneTemplateId === trackTemplateId)
  const viewingContentUrl = viewing?.defaultContentUrl?.trim() || ''
  const needsPresignedPreview = Boolean(
    viewing &&
    viewing.type !== 'TEXT' &&
    viewing.type !== 'LINK' &&
    viewingContentUrl &&
    !/^https?:\/\//i.test(viewingContentUrl)
  )
  const { data: previewSourceUrl, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['material-preview', viewing?.id, viewingContentUrl],
    queryFn: async () => {
      if (!viewing || viewing.type === 'TEXT' || viewing.type === 'LINK' || !viewingContentUrl) return null
      if (/^https?:\/\//i.test(viewingContentUrl)) return viewingContentUrl
      const { downloadUrl } = await presignDownload(viewingContentUrl)
      return downloadUrl
    },
    enabled: !!viewing && !!viewingContentUrl,
    staleTime: 5 * 60 * 1000,
  })

  const createMut = useMutation({
    mutationFn: () => createMaterialTemplate(trackTemplateId, { type: form.type, title: form.title, defaultContentUrl: form.defaultContentUrl || undefined, defaultTextContent: form.defaultTextContent || undefined }),
    onSuccess: async () => {
      toast.success('Material criado!')
      queryClient.invalidateQueries({ queryKey: ['material-templates', trackTemplateId] })
      await refreshTemplateVersion()
      setModalOpen(false)
    },
  })

  const updateMut = useMutation({
    mutationFn: () => updateMaterialTemplate(editing!.id, { title: form.title, defaultContentUrl: form.defaultContentUrl || undefined, defaultTextContent: form.defaultTextContent || undefined }),
    onSuccess: async () => {
      toast.success('Material atualizado!')
      queryClient.invalidateQueries({ queryKey: ['material-templates', trackTemplateId] })
      await refreshTemplateVersion()
      setEditing(null)
      setModalOpen(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteMaterialTemplate(deleteTarget!.id),
    onSuccess: async () => {
      toast.success('Material desativado!')
      queryClient.invalidateQueries({ queryKey: ['material-templates', trackTemplateId] })
      queryClient.invalidateQueries({ queryKey: ['material-templates', 'deleted', trackTemplateId] })
      await refreshTemplateVersion()
      setDeleteTarget(null)
    },
  })

  const restoreMut = useMutation({
    mutationFn: () => restoreMaterialTemplate(restoreTarget!.id),
    onSuccess: async () => {
      toast.success('Material restaurado!')
      queryClient.invalidateQueries({ queryKey: ['material-templates', trackTemplateId] })
      queryClient.invalidateQueries({ queryKey: ['material-templates', 'deleted', trackTemplateId] })
      await refreshTemplateVersion()
      setRestoreTarget(null)
    },
  })

  const openCreate = () => { setEditing(null); setForm({ type: 'TEXT', title: '', defaultContentUrl: '', defaultTextContent: '' }); setModalOpen(true) }
  const openEdit = (m: TrackMaterialTemplate) => { setEditing(m); setForm({ type: m.type, title: m.title, defaultContentUrl: m.defaultContentUrl || '', defaultTextContent: m.defaultTextContent || '' }); setModalOpen(true) }
  const openPreview = (material: TrackMaterialTemplate) => {
    const contentUrl = material.defaultContentUrl?.trim()
    if (material.type !== 'TEXT' && !contentUrl) {
      toast.error('Este material não tem conteúdo para visualizar.')
      return
    }
    setViewing(material)
    setPanelMode('detail')
  }
  const resolvedPreviewUrl = (() => {
    if (!viewing) return null
    if (viewing.type === 'TEXT') return null
    if (!viewingContentUrl) return null
    if (viewing.type === 'LINK') return viewingContentUrl
    if (/^https?:\/\//i.test(viewingContentUrl)) return viewingContentUrl
    return previewSourceUrl || null
  })()
  const previewFileName = viewingContentUrl ? viewingContentUrl.split('/').pop() || viewing?.title || '' : viewing?.title || ''
  const previewMimeType = viewing?.type === 'PDF'
    ? 'application/pdf'
    : viewing?.type === 'AUDIO'
      ? 'audio/*'
      : viewing?.type === 'VIDEO'
        ? 'video/*'
        : undefined
  const showPreviewLoading = !!viewing && viewing.type !== 'TEXT' && needsPresignedPreview && isLoadingPreview

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="flex flex-1 items-center gap-1.5 text-left text-sm font-semibold text-text"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
          <FileText className="h-4 w-4 text-info" />
          Materiais ({materials.length})
        </button>
        {!isTrash && (
          <Button size="sm" variant="ghost" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isExpanded && (
        <>
          <Tabs
            tabs={[
              { key: 'active', label: 'Ativos', count: materials.length },
              { key: 'TRASH', label: 'Lixeira', count: deletedMaterials.length },
              ...(viewing ? [{ key: 'DETAIL', label: 'Detalhes' }] : []),
            ]}
            activeKey={panelMode === 'detail' ? 'DETAIL' : activeTab}
            onChange={(key) => {
              if (key === 'DETAIL') {
                setPanelMode('detail')
                return
              }
              setPanelMode('list')
              setActiveTab(key)
            }}
          />

          {panelMode === 'list' && !isTrash && (
            <>
              {materials.length > 0 ? (
                <div className="space-y-1 mt-2">
                  {materials.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                      <Badge variant={TRACK_MATERIAL_TYPE_VARIANT[m.type]} className="text-[10px]">{TRACK_MATERIAL_TYPE_LABELS[m.type]}</Badge>
                      <span className="min-w-0 flex-1 truncate text-text" title={m.title}>{m.title}</span>
                      <IconButton
                        onClick={() => openPreview(m)}
                        label="Ver detalhes"
                        icon={<Eye className="h-3.5 w-3.5" />}
                        size="sm"
                      >
                        Detalhes
                      </IconButton>
                      <IconButton onClick={() => openEdit(m)} label="Editar cadastro" icon={<Pencil className="h-3.5 w-3.5" />} size="sm" />
                      <IconButton onClick={() => setDeleteTarget(m)} label="Desativar" icon={<Trash2 className="h-3.5 w-3.5" />} variant="danger" size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted mt-2">Nenhum material ativo</p>
              )}
            </>
          )}

          {panelMode === 'list' && isTrash && (
            <>
              {deletedMaterials.length > 0 ? (
                <div className="space-y-1 mt-2">
                  {deletedMaterials.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                      <Badge variant={TRACK_MATERIAL_TYPE_VARIANT[m.type]} className="text-[10px]">{TRACK_MATERIAL_TYPE_LABELS[m.type]}</Badge>
                      <span className="min-w-0 flex-1 truncate text-text" title={m.title}>{m.title}</span>
                      <Badge variant="error" className="text-[10px]">Excluído</Badge>
                      <IconButton onClick={() => setRestoreTarget(m)} label="Restaurar" icon={<ArchiveRestore className="h-3.5 w-3.5" />} variant="success" size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted mt-2">A lixeira está vazia.</p>
              )}
            </>
          )}

          {panelMode === 'detail' && viewing && (
            <div className="mt-2 space-y-4 rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text">Detalhes do material</p>
                <Button size="sm" variant="secondary" onClick={() => setPanelMode('list')}>
                  Voltar para lista
                </Button>
              </div>
              <Input id="matViewTitleInline" label="Título" value={viewing.title} readOnly />
              <Input id="matViewTypeInline" label="Tipo" value={TRACK_MATERIAL_TYPE_LABELS[viewing.type]} readOnly />
              {viewing.type === 'TEXT' ? (
                <Textarea id="matViewContentInline" label="Conteúdo" value={viewing.defaultTextContent || 'Sem conteúdo cadastrado'} readOnly />
              ) : viewing.type === 'LINK' ? (
                <div className="space-y-2">
                  <Input id="matViewUrlInline" label="Link" value={viewing.defaultContentUrl || ''} readOnly />
                  {resolvedPreviewUrl ? (
                    <iframe
                      src={resolvedPreviewUrl}
                      title={`Preview de ${viewing.title}`}
                      className="h-[70vh] w-full rounded-lg border border-border bg-surface"
                    />
                  ) : (
                    <div className="rounded-lg border border-border bg-surface-2 px-3 py-3 text-sm text-muted">
                      Não foi possível carregar o preview deste link dentro da plataforma.
                    </div>
                  )}
                </div>
              ) : showPreviewLoading ? (
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-3 text-sm text-muted">
                  Carregando visualização...
                </div>
              ) : resolvedPreviewUrl ? (
                <FilePreview
                  fileName={previewFileName}
                  sourceUrl={resolvedPreviewUrl}
                  mimeType={previewMimeType}
                />
              ) : (
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-3 text-sm text-muted">
                  Não foi possível carregar o preview deste material.
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Editar material' : 'Cadastrar material'} footer={
        <><Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancelar</Button>
        <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} isLoading={createMut.isPending || updateMut.isPending}>{editing ? 'Salvar alterações' : 'Cadastrar'}</Button></>
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
              compact
            />
          )}
          {form.type === 'LINK' && <Input id="matUrl" label="URL do Link" value={form.defaultContentUrl} onChange={(e) => setForm({ ...form, defaultContentUrl: e.target.value })} placeholder="https://..." />}
          {form.type === 'TEXT' && <Textarea id="matText" label="Conteúdo" value={form.defaultTextContent} onChange={(e) => setForm({ ...form, defaultTextContent: e.target.value })} />}
        </div>
      </Modal>
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} title="Desativar material" message={`Confirma a desativação de "${deleteTarget?.title}"?`} />
      <ConfirmModal isOpen={!!restoreTarget} onClose={() => setRestoreTarget(null)} onConfirm={() => restoreMut.mutate()} isLoading={restoreMut.isPending} title="Restaurar material" message={`Confirma a restauração de "${restoreTarget?.title}"?`} confirmLabel="Restaurar" />
    </div>
  )
}

// ---- Study Tracks Section ----
function StudyTracksSection({ trackTemplateId, projectTemplateSlug }: { trackTemplateId: string; projectTemplateSlug: string }) {
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [panelMode, setPanelMode] = useState<'list' | 'detail'>('list')
  const [trashPage, setTrashPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewing, setViewing] = useState<StudyTrackTemplate | null>(null)
  const [editing, setEditing] = useState<StudyTrackTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudyTrackTemplate | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<StudyTrackTemplate | null>(null)
  const [form, setForm] = useState({ title: '', description: '', technicalNotes: '', videoUrl: '', audioUrl: '', pdfUrl: '' })
  const refreshTemplateVersion = async () => {
    queryClient.setQueryData<ProjectTemplate>(['project-template', projectTemplateSlug], (current) => {
      if (!current) return current
      return { ...current, version: current.version + 1 }
    })
    await queryClient.refetchQueries({ queryKey: ['project-template', projectTemplateSlug], exact: true, type: 'active' })
    queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    queryClient.invalidateQueries({ queryKey: ['project-template-readiness', projectTemplateSlug] })
  }
  const isTrash = activeTab === 'TRASH'

  const { data: studyTracks = [] } = useQuery({
    queryKey: ['study-track-templates', trackTemplateId],
    queryFn: () => listStudyTrackTemplates(trackTemplateId),
    enabled: !isTrash,
  })

  const { data: deletedResponse } = useQuery({
    queryKey: ['study-track-templates', 'deleted', trackTemplateId, trashPage],
    queryFn: () => listDeletedStudyTrackTemplates({
      page: trashPage,
      limit: STUDY_TRACK_TRASH_PAGE_LIMIT,
      trackSceneTemplateId: trackTemplateId,
    }),
    enabled: isTrash,
  })
  const deletedStudyTracks = deletedResponse?.data ?? []
  const pagination = deletedResponse?.pagination

  const createMut = useMutation({
    mutationFn: () => createStudyTrackTemplate(trackTemplateId, {
      title: form.title, description: form.description || undefined, technicalNotes: form.technicalNotes || undefined,
      videoUrl: form.videoUrl || undefined, audioUrl: form.audioUrl || undefined, pdfUrl: form.pdfUrl || undefined,
    }),
    onSuccess: async () => {
      toast.success('Trilha cadastrada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['study-track-templates', trackTemplateId] })
      await refreshTemplateVersion()
      setModalOpen(false)
    },
  })

  const updateMut = useMutation({
    mutationFn: () => updateStudyTrackTemplate(editing!.id, {
      title: form.title,
      description: form.description || undefined,
      technicalNotes: form.technicalNotes || undefined,
      videoUrl: form.videoUrl.trim() ? form.videoUrl : null,
      audioUrl: form.audioUrl.trim() ? form.audioUrl : null,
      pdfUrl: form.pdfUrl.trim() ? form.pdfUrl : null,
    }),
    onSuccess: async () => {
      toast.success('Trilha atualizada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['study-track-templates', trackTemplateId] })
      await refreshTemplateVersion()
      setEditing(null)
      setModalOpen(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteStudyTrackTemplate(deleteTarget!.id),
    onSuccess: async () => {
      toast.success('Trilha desativada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['study-track-templates', trackTemplateId] })
      queryClient.invalidateQueries({ queryKey: ['study-track-templates', 'deleted', trackTemplateId] })
      await refreshTemplateVersion()
      setDeleteTarget(null)
    },
  })

  const restoreMut = useMutation({
    mutationFn: () => restoreStudyTrackTemplate(restoreTarget!.id),
    onSuccess: async () => {
      toast.success('Trilha restaurada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['study-track-templates', trackTemplateId] })
      queryClient.invalidateQueries({ queryKey: ['study-track-templates', 'deleted', trackTemplateId] })
      await refreshTemplateVersion()
      setRestoreTarget(null)
    },
  })

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', technicalNotes: '', videoUrl: '', audioUrl: '', pdfUrl: '' }); setModalOpen(true) }
  const openEdit = (st: StudyTrackTemplate) => { setEditing(st); setForm({ title: st.title, description: st.description || '', technicalNotes: st.technicalNotes || '', videoUrl: st.videoUrl || '', audioUrl: st.audioUrl || '', pdfUrl: st.pdfUrl || '' }); setModalOpen(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="flex flex-1 items-center gap-1.5 text-left text-sm font-semibold text-text"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
          <BookOpen className="h-4 w-4 text-success" />
          Trilhas de Estudo ({studyTracks.length})
        </button>
        {!isTrash && (
          <Button size="sm" variant="ghost" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isExpanded && (
        <>
          <Tabs
            tabs={[
              { key: 'active', label: 'Ativas', count: studyTracks.length },
              { key: 'TRASH', label: 'Lixeira', count: pagination?.total ?? deletedStudyTracks.length },
              ...(viewing ? [{ key: 'DETAIL', label: 'Detalhes' }] : []),
            ]}
            activeKey={panelMode === 'detail' ? 'DETAIL' : activeTab}
            onChange={(key) => {
              if (key === 'DETAIL') {
                setPanelMode('detail')
                return
              }
              setPanelMode('list')
              setActiveTab(key)
              setTrashPage(1)
            }}
          />

          {panelMode === 'list' && !isTrash && (
            <>
              {studyTracks.length > 0 ? (
                <div className="space-y-1 mt-2">
                  {studyTracks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                      <span className="min-w-0 flex-1 truncate text-text" title={st.title}>{st.title}</span>
                      <IconButton onClick={() => { setViewing(st); setPanelMode('detail') }} label="Ver detalhes" icon={<Eye className="h-3.5 w-3.5" />} size="sm">
                        Detalhes
                      </IconButton>
                      <IconButton onClick={() => openEdit(st)} label="Editar cadastro" icon={<Pencil className="h-3.5 w-3.5" />} size="sm" />
                      <IconButton onClick={() => setDeleteTarget(st)} label="Desativar" icon={<Trash2 className="h-3.5 w-3.5" />} variant="danger" size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted mt-2">Nenhuma trilha ativa.</p>
              )}
            </>
          )}

          {panelMode === 'list' && isTrash && (
            <>
              {deletedStudyTracks.length > 0 ? (
                <>
                  <div className="space-y-1 mt-2">
                    {deletedStudyTracks.map((st) => (
                      <div key={st.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                        <span className="min-w-0 flex-1 truncate text-text" title={st.title}>{st.title}</span>
                        <Badge variant="error" className="text-[10px]">Excluído</Badge>
                        <IconButton onClick={() => setRestoreTarget(st)} label="Restaurar" icon={<ArchiveRestore className="h-3.5 w-3.5" />} variant="success" size="sm" />
                      </div>
                    ))}
                  </div>
                  {pagination && pagination.totalPages > 1 && (
                    <Pagination
                      page={trashPage}
                      totalPages={pagination.totalPages}
                      total={pagination.total}
                      onPageChange={setTrashPage}
                    />
                  )}
                </>
              ) : (
                <p className="text-sm text-muted mt-2">A lixeira está vazia.</p>
              )}
            </>
          )}

          {panelMode === 'detail' && viewing && (
            <div className="mt-2 space-y-4 rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text">Detalhes da trilha</p>
                <Button size="sm" variant="secondary" onClick={() => setPanelMode('list')}>
                  Voltar para lista
                </Button>
              </div>
              <Input id="stViewTitleInline" label="Título" value={viewing.title} readOnly />
              <Textarea id="stViewDescInline" label="Descrição" value={viewing.description || ''} readOnly />
              <Textarea id="stViewNotesInline" label="Notas Técnicas" value={viewing.technicalNotes || ''} readOnly />
              <div className="space-y-2">
                <p className="text-sm font-medium text-text">Arquivos vinculados</p>
                <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-text">Vídeo:</span>{' '}
                    <span className="text-muted break-all">{viewing.videoUrl || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-text">Áudio:</span>{' '}
                    <span className="text-muted break-all">{viewing.audioUrl || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-text">PDF:</span>{' '}
                    <span className="text-muted break-all">{viewing.pdfUrl || 'Não informado'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Editar trilha' : 'Cadastrar trilha'} size="lg" footer={
        <><Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancelar</Button>
        <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} isLoading={createMut.isPending || updateMut.isPending}>{editing ? 'Salvar alterações' : 'Cadastrar'}</Button></>
      }>
        <div className="space-y-4">
          <Input id="stTitle" label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea id="stDesc" label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Textarea id="stNotes" label="Notas Técnicas" value={form.technicalNotes} onChange={(e) => setForm({ ...form, technicalNotes: e.target.value })} />
          <div className="space-y-4">
            <div className="space-y-2">
              <FileUpload
                fileType="videos"
                entityType="study-track-template"
                entityId={editing?.id || 'draft'}
                currentValue={form.videoUrl || null}
                onUploadComplete={(key) => setForm({ ...form, videoUrl: key })}
                onRemove={() => setForm({ ...form, videoUrl: '' })}
                label="Vídeo"
                accept=".mp4,.webm,.mov"
                helperText="Formatos: .mp4, .webm, .mov"
                compact
              />
            </div>

            <div className="space-y-2">
              <FileUpload
                fileType="materials"
                entityType="study-track-template"
                entityId={editing?.id || 'draft'}
                currentValue={form.audioUrl || null}
                onUploadComplete={(key) => setForm({ ...form, audioUrl: key })}
                onRemove={() => setForm({ ...form, audioUrl: '' })}
                label="Áudio"
                accept=".mp3,.wav,.m4a"
                helperText="Formatos: .mp3, .wav, .m4a"
                compact
              />
            </div>

            <div className="space-y-2">
              <FileUpload
                fileType="materials"
                entityType="study-track-template"
                entityId={editing?.id || 'draft'}
                currentValue={form.pdfUrl || null}
                onUploadComplete={(key) => setForm({ ...form, pdfUrl: key })}
                onRemove={() => setForm({ ...form, pdfUrl: '' })}
                label="PDF"
                accept=".pdf"
                helperText="Formato: .pdf"
                compact
              />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} title="Desativar trilha" message={`Confirma a desativação de "${deleteTarget?.title}"?`} />
      <ConfirmModal isOpen={!!restoreTarget} onClose={() => setRestoreTarget(null)} onConfirm={() => restoreMut.mutate()} isLoading={restoreMut.isPending} title="Restaurar trilha" message={`Confirma a restauração de "${restoreTarget?.title}"?`} confirmLabel="Restaurar" />
    </div>
  )
}

const QUIZ_TRASH_PAGE_LIMIT = 20
const STUDY_TRACK_TRASH_PAGE_LIMIT = 20

function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isQuestionDuplicate(candidate: string, existing: string): boolean {
  const normalizedCandidate = normalizeQuestionText(candidate)
  const normalizedExisting = normalizeQuestionText(existing)

  if (!normalizedCandidate || !normalizedExisting) return false
  if (normalizedCandidate === normalizedExisting) return true
  if (normalizedCandidate.length >= 24 && normalizedExisting.includes(normalizedCandidate)) return true
  if (normalizedExisting.length >= 24 && normalizedCandidate.includes(normalizedExisting)) return true

  const candidateTokens = new Set(normalizedCandidate.split(' ').filter((token) => token.length > 2))
  const existingTokens = new Set(normalizedExisting.split(' ').filter((token) => token.length > 2))
  if (candidateTokens.size === 0 || existingTokens.size === 0) return false

  let intersection = 0
  for (const token of candidateTokens) {
    if (existingTokens.has(token)) intersection += 1
  }
  const union = candidateTokens.size + existingTokens.size - intersection
  const jaccard = union === 0 ? 0 : intersection / union

  return jaccard >= 0.7
}

// ---- Press Quizzes Section ----
function PressQuizzesSection({ trackTemplateId, projectTemplateSlug, track, template }: { trackTemplateId: string; projectTemplateSlug: string; track: TrackSceneTemplate; template?: ProjectTemplate }) {
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [panelMode, setPanelMode] = useState<'list' | 'detail'>('list')
  const [trashPage, setTrashPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewing, setViewing] = useState<PressQuizTemplate | null>(null)
  const [editing, setEditing] = useState<PressQuizTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PressQuizTemplate | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<PressQuizTemplate | null>(null)
  const [form, setForm] = useState({ title: '', description: '', questions: [] as QuizQuestion[], maxAttempts: 3, passingScore: 70 })
  const trackLabelLower = template?.type === 'PLAY' ? 'cena' : 'faixa'
  const refreshTemplateVersion = async () => {
    queryClient.setQueryData<ProjectTemplate>(['project-template', projectTemplateSlug], (current) => {
      if (!current) return current
      return { ...current, version: current.version + 1 }
    })
    await queryClient.refetchQueries({ queryKey: ['project-template', projectTemplateSlug], exact: true, type: 'active' })
    queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    queryClient.invalidateQueries({ queryKey: ['project-template-readiness', projectTemplateSlug] })
  }

  const isTrash = activeTab === 'TRASH'

  const { data: quizzes = [] } = useQuery({
    queryKey: ['press-quiz-templates', trackTemplateId],
    queryFn: () => listPressQuizTemplates(trackTemplateId),
    enabled: !isTrash,
  })

  const { data: materials = [] } = useQuery({
    queryKey: ['material-templates', trackTemplateId],
    queryFn: () => listMaterialTemplates(trackTemplateId),
    enabled: modalOpen,
  })

  const { data: studyTracks = [] } = useQuery({
    queryKey: ['study-track-templates', trackTemplateId],
    queryFn: () => listStudyTrackTemplates(trackTemplateId),
    enabled: modalOpen,
  })

  const { data: deletedResponse } = useQuery({
    queryKey: ['press-quiz-templates', 'deleted', trackTemplateId, trashPage],
    queryFn: () => listDeletedPressQuizTemplates({
      page: trashPage,
      limit: QUIZ_TRASH_PAGE_LIMIT,
      trackSceneTemplateId: trackTemplateId,
    }),
    enabled: isTrash,
  })

  const deletedQuizzes = deletedResponse?.data ?? []
  const pagination = deletedResponse?.pagination

  const createMut = useMutation({
    mutationFn: () => createPressQuizTemplate(trackTemplateId, {
      title: form.title,
      description: form.description || undefined,
      questionsJson: form.questions.length > 0 ? form.questions : undefined,
      maxAttempts: form.maxAttempts,
      passingScore: form.passingScore,
    }),
    onSuccess: async () => {
      toast.success('Coletiva de imprensa cadastrada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', trackTemplateId] })
      await refreshTemplateVersion()
      setModalOpen(false)
    },
  })

  const updateMut = useMutation({
    mutationFn: () => updatePressQuizTemplate(editing!.id, {
      title: form.title,
      description: form.description || undefined,
      questionsJson: form.questions.length > 0 ? form.questions : undefined,
      maxAttempts: form.maxAttempts,
      passingScore: form.passingScore,
    }),
    onSuccess: async () => {
      toast.success('Coletiva de imprensa atualizada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', trackTemplateId] })
      await refreshTemplateVersion()
      setEditing(null)
      setModalOpen(false)
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ code?: string }>
      if (err.response?.status === 404 || err.response?.data?.code === 'RESOURCE_NOT_FOUND') {
        setEditing(null)
        toast('Coletiva antiga não encontrada. Criando uma nova com os dados atuais...')
        createMut.mutate()
      }
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => deletePressQuizTemplate(deleteTarget!.id),
    onSuccess: async () => {
      toast.success('Coletiva de imprensa desativada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', trackTemplateId] })
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', 'deleted', trackTemplateId] })
      await refreshTemplateVersion()
      setDeleteTarget(null)
    },
  })

  const restoreMut = useMutation({
    mutationFn: () => restorePressQuizTemplate(restoreTarget!.id),
    onSuccess: async () => {
      toast.success('Coletiva de imprensa restaurada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', trackTemplateId] })
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', 'deleted', trackTemplateId] })
      await refreshTemplateVersion()
      setRestoreTarget(null)
    },
  })

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', questions: [], maxAttempts: 3, passingScore: 70 }); setModalOpen(true) }
  const openEdit = (q: PressQuizTemplate) => { setEditing(q); setForm({ title: q.title, description: q.description || '', questions: q.questionsJson || [], maxAttempts: q.maxAttempts, passingScore: q.passingScore }); setModalOpen(true) }
  const trackQuestions = quizzes
    .filter((quiz) => !editing || quiz.id !== editing.id)
    .flatMap((quiz) => quiz.questionsJson ?? [])
  const referenceQuestions = [...trackQuestions, ...form.questions]
  const withNoDuplicateInstruction = (userExtra?: string) => {
    const duplicateRule = 'NUNCA repita perguntas iguais ou no mesmo sentido das perguntas de referência já existentes.'
    return userExtra?.trim() ? `${duplicateRule}\n${userExtra.trim()}` : duplicateRule
  }

  const buildQuizAiContext = (userExtra?: string) => ({
    title: form.title || track.title,
    description: form.description,
    count: 5,
    project: template ? { name: template.name, type: template.type, description: template.description } : undefined,
    track: { title: track.title, artist: track.artist, description: track.description, technicalInstruction: track.technicalInstruction, lyrics: track.lyrics },
    materials: materials.map((m) => ({ title: m.title, type: m.type })),
    studyTracks: studyTracks.map((st) => ({ title: st.title, description: st.description, technicalNotes: st.technicalNotes })),
    existingQuestions: referenceQuestions,
    userExtra: withNoDuplicateInstruction(userExtra),
  })

  const parseGeneratedQuestion = (raw: string): QuizQuestion | null => {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0]
        if (
          first &&
          typeof first.question === 'string' &&
          Array.isArray(first.options) &&
          typeof first.correctIndex === 'number'
        ) {
          return first as QuizQuestion
        }
      }
      if (
        parsed &&
        typeof parsed.question === 'string' &&
        Array.isArray(parsed.options) &&
        typeof parsed.correctIndex === 'number'
      ) {
        return parsed as QuizQuestion
      }
      return null
    } catch {
      return null
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="flex flex-1 items-center gap-1.5 text-left text-sm font-semibold text-text"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
          <HelpCircle className="h-4 w-4 text-warning" />
          Coletivas de imprensa ({quizzes.length})
        </button>
        {!isTrash && (
          <Button size="sm" variant="ghost" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isExpanded && (
        <>
          <Tabs
            tabs={[
              { key: 'active', label: 'Ativos', count: quizzes.length },
              { key: 'TRASH', label: 'Lixeira', count: pagination?.total ?? deletedQuizzes.length },
              ...(viewing ? [{ key: 'DETAIL', label: 'Detalhes' }] : []),
            ]}
            activeKey={panelMode === 'detail' ? 'DETAIL' : activeTab}
            onChange={(key) => {
              if (key === 'DETAIL') {
                setPanelMode('detail')
                return
              }
              setPanelMode('list')
              setActiveTab(key)
              setTrashPage(1)
            }}
          />

          {panelMode === 'list' && !isTrash && (
            <>
              {quizzes.length > 0 ? (
                <div className="space-y-1 mt-2">
                  {quizzes.map((q) => (
                    <div key={q.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                      <span className="min-w-0 flex-1 truncate text-text" title={q.title}>{q.title}</span>
                      <span className="text-xs text-muted">{q.questionsJson?.length || 0} questões</span>
                      <span className="text-xs text-muted">{q.passingScore}%</span>
                      <IconButton onClick={() => { setViewing(q); setPanelMode('detail') }} label="Ver detalhes" icon={<Eye className="h-3.5 w-3.5" />} size="sm">
                        Detalhes
                      </IconButton>
                      <IconButton onClick={() => openEdit(q)} label="Editar cadastro" icon={<Pencil className="h-3.5 w-3.5" />} size="sm" />
                      <IconButton onClick={() => setDeleteTarget(q)} label="Desativar" icon={<Trash2 className="h-3.5 w-3.5" />} variant="danger" size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted mt-2">Nenhuma coletiva de imprensa ativa.</p>
              )}
            </>
          )}

          {panelMode === 'list' && isTrash && (
            <>
              {deletedQuizzes.length > 0 ? (
                <>
                  <div className="space-y-1 mt-2">
                    {deletedQuizzes.map((q) => (
                      <div key={q.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                        <span className="min-w-0 flex-1 truncate text-text" title={q.title}>{q.title}</span>
                        <Badge variant="error" className="text-[10px]">Excluído</Badge>
                        <span className="text-xs text-muted">{q.questionsJson?.length || 0} questões</span>
                        <IconButton onClick={() => setRestoreTarget(q)} label="Restaurar" icon={<ArchiveRestore className="h-3.5 w-3.5" />} variant="success" size="sm" />
                      </div>
                    ))}
                  </div>
                  {pagination && pagination.totalPages > 1 && (
                    <Pagination
                      page={trashPage}
                      totalPages={pagination.totalPages}
                      total={pagination.total}
                      onPageChange={setTrashPage}
                    />
                  )}
                </>
              ) : (
                <p className="text-sm text-muted mt-2">A lixeira está vazia.</p>
              )}
            </>
          )}

          {panelMode === 'detail' && viewing && (
            <div className="mt-2 space-y-4 rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text">Detalhes da coletiva de imprensa</p>
                <Button size="sm" variant="secondary" onClick={() => setPanelMode('list')}>
                  Voltar para lista
                </Button>
              </div>
              <Input id="pqViewTitleInline" label="Título" value={viewing.title} readOnly />
              <Textarea id="pqViewDescInline" label="Descrição" value={viewing.description || ''} readOnly />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input id="pqViewAttemptsInline" label="Máximo de tentativas" value={String(viewing.maxAttempts)} readOnly />
                <Input id="pqViewScoreInline" label="Nota de aprovação (%)" value={String(viewing.passingScore)} readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text">Questões</p>
                {viewing.questionsJson && viewing.questionsJson.length > 0 ? (
                  <div className="space-y-2">
                    {viewing.questionsJson.map((question, index) => (
                      <div key={`${viewing.id}-question-inline-${index}`} className="rounded-lg border border-border bg-surface-2 p-3">
                        <p className="text-sm font-medium text-text">{index + 1}. {question.question}</p>
                        <ul className="mt-2 space-y-1">
                          {question.options.map((option, optionIndex) => (
                            <li
                              key={`${viewing.id}-question-inline-${index}-option-${optionIndex}`}
                              className={`text-sm ${optionIndex === question.correctIndex ? 'text-success' : 'text-muted'}`}
                            >
                              {optionIndex + 1}. {option}
                              {optionIndex === question.correctIndex ? ' (correta)' : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Nenhuma questão cadastrada.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Editar coletiva de imprensa' : 'Cadastrar coletiva de imprensa'} size="lg" footer={
        <><Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancelar</Button>
        <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} isLoading={createMut.isPending || updateMut.isPending}>{editing ? 'Salvar alterações' : 'Cadastrar'}</Button></>
      }>
        <div className="space-y-4">
          <Input id="pqTitle" label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea id="pqDesc" label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="block text-sm font-medium text-text">Questões</label>
          <QuizBuilder
            value={form.questions}
            onChange={(questions) => setForm({ ...form, questions })}
            footerActions={form.questions.length === 0 ? (
              <AIButton
                label="Gerar coletiva com IA"
                extraInputLabel="Instruções extras (opcional)"
                extraInputPlaceholder="Ex.: foco em teoria musical, dificuldade intermediária, questões sobre a letra..."
                onGenerate={(userExtra) => generateQuiz(buildQuizAiContext(userExtra))}
                onAccept={(raw) => {
                  try {
                    const parsed = JSON.parse(raw)
                    if (Array.isArray(parsed)) {
                      const validGenerated = parsed.filter((item): item is QuizQuestion => (
                        item &&
                        typeof item.question === 'string' &&
                        Array.isArray(item.options) &&
                        typeof item.correctIndex === 'number'
                      ))

                      const uniqueGenerated = validGenerated.filter((item) => (
                        !referenceQuestions.some((existingQuestion) => isQuestionDuplicate(item.question, existingQuestion.question))
                      ))

                      if (uniqueGenerated.length === 0) {
                        toast.error(`A IA gerou perguntas repetidas para esta ${trackLabelLower}. Tente novamente.`)
                        return
                      }

                      if (uniqueGenerated.length < validGenerated.length) {
                        toast('Algumas perguntas repetidas foram removidas automaticamente.')
                      }

                      setForm({ ...form, questions: uniqueGenerated })
                      return
                    }
                    toast.error('A IA não retornou uma lista de questões.')
                  } catch {
                    toast.error('Formato inválido retornado pela IA')
                  }
                }}
              />
            ) : (
              <AIButton
                label="Gerar 1 pergunta com IA"
                extraInputLabel="Instruções extras (opcional)"
                extraInputPlaceholder="Ex.: evitar teoria pura, focar aplicação prática..."
                onGenerate={(userExtra) => generateQuizQuestion(buildQuizAiContext(userExtra))}
                onAccept={(raw) => {
                  const generatedQuestion = parseGeneratedQuestion(raw)
                  if (!generatedQuestion) {
                    toast.error('Formato inválido retornado para pergunta.')
                    return
                  }
                  const alreadyExists = referenceQuestions.some((existingQuestion) => (
                    isQuestionDuplicate(generatedQuestion.question, existingQuestion.question)
                  ))
                  if (alreadyExists) {
                    toast.error(`Essa pergunta já existe (ou é muito parecida) nesta ${trackLabelLower}. Gere outra.`)
                    return
                  }
                  setForm({ ...form, questions: [...form.questions, generatedQuestion] })
                  toast.success('Pergunta adicionada com contexto das anteriores!')
                }}
              />
            )}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="pqAttempts" label="Máximo de tentativas" type="number" value={String(form.maxAttempts)} onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })} />
            <Input id="pqScore" label="Nota de aprovação (%)" type="number" value={String(form.passingScore)} onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })} />
          </div>
        </div>
      </Modal>
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} title="Desativar coletiva de imprensa" message={`Confirma a desativação de "${deleteTarget?.title}"?`} />
      <ConfirmModal isOpen={!!restoreTarget} onClose={() => setRestoreTarget(null)} onConfirm={() => restoreMut.mutate()} isLoading={restoreMut.isPending} title="Restaurar coletiva de imprensa" message={`Confirma a restauração de "${restoreTarget?.title}"?`} confirmLabel="Restaurar" />
    </div>
  )
}
