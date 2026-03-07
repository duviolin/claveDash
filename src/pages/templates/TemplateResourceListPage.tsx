import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArchiveRestore, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingState } from '@/components/ui/LoadingState'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import { Tabs } from '@/components/ui/Tabs'
import { Pagination } from '@/components/ui/Pagination'
import {
  createTrackTemplate,
  deleteTrackTemplate,
  listMaterialTemplates,
  listDeletedTrackTemplates,
  listPressQuizTemplates,
  listProjectTemplates,
  listStudyTrackTemplates,
  listTrackTemplates,
  restoreTrackTemplate,
  updateTrackTemplate,
} from '@/api/templates'
import { TRACK_MATERIAL_TYPE_LABELS, TRACK_MATERIAL_TYPE_VARIANT } from '@/lib/constants'
import type {
  PressQuizTemplate,
  ProjectTemplate,
  StudyTrackTemplate,
  TrackMaterialTemplate,
  TrackSceneTemplate,
} from '@/types'
import toast from 'react-hot-toast'
import { useDeactivationBlockedHandler } from '@/hooks/useDeactivationBlockedHandler'

type ResourceMode = 'tracks' | 'materials' | 'study-tracks' | 'press-quizzes'

interface TrackRow {
  project: ProjectTemplate
  track: TrackSceneTemplate
}

interface MaterialRow {
  project: ProjectTemplate
  track: TrackSceneTemplate
  material: TrackMaterialTemplate
}

interface StudyTrackRow {
  project: ProjectTemplate
  track: TrackSceneTemplate
  studyTrack: StudyTrackTemplate
}

interface QuizRow {
  project: ProjectTemplate
  track: TrackSceneTemplate
  quiz: PressQuizTemplate
}

interface TrackGroup {
  project: ProjectTemplate
  tracks: TrackSceneTemplate[]
}

interface TrackTrashRow {
  project: ProjectTemplate | null
  track: TrackSceneTemplate
}

const TRACK_TRASH_PAGE_LIMIT = 20

function useTemplateContext() {
  const [searchParams, setSearchParams] = useSearchParams()
  const projectSlug = searchParams.get('projectSlug') ?? ''
  const trackSlug = searchParams.get('trackSlug') ?? ''

  const setProjectSlug = (nextSlug: string) => {
    const next = new URLSearchParams(searchParams)
    if (nextSlug) {
      next.set('projectSlug', nextSlug)
    } else {
      next.delete('projectSlug')
    }
    next.delete('trackSlug')
    setSearchParams(next)
  }

  const setTrackSlug = (nextTrackSlug: string) => {
    const next = new URLSearchParams(searchParams)
    if (nextTrackSlug) {
      next.set('trackSlug', nextTrackSlug)
    } else {
      next.delete('trackSlug')
    }
    setSearchParams(next)
  }

  return { projectSlug, trackSlug, setProjectSlug, setTrackSlug }
}

function pageTitle(mode: ResourceMode) {
  if (mode === 'tracks') return 'Faixas'
  if (mode === 'materials') return 'Materiais'
  if (mode === 'study-tracks') return 'Trilhas'
  return 'Quizzes'
}

function emptyMessage(mode: ResourceMode, hasContext: boolean) {
  if (hasContext) {
    if (mode === 'tracks') return 'Nenhuma faixa encontrada para este projeto.'
    if (mode === 'materials') return 'Nenhum material encontrado para este projeto.'
    if (mode === 'study-tracks') return 'Nenhuma trilha encontrada para este projeto.'
    return 'Nenhum quiz encontrado para este projeto.'
  }

  if (mode === 'tracks') return 'Nenhuma faixa encontrada.'
  if (mode === 'materials') return 'Nenhum material encontrado.'
  if (mode === 'study-tracks') return 'Nenhuma trilha encontrada.'
  return 'Nenhum quiz encontrado.'
}

function ResourceListPage({ mode }: { mode: ResourceMode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { projectSlug, trackSlug, setProjectSlug, setTrackSlug } = useTemplateContext()
  const [tracksTab, setTracksTab] = useState<'active' | 'TRASH'>('active')
  const [trashPage, setTrashPage] = useState(1)
  const isTracksTrash = mode === 'tracks' && tracksTab === 'TRASH'
  const [createTrackOpen, setCreateTrackOpen] = useState(false)
  const [editingTrack, setEditingTrack] = useState<TrackRow | null>(null)
  const [deleteTargetTrack, setDeleteTargetTrack] = useState<TrackRow | null>(null)
  const [restoreTargetTrack, setRestoreTargetTrack] = useState<TrackTrashRow | null>(null)
  const [trackForm, setTrackForm] = useState({
    projectTemplateId: '',
    title: '',
    artist: '',
    description: '',
    technicalInstruction: '',
    lyrics: '',
    unlockAfterTrackId: '',
  })
  const { blockedInfo, setBlockedInfo, handleBlockedError } = useDeactivationBlockedHandler()

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['project-templates'],
    queryFn: () => listProjectTemplates(),
  })

  const selectedProject = projectSlug ? projects.find((project) => project.slug === projectSlug) ?? null : null
  const scopedProjects = projectSlug ? projects.filter((project) => project.slug === projectSlug) : projects

  const tracksQueries = useQueries({
    queries: scopedProjects.map((project) => ({
      queryKey: ['resource-list-tracks', project.slug],
      queryFn: () => listTrackTemplates(project.id),
      enabled: mode === 'tracks' && !isTracksTrash,
    })),
  })

  const isLoadingTracks = tracksQueries.some((query) => query.isLoading)

  const trackRows = useMemo<TrackRow[]>(() => {
    return scopedProjects
      .flatMap((project, index) => {
        const tracks = tracksQueries[index]?.data ?? []
        return tracks.map((track) => ({ project, track }))
      })
      .sort((a, b) => a.project.name.localeCompare(b.project.name) || a.track.order - b.track.order)
  }, [scopedProjects, tracksQueries])

  const filteredTrackRows = useMemo(() => {
    if (!trackSlug) return trackRows
    return trackRows.filter((row) => row.track.slug === trackSlug)
  }, [trackRows, trackSlug])

  const trackGroups = useMemo<TrackGroup[]>(() => {
    const groups = new Map<string, TrackGroup>()

    filteredTrackRows.forEach(({ project, track }) => {
      const existingGroup = groups.get(project.id)
      if (existingGroup) {
        existingGroup.tracks.push(track)
      } else {
        groups.set(project.id, { project, tracks: [track] })
      }
    })

    return Array.from(groups.values()).map((group) => ({
      ...group,
      tracks: [...group.tracks].sort((a, b) => a.order - b.order),
    }))
  }, [filteredTrackRows])

  const { data: deletedTracksResponse } = useQuery({
    queryKey: ['resource-list-tracks', 'deleted', trashPage],
    queryFn: () => listDeletedTrackTemplates({ page: trashPage, limit: TRACK_TRASH_PAGE_LIMIT }),
    enabled: isTracksTrash,
  })

  const deletedTrackRows = useMemo<TrackTrashRow[]>(() => {
    const deletedTracks = deletedTracksResponse?.data ?? []
    return deletedTracks
      .map((track) => {
        const project = projects.find((item) => item.id === track.projectTemplateId) ?? null
        return { project, track }
      })
      .filter((row) => {
        if (!projectSlug) return true
        return row.project?.slug === projectSlug
      })
  }, [deletedTracksResponse?.data, projects, projectSlug])

  const availableTrackOptions = useMemo(() => {
    const sourceRows = projectSlug
      ? trackRows.filter((row) => row.project.slug === projectSlug)
      : trackRows
    return sourceRows
      .map((row) => row.track)
      .sort((a, b) => a.order - b.order)
      .map((track) => ({ value: track.slug, label: `${track.order}. ${track.title}` }))
  }, [projectSlug, trackRows])

  const materialQueries = useQueries({
    queries:
      mode === 'materials'
        ? trackRows.map(({ track }) => ({
            queryKey: ['resource-list-materials', track.id],
            queryFn: () => listMaterialTemplates(track.id),
          }))
        : [],
  })

  const studyTrackQueries = useQueries({
    queries:
      mode === 'study-tracks'
        ? trackRows.map(({ track }) => ({
            queryKey: ['resource-list-study-tracks', track.id],
            queryFn: () => listStudyTrackTemplates(track.id),
          }))
        : [],
  })

  const quizQueries = useQueries({
    queries:
      mode === 'press-quizzes'
        ? trackRows.map(({ track }) => ({
            queryKey: ['resource-list-press-quizzes', track.id],
            queryFn: () => listPressQuizTemplates(track.id),
          }))
        : [],
  })

  const materialRows = useMemo<MaterialRow[]>(() => {
    if (mode !== 'materials') return []

    return trackRows
      .flatMap((trackRow, index) => {
        const materials = materialQueries[index]?.data ?? []
        return materials.map((material) => ({ ...trackRow, material }))
      })
      .sort(
        (a, b) =>
          a.project.name.localeCompare(b.project.name) ||
          a.track.order - b.track.order ||
          a.material.order - b.material.order
      )
  }, [mode, trackRows, materialQueries])

  const studyTrackRows = useMemo<StudyTrackRow[]>(() => {
    if (mode !== 'study-tracks') return []

    return trackRows
      .flatMap((trackRow, index) => {
        const studyTracks = studyTrackQueries[index]?.data ?? []
        return studyTracks.map((studyTrack) => ({ ...trackRow, studyTrack }))
      })
      .sort(
        (a, b) =>
          a.project.name.localeCompare(b.project.name) ||
          a.track.order - b.track.order ||
          a.studyTrack.order - b.studyTrack.order
      )
  }, [mode, trackRows, studyTrackQueries])

  const quizRows = useMemo<QuizRow[]>(() => {
    if (mode !== 'press-quizzes') return []

    return trackRows
      .flatMap((trackRow, index) => {
        const quizzes = quizQueries[index]?.data ?? []
        return quizzes.map((quiz) => ({ ...trackRow, quiz }))
      })
      .sort((a, b) => a.project.name.localeCompare(b.project.name) || a.track.order - b.track.order)
  }, [mode, trackRows, quizQueries])

  const isLoadingChildren =
    (mode === 'materials' && materialQueries.some((query) => query.isLoading)) ||
    (mode === 'study-tracks' && studyTrackQueries.some((query) => query.isLoading)) ||
    (mode === 'press-quizzes' && quizQueries.some((query) => query.isLoading))

  const isLoading = isLoadingProjects || isLoadingTracks || isLoadingChildren

  const saveTrackMutation = useMutation({
    mutationFn: () => updateTrackTemplate(editingTrack!.track.id, {
      title: trackForm.title,
      artist: trackForm.artist.trim() ? trackForm.artist : null,
      description: trackForm.description.trim() ? trackForm.description : null,
      technicalInstruction: trackForm.technicalInstruction.trim() ? trackForm.technicalInstruction : null,
      lyrics: trackForm.lyrics.trim() ? trackForm.lyrics : null,
      unlockAfterTrackId: trackForm.unlockAfterTrackId || null,
    }),
    onSuccess: () => {
      toast.success('Faixa atualizada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-tracks'] })
      setEditingTrack(null)
    },
  })

  const createTrackMutation = useMutation({
    mutationFn: () =>
      createTrackTemplate(trackForm.projectTemplateId, {
        title: trackForm.title,
        artist: trackForm.artist.trim() ? trackForm.artist : undefined,
        description: trackForm.description.trim() ? trackForm.description : undefined,
        technicalInstruction: trackForm.technicalInstruction.trim() ? trackForm.technicalInstruction : undefined,
        lyrics: trackForm.lyrics.trim() ? trackForm.lyrics : undefined,
        unlockAfterTrackId: trackForm.unlockAfterTrackId || undefined,
      }),
    onSuccess: () => {
      toast.success('Faixa cadastrada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-tracks'] })
      setCreateTrackOpen(false)
      setTrackForm({
        projectTemplateId: selectedProject?.id ?? '',
        title: '',
        artist: '',
        description: '',
        technicalInstruction: '',
        lyrics: '',
        unlockAfterTrackId: '',
      })
    },
  })

  const deleteTrackMutation = useMutation({
    mutationFn: () => deleteTrackTemplate(deleteTargetTrack!.track.id),
    onSuccess: () => {
      toast.success('Faixa desativada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-tracks'] })
      queryClient.invalidateQueries({ queryKey: ['resource-list-tracks', 'deleted'] })
      setDeleteTargetTrack(null)
    },
    onError: (error: unknown) => {
      if (deleteTargetTrack) {
        handleBlockedError(error, { name: deleteTargetTrack.track.title, slug: deleteTargetTrack.project.slug })
      }
      setDeleteTargetTrack(null)
    },
  })

  const restoreTrackMutation = useMutation({
    mutationFn: () => restoreTrackTemplate(restoreTargetTrack!.track.id),
    onSuccess: () => {
      toast.success('Faixa restaurada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-tracks'] })
      queryClient.invalidateQueries({ queryKey: ['resource-list-tracks', 'deleted'] })
      setRestoreTargetTrack(null)
    },
  })

  const trackTrashColumns = [
    {
      key: 'project',
      header: 'Projeto',
      render: (row: TrackTrashRow) => (
        <span className="font-medium text-text">{row.project?.name || 'Projeto não encontrado'}</span>
      ),
    },
    {
      key: 'track',
      header: 'Faixa',
      render: (row: TrackTrashRow) => (
        <div className="flex items-center gap-2">
          <span className="text-text">{row.track.title}</span>
          <Badge variant="error" className="text-[10px]">Excluída</Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row: TrackTrashRow) => (
        <IconButton
          label="Restaurar faixa"
          icon={<ArchiveRestore className="h-4 w-4" />}
          variant="success"
          onClick={() => setRestoreTargetTrack(row)}
        />
      ),
    },
  ]

  const availablePrerequisiteTrackOptions = useMemo(() => {
    const selectedProjectTracks = trackRows.filter((row) => row.project.id === trackForm.projectTemplateId)
    const filtered = selectedProjectTracks.filter((row) => row.track.id !== editingTrack?.track.id)
    return filtered
      .sort((a, b) => a.track.order - b.track.order)
      .map((row) => ({
        value: row.track.id,
        label: `${row.track.order}. ${row.track.title}`,
      }))
  }, [trackRows, trackForm.projectTemplateId, editingTrack?.track.id])

  const materialsColumns = [
    {
      key: 'project',
      header: 'Projeto',
      render: (row: MaterialRow) => <span className="font-medium text-text">{row.project.name}</span>,
    },
    {
      key: 'track',
      header: 'Faixa',
      render: (row: MaterialRow) => <span className="text-text">{row.track.title}</span>,
    },
    {
      key: 'material',
      header: 'Material',
      render: (row: MaterialRow) => (
        <div className="flex items-center gap-2">
          <span className="text-text">{row.material.title}</span>
          <Badge variant={TRACK_MATERIAL_TYPE_VARIANT[row.material.type]} className="text-[10px]">
            {TRACK_MATERIAL_TYPE_LABELS[row.material.type]}
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row: MaterialRow) => (
        <IconButton
          label="Ver materiais do projeto"
          icon={<Eye className="h-4 w-4" />}
          onClick={() => navigate(`/templates/materials?projectSlug=${row.project.slug}`)}
        />
      ),
    },
  ]

  const studyTracksColumns = [
    {
      key: 'project',
      header: 'Projeto',
      render: (row: StudyTrackRow) => <span className="font-medium text-text">{row.project.name}</span>,
    },
    {
      key: 'track',
      header: 'Faixa',
      render: (row: StudyTrackRow) => <span className="text-text">{row.track.title}</span>,
    },
    {
      key: 'studyTrack',
      header: 'Trilha',
      render: (row: StudyTrackRow) => <span className="text-text">{row.studyTrack.title}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row: StudyTrackRow) => (
        <IconButton
          label="Ver trilhas do projeto"
          icon={<Eye className="h-4 w-4" />}
          onClick={() => navigate(`/templates/study-tracks?projectSlug=${row.project.slug}`)}
        />
      ),
    },
  ]

  const quizzesColumns = [
    {
      key: 'project',
      header: 'Projeto',
      render: (row: QuizRow) => <span className="font-medium text-text">{row.project.name}</span>,
    },
    {
      key: 'track',
      header: 'Faixa',
      render: (row: QuizRow) => <span className="text-text">{row.track.title}</span>,
    },
    {
      key: 'quiz',
      header: 'Quiz',
      render: (row: QuizRow) => (
        <div className="flex flex-col">
          <span className="text-text">{row.quiz.title}</span>
          <span className="text-xs text-muted">{row.quiz.questionsJson?.length ?? 0} questões</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row: QuizRow) => (
        <IconButton
          label="Ver quizzes do projeto"
          icon={<Eye className="h-4 w-4" />}
          onClick={() => navigate(`/templates/press-quizzes?projectSlug=${row.project.slug}`)}
        />
      ),
    },
  ]

  return (
    <PageContainer
      title={selectedProject ? `${pageTitle(mode)} - ${selectedProject.name}` : pageTitle(mode)}
      count={
        mode === 'tracks'
          ? (isTracksTrash ? (deletedTracksResponse?.pagination.total ?? deletedTrackRows.length) : trackRows.length)
          : mode === 'materials'
            ? materialRows.length
            : mode === 'study-tracks'
              ? studyTrackRows.length
              : quizRows.length
      }
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <Select
            value={projectSlug}
            onChange={(event) => setProjectSlug(event.target.value)}
            placeholder="Todos os projetos"
            options={projects.map((project) => ({ value: project.slug, label: project.name }))}
            className="w-full sm:min-w-[260px]"
          />
          {mode === 'tracks' && (
            <Select
              value={trackSlug}
              onChange={(event) => setTrackSlug(event.target.value)}
              placeholder="Todas as faixas"
              options={availableTrackOptions}
              className="w-full sm:min-w-[260px]"
            />
          )}
          <Button
            variant="secondary"
            onClick={() => {
              setProjectSlug('')
              setTrackSlug('')
            }}
            disabled={!projectSlug && !trackSlug}
          >
            Limpar contexto
          </Button>
          {mode === 'tracks' && !isTracksTrash && (
            <Button
              onClick={() => {
                setTrackForm({
                  projectTemplateId: selectedProject?.id ?? '',
                  title: '',
                  artist: '',
                  description: '',
                  technicalInstruction: '',
                  lyrics: '',
                  unlockAfterTrackId: '',
                })
                setCreateTrackOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar faixa
            </Button>
          )}
        </div>
      }
    >
      {mode === 'tracks' && (
        <>
          <Tabs
            tabs={[
              { key: 'active', label: 'Ativas', count: filteredTrackRows.length },
              { key: 'TRASH', label: 'Lixeira', count: deletedTracksResponse?.pagination.total ?? deletedTrackRows.length },
            ]}
            activeKey={tracksTab}
            onChange={(key) => {
              setTracksTab(key as 'active' | 'TRASH')
              setTrashPage(1)
            }}
          />

          {isLoading ? (
            <Card>
              <LoadingState />
            </Card>
          ) : !isTracksTrash && trackGroups.length === 0 ? (
            <Card>
              <div className="px-4 py-8 text-center text-sm text-muted">
                {emptyMessage(mode, Boolean(projectSlug))}
              </div>
            </Card>
          ) : !isTracksTrash ? (
            <div className="space-y-4">
              {trackGroups.map((group) => (
                <Card key={group.project.id}>
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-text">{group.project.name}</p>
                    <p className="text-xs text-muted">{group.tracks.length} faixa(s)</p>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,260px)_90px] gap-3 border-b border-border bg-surface-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <span>Faixa</span>
                    <span>Artista</span>
                    <span className="text-center">Ações</span>
                  </div>
                  <div className="divide-y divide-border">
                    {group.tracks.map((track) => (
                      <div
                        key={track.id}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,260px)_90px] items-center gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text">
                            {track.order}. {track.title}
                          </p>
                        </div>
                        <p className="truncate text-sm text-muted">{track.artist || '—'}</p>
                        <div className="flex items-center justify-center gap-1">
                          <IconButton
                            label="Editar faixa"
                            icon={<Pencil className="h-4 w-4" />}
                            onClick={() => {
                              setEditingTrack({ project: group.project, track })
                              setTrackForm({
                                projectTemplateId: group.project.id,
                                title: track.title,
                                artist: track.artist || '',
                                description: track.description || '',
                                technicalInstruction: track.technicalInstruction || '',
                                lyrics: track.lyrics || '',
                                unlockAfterTrackId: track.unlockAfterTrackId || '',
                              })
                            }}
                          />
                          <IconButton
                            label="Desativar faixa"
                            icon={<Trash2 className="h-4 w-4" />}
                            variant="danger"
                            onClick={() => setDeleteTargetTrack({ project: group.project, track })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <Table
                columns={trackTrashColumns}
                data={deletedTrackRows}
                keyExtractor={(row) => row.track.id}
                emptyMessage={emptyMessage(mode, Boolean(projectSlug))}
              />
              {deletedTracksResponse?.pagination && deletedTracksResponse.pagination.totalPages > 1 && (
                <Pagination
                  page={trashPage}
                  totalPages={deletedTracksResponse.pagination.totalPages}
                  total={deletedTracksResponse.pagination.total}
                  onPageChange={setTrashPage}
                />
              )}
            </>
          )}
        </>
      )}

      {mode === 'materials' && (
        <Table
          columns={materialsColumns}
          data={materialRows}
          keyExtractor={(row) => row.material.id}
          isLoading={isLoading}
          emptyMessage={emptyMessage(mode, Boolean(projectSlug))}
        />
      )}

      {mode === 'study-tracks' && (
        <Table
          columns={studyTracksColumns}
          data={studyTrackRows}
          keyExtractor={(row) => row.studyTrack.id}
          isLoading={isLoading}
          emptyMessage={emptyMessage(mode, Boolean(projectSlug))}
        />
      )}

      {mode === 'press-quizzes' && (
        <Table
          columns={quizzesColumns}
          data={quizRows}
          keyExtractor={(row) => row.quiz.id}
          isLoading={isLoading}
          emptyMessage={emptyMessage(mode, Boolean(projectSlug))}
        />
      )}

      <Modal
        isOpen={mode === 'tracks' && createTrackOpen}
        onClose={() => setCreateTrackOpen(false)}
        title="Adicionar faixa"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateTrackOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createTrackMutation.mutate()}
              isLoading={createTrackMutation.isPending}
              disabled={!trackForm.projectTemplateId || !trackForm.title.trim()}
            >
              Cadastrar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            id="trackProjectTemplateId"
            label="Projeto"
            value={trackForm.projectTemplateId}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, projectTemplateId: event.target.value }))}
            options={projects.map((project) => ({ value: project.id, label: project.name }))}
            placeholder="Selecionar projeto..."
            required
          />
          <Input
            id="trackCreateTitle"
            label="Título"
            value={trackForm.title}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <Input
            id="trackCreateArtist"
            label="Artista"
            value={trackForm.artist}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, artist: event.target.value }))}
          />
          <Textarea
            id="trackCreateDescription"
            label="Descrição"
            value={trackForm.description}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <Textarea
            id="trackCreateTechInstruction"
            label="Instrução técnica"
            value={trackForm.technicalInstruction}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, technicalInstruction: event.target.value }))}
          />
          <Textarea
            id="trackCreateLyrics"
            label="Letra"
            value={trackForm.lyrics}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, lyrics: event.target.value }))}
          />
          {availablePrerequisiteTrackOptions.length > 0 && (
            <Select
              id="trackCreateUnlockAfter"
              label="Desbloqueia após (pré-requisito)"
              value={trackForm.unlockAfterTrackId}
              onChange={(event) => setTrackForm((prev) => ({ ...prev, unlockAfterTrackId: event.target.value }))}
              placeholder="Sem pré-requisito"
              options={availablePrerequisiteTrackOptions}
            />
          )}
        </div>
      </Modal>

      <Modal
        isOpen={mode === 'tracks' && !!editingTrack}
        onClose={() => setEditingTrack(null)}
        title="Editar faixa"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingTrack(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveTrackMutation.mutate()}
              isLoading={saveTrackMutation.isPending}
              disabled={!trackForm.title.trim()}
            >
              Salvar alterações
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            id="trackTitle"
            label="Título"
            value={trackForm.title}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <Input
            id="trackArtist"
            label="Artista"
            value={trackForm.artist}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, artist: event.target.value }))}
          />
          <Textarea
            id="trackEditDescription"
            label="Descrição"
            value={trackForm.description}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <Textarea
            id="trackEditTechInstruction"
            label="Instrução técnica"
            value={trackForm.technicalInstruction}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, technicalInstruction: event.target.value }))}
          />
          <Textarea
            id="trackEditLyrics"
            label="Letra"
            value={trackForm.lyrics}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, lyrics: event.target.value }))}
          />
          {availablePrerequisiteTrackOptions.length > 0 && (
            <Select
              id="trackEditUnlockAfter"
              label="Desbloqueia após (pré-requisito)"
              value={trackForm.unlockAfterTrackId}
              onChange={(event) => setTrackForm((prev) => ({ ...prev, unlockAfterTrackId: event.target.value }))}
              placeholder="Sem pré-requisito"
              options={availablePrerequisiteTrackOptions}
            />
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={mode === 'tracks' && !!deleteTargetTrack}
        onClose={() => setDeleteTargetTrack(null)}
        onConfirm={() => deleteTrackMutation.mutate()}
        isLoading={deleteTrackMutation.isPending}
        title="Desativar faixa"
        message={`Confirma a desativação de "${deleteTargetTrack?.track.title}"?`}
      />

      <ConfirmModal
        isOpen={mode === 'tracks' && !!restoreTargetTrack}
        onClose={() => setRestoreTargetTrack(null)}
        onConfirm={() => restoreTrackMutation.mutate()}
        isLoading={restoreTrackMutation.isPending}
        title="Restaurar faixa"
        message={`Confirma a restauração de "${restoreTargetTrack?.track.title}"?`}
        confirmLabel="Restaurar"
      />

      <DeactivationBlockedModal
        isOpen={mode === 'tracks' && !!blockedInfo}
        onClose={() => setBlockedInfo(null)}
        entityName={blockedInfo?.name ?? ''}
        parentSlug={blockedInfo?.slug ?? ''}
        details={blockedInfo?.details ?? null}
      />
    </PageContainer>
  )
}

export function TrackTemplatesListPage() {
  return <ResourceListPage mode="tracks" />
}

export function MaterialTemplatesListPage() {
  return <ResourceListPage mode="materials" />
}

export function StudyTrackTemplatesListPage() {
  return <ResourceListPage mode="study-tracks" />
}

export function PressQuizTemplatesListPage() {
  return <ResourceListPage mode="press-quizzes" />
}
