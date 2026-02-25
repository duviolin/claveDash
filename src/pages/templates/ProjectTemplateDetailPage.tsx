import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, GripVertical, Music, FileText, BookOpen, HelpCircle, ArchiveRestore, CheckCircle2, AlertTriangle, CircleDashed, RotateCw } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { Pagination } from '@/components/ui/Pagination'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { FileUpload } from '@/components/ui/FileUpload'
import { QuizBuilder } from '@/components/ui/QuizBuilder'
import { AIButton } from '@/components/ui/AIButton'
import { generatePublicationQualitativeAnalysis, generateQuiz } from '@/api/ai'
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
  getProjectTemplateReadiness,
  getProjectTemplateQualitativeAnalysis,
  listProjectTemplateReadinessRules,
  updateProjectTemplateReadinessRule,
  saveProjectTemplateQualitativeAnalysis,
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
  ProjectTemplateReadinessSummary,
  ProjectTemplateReadinessRule,
  ProjectTemplateQualitativeAnalysis,
} from '@/types'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const AUTO_PUBLICATION_ANALYSIS_MIN_INTERVAL_MS = 15000
const AUTO_PUBLICATION_ANALYSIS_DEBOUNCE_MS = 8000

export function ProjectTemplateDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [editingProject, setEditingProject] = useState(false)
  const [editingReadinessRules, setEditingReadinessRules] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: '', description: '', coverImage: '' })
  const [readinessRulesForm, setReadinessRulesForm] = useState<Record<string, { title: string; description: string; targetValue: string; weight: string; isActive: boolean }>>({})
  const [isGeneratingQualitativeFeedback, setIsGeneratingQualitativeFeedback] = useState(false)
  const [lastAutoAnalysisAt, setLastAutoAnalysisAt] = useState(0)
  const autoAnalysisRequestIdRef = useRef(0)
  const isAutoAnalysisInFlightRef = useRef(false)

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

  const { data: readiness } = useQuery({
    queryKey: ['project-template-readiness', slug],
    queryFn: () => getProjectTemplateReadiness(slug!),
    enabled: !!slug,
  })

  const { data: qualitativeAnalysis } = useQuery({
    queryKey: ['project-template-qualitative-analysis', slug],
    queryFn: () => getProjectTemplateQualitativeAnalysis(slug!),
    enabled: !!slug,
  })

  const { data: readinessRules = [] } = useQuery({
    queryKey: ['project-template-readiness-rules'],
    queryFn: () => listProjectTemplateReadinessRules(),
    enabled: user?.role === 'ADMIN',
  })

  useEffect(() => {
    if (!readinessRules.length) return
    setReadinessRulesForm((prev) => {
      const next = { ...prev }
      for (const rule of readinessRules) {
        next[rule.id] = {
          title: rule.title,
          description: rule.description || '',
          targetValue: String(rule.targetValue),
          weight: String(rule.weight),
          isActive: rule.isActive,
        }
      }
      return next
    })
  }, [readinessRules])

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
    mutationFn: () => updateProjectTemplate(slug!, { name: projectForm.name, description: projectForm.description || undefined, coverImage: projectForm.coverImage || undefined }),
    onSuccess: () => {
      toast.success('Template atualizado!')
      queryClient.invalidateQueries({ queryKey: ['project-template', slug] })
      setEditingProject(false)
    },
  })

  const saveReadinessRulesMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        readinessRules.map((rule) => {
          const form = readinessRulesForm[rule.id]
          if (!form) return Promise.resolve()

          const targetValue = Math.max(1, Number(form.targetValue) || 1)
          const weight = Math.max(1, Number(form.weight) || 1)

          return updateProjectTemplateReadinessRule(rule.id, {
            title: form.title,
            description: form.description.trim() || null,
            targetValue,
            weight,
            isActive: form.isActive,
          })
        })
      )
    },
    onSuccess: () => {
      toast.success('Critérios de publicação atualizados!')
      queryClient.invalidateQueries({ queryKey: ['project-template-readiness-rules'] })
      queryClient.invalidateQueries({ queryKey: ['project-template-readiness', slug] })
      setEditingReadinessRules(false)
    },
  })

  const buildPublicationAnalysisContext = (userExtra?: string) => {
    if (!template || !readiness) return null

    return {
      project: {
        name: template.name,
        type: template.type,
        description: template.description,
        version: template.version,
      },
      readiness: {
        scorePercentage: readiness.scorePercentage,
        statusLabel: readiness.statusLabel,
        isReady: readiness.isReady,
        metCount: readiness.metCount,
        totalCount: readiness.totalCount,
        trackCount: readiness.trackCount,
        quizCount: readiness.quizCount,
        materialCount: readiness.materialCount,
        studyTrackCount: readiness.studyTrackCount,
        missingTips: readiness.missingTips,
      },
      publicationCriteria: readiness.requirements.map((requirement) => ({
        title: requirement.title,
        description: requirement.description,
        targetValue: requirement.targetValue,
        actualValue: requirement.actualValue,
        isMet: requirement.isMet,
        isActive: true,
      })),
      userExtra,
    }
  }
  const qualitativeReadinessFeedback = qualitativeAnalysis?.analysis || ''
  const generatedForVersion = qualitativeAnalysis?.generatedForVersion ?? null
  const isQualitativeAnalysisStale = !template || generatedForVersion !== template.version

  const runQualitativeAnalysisGeneration = async (source: 'auto' | 'manual') => {
    if (!slug || !template || !readiness || isAutoAnalysisInFlightRef.current) return

    const context = buildPublicationAnalysisContext()
    if (!context) return

    const requestId = autoAnalysisRequestIdRef.current + 1
    autoAnalysisRequestIdRef.current = requestId
    isAutoAnalysisInFlightRef.current = true
    setLastAutoAnalysisAt(Date.now())
    setIsGeneratingQualitativeFeedback(true)

    try {
      const result = await generatePublicationQualitativeAnalysis(context)
      if (autoAnalysisRequestIdRef.current !== requestId) return

      await saveProjectTemplateQualitativeAnalysis(slug, {
        analysis: result,
        generatedForVersion: template.version,
      })
      if (autoAnalysisRequestIdRef.current !== requestId) return

      queryClient.invalidateQueries({ queryKey: ['project-template-qualitative-analysis', slug] })
      if (source === 'manual') toast.success('Avaliação da IA atualizada!')
    } catch (error: unknown) {
      if (autoAnalysisRequestIdRef.current !== requestId) return
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao gerar crítica.'
      toast.error(message)
    } finally {
      if (autoAnalysisRequestIdRef.current !== requestId) return
      isAutoAnalysisInFlightRef.current = false
      setIsGeneratingQualitativeFeedback(false)
    }
  }

  useEffect(() => {
    if (!slug || !template || !readiness) return
    if (!isQualitativeAnalysisStale || isAutoAnalysisInFlightRef.current) return

    const elapsed = Date.now() - lastAutoAnalysisAt
    const throttledDelay = elapsed >= AUTO_PUBLICATION_ANALYSIS_MIN_INTERVAL_MS
      ? 0
      : AUTO_PUBLICATION_ANALYSIS_MIN_INTERVAL_MS - elapsed
    const delay = Math.max(throttledDelay, AUTO_PUBLICATION_ANALYSIS_DEBOUNCE_MS)

    const timerId = window.setTimeout(() => {
      void runQualitativeAnalysisGeneration('auto')
    }, delay)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [isQualitativeAnalysisStale, lastAutoAnalysisAt, readiness, slug, template])

  useEffect(() => {
    autoAnalysisRequestIdRef.current += 1
    isAutoAnalysisInFlightRef.current = false
    setIsGeneratingQualitativeFeedback(false)
  }, [slug])

  if (!template) {
    return <PageContainer title="Carregando..."><div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div></PageContainer>
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
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={template.type === 'ALBUM' ? 'accent' : 'info'}>{template.type}</Badge>
          <Badge variant="default">v{template.version}</Badge>
          {user?.role === 'ADMIN' && (
            <Button size="sm" variant="secondary" onClick={() => setEditingReadinessRules(true)}>
              Critérios de Publicação
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => { setProjectForm({ name: template.name, description: template.description || '', coverImage: template.coverImage || '' }); setEditingProject(true) }}>
            <Pencil className="h-3.5 w-3.5" /> Editar Info
          </Button>
        </div>
      }
    >
      {template.description && <p className="text-sm text-muted -mt-4 mb-4">{template.description}</p>}
      {readiness && (
        <ProjectTemplateReadinessCard
          readiness={readiness}
          qualitativeReadinessFeedback={qualitativeReadinessFeedback}
          isGeneratingQualitativeFeedback={isGeneratingQualitativeFeedback}
          generatedForVersion={generatedForVersion}
          currentTemplateVersion={template.version}
          onRequestNewAnalysis={() => {
            void runQualitativeAnalysisGeneration('manual')
          }}
        />
      )}

      <TracksList projectTemplateSlug={slug!} projectTemplateId={template.id} tracks={tracks} template={template} />

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
            entityId={template?.id ?? 'draft'}
            currentValue={projectForm.coverImage || null}
            onUploadComplete={(key) => setProjectForm({ ...projectForm, coverImage: key })}
            onRemove={() => setProjectForm({ ...projectForm, coverImage: '' })}
            label="Imagem de Capa"
            compact
          />
        </div>
      </Modal>

      <Modal
        isOpen={editingReadinessRules}
        onClose={() => setEditingReadinessRules(false)}
        title="Critérios de publicação (somente admin)"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingReadinessRules(false)}>Cancelar</Button>
            <Button onClick={() => saveReadinessRulesMutation.mutate()} isLoading={saveReadinessRulesMutation.isPending}>Salvar critérios</Button>
          </>
        }
      >
        <div className="space-y-3">
          {readinessRules.map((rule: ProjectTemplateReadinessRule) => {
            const form = readinessRulesForm[rule.id] ?? {
              title: rule.title,
              description: rule.description || '',
              targetValue: String(rule.targetValue),
              weight: String(rule.weight),
              isActive: rule.isActive,
            }

            return (
              <div key={rule.id} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    id={`rule-title-${rule.id}`}
                    label="Título"
                    value={form.title}
                    onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, title: e.target.value } }))}
                  />
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm text-text">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, isActive: e.target.checked } }))}
                      />
                      Regra ativa
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Textarea
                    id={`rule-description-${rule.id}`}
                    label="Critério de avaliação para IA (editável pelo admin)"
                    value={form.description}
                    onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, description: e.target.value } }))}
                    placeholder="Ex.: Avaliar se a progressão didática da faixa está clara e contextualizada para o aluno."
                  />
                  <Input
                    id={`rule-target-${rule.id}`}
                    label="Meta mínima"
                    type="number"
                    min={1}
                    value={form.targetValue}
                    onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, targetValue: e.target.value } }))}
                  />
                  <Input
                    id={`rule-weight-${rule.id}`}
                    label="Peso no score"
                    type="number"
                    min={1}
                    value={form.weight}
                    onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, weight: e.target.value } }))}
                  />
                </div>
                {rule.description && <p className="mt-2 text-xs text-muted">{rule.description}</p>}
              </div>
            )
          })}
        </div>
      </Modal>
    </PageContainer>
  )
}

function ProjectTemplateReadinessCard({
  readiness,
  qualitativeReadinessFeedback,
  isGeneratingQualitativeFeedback,
  generatedForVersion,
  currentTemplateVersion,
  onRequestNewAnalysis,
}: {
  readiness: ProjectTemplateReadinessSummary
  qualitativeReadinessFeedback: string
  isGeneratingQualitativeFeedback: boolean
  generatedForVersion: number | null
  currentTemplateVersion: number
  onRequestNewAnalysis: () => void
}) {
  const { scorePercentage, statusLabel, isReady, metCount, totalCount, missingTips, trackCount, quizCount, materialCount, studyTrackCount } = readiness
  const isOutdated = generatedForVersion == null || generatedForVersion !== currentTemplateVersion

  const statusVariant = isReady ? 'success' : scorePercentage >= 70 ? 'warning' : 'error'
  const statusIcon = isReady ? <CheckCircle2 className="h-4 w-4" /> : scorePercentage >= 70 ? <AlertTriangle className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />

  return (
    <div className="mb-4 rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text">Aptidão para publicação</p>
          <p className="text-xs text-muted">A barra considera os requisitos pedagógicos ativos definidos pela coordenação.</p>
        </div>
        <Badge variant={statusVariant} className="flex items-center gap-1.5">
          {statusIcon}
          {statusLabel}
        </Badge>
      </div>

      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${Math.max(0, Math.min(scorePercentage, 100))}%` }} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>{scorePercentage}% concluído</span>
        <span>•</span>
        <span>{metCount}/{totalCount} requisitos atendidos</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface-2 px-2 py-1.5">Faixas: <span className="font-semibold text-text">{trackCount}</span></div>
        <div className="rounded-lg border border-border bg-surface-2 px-2 py-1.5">Quizzes: <span className="font-semibold text-text">{quizCount}</span></div>
        <div className="rounded-lg border border-border bg-surface-2 px-2 py-1.5">Materiais: <span className="font-semibold text-text">{materialCount}</span></div>
        <div className="rounded-lg border border-border bg-surface-2 px-2 py-1.5">Trilhas: <span className="font-semibold text-text">{studyTrackCount}</span></div>
      </div>

      {missingTips.length > 0 && (
        <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
          <p className="text-xs font-semibold uppercase text-warning">O que falta para publicar</p>
          <ul className="mt-1 space-y-1 text-sm text-text">
            {missingTips.map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}

      {(qualitativeReadinessFeedback || isOutdated) && (
        <div className="mt-3 rounded-lg border border-info/30 bg-info/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-info">Crítica construtiva da IA (orientativa)</p>
            <div className="flex items-center gap-2">
              {isOutdated && (
                <Badge variant="warning" className="text-[10px]">
                  Desatualizada (v{generatedForVersion ?? 0} → v{currentTemplateVersion})
                </Badge>
              )}
              <Button size="sm" variant="ghost" onClick={onRequestNewAnalysis} isLoading={isGeneratingQualitativeFeedback}>
                <RotateCw className="h-3.5 w-3.5" /> Gerar nova avaliação
              </Button>
            </div>
          </div>
          {qualitativeReadinessFeedback ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-text">{qualitativeReadinessFeedback}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">A avaliação ainda não foi gerada para esta versão.</p>
          )}
        </div>
      )}

      {isGeneratingQualitativeFeedback && (
        <p className="mt-3 text-xs text-muted">Atualizando crítica construtiva da IA automaticamente...</p>
      )}
    </div>
  )
}

// ---- Tracks List ----
function TracksList({ projectTemplateSlug, projectTemplateId, tracks, template }: { projectTemplateSlug: string; projectTemplateId: string; tracks: TrackSceneTemplate[]; template?: ProjectTemplate }) {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null)
  const [editingTrack, setEditingTrack] = useState<TrackSceneTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrackSceneTemplate | null>(null)
  const [blockedInfo, setBlockedInfo] = useState<{ name: string; slug: string; details: DeactivationErrorDetails } | null>(null)
  const [form, setForm] = useState({ title: '', artist: '', description: '', technicalInstruction: '', lyrics: '', unlockAfterTrackId: '' })

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order)
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
      toast.success('Faixa criada!')
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
      toast.success('Faixa atualizada!')
      queryClient.invalidateQueries({ queryKey: ['track-templates', projectTemplateSlug] })
      await refreshTemplateVersion()
      setEditingTrack(null)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTrackTemplate(deleteTarget!.id),
    onSuccess: async () => {
      toast.success('Faixa desativada!')
      queryClient.invalidateQueries({ queryKey: ['track-templates', projectTemplateSlug] })
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
            <span className="min-w-0 flex-1 truncate font-medium text-text" title={track.title}>{track.title}</span>
            {track.artist && <span className="max-w-40 truncate text-sm text-muted sm:max-w-56" title={track.artist}>{track.artist}</span>}
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

              <MaterialsSection trackTemplateId={track.id} projectTemplateSlug={projectTemplateSlug} />
              <StudyTracksSection trackTemplateId={track.id} projectTemplateSlug={projectTemplateSlug} />
              <PressQuizzesSection trackTemplateId={track.id} projectTemplateSlug={projectTemplateSlug} track={track} template={template} />
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
        parentSlug={blockedInfo?.slug ?? ''}
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
function MaterialsSection({ trackTemplateId, projectTemplateSlug }: { trackTemplateId: string; projectTemplateSlug: string }) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('active')
  const [modalOpen, setModalOpen] = useState(false)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text flex items-center gap-1.5"><FileText className="h-4 w-4 text-info" /> Materiais ({materials.length})</h3>
        {!isTrash && <Button size="sm" variant="ghost" onClick={openCreate}><Plus className="h-3.5 w-3.5" /></Button>}
      </div>

      <Tabs
        tabs={[
          { key: 'active', label: 'Ativos', count: materials.length },
          { key: 'TRASH', label: 'Lixeira', count: deletedMaterials.length },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {!isTrash && (
        <>
          {materials.length > 0 ? (
            <div className="space-y-1 mt-2">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                  <Badge variant={TRACK_MATERIAL_TYPE_VARIANT[m.type]} className="text-[10px]">{TRACK_MATERIAL_TYPE_LABELS[m.type]}</Badge>
                  <span className="min-w-0 flex-1 truncate text-text" title={m.title}>{m.title}</span>
                  <button onClick={() => openEdit(m)} className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-2 hover:text-text cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(m)} className="rounded-lg p-1 text-muted transition-colors hover:bg-error/10 hover:text-error cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mt-2">Nenhum material ativo</p>
          )}
        </>
      )}

      {isTrash && (
        <>
          {deletedMaterials.length > 0 ? (
            <div className="space-y-1 mt-2">
              {deletedMaterials.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                  <Badge variant={TRACK_MATERIAL_TYPE_VARIANT[m.type]} className="text-[10px]">{TRACK_MATERIAL_TYPE_LABELS[m.type]}</Badge>
                  <span className="min-w-0 flex-1 truncate text-text" title={m.title}>{m.title}</span>
                  <Badge variant="error" className="text-[10px]">Excluído</Badge>
                  <button onClick={() => setRestoreTarget(m)} className="rounded-lg p-1 text-muted transition-colors hover:bg-success/10 hover:text-success cursor-pointer" title="Restaurar"><ArchiveRestore className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mt-2">A lixeira está vazia</p>
          )}
        </>
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
              compact
            />
          )}
          {form.type === 'LINK' && <Input id="matUrl" label="URL do Link" value={form.defaultContentUrl} onChange={(e) => setForm({ ...form, defaultContentUrl: e.target.value })} placeholder="https://..." />}
          {form.type === 'TEXT' && <Textarea id="matText" label="Conteúdo" value={form.defaultTextContent} onChange={(e) => setForm({ ...form, defaultTextContent: e.target.value })} />}
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} title="Desativar Material" message={`Desativar "${deleteTarget?.title}"?`} />
      <ConfirmModal isOpen={!!restoreTarget} onClose={() => setRestoreTarget(null)} onConfirm={() => restoreMut.mutate()} isLoading={restoreMut.isPending} title="Restaurar Material" message={`Restaurar "${restoreTarget?.title}"?`} confirmLabel="Restaurar" />
    </div>
  )
}

// ---- Study Tracks Section ----
function StudyTracksSection({ trackTemplateId, projectTemplateSlug }: { trackTemplateId: string; projectTemplateSlug: string }) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('active')
  const [trashPage, setTrashPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
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
      toast.success('Trilha criada!')
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
      toast.success('Trilha atualizada!')
      queryClient.invalidateQueries({ queryKey: ['study-track-templates', trackTemplateId] })
      await refreshTemplateVersion()
      setEditing(null)
      setModalOpen(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteStudyTrackTemplate(deleteTarget!.id),
    onSuccess: async () => {
      toast.success('Trilha desativada!')
      queryClient.invalidateQueries({ queryKey: ['study-track-templates', trackTemplateId] })
      queryClient.invalidateQueries({ queryKey: ['study-track-templates', 'deleted', trackTemplateId] })
      await refreshTemplateVersion()
      setDeleteTarget(null)
    },
  })

  const restoreMut = useMutation({
    mutationFn: () => restoreStudyTrackTemplate(restoreTarget!.id),
    onSuccess: async () => {
      toast.success('Trilha restaurada!')
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
        <h3 className="text-sm font-semibold text-text flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-success" /> Trilhas de Estudo ({studyTracks.length})</h3>
        {!isTrash && <Button size="sm" variant="ghost" onClick={openCreate}><Plus className="h-3.5 w-3.5" /></Button>}
      </div>

      <Tabs
        tabs={[
          { key: 'active', label: 'Ativas', count: studyTracks.length },
          { key: 'TRASH', label: 'Lixeira', count: pagination?.total ?? deletedStudyTracks.length },
        ]}
        activeKey={activeTab}
        onChange={(key) => { setActiveTab(key); setTrashPage(1) }}
      />

      {!isTrash && (
        <>
          {studyTracks.length > 0 ? (
            <div className="space-y-1 mt-2">
              {studyTracks.map((st) => (
                <div key={st.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                  <span className="min-w-0 flex-1 truncate text-text" title={st.title}>{st.title}</span>
                  <button onClick={() => openEdit(st)} className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-2 hover:text-text cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(st)} className="rounded-lg p-1 text-muted transition-colors hover:bg-error/10 hover:text-error cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mt-2">Nenhuma trilha ativa</p>
          )}
        </>
      )}

      {isTrash && (
        <>
          {deletedStudyTracks.length > 0 ? (
            <>
              <div className="space-y-1 mt-2">
                {deletedStudyTracks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                    <span className="min-w-0 flex-1 truncate text-text" title={st.title}>{st.title}</span>
                    <Badge variant="error" className="text-[10px]">Excluído</Badge>
                    <button onClick={() => setRestoreTarget(st)} className="rounded-lg p-1 text-muted transition-colors hover:bg-success/10 hover:text-success cursor-pointer" title="Restaurar"><ArchiveRestore className="h-3.5 w-3.5" /></button>
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
            <p className="text-sm text-muted mt-2">A lixeira está vazia</p>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Editar Trilha' : 'Criar Trilha'} size="lg" footer={
        <><Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancelar</Button>
        <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} isLoading={createMut.isPending || updateMut.isPending}>{editing ? 'Salvar' : 'Criar'}</Button></>
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

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} title="Desativar Trilha" message={`Desativar "${deleteTarget?.title}"?`} />
      <ConfirmModal isOpen={!!restoreTarget} onClose={() => setRestoreTarget(null)} onConfirm={() => restoreMut.mutate()} isLoading={restoreMut.isPending} title="Restaurar Trilha" message={`Restaurar "${restoreTarget?.title}"?`} confirmLabel="Restaurar" />
    </div>
  )
}

const QUIZ_TRASH_PAGE_LIMIT = 20
const STUDY_TRACK_TRASH_PAGE_LIMIT = 20

// ---- Press Quizzes Section ----
function PressQuizzesSection({ trackTemplateId, projectTemplateSlug, track, template }: { trackTemplateId: string; projectTemplateSlug: string; track: TrackSceneTemplate; template?: ProjectTemplate }) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('active')
  const [trashPage, setTrashPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PressQuizTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PressQuizTemplate | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<PressQuizTemplate | null>(null)
  const [form, setForm] = useState({ title: '', description: '', questions: [] as QuizQuestion[], maxAttempts: 3, passingScore: 70 })
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
      toast.success('Quiz criado!')
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
      toast.success('Quiz atualizado!')
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', trackTemplateId] })
      await refreshTemplateVersion()
      setEditing(null)
      setModalOpen(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => deletePressQuizTemplate(deleteTarget!.id),
    onSuccess: async () => {
      toast.success('Quiz desativado!')
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', trackTemplateId] })
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', 'deleted', trackTemplateId] })
      await refreshTemplateVersion()
      setDeleteTarget(null)
    },
  })

  const restoreMut = useMutation({
    mutationFn: () => restorePressQuizTemplate(restoreTarget!.id),
    onSuccess: async () => {
      toast.success('Quiz restaurado!')
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', trackTemplateId] })
      queryClient.invalidateQueries({ queryKey: ['press-quiz-templates', 'deleted', trackTemplateId] })
      await refreshTemplateVersion()
      setRestoreTarget(null)
    },
  })

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', questions: [], maxAttempts: 3, passingScore: 70 }); setModalOpen(true) }
  const openEdit = (q: PressQuizTemplate) => { setEditing(q); setForm({ title: q.title, description: q.description || '', questions: q.questionsJson || [], maxAttempts: q.maxAttempts, passingScore: q.passingScore }); setModalOpen(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-warning" /> Quizzes</h3>
        {!isTrash && <Button size="sm" variant="ghost" onClick={openCreate}><Plus className="h-3.5 w-3.5" /></Button>}
      </div>

      <Tabs
        tabs={[
          { key: 'active', label: 'Ativos', count: quizzes.length },
          { key: 'TRASH', label: 'Lixeira', count: pagination?.total ?? deletedQuizzes.length },
        ]}
        activeKey={activeTab}
        onChange={(key) => { setActiveTab(key); setTrashPage(1) }}
      />

      {!isTrash && (
        <>
          {quizzes.length > 0 ? (
            <div className="space-y-1 mt-2">
              {quizzes.map((q) => (
                <div key={q.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                  <span className="min-w-0 flex-1 truncate text-text" title={q.title}>{q.title}</span>
                  <span className="text-xs text-muted">{q.questionsJson?.length || 0} questões</span>
                  <span className="text-xs text-muted">{q.passingScore}%</span>
                  <button onClick={() => openEdit(q)} className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-2 hover:text-text cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(q)} className="rounded-lg p-1 text-muted transition-colors hover:bg-error/10 hover:text-error cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
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
          {deletedQuizzes.length > 0 ? (
            <>
              <div className="space-y-1 mt-2">
                {deletedQuizzes.map((q) => (
                  <div key={q.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-surface-2/50">
                    <span className="min-w-0 flex-1 truncate text-text" title={q.title}>{q.title}</span>
                    <Badge variant="error" className="text-[10px]">Excluído</Badge>
                    <span className="text-xs text-muted">{q.questionsJson?.length || 0} questões</span>
                    <button onClick={() => setRestoreTarget(q)} className="rounded-lg p-1 text-muted transition-colors hover:bg-success/10 hover:text-success cursor-pointer" title="Restaurar"><ArchiveRestore className="h-3.5 w-3.5" /></button>
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
            <p className="text-sm text-muted mt-2">A lixeira está vazia</p>
          )}
        </>
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
              extraInputLabel="Instruções extras (opcional)"
              extraInputPlaceholder="Ex.: foco em teoria musical, dificuldade intermediária, questões sobre a letra..."
              onGenerate={(userExtra) => generateQuiz({
                title: form.title || track.title,
                description: form.description,
                count: 5,
                project: template ? { name: template.name, type: template.type, description: template.description } : undefined,
                track: { title: track.title, artist: track.artist, description: track.description, technicalInstruction: track.technicalInstruction, lyrics: track.lyrics },
                materials: materials.map((m) => ({ title: m.title, type: m.type })),
                studyTracks: studyTracks.map((st) => ({ title: st.title, description: st.description, technicalNotes: st.technicalNotes })),
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
            <Input id="pqAttempts" label="Máximo de tentativas" type="number" value={String(form.maxAttempts)} onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })} />
            <Input id="pqScore" label="Nota de aprovação (%)" type="number" value={String(form.passingScore)} onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })} />
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} title="Desativar Quiz" message={`Desativar "${deleteTarget?.title}"?`} />
      <ConfirmModal isOpen={!!restoreTarget} onClose={() => setRestoreTarget(null)} onConfirm={() => restoreMut.mutate()} isLoading={restoreMut.isPending} title="Restaurar Quiz" message={`Restaurar "${restoreTarget?.title}"?`} confirmLabel="Restaurar" />
    </div>
  )
}
