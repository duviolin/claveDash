import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArchiveRestore, Pencil, Plus, Trash2 } from 'lucide-react'
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
  createMaterialTemplate,
  createPressQuizTemplate,
  createStudyTrackTemplate,
  createTrackTemplate,
  deleteMaterialTemplate,
  deletePressQuizTemplate,
  deleteStudyTrackTemplate,
  deleteTrackTemplate,
  listDeletedMaterialTemplates,
  listDeletedPressQuizTemplates,
  listDeletedStudyTrackTemplates,
  listDeletedTrackTemplates,
  listMaterialTemplates,
  listPressQuizTemplates,
  listProjectTemplates,
  listStudyTrackTemplates,
  listTrackTemplates,
  restoreMaterialTemplate,
  restorePressQuizTemplate,
  restoreStudyTrackTemplate,
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

interface MaterialTrackGroup {
  track: TrackSceneTemplate
  materials: TrackMaterialTemplate[]
}

interface MaterialProjectGroup {
  project: ProjectTemplate
  tracks: MaterialTrackGroup[]
}

interface StudyTrackGroup {
  track: TrackSceneTemplate
  studyTracks: StudyTrackTemplate[]
}

interface StudyTrackProjectGroup {
  project: ProjectTemplate
  tracks: StudyTrackGroup[]
}

interface QuizTrackGroup {
  track: TrackSceneTemplate
  quizzes: PressQuizTemplate[]
}

interface QuizProjectGroup {
  project: ProjectTemplate
  tracks: QuizTrackGroup[]
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

interface MaterialTrashRow {
  project: ProjectTemplate | null
  track: TrackSceneTemplate | null
  material: TrackMaterialTemplate
}

interface StudyTrackTrashRow {
  project: ProjectTemplate | null
  track: TrackSceneTemplate | null
  studyTrack: StudyTrackTemplate
}

interface QuizTrashRow {
  project: ProjectTemplate | null
  track: TrackSceneTemplate | null
  quiz: PressQuizTemplate
}

const TRACK_TRASH_PAGE_LIMIT = 20
const MATERIAL_TRASH_PAGE_LIMIT = 20
const STUDY_TRACK_TRASH_PAGE_LIMIT = 20
const QUIZ_TRASH_PAGE_LIMIT = 20
const TEMPLATE_FILTERS_STORAGE_KEY = 'template-resource-filters'

interface StoredTemplateFilters {
  projectSlug: string
  trackSlug: string
}

function getStoredTemplateFilters(): StoredTemplateFilters {
  if (typeof window === 'undefined') {
    return { projectSlug: '', trackSlug: '' }
  }

  try {
    const raw = window.sessionStorage.getItem(TEMPLATE_FILTERS_STORAGE_KEY)
    if (!raw) return { projectSlug: '', trackSlug: '' }
    const parsed = JSON.parse(raw) as Partial<StoredTemplateFilters>
    return {
      projectSlug: parsed.projectSlug ?? '',
      trackSlug: parsed.trackSlug ?? '',
    }
  } catch {
    return { projectSlug: '', trackSlug: '' }
  }
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
  if ((mode === 'materials' || mode === 'study-tracks' || mode === 'press-quizzes') && !hasContext) {
    return 'Selecione um projeto e uma faixa para visualizar os itens.'
  }
  if (mode === 'materials') return 'Nenhum material encontrado.'
  if (mode === 'study-tracks') return 'Nenhuma trilha encontrada.'
  return 'Nenhum quiz encontrado.'
}

function ResourceListPage({ mode }: { mode: ResourceMode }) {
  const queryClient = useQueryClient()
  const [storedFilters, setStoredFilters] = useState<StoredTemplateFilters>(getStoredTemplateFilters)
  const [projectSlug, setProjectSlug] = useState(storedFilters.projectSlug)
  const [trackSlug, setTrackSlug] = useState(storedFilters.trackSlug)
  const [tracksTab, setTracksTab] = useState<'active' | 'TRASH'>('active')
  const [materialsTab, setMaterialsTab] = useState<'active' | 'TRASH'>('active')
  const [studyTracksTab, setStudyTracksTab] = useState<'active' | 'TRASH'>('active')
  const [quizzesTab, setQuizzesTab] = useState<'active' | 'TRASH'>('active')
  const [trashPage, setTrashPage] = useState(1)
  const isTracksTrash = mode === 'tracks' && tracksTab === 'TRASH'
  const isMaterialsTrash = mode === 'materials' && materialsTab === 'TRASH'
  const isStudyTracksTrash = mode === 'study-tracks' && studyTracksTab === 'TRASH'
  const isQuizzesTrash = mode === 'press-quizzes' && quizzesTab === 'TRASH'
  const [materialsTrashPage, setMaterialsTrashPage] = useState(1)
  const [studyTracksTrashPage, setStudyTracksTrashPage] = useState(1)
  const [quizzesTrashPage, setQuizzesTrashPage] = useState(1)
  const [createTrackOpen, setCreateTrackOpen] = useState(false)
  const [createMaterialOpen, setCreateMaterialOpen] = useState(false)
  const [createStudyTrackOpen, setCreateStudyTrackOpen] = useState(false)
  const [createQuizOpen, setCreateQuizOpen] = useState(false)
  const [editingTrack, setEditingTrack] = useState<TrackRow | null>(null)
  const [deleteTargetTrack, setDeleteTargetTrack] = useState<TrackRow | null>(null)
  const [restoreTargetTrack, setRestoreTargetTrack] = useState<TrackTrashRow | null>(null)
  const [deleteTargetMaterial, setDeleteTargetMaterial] = useState<MaterialRow | null>(null)
  const [restoreTargetMaterial, setRestoreTargetMaterial] = useState<MaterialTrashRow | null>(null)
  const [deleteTargetStudyTrack, setDeleteTargetStudyTrack] = useState<StudyTrackRow | null>(null)
  const [restoreTargetStudyTrack, setRestoreTargetStudyTrack] = useState<StudyTrackTrashRow | null>(null)
  const [deleteTargetQuiz, setDeleteTargetQuiz] = useState<QuizRow | null>(null)
  const [restoreTargetQuiz, setRestoreTargetQuiz] = useState<QuizTrashRow | null>(null)
  const [trackForm, setTrackForm] = useState({
    projectTemplateId: '',
    title: '',
    artist: '',
    description: '',
    technicalInstruction: '',
    lyrics: '',
    unlockAfterTrackId: '',
  })
  const [materialForm, setMaterialForm] = useState({
    projectTemplateId: '',
    trackSceneTemplateId: '',
    type: 'TEXT' as TrackMaterialTemplate['type'],
    title: '',
    defaultContentUrl: '',
    defaultTextContent: '',
  })
  const [studyTrackForm, setStudyTrackForm] = useState({
    projectTemplateId: '',
    trackSceneTemplateId: '',
    title: '',
    description: '',
    technicalNotes: '',
  })
  const [quizForm, setQuizForm] = useState({
    projectTemplateId: '',
    trackSceneTemplateId: '',
    title: '',
    description: '',
    maxAttempts: 3,
    passingScore: 70,
  })
  const { blockedInfo, setBlockedInfo, handleBlockedError } = useDeactivationBlockedHandler()

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['project-templates'],
    queryFn: () => listProjectTemplates(),
  })

  const selectedProject = projectSlug ? projects.find((project) => project.slug === projectSlug) ?? null : null
  const scopedProjects = selectedProject ? [selectedProject] : []

  const tracksQueries = useQueries({
    queries: scopedProjects.map((project) => ({
      queryKey: ['resource-list-tracks', project.slug],
      queryFn: () => listTrackTemplates(project.id),
      enabled: mode !== 'tracks' || !isTracksTrash,
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

  const { data: deletedMaterialsResponse } = useQuery({
    queryKey: ['resource-list-materials', 'deleted', materialsTrashPage],
    queryFn: () => listDeletedMaterialTemplates({ page: materialsTrashPage, limit: MATERIAL_TRASH_PAGE_LIMIT }),
    enabled: isMaterialsTrash,
  })

  const availableTrackOptions = useMemo(() => {
    const sourceRows = projectSlug
      ? trackRows.filter((row) => row.project.slug === projectSlug)
      : trackRows
    return sourceRows
      .map((row) => row.track)
      .sort((a, b) => a.order - b.order)
      .map((track) => ({ value: track.slug, label: `${track.order}. ${track.title}` }))
  }, [projectSlug, trackRows])

  const selectedTrackRow = useMemo(() => {
    if (!trackSlug) return null
    return trackRows.find((row) => row.track.slug === trackSlug) ?? null
  }, [trackRows, trackSlug])

  const trackRowsForChildren = useMemo(() => {
    if (!trackSlug) return []
    return trackRows.filter((row) => row.track.slug === trackSlug)
  }, [trackRows, trackSlug])

  const materialQueries = useQueries({
    queries:
      mode === 'materials' && !isMaterialsTrash
        ? trackRowsForChildren.map(({ track }) => ({
            queryKey: ['resource-list-materials', track.id],
            queryFn: () => listMaterialTemplates(track.id),
          }))
        : [],
  })

  const studyTrackQueries = useQueries({
    queries:
      mode === 'study-tracks' && !isStudyTracksTrash
        ? trackRowsForChildren.map(({ track }) => ({
            queryKey: ['resource-list-study-tracks', track.id],
            queryFn: () => listStudyTrackTemplates(track.id),
          }))
        : [],
  })

  const quizQueries = useQueries({
    queries:
      mode === 'press-quizzes' && !isQuizzesTrash
        ? trackRowsForChildren.map(({ track }) => ({
            queryKey: ['resource-list-press-quizzes', track.id],
            queryFn: () => listPressQuizTemplates(track.id),
          }))
        : [],
  })

  const materialRows = useMemo<MaterialRow[]>(() => {
    if (mode !== 'materials') return []

    return trackRowsForChildren
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
  }, [mode, trackRowsForChildren, materialQueries])

  const filteredMaterialRows = useMemo(() => {
    if (!trackSlug) return materialRows
    return materialRows.filter((row) => row.track.slug === trackSlug)
  }, [materialRows, trackSlug])

  const materialGroups = useMemo<MaterialProjectGroup[]>(() => {
    const projectMap = new Map<string, MaterialProjectGroup>()

    filteredMaterialRows.forEach(({ project, track, material }) => {
      let projectGroup = projectMap.get(project.id)
      if (!projectGroup) {
        projectGroup = { project, tracks: [] }
        projectMap.set(project.id, projectGroup)
      }

      let trackGroup = projectGroup.tracks.find((item) => item.track.id === track.id)
      if (!trackGroup) {
        trackGroup = { track, materials: [] }
        projectGroup.tracks.push(trackGroup)
      }

      trackGroup.materials.push(material)
    })

    return Array.from(projectMap.values()).map((projectGroup) => ({
      ...projectGroup,
      tracks: projectGroup.tracks
        .map((trackGroup) => ({
          ...trackGroup,
          materials: [...trackGroup.materials].sort((a, b) => a.order - b.order),
        }))
        .sort((a, b) => a.track.order - b.track.order),
    }))
  }, [filteredMaterialRows])

  const deletedMaterialRows = useMemo<MaterialTrashRow[]>(() => {
    const deletedMaterials = deletedMaterialsResponse?.data ?? []
    return deletedMaterials
      .map((material) => {
        const trackRow = trackRows.find((row) => row.track.id === material.trackSceneTemplateId) ?? null
        return {
          project: trackRow?.project ?? null,
          track: trackRow?.track ?? null,
          material,
        }
      })
      .filter((row) => {
        if (!projectSlug) return true
        return row.project?.slug === projectSlug
      })
      .filter((row) => {
        if (!trackSlug) return true
        return row.track?.slug === trackSlug
      })
  }, [deletedMaterialsResponse?.data, trackRows, projectSlug, trackSlug])

  const { data: deletedStudyTracksResponse } = useQuery({
    queryKey: ['resource-list-study-tracks', 'deleted', studyTracksTrashPage],
    queryFn: () => listDeletedStudyTrackTemplates({ page: studyTracksTrashPage, limit: STUDY_TRACK_TRASH_PAGE_LIMIT }),
    enabled: isStudyTracksTrash,
  })

  const deletedStudyTrackRows = useMemo<StudyTrackTrashRow[]>(() => {
    const deletedStudyTracks = deletedStudyTracksResponse?.data ?? []
    return deletedStudyTracks
      .map((studyTrack) => {
        const trackRow = trackRows.find((row) => row.track.id === studyTrack.trackSceneTemplateId) ?? null
        return {
          project: trackRow?.project ?? null,
          track: trackRow?.track ?? null,
          studyTrack,
        }
      })
      .filter((row) => {
        if (!projectSlug) return true
        return row.project?.slug === projectSlug
      })
      .filter((row) => {
        if (!trackSlug) return true
        return row.track?.slug === trackSlug
      })
  }, [deletedStudyTracksResponse?.data, trackRows, projectSlug, trackSlug])

  const { data: deletedQuizzesResponse } = useQuery({
    queryKey: ['resource-list-press-quizzes', 'deleted', quizzesTrashPage],
    queryFn: () => listDeletedPressQuizTemplates({ page: quizzesTrashPage, limit: QUIZ_TRASH_PAGE_LIMIT }),
    enabled: isQuizzesTrash,
  })

  const deletedQuizRows = useMemo<QuizTrashRow[]>(() => {
    const deletedQuizzes = deletedQuizzesResponse?.data ?? []
    return deletedQuizzes
      .map((quiz) => {
        const trackRow = trackRows.find((row) => row.track.id === quiz.trackSceneTemplateId) ?? null
        return {
          project: trackRow?.project ?? null,
          track: trackRow?.track ?? null,
          quiz,
        }
      })
      .filter((row) => {
        if (!projectSlug) return true
        return row.project?.slug === projectSlug
      })
      .filter((row) => {
        if (!trackSlug) return true
        return row.track?.slug === trackSlug
      })
  }, [deletedQuizzesResponse?.data, trackRows, projectSlug, trackSlug])

  const studyTrackRows = useMemo<StudyTrackRow[]>(() => {
    if (mode !== 'study-tracks') return []

    return trackRowsForChildren
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
  }, [mode, trackRowsForChildren, studyTrackQueries])

  const filteredStudyTrackRows = useMemo(() => {
    if (!trackSlug) return studyTrackRows
    return studyTrackRows.filter((row) => row.track.slug === trackSlug)
  }, [studyTrackRows, trackSlug])

  const studyTrackGroups = useMemo<StudyTrackProjectGroup[]>(() => {
    const projectMap = new Map<string, StudyTrackProjectGroup>()

    filteredStudyTrackRows.forEach(({ project, track, studyTrack }) => {
      let projectGroup = projectMap.get(project.id)
      if (!projectGroup) {
        projectGroup = { project, tracks: [] }
        projectMap.set(project.id, projectGroup)
      }

      let trackGroup = projectGroup.tracks.find((item) => item.track.id === track.id)
      if (!trackGroup) {
        trackGroup = { track, studyTracks: [] }
        projectGroup.tracks.push(trackGroup)
      }

      trackGroup.studyTracks.push(studyTrack)
    })

    return Array.from(projectMap.values()).map((projectGroup) => ({
      ...projectGroup,
      tracks: projectGroup.tracks
        .map((trackGroup) => ({
          ...trackGroup,
          studyTracks: [...trackGroup.studyTracks].sort((a, b) => a.order - b.order),
        }))
        .sort((a, b) => a.track.order - b.track.order),
    }))
  }, [filteredStudyTrackRows])

  const quizRows = useMemo<QuizRow[]>(() => {
    if (mode !== 'press-quizzes') return []

    return trackRowsForChildren
      .flatMap((trackRow, index) => {
        const quizzes = quizQueries[index]?.data ?? []
        return quizzes.map((quiz) => ({ ...trackRow, quiz }))
      })
      .sort((a, b) => a.project.name.localeCompare(b.project.name) || a.track.order - b.track.order)
  }, [mode, trackRowsForChildren, quizQueries])

  const filteredQuizRows = useMemo(() => {
    if (!trackSlug) return quizRows
    return quizRows.filter((row) => row.track.slug === trackSlug)
  }, [quizRows, trackSlug])

  const quizGroups = useMemo<QuizProjectGroup[]>(() => {
    const projectMap = new Map<string, QuizProjectGroup>()

    filteredQuizRows.forEach(({ project, track, quiz }) => {
      let projectGroup = projectMap.get(project.id)
      if (!projectGroup) {
        projectGroup = { project, tracks: [] }
        projectMap.set(project.id, projectGroup)
      }

      let trackGroup = projectGroup.tracks.find((item) => item.track.id === track.id)
      if (!trackGroup) {
        trackGroup = { track, quizzes: [] }
        projectGroup.tracks.push(trackGroup)
      }

      trackGroup.quizzes.push(quiz)
    })

    return Array.from(projectMap.values()).map((projectGroup) => ({
      ...projectGroup,
      tracks: projectGroup.tracks
        .map((trackGroup) => ({
          ...trackGroup,
          quizzes: [...trackGroup.quizzes],
        }))
        .sort((a, b) => a.track.order - b.track.order),
    }))
  }, [filteredQuizRows])

  const isLoadingChildren =
    (mode === 'materials' && !isMaterialsTrash && materialQueries.some((query) => query.isLoading)) ||
    (mode === 'materials' && isMaterialsTrash && !deletedMaterialsResponse) ||
    (mode === 'study-tracks' && !isStudyTracksTrash && studyTrackQueries.some((query) => query.isLoading)) ||
    (mode === 'study-tracks' && isStudyTracksTrash && !deletedStudyTracksResponse) ||
    (mode === 'press-quizzes' && !isQuizzesTrash && quizQueries.some((query) => query.isLoading)) ||
    (mode === 'press-quizzes' && isQuizzesTrash && !deletedQuizzesResponse)

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

  const createMaterialMutation = useMutation({
    mutationFn: () =>
      createMaterialTemplate(materialForm.trackSceneTemplateId, {
        type: materialForm.type,
        title: materialForm.title,
        defaultContentUrl: materialForm.defaultContentUrl.trim() ? materialForm.defaultContentUrl : undefined,
        defaultTextContent: materialForm.defaultTextContent.trim() ? materialForm.defaultTextContent : undefined,
      }),
    onSuccess: () => {
      toast.success('Material cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-materials'] })
      setCreateMaterialOpen(false)
      setMaterialForm({
        projectTemplateId: selectedProject?.id ?? '',
        trackSceneTemplateId: '',
        type: 'TEXT',
        title: '',
        defaultContentUrl: '',
        defaultTextContent: '',
      })
    },
  })

  const deleteMaterialMutation = useMutation({
    mutationFn: () => deleteMaterialTemplate(deleteTargetMaterial!.material.id),
    onSuccess: () => {
      toast.success('Material desativado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-materials'] })
      queryClient.invalidateQueries({ queryKey: ['resource-list-materials', 'deleted'] })
      setDeleteTargetMaterial(null)
    },
  })

  const restoreMaterialMutation = useMutation({
    mutationFn: () => restoreMaterialTemplate(restoreTargetMaterial!.material.id),
    onSuccess: () => {
      toast.success('Material restaurado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-materials'] })
      queryClient.invalidateQueries({ queryKey: ['resource-list-materials', 'deleted'] })
      setRestoreTargetMaterial(null)
    },
  })

  const createStudyTrackMutation = useMutation({
    mutationFn: () =>
      createStudyTrackTemplate(studyTrackForm.trackSceneTemplateId, {
        title: studyTrackForm.title,
        description: studyTrackForm.description.trim() ? studyTrackForm.description : undefined,
        technicalNotes: studyTrackForm.technicalNotes.trim() ? studyTrackForm.technicalNotes : undefined,
      }),
    onSuccess: () => {
      toast.success('Trilha cadastrada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-study-tracks'] })
      setCreateStudyTrackOpen(false)
      setStudyTrackForm({
        projectTemplateId: selectedProject?.id ?? selectedTrackRow?.project.id ?? '',
        trackSceneTemplateId: selectedTrackRow?.track.id ?? '',
        title: '',
        description: '',
        technicalNotes: '',
      })
    },
  })

  const deleteStudyTrackMutation = useMutation({
    mutationFn: () => deleteStudyTrackTemplate(deleteTargetStudyTrack!.studyTrack.id),
    onSuccess: () => {
      toast.success('Trilha desativada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-study-tracks'] })
      queryClient.invalidateQueries({ queryKey: ['resource-list-study-tracks', 'deleted'] })
      setDeleteTargetStudyTrack(null)
    },
  })

  const restoreStudyTrackMutation = useMutation({
    mutationFn: () => restoreStudyTrackTemplate(restoreTargetStudyTrack!.studyTrack.id),
    onSuccess: () => {
      toast.success('Trilha restaurada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-study-tracks'] })
      queryClient.invalidateQueries({ queryKey: ['resource-list-study-tracks', 'deleted'] })
      setRestoreTargetStudyTrack(null)
    },
  })

  const createQuizMutation = useMutation({
    mutationFn: () =>
      createPressQuizTemplate(quizForm.trackSceneTemplateId, {
        title: quizForm.title,
        description: quizForm.description.trim() ? quizForm.description : undefined,
        maxAttempts: quizForm.maxAttempts,
        passingScore: quizForm.passingScore,
      }),
    onSuccess: () => {
      toast.success('Quiz cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-press-quizzes'] })
      setCreateQuizOpen(false)
      setQuizForm({
        projectTemplateId: selectedProject?.id ?? selectedTrackRow?.project.id ?? '',
        trackSceneTemplateId: selectedTrackRow?.track.id ?? '',
        title: '',
        description: '',
        maxAttempts: 3,
        passingScore: 70,
      })
    },
  })

  const deleteQuizMutation = useMutation({
    mutationFn: () => deletePressQuizTemplate(deleteTargetQuiz!.quiz.id),
    onSuccess: () => {
      toast.success('Quiz desativado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-press-quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['resource-list-press-quizzes', 'deleted'] })
      setDeleteTargetQuiz(null)
    },
  })

  const restoreQuizMutation = useMutation({
    mutationFn: () => restorePressQuizTemplate(restoreTargetQuiz!.quiz.id),
    onSuccess: () => {
      toast.success('Quiz restaurado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-press-quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['resource-list-press-quizzes', 'deleted'] })
      setRestoreTargetQuiz(null)
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

  const materialTrackOptions = useMemo(() => {
    const rows = trackRows
      .filter((row) => !materialForm.projectTemplateId || row.project.id === materialForm.projectTemplateId)
      .sort((a, b) => a.project.name.localeCompare(b.project.name) || a.track.order - b.track.order)

    return rows.map((row) => ({
      value: row.track.id,
      label: `${row.project.name} - ${row.track.order}. ${row.track.title}`,
    }))
  }, [trackRows, materialForm.projectTemplateId])

  const studyTrackTrackOptions = useMemo(() => {
    const rows = trackRows
      .filter((row) => !studyTrackForm.projectTemplateId || row.project.id === studyTrackForm.projectTemplateId)
      .sort((a, b) => a.project.name.localeCompare(b.project.name) || a.track.order - b.track.order)

    return rows.map((row) => ({
      value: row.track.id,
      label: `${row.project.name} - ${row.track.order}. ${row.track.title}`,
    }))
  }, [trackRows, studyTrackForm.projectTemplateId])

  const quizTrackOptions = useMemo(() => {
    const rows = trackRows
      .filter((row) => !quizForm.projectTemplateId || row.project.id === quizForm.projectTemplateId)
      .sort((a, b) => a.project.name.localeCompare(b.project.name) || a.track.order - b.track.order)

    return rows.map((row) => ({
      value: row.track.id,
      label: `${row.project.name} - ${row.track.order}. ${row.track.title}`,
    }))
  }, [trackRows, quizForm.projectTemplateId])

  useEffect(() => {
    setStoredFilters({ projectSlug, trackSlug })
  }, [projectSlug, trackSlug])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(TEMPLATE_FILTERS_STORAGE_KEY, JSON.stringify(storedFilters))
  }, [storedFilters])

  useEffect(() => {
    if (!trackSlug) return
    const existsInOptions = availableTrackOptions.some((option) => option.value === trackSlug)
    if (!existsInOptions) {
      setTrackSlug('')
    }
  }, [availableTrackOptions, trackSlug])

  const materialTrashColumns = [
    {
      key: 'project',
      header: 'Projeto',
      render: (row: MaterialTrashRow) => (
        <span className="font-medium text-text">{row.project?.name || 'Projeto não encontrado'}</span>
      ),
    },
    {
      key: 'track',
      header: 'Faixa',
      render: (row: MaterialTrashRow) => <span className="text-muted">{row.track?.title || 'Faixa não encontrada'}</span>,
    },
    {
      key: 'material',
      header: 'Material',
      render: (row: MaterialTrashRow) => (
        <div className="flex items-center gap-2">
          <span className="text-text">{row.material.title}</span>
          <Badge variant="error" className="text-[10px]">Excluído</Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row: MaterialTrashRow) => (
        <IconButton
          label="Restaurar material"
          icon={<ArchiveRestore className="h-4 w-4" />}
          variant="success"
          onClick={() => setRestoreTargetMaterial(row)}
        />
      ),
    },
  ]

  const studyTrackTrashColumns = [
    {
      key: 'project',
      header: 'Projeto',
      render: (row: StudyTrackTrashRow) => (
        <span className="font-medium text-text">{row.project?.name || 'Projeto não encontrado'}</span>
      ),
    },
    {
      key: 'track',
      header: 'Faixa',
      render: (row: StudyTrackTrashRow) => <span className="text-muted">{row.track?.title || 'Faixa não encontrada'}</span>,
    },
    {
      key: 'studyTrack',
      header: 'Trilha',
      render: (row: StudyTrackTrashRow) => (
        <div className="flex items-center gap-2">
          <span className="text-text">{row.studyTrack.title}</span>
          <Badge variant="error" className="text-[10px]">Excluída</Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row: StudyTrackTrashRow) => (
        <IconButton
          label="Restaurar trilha"
          icon={<ArchiveRestore className="h-4 w-4" />}
          variant="success"
          onClick={() => setRestoreTargetStudyTrack(row)}
        />
      ),
    },
  ]

  const quizTrashColumns = [
    {
      key: 'project',
      header: 'Projeto',
      render: (row: QuizTrashRow) => (
        <span className="font-medium text-text">{row.project?.name || 'Projeto não encontrado'}</span>
      ),
    },
    {
      key: 'track',
      header: 'Faixa',
      render: (row: QuizTrashRow) => <span className="text-muted">{row.track?.title || 'Faixa não encontrada'}</span>,
    },
    {
      key: 'quiz',
      header: 'Quiz',
      render: (row: QuizTrashRow) => (
        <div className="flex items-center gap-2">
          <span className="text-text">{row.quiz.title}</span>
          <Badge variant="error" className="text-[10px]">Excluído</Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row: QuizTrashRow) => (
        <IconButton
          label="Restaurar quiz"
          icon={<ArchiveRestore className="h-4 w-4" />}
          variant="success"
          onClick={() => setRestoreTargetQuiz(row)}
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
            ? (isMaterialsTrash
                ? (projectSlug ? deletedMaterialRows.length : (deletedMaterialsResponse?.pagination.total ?? deletedMaterialRows.length))
                : filteredMaterialRows.length)
            : mode === 'study-tracks'
              ? (isStudyTracksTrash
                  ? (projectSlug ? deletedStudyTrackRows.length : (deletedStudyTracksResponse?.pagination.total ?? deletedStudyTrackRows.length))
                  : filteredStudyTrackRows.length)
              : (isQuizzesTrash
                  ? (projectSlug ? deletedQuizRows.length : (deletedQuizzesResponse?.pagination.total ?? deletedQuizRows.length))
                  : filteredQuizRows.length)
      }
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <Select
            value={projectSlug}
            onChange={(event) => {
              setProjectSlug(event.target.value)
              setTrackSlug('')
            }}
            placeholder="Todos os projetos"
            options={projects.map((project) => ({ value: project.slug, label: project.name }))}
            className="w-full sm:min-w-[260px]"
          />
          {(mode === 'materials' || mode === 'study-tracks' || mode === 'press-quizzes') && (
            <Select
              value={trackSlug}
              onChange={(event) => setTrackSlug(event.target.value)}
              placeholder="Todas as faixas"
              options={availableTrackOptions}
              className="w-full sm:min-w-[260px]"
            />
          )}
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
          {mode === 'materials' && !isMaterialsTrash && (
            <Button
              onClick={() => {
                setMaterialForm({
                  projectTemplateId: selectedProject?.id ?? selectedTrackRow?.project.id ?? '',
                  trackSceneTemplateId: selectedTrackRow?.track.id ?? '',
                  type: 'TEXT',
                  title: '',
                  defaultContentUrl: '',
                  defaultTextContent: '',
                })
                setCreateMaterialOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar material
            </Button>
          )}
          {mode === 'study-tracks' && !isStudyTracksTrash && (
            <Button
              onClick={() => {
                setStudyTrackForm({
                  projectTemplateId: selectedProject?.id ?? selectedTrackRow?.project.id ?? '',
                  trackSceneTemplateId: selectedTrackRow?.track.id ?? '',
                  title: '',
                  description: '',
                  technicalNotes: '',
                })
                setCreateStudyTrackOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar trilha
            </Button>
          )}
          {mode === 'press-quizzes' && !isQuizzesTrash && (
            <Button
              onClick={() => {
                setQuizForm({
                  projectTemplateId: selectedProject?.id ?? selectedTrackRow?.project.id ?? '',
                  trackSceneTemplateId: selectedTrackRow?.track.id ?? '',
                  title: '',
                  description: '',
                  maxAttempts: 3,
                  passingScore: 70,
                })
                setCreateQuizOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar quiz
            </Button>
          )}
        </div>
      }
    >
      {mode === 'tracks' && (
        <>
          <Tabs
            tabs={[
              { key: 'active', label: 'Ativos', count: filteredTrackRows.length },
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
        <>
          <Tabs
            tabs={[
              { key: 'active', label: 'Ativos', count: materialRows.length },
              { key: 'TRASH', label: 'Lixeira', count: deletedMaterialsResponse?.pagination.total ?? deletedMaterialRows.length },
            ]}
            activeKey={materialsTab}
            onChange={(key) => {
              setMaterialsTab(key as 'active' | 'TRASH')
              setMaterialsTrashPage(1)
            }}
          />

          {!isMaterialsTrash ? (
            isLoading ? (
              <Card>
                <LoadingState />
              </Card>
            ) : materialGroups.length === 0 ? (
              <Card>
                <div className="px-4 py-8 text-center text-sm text-muted">
                  {emptyMessage(mode, Boolean(projectSlug))}
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {materialGroups.map((projectGroup) => (
                  <Card key={projectGroup.project.id}>
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold text-text">{projectGroup.project.name}</p>
                      <p className="text-xs text-muted">
                        {projectGroup.tracks.reduce((acc, trackGroup) => acc + trackGroup.materials.length, 0)} material(is)
                      </p>
                    </div>

                    <div className="divide-y divide-border">
                      {projectGroup.tracks.map((trackGroup) => (
                        <div key={trackGroup.track.id}>
                          <div className="bg-surface-2/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                            Faixa {trackGroup.track.order}: {trackGroup.track.title}
                          </div>

                          <div className="grid grid-cols-[minmax(0,1fr)_120px_90px] gap-3 border-b border-border bg-surface-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                            <span>Material</span>
                            <span>Tipo</span>
                            <span className="text-center">Ações</span>
                          </div>

                          <div className="divide-y divide-border">
                            {trackGroup.materials.map((material) => (
                              <div
                                key={material.id}
                                className="grid grid-cols-[minmax(0,1fr)_120px_90px] items-center gap-3 px-4 py-3"
                              >
                                <p className="truncate text-sm text-text">{material.title}</p>
                                <Badge variant={TRACK_MATERIAL_TYPE_VARIANT[material.type]} className="w-fit text-[10px]">
                                  {TRACK_MATERIAL_TYPE_LABELS[material.type]}
                                </Badge>
                                <div className="flex items-center justify-center">
                                  <IconButton
                                    label="Desativar material"
                                    icon={<Trash2 className="h-4 w-4" />}
                                    variant="danger"
                                    onClick={() =>
                                      setDeleteTargetMaterial({
                                        project: projectGroup.project,
                                        track: trackGroup.track,
                                        material,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <>
              <Table
                columns={materialTrashColumns}
                data={deletedMaterialRows}
                keyExtractor={(row) => row.material.id}
                emptyMessage={emptyMessage(mode, Boolean(projectSlug))}
              />
              {deletedMaterialsResponse?.pagination && deletedMaterialsResponse.pagination.totalPages > 1 && (
                <Pagination
                  page={materialsTrashPage}
                  totalPages={deletedMaterialsResponse.pagination.totalPages}
                  total={deletedMaterialsResponse.pagination.total}
                  onPageChange={setMaterialsTrashPage}
                />
              )}
            </>
          )}
        </>
      )}

      {mode === 'study-tracks' && (
        <>
          <Tabs
            tabs={[
              { key: 'active', label: 'Ativos', count: filteredStudyTrackRows.length },
              { key: 'TRASH', label: 'Lixeira', count: deletedStudyTracksResponse?.pagination.total ?? deletedStudyTrackRows.length },
            ]}
            activeKey={studyTracksTab}
            onChange={(key) => {
              setStudyTracksTab(key as 'active' | 'TRASH')
              setStudyTracksTrashPage(1)
            }}
          />

          {!isStudyTracksTrash ? (
            isLoading ? (
              <Card>
                <LoadingState />
              </Card>
            ) : studyTrackGroups.length === 0 ? (
              <Card>
                <div className="px-4 py-8 text-center text-sm text-muted">
                  {emptyMessage(mode, Boolean(projectSlug))}
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {studyTrackGroups.map((projectGroup) => (
                  <Card key={projectGroup.project.id}>
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold text-text">{projectGroup.project.name}</p>
                      <p className="text-xs text-muted">
                        {projectGroup.tracks.reduce((acc, trackGroup) => acc + trackGroup.studyTracks.length, 0)} trilha(s)
                      </p>
                    </div>

                    <div className="divide-y divide-border">
                      {projectGroup.tracks.map((trackGroup) => (
                        <div key={trackGroup.track.id}>
                          <div className="bg-surface-2/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                            Faixa {trackGroup.track.order}: {trackGroup.track.title}
                          </div>

                          <div className="grid grid-cols-[minmax(0,1fr)_90px] gap-3 border-b border-border bg-surface-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                            <span>Trilha</span>
                            <span className="text-center">Ações</span>
                          </div>

                          <div className="divide-y divide-border">
                            {trackGroup.studyTracks.map((studyTrack) => (
                              <div
                                key={studyTrack.id}
                                className="grid grid-cols-[minmax(0,1fr)_90px] items-center gap-3 px-4 py-3"
                              >
                                <p className="truncate text-sm text-text">{studyTrack.title}</p>
                                <div className="flex items-center justify-center">
                                  <IconButton
                                    label="Desativar trilha"
                                    icon={<Trash2 className="h-4 w-4" />}
                                    variant="danger"
                                    onClick={() =>
                                      setDeleteTargetStudyTrack({
                                        project: projectGroup.project,
                                        track: trackGroup.track,
                                        studyTrack,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <>
              <Table
                columns={studyTrackTrashColumns}
                data={deletedStudyTrackRows}
                keyExtractor={(row) => row.studyTrack.id}
                emptyMessage={emptyMessage(mode, Boolean(projectSlug))}
              />
              {deletedStudyTracksResponse?.pagination && deletedStudyTracksResponse.pagination.totalPages > 1 && (
                <Pagination
                  page={studyTracksTrashPage}
                  totalPages={deletedStudyTracksResponse.pagination.totalPages}
                  total={deletedStudyTracksResponse.pagination.total}
                  onPageChange={setStudyTracksTrashPage}
                />
              )}
            </>
          )}
        </>
      )}

      {mode === 'press-quizzes' && (
        <>
          <Tabs
            tabs={[
              { key: 'active', label: 'Ativos', count: filteredQuizRows.length },
              { key: 'TRASH', label: 'Lixeira', count: deletedQuizzesResponse?.pagination.total ?? deletedQuizRows.length },
            ]}
            activeKey={quizzesTab}
            onChange={(key) => {
              setQuizzesTab(key as 'active' | 'TRASH')
              setQuizzesTrashPage(1)
            }}
          />

          {!isQuizzesTrash ? (
            isLoading ? (
              <Card>
                <LoadingState />
              </Card>
            ) : quizGroups.length === 0 ? (
              <Card>
                <div className="px-4 py-8 text-center text-sm text-muted">
                  {emptyMessage(mode, Boolean(projectSlug))}
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {quizGroups.map((projectGroup) => (
                  <Card key={projectGroup.project.id}>
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold text-text">{projectGroup.project.name}</p>
                      <p className="text-xs text-muted">
                        {projectGroup.tracks.reduce((acc, trackGroup) => acc + trackGroup.quizzes.length, 0)} quiz(es)
                      </p>
                    </div>

                    <div className="divide-y divide-border">
                      {projectGroup.tracks.map((trackGroup) => (
                        <div key={trackGroup.track.id}>
                          <div className="bg-surface-2/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                            Faixa {trackGroup.track.order}: {trackGroup.track.title}
                          </div>

                          <div className="grid grid-cols-[minmax(0,1fr)_120px_90px] gap-3 border-b border-border bg-surface-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                            <span>Quiz</span>
                            <span>Questões</span>
                            <span className="text-center">Ações</span>
                          </div>

                          <div className="divide-y divide-border">
                            {trackGroup.quizzes.map((quiz) => (
                              <div
                                key={quiz.id}
                                className="grid grid-cols-[minmax(0,1fr)_120px_90px] items-center gap-3 px-4 py-3"
                              >
                                <p className="truncate text-sm text-text">{quiz.title}</p>
                                <p className="text-sm text-muted">{quiz.questionsJson?.length ?? 0}</p>
                                <div className="flex items-center justify-center">
                                  <IconButton
                                    label="Desativar quiz"
                                    icon={<Trash2 className="h-4 w-4" />}
                                    variant="danger"
                                    onClick={() =>
                                      setDeleteTargetQuiz({
                                        project: projectGroup.project,
                                        track: trackGroup.track,
                                        quiz,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <>
              <Table
                columns={quizTrashColumns}
                data={deletedQuizRows}
                keyExtractor={(row) => row.quiz.id}
                emptyMessage={emptyMessage(mode, Boolean(projectSlug))}
              />
              {deletedQuizzesResponse?.pagination && deletedQuizzesResponse.pagination.totalPages > 1 && (
                <Pagination
                  page={quizzesTrashPage}
                  totalPages={deletedQuizzesResponse.pagination.totalPages}
                  total={deletedQuizzesResponse.pagination.total}
                  onPageChange={setQuizzesTrashPage}
                />
              )}
            </>
          )}
        </>
      )}

      <Modal
        isOpen={mode === 'materials' && createMaterialOpen}
        onClose={() => setCreateMaterialOpen(false)}
        title="Adicionar material"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateMaterialOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMaterialMutation.mutate()}
              isLoading={createMaterialMutation.isPending}
              disabled={!materialForm.trackSceneTemplateId || !materialForm.title.trim()}
            >
              Cadastrar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            id="materialProjectTemplateId"
            label="Projeto"
            value={materialForm.projectTemplateId}
            onChange={(event) => setMaterialForm((prev) => ({ ...prev, projectTemplateId: event.target.value, trackSceneTemplateId: '' }))}
            options={projects.map((project) => ({ value: project.id, label: project.name }))}
            placeholder="Selecionar projeto..."
          />
          <Select
            id="materialTrackSceneTemplateId"
            label="Faixa"
            value={materialForm.trackSceneTemplateId}
            onChange={(event) => setMaterialForm((prev) => ({ ...prev, trackSceneTemplateId: event.target.value }))}
            options={materialTrackOptions}
            placeholder="Selecionar faixa..."
            required
          />
          <Select
            id="materialType"
            label="Tipo"
            value={materialForm.type}
            onChange={(event) => setMaterialForm((prev) => ({ ...prev, type: event.target.value as TrackMaterialTemplate['type'] }))}
            options={Object.entries(TRACK_MATERIAL_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Input
            id="materialTitle"
            label="Título"
            value={materialForm.title}
            onChange={(event) => setMaterialForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          {materialForm.type === 'TEXT' ? (
            <Textarea
              id="materialTextContent"
              label="Conteúdo"
              value={materialForm.defaultTextContent}
              onChange={(event) => setMaterialForm((prev) => ({ ...prev, defaultTextContent: event.target.value }))}
            />
          ) : (
            <Input
              id="materialContentUrl"
              label="Conteúdo (URL ou key)"
              value={materialForm.defaultContentUrl}
              onChange={(event) => setMaterialForm((prev) => ({ ...prev, defaultContentUrl: event.target.value }))}
              placeholder={materialForm.type === 'LINK' ? 'https://...' : 'chave do arquivo'}
            />
          )}
        </div>
      </Modal>

      <Modal
        isOpen={mode === 'study-tracks' && createStudyTrackOpen}
        onClose={() => setCreateStudyTrackOpen(false)}
        title="Adicionar trilha"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateStudyTrackOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createStudyTrackMutation.mutate()}
              isLoading={createStudyTrackMutation.isPending}
              disabled={!studyTrackForm.trackSceneTemplateId || !studyTrackForm.title.trim()}
            >
              Cadastrar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            id="studyTrackProjectTemplateId"
            label="Projeto"
            value={studyTrackForm.projectTemplateId}
            onChange={(event) => setStudyTrackForm((prev) => ({ ...prev, projectTemplateId: event.target.value, trackSceneTemplateId: '' }))}
            options={projects.map((project) => ({ value: project.id, label: project.name }))}
            placeholder="Selecionar projeto..."
          />
          <Select
            id="studyTrackTrackSceneTemplateId"
            label="Faixa"
            value={studyTrackForm.trackSceneTemplateId}
            onChange={(event) => setStudyTrackForm((prev) => ({ ...prev, trackSceneTemplateId: event.target.value }))}
            options={studyTrackTrackOptions}
            placeholder="Selecionar faixa..."
            required
          />
          <Input
            id="studyTrackTitle"
            label="Título"
            value={studyTrackForm.title}
            onChange={(event) => setStudyTrackForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <Textarea
            id="studyTrackDescription"
            label="Descrição"
            value={studyTrackForm.description}
            onChange={(event) => setStudyTrackForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <Textarea
            id="studyTrackTechnicalNotes"
            label="Notas técnicas"
            value={studyTrackForm.technicalNotes}
            onChange={(event) => setStudyTrackForm((prev) => ({ ...prev, technicalNotes: event.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        isOpen={mode === 'press-quizzes' && createQuizOpen}
        onClose={() => setCreateQuizOpen(false)}
        title="Adicionar quiz"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateQuizOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createQuizMutation.mutate()}
              isLoading={createQuizMutation.isPending}
              disabled={!quizForm.trackSceneTemplateId || !quizForm.title.trim()}
            >
              Cadastrar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            id="quizProjectTemplateId"
            label="Projeto"
            value={quizForm.projectTemplateId}
            onChange={(event) => setQuizForm((prev) => ({ ...prev, projectTemplateId: event.target.value, trackSceneTemplateId: '' }))}
            options={projects.map((project) => ({ value: project.id, label: project.name }))}
            placeholder="Selecionar projeto..."
          />
          <Select
            id="quizTrackSceneTemplateId"
            label="Faixa"
            value={quizForm.trackSceneTemplateId}
            onChange={(event) => setQuizForm((prev) => ({ ...prev, trackSceneTemplateId: event.target.value }))}
            options={quizTrackOptions}
            placeholder="Selecionar faixa..."
            required
          />
          <Input
            id="quizTitle"
            label="Título"
            value={quizForm.title}
            onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <Textarea
            id="quizDescription"
            label="Descrição"
            value={quizForm.description}
            onChange={(event) => setQuizForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <Input
            id="quizMaxAttempts"
            label="Máximo de tentativas"
            type="number"
            value={String(quizForm.maxAttempts)}
            onChange={(event) => setQuizForm((prev) => ({ ...prev, maxAttempts: Number(event.target.value) }))}
          />
          <Input
            id="quizPassingScore"
            label="Nota mínima (%)"
            type="number"
            value={String(quizForm.passingScore)}
            onChange={(event) => setQuizForm((prev) => ({ ...prev, passingScore: Number(event.target.value) }))}
          />
        </div>
      </Modal>

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

      <ConfirmModal
        isOpen={mode === 'materials' && !!deleteTargetMaterial}
        onClose={() => setDeleteTargetMaterial(null)}
        onConfirm={() => deleteMaterialMutation.mutate()}
        isLoading={deleteMaterialMutation.isPending}
        title="Desativar material"
        message={`Confirma a desativação de "${deleteTargetMaterial?.material.title}"?`}
      />

      <ConfirmModal
        isOpen={mode === 'materials' && !!restoreTargetMaterial}
        onClose={() => setRestoreTargetMaterial(null)}
        onConfirm={() => restoreMaterialMutation.mutate()}
        isLoading={restoreMaterialMutation.isPending}
        title="Restaurar material"
        message={`Confirma a restauração de "${restoreTargetMaterial?.material.title}"?`}
        confirmLabel="Restaurar"
      />

      <ConfirmModal
        isOpen={mode === 'study-tracks' && !!deleteTargetStudyTrack}
        onClose={() => setDeleteTargetStudyTrack(null)}
        onConfirm={() => deleteStudyTrackMutation.mutate()}
        isLoading={deleteStudyTrackMutation.isPending}
        title="Desativar trilha"
        message={`Confirma a desativação de "${deleteTargetStudyTrack?.studyTrack.title}"?`}
      />

      <ConfirmModal
        isOpen={mode === 'study-tracks' && !!restoreTargetStudyTrack}
        onClose={() => setRestoreTargetStudyTrack(null)}
        onConfirm={() => restoreStudyTrackMutation.mutate()}
        isLoading={restoreStudyTrackMutation.isPending}
        title="Restaurar trilha"
        message={`Confirma a restauração de "${restoreTargetStudyTrack?.studyTrack.title}"?`}
        confirmLabel="Restaurar"
      />

      <ConfirmModal
        isOpen={mode === 'press-quizzes' && !!deleteTargetQuiz}
        onClose={() => setDeleteTargetQuiz(null)}
        onConfirm={() => deleteQuizMutation.mutate()}
        isLoading={deleteQuizMutation.isPending}
        title="Desativar quiz"
        message={`Confirma a desativação de "${deleteTargetQuiz?.quiz.title}"?`}
      />

      <ConfirmModal
        isOpen={mode === 'press-quizzes' && !!restoreTargetQuiz}
        onClose={() => setRestoreTargetQuiz(null)}
        onConfirm={() => restoreQuizMutation.mutate()}
        isLoading={restoreQuizMutation.isPending}
        title="Restaurar quiz"
        message={`Confirma a restauração de "${restoreTargetQuiz?.quiz.title}"?`}
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
