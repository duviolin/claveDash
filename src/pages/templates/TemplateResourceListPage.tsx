import { useEffect, useMemo, useState } from 'react'
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
import { DetailFieldList } from '@/components/ui/DetailFieldList'
import { QuizBuilder } from '@/components/ui/QuizBuilder'
import { AIButton } from '@/components/ui/AIButton'
import { FileUpload, type FileUploadFileType } from '@/components/ui/FileUpload'
import { FilePreview } from '@/components/ui/FilePreview'
import { LoadingState } from '@/components/ui/LoadingState'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import { Tabs } from '@/components/ui/Tabs'
import { Pagination } from '@/components/ui/Pagination'
import { ListHeaderFilters } from '@/components/ui/ListHeaderFilters'
import { usePersistedState } from '@/hooks/usePersistedState'
import { presignDownload } from '@/api/storage'
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
  updateMaterialTemplate,
  updatePressQuizTemplate,
  updateStudyTrackTemplate,
  updateTrackTemplate,
} from '@/api/templates'
import { generateQuizQuestion } from '@/api/ai'
import {
  STUDY_TRACK_ATTACHMENT_FILE_TYPE,
  STUDY_TRACK_ATTACHMENT_TYPE_LABELS,
  TRACK_MATERIAL_TYPE_LABELS,
  TRACK_MATERIAL_TYPE_VARIANT,
} from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type {
  PressQuizTemplate,
  ProjectTemplate,
  QuizQuestion,
  StudyTrackAttachmentType,
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
const MATERIAL_FILE_TYPE_BY_CONTENT_TYPE: Partial<Record<TrackMaterialTemplate['type'], FileUploadFileType>> = {
  PDF: 'materials',
  AUDIO: 'materials',
  VIDEO: 'materials',
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
  const [persistedFilters, setPersistedFilters] = usePersistedState({
    storage: 'session',
    key: TEMPLATE_FILTERS_STORAGE_KEY,
    initialValue: { projectSlug: '', trackSlug: '', search: '' },
  })
  const [projectSlug, setProjectSlug] = useState(persistedFilters.projectSlug)
  const [trackSlug, setTrackSlug] = useState(persistedFilters.trackSlug)
  const [searchFilter, setSearchFilter] = useState(persistedFilters.search ?? '')
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState((persistedFilters.search ?? '').trim())
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
  const [previewTrack, setPreviewTrack] = useState<TrackRow | null>(null)
  const [previewMaterial, setPreviewMaterial] = useState<MaterialRow | null>(null)
  const [previewStudyTrack, setPreviewStudyTrack] = useState<StudyTrackRow | null>(null)
  const [previewQuiz, setPreviewQuiz] = useState<QuizRow | null>(null)
  const [deleteTargetTrack, setDeleteTargetTrack] = useState<TrackRow | null>(null)
  const [restoreTargetTrack, setRestoreTargetTrack] = useState<TrackTrashRow | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<MaterialRow | null>(null)
  const [deleteTargetMaterial, setDeleteTargetMaterial] = useState<MaterialRow | null>(null)
  const [restoreTargetMaterial, setRestoreTargetMaterial] = useState<MaterialTrashRow | null>(null)
  const [isMaterialContentUploading, setIsMaterialContentUploading] = useState(false)
  const [editingStudyTrack, setEditingStudyTrack] = useState<StudyTrackRow | null>(null)
  const [isStudyTrackAttachmentUploading, setIsStudyTrackAttachmentUploading] = useState(false)
  const [deleteTargetStudyTrack, setDeleteTargetStudyTrack] = useState<StudyTrackRow | null>(null)
  const [restoreTargetStudyTrack, setRestoreTargetStudyTrack] = useState<StudyTrackTrashRow | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<QuizRow | null>(null)
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
    attachmentType: 'VIDEO' as StudyTrackAttachmentType,
    attachmentUrl: '',
  })
  const [quizForm, setQuizForm] = useState({
    projectTemplateId: '',
    trackSceneTemplateId: '',
    title: '',
    description: '',
    questions: [] as QuizQuestion[],
    maxAttempts: 3,
    passingScore: 70,
  })
  const previewMaterialContentKey = previewMaterial?.material.defaultContentUrl?.trim() ?? ''
  const isDirectMaterialContentUrl = /^https?:\/\//i.test(previewMaterialContentKey)
  const { data: previewMaterialContentUrl, isLoading: isLoadingPreviewMaterialContent } = useQuery({
    queryKey: ['track-material-template-preview-content', previewMaterial?.material.id, previewMaterialContentKey],
    queryFn: async () => {
      if (!previewMaterialContentKey) return null
      if (isDirectMaterialContentUrl) return previewMaterialContentKey
      const { downloadUrl } = await presignDownload(previewMaterialContentKey)
      return downloadUrl
    },
    enabled: Boolean(previewMaterial?.material.defaultContentUrl?.trim()),
    staleTime: 5 * 60 * 1000,
  })
  const studyTrackAttachmentKey = previewStudyTrack?.studyTrack.attachmentUrl?.trim() ?? ''
  const isDirectAttachmentUrl = /^https?:\/\//i.test(studyTrackAttachmentKey)
  const { data: previewStudyTrackAttachmentUrl, isLoading: isLoadingPreviewStudyTrackAttachment } = useQuery({
    queryKey: ['study-track-template-preview-attachment', previewStudyTrack?.studyTrack.id, studyTrackAttachmentKey],
    queryFn: async () => {
      if (!studyTrackAttachmentKey) return null
      if (isDirectAttachmentUrl) return studyTrackAttachmentKey
      const { downloadUrl } = await presignDownload(studyTrackAttachmentKey)
      return downloadUrl
    },
    enabled: Boolean(previewStudyTrack?.studyTrack.attachmentUrl?.trim()),
    staleTime: 5 * 60 * 1000,
  })
  const { blockedInfo, setBlockedInfo, handleBlockedError } = useDeactivationBlockedHandler()

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['project-templates'],
    queryFn: () => listProjectTemplates(),
  })

  const selectedProject = useMemo(
    () => (projectSlug ? projects.find((project) => project.slug === projectSlug) ?? null : null),
    [projectSlug, projects]
  )
  const scopedProjects = useMemo(() => (selectedProject ? [selectedProject] : []), [selectedProject])

  const tracksQueries = useQueries({
    queries: scopedProjects.map((project) => ({
      queryKey: ['resource-list-tracks', project.slug, mode === 'tracks' ? debouncedSearchFilter : ''],
      queryFn: () => listTrackTemplates(project.id, mode === 'tracks' ? (debouncedSearchFilter || undefined) : undefined),
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
    if (mode === 'tracks' || !trackSlug) return trackRows
    return trackRows.filter((row) => row.track.slug === trackSlug)
  }, [mode, trackRows, trackSlug])

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
    queryKey: ['resource-list-tracks', 'deleted', trashPage, selectedProject?.id, debouncedSearchFilter],
    queryFn: () =>
      listDeletedTrackTemplates({
        page: trashPage,
        limit: TRACK_TRASH_PAGE_LIMIT,
        projectTemplateId: selectedProject?.id,
        search: debouncedSearchFilter || undefined,
      }),
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

  const selectedTrackRow = useMemo(() => {
    if (!trackSlug) return null
    return trackRows.find((row) => row.track.slug === trackSlug) ?? null
  }, [trackRows, trackSlug])

  const { data: deletedMaterialsResponse } = useQuery({
    queryKey: ['resource-list-materials', 'deleted', materialsTrashPage, selectedProject?.id, selectedTrackRow?.track.id, debouncedSearchFilter],
    queryFn: () =>
      listDeletedMaterialTemplates({
        page: materialsTrashPage,
        limit: MATERIAL_TRASH_PAGE_LIMIT,
        projectTemplateId: selectedProject?.id,
        trackSceneTemplateId: selectedTrackRow?.track.id,
        search: debouncedSearchFilter || undefined,
      }),
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

  const trackRowsForChildren = useMemo(() => {
    if (!trackSlug) return []
    return trackRows.filter((row) => row.track.slug === trackSlug)
  }, [trackRows, trackSlug])

  const materialQueries = useQueries({
    queries:
      mode === 'materials' && !isMaterialsTrash
        ? trackRowsForChildren.map(({ track }) => ({
            queryKey: ['resource-list-materials', track.id, debouncedSearchFilter],
            queryFn: () => listMaterialTemplates(track.id, debouncedSearchFilter || undefined),
          }))
        : [],
  })

  const studyTrackQueries = useQueries({
    queries:
      mode === 'study-tracks' && !isStudyTracksTrash
        ? trackRowsForChildren.map(({ track }) => ({
            queryKey: ['resource-list-study-tracks', track.id, debouncedSearchFilter],
            queryFn: () => listStudyTrackTemplates(track.id, debouncedSearchFilter || undefined),
          }))
        : [],
  })

  const quizQueries = useQueries({
    queries:
      mode === 'press-quizzes' && !isQuizzesTrash
        ? trackRowsForChildren.map(({ track }) => ({
            queryKey: ['resource-list-press-quizzes', track.id, debouncedSearchFilter],
            queryFn: () => listPressQuizTemplates(track.id, debouncedSearchFilter || undefined),
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
    queryKey: ['resource-list-study-tracks', 'deleted', studyTracksTrashPage, selectedProject?.id, selectedTrackRow?.track.id, debouncedSearchFilter],
    queryFn: () =>
      listDeletedStudyTrackTemplates({
        page: studyTracksTrashPage,
        limit: STUDY_TRACK_TRASH_PAGE_LIMIT,
        projectTemplateId: selectedProject?.id,
        trackSceneTemplateId: selectedTrackRow?.track.id,
        search: debouncedSearchFilter || undefined,
      }),
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
    queryKey: ['resource-list-press-quizzes', 'deleted', quizzesTrashPage, selectedProject?.id, selectedTrackRow?.track.id, debouncedSearchFilter],
    queryFn: () =>
      listDeletedPressQuizTemplates({
        page: quizzesTrashPage,
        limit: QUIZ_TRASH_PAGE_LIMIT,
        projectTemplateId: selectedProject?.id,
        trackSceneTemplateId: selectedTrackRow?.track.id,
        search: debouncedSearchFilter || undefined,
      }),
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
        defaultContentUrl:
          materialForm.type === 'TEXT'
            ? undefined
            : materialForm.defaultContentUrl.trim()
              ? materialForm.defaultContentUrl
              : undefined,
        defaultTextContent:
          materialForm.type === 'TEXT'
            ? materialForm.defaultTextContent.trim()
              ? materialForm.defaultTextContent
              : undefined
            : undefined,
      }),
    onSuccess: () => {
      toast.success('Material cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-materials'] })
      setCreateMaterialOpen(false)
      setIsMaterialContentUploading(false)
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

  const updateMaterialMutation = useMutation({
    mutationFn: () =>
      updateMaterialTemplate(editingMaterial!.material.id, {
        type: materialForm.type,
        title: materialForm.title,
        defaultContentUrl:
          materialForm.type === 'TEXT'
            ? null
            : materialForm.defaultContentUrl.trim()
              ? materialForm.defaultContentUrl
              : null,
        defaultTextContent:
          materialForm.type === 'TEXT'
            ? materialForm.defaultTextContent.trim()
              ? materialForm.defaultTextContent
              : null
            : null,
      }),
    onSuccess: () => {
      toast.success('Material atualizado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-materials'] })
      setIsMaterialContentUploading(false)
      setEditingMaterial(null)
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
        attachmentType: studyTrackForm.attachmentUrl.trim() ? studyTrackForm.attachmentType : undefined,
        attachmentUrl: studyTrackForm.attachmentUrl.trim() ? studyTrackForm.attachmentUrl : undefined,
      }),
    onSuccess: () => {
      toast.success('Trilha cadastrada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-study-tracks'] })
      setCreateStudyTrackOpen(false)
      setIsStudyTrackAttachmentUploading(false)
      setStudyTrackForm({
        projectTemplateId: selectedProject?.id ?? selectedTrackRow?.project.id ?? '',
        trackSceneTemplateId: selectedTrackRow?.track.id ?? '',
        title: '',
        description: '',
        technicalNotes: '',
        attachmentType: 'VIDEO',
        attachmentUrl: '',
      })
    },
  })

  const updateStudyTrackMutation = useMutation({
    mutationFn: () =>
      updateStudyTrackTemplate(editingStudyTrack!.studyTrack.id, {
        title: studyTrackForm.title,
        description: studyTrackForm.description.trim() ? studyTrackForm.description : null,
        technicalNotes: studyTrackForm.technicalNotes.trim() ? studyTrackForm.technicalNotes : null,
        attachmentType: studyTrackForm.attachmentUrl.trim() ? studyTrackForm.attachmentType : null,
        attachmentUrl: studyTrackForm.attachmentUrl.trim() ? studyTrackForm.attachmentUrl : null,
      }),
    onSuccess: () => {
      toast.success('Trilha atualizada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-study-tracks'] })
      setIsStudyTrackAttachmentUploading(false)
      setEditingStudyTrack(null)
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
        questionsJson: quizForm.questions.length > 0 ? quizForm.questions : undefined,
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
        questions: [],
        maxAttempts: 3,
        passingScore: 70,
      })
    },
  })

  const updateQuizMutation = useMutation({
    mutationFn: () =>
      updatePressQuizTemplate(editingQuiz!.quiz.id, {
        title: quizForm.title,
        description: quizForm.description.trim() ? quizForm.description : null,
        questionsJson: quizForm.questions.length > 0 ? quizForm.questions : null,
        maxAttempts: quizForm.maxAttempts,
        passingScore: quizForm.passingScore,
      }),
    onSuccess: () => {
      toast.success('Quiz atualizado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['resource-list-press-quizzes'] })
      setEditingQuiz(null)
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

  const selectedQuizProject = useMemo(
    () => projects.find((project) => project.id === quizForm.projectTemplateId) ?? null,
    [projects, quizForm.projectTemplateId]
  )

  const selectedQuizTrack = useMemo(
    () => trackRows.find((row) => row.track.id === quizForm.trackSceneTemplateId)?.track ?? null,
    [trackRows, quizForm.trackSceneTemplateId]
  )

  useEffect(() => {
    setPersistedFilters({ projectSlug, trackSlug, search: searchFilter })
  }, [projectSlug, searchFilter, setPersistedFilters, trackSlug])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchFilter(searchFilter.trim())
      setTrashPage(1)
      setMaterialsTrashPage(1)
      setStudyTracksTrashPage(1)
      setQuizzesTrashPage(1)
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [searchFilter])

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
                ? (deletedMaterialsResponse?.pagination.total ?? deletedMaterialRows.length)
                : filteredMaterialRows.length)
            : mode === 'study-tracks'
              ? (isStudyTracksTrash
                  ? (deletedStudyTracksResponse?.pagination.total ?? deletedStudyTrackRows.length)
                  : filteredStudyTrackRows.length)
              : (isQuizzesTrash
                  ? (deletedQuizzesResponse?.pagination.total ?? deletedQuizRows.length)
                  : filteredQuizRows.length)
      }
      action={
        <ListHeaderFilters
          projectValue={projectSlug}
          onProjectChange={(value) => {
            setProjectSlug(value)
            setTrackSlug('')
          }}
          projectOptions={projects.map((project) => ({ value: project.slug, label: project.name }))}
          showTrackFilter={mode === 'materials' || mode === 'study-tracks' || mode === 'press-quizzes'}
          trackValue={trackSlug}
          onTrackChange={setTrackSlug}
          trackOptions={availableTrackOptions}
          searchValue={searchFilter}
          onSearchChange={setSearchFilter}
          searchPlaceholder={mode === 'tracks' ? 'Buscar faixa por título' : mode === 'materials' ? 'Buscar material por título' : mode === 'study-tracks' ? 'Buscar trilha por título' : 'Buscar quiz por título'}
          searchDisabled={mode !== 'tracks' && !trackSlug}
        >
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
                setIsMaterialContentUploading(false)
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
                  attachmentType: 'VIDEO',
                  attachmentUrl: '',
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
                  questions: [],
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
        </ListHeaderFilters>
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
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,260px)_120px] gap-3 border-b border-border bg-surface-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <span>Faixa</span>
                    <span>Artista</span>
                    <span className="text-center">Ações</span>
                  </div>
                  <div className="divide-y divide-border">
                    {group.tracks.map((track) => (
                      <div
                        key={track.id}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,260px)_120px] items-center gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text">
                            {track.order}. {track.title}
                          </p>
                        </div>
                        <p className="truncate text-sm text-muted">{track.artist || '—'}</p>
                        <div className="flex items-center justify-center gap-1">
                          <IconButton
                            label="Visualizar faixa"
                            icon={<Eye className="h-4 w-4" />}
                            onClick={() => setPreviewTrack({ project: group.project, track })}
                          />
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

                          <div className="grid grid-cols-[minmax(0,1fr)_120px_160px] gap-3 border-b border-border bg-surface-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                            <span>Material</span>
                            <span>Tipo</span>
                            <span className="text-center">Ações</span>
                          </div>

                          <div className="divide-y divide-border">
                            {trackGroup.materials.map((material) => (
                              <div
                                key={material.id}
                                className="grid grid-cols-[minmax(0,1fr)_120px_160px] items-center gap-3 px-4 py-3"
                              >
                                <p className="truncate text-sm text-text">{material.title}</p>
                                <Badge variant={TRACK_MATERIAL_TYPE_VARIANT[material.type]} className="w-fit text-[10px]">
                                  {TRACK_MATERIAL_TYPE_LABELS[material.type]}
                                </Badge>
                                <div className="flex items-center justify-center gap-1">
                                  <IconButton
                                    label="Visualizar material"
                                    icon={<Eye className="h-4 w-4" />}
                                    onClick={() =>
                                      setPreviewMaterial({
                                        project: projectGroup.project,
                                        track: trackGroup.track,
                                        material,
                                      })
                                    }
                                  />
                                  <IconButton
                                    label="Editar material"
                                    icon={<Pencil className="h-4 w-4" />}
                                    onClick={() => {
                                      setIsMaterialContentUploading(false)
                                      setEditingMaterial({
                                        project: projectGroup.project,
                                        track: trackGroup.track,
                                        material,
                                      })
                                      setMaterialForm({
                                        projectTemplateId: projectGroup.project.id,
                                        trackSceneTemplateId: trackGroup.track.id,
                                        type: material.type,
                                        title: material.title,
                                        defaultContentUrl: material.defaultContentUrl || '',
                                        defaultTextContent: material.defaultTextContent || '',
                                      })
                                    }}
                                  />
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

                          <div className="grid grid-cols-[minmax(0,1fr)_160px] gap-3 border-b border-border bg-surface-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                            <span>Trilha</span>
                            <span className="text-center">Ações</span>
                          </div>

                          <div className="divide-y divide-border">
                            {trackGroup.studyTracks.map((studyTrack) => (
                              <div
                                key={studyTrack.id}
                                className="grid grid-cols-[minmax(0,1fr)_160px] items-center gap-3 px-4 py-3"
                              >
                                <p className="truncate text-sm text-text">{studyTrack.title}</p>
                                <div className="flex items-center justify-center gap-1">
                                  <IconButton
                                    label="Visualizar trilha"
                                    icon={<Eye className="h-4 w-4" />}
                                    onClick={() =>
                                      setPreviewStudyTrack({
                                        project: projectGroup.project,
                                        track: trackGroup.track,
                                        studyTrack,
                                      })
                                    }
                                  />
                                  <IconButton
                                    label="Editar trilha"
                                    icon={<Pencil className="h-4 w-4" />}
                                    onClick={() => {
                                      setEditingStudyTrack({
                                        project: projectGroup.project,
                                        track: trackGroup.track,
                                        studyTrack,
                                      })
                                      setStudyTrackForm({
                                        projectTemplateId: projectGroup.project.id,
                                        trackSceneTemplateId: trackGroup.track.id,
                                        title: studyTrack.title,
                                        description: studyTrack.description || '',
                                        technicalNotes: studyTrack.technicalNotes || '',
                                        attachmentType: studyTrack.attachmentType || 'VIDEO',
                                        attachmentUrl: studyTrack.attachmentUrl || '',
                                      })
                                    }}
                                  />
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

                          <div className="grid grid-cols-[minmax(0,1fr)_120px_160px] gap-3 border-b border-border bg-surface-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                            <span>Quiz</span>
                            <span>Questões</span>
                            <span className="text-center">Ações</span>
                          </div>

                          <div className="divide-y divide-border">
                            {trackGroup.quizzes.map((quiz) => (
                              <div
                                key={quiz.id}
                                className="grid grid-cols-[minmax(0,1fr)_120px_160px] items-center gap-3 px-4 py-3"
                              >
                                <p className="truncate text-sm text-text">{quiz.title}</p>
                                <p className="text-sm text-muted">{quiz.questionsJson?.length ?? 0}</p>
                                <div className="flex items-center justify-center gap-1">
                                  <IconButton
                                    label="Visualizar quiz"
                                    icon={<Eye className="h-4 w-4" />}
                                    onClick={() =>
                                      setPreviewQuiz({
                                        project: projectGroup.project,
                                        track: trackGroup.track,
                                        quiz,
                                      })
                                    }
                                  />
                                  <IconButton
                                    label="Editar quiz"
                                    icon={<Pencil className="h-4 w-4" />}
                                    onClick={() => {
                                      setEditingQuiz({
                                        project: projectGroup.project,
                                        track: trackGroup.track,
                                        quiz,
                                      })
                                      setQuizForm({
                                        projectTemplateId: projectGroup.project.id,
                                        trackSceneTemplateId: trackGroup.track.id,
                                        title: quiz.title,
                                        description: quiz.description || '',
                                        questions: quiz.questionsJson || [],
                                        maxAttempts: quiz.maxAttempts,
                                        passingScore: quiz.passingScore,
                                      })
                                    }}
                                  />
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
        isOpen={mode === 'tracks' && !!previewTrack}
        onClose={() => setPreviewTrack(null)}
        title="Dados da faixa"
        footer={<Button variant="secondary" onClick={() => setPreviewTrack(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <DetailFieldList
            items={[
              { label: 'Projeto', value: previewTrack?.project.name ?? '—' },
              { label: 'Faixa', value: previewTrack?.track.title ?? '—' },
              { label: 'Artista', value: previewTrack?.track.artist || '—' },
              { label: 'Versão', value: previewTrack ? `v${previewTrack.track.version}` : '—' },
              { label: 'Atualizado em', value: previewTrack ? formatDate(previewTrack.track.updatedAt) : '—' },
            ]}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Descrição</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text">
              {previewTrack?.track.description?.trim() || 'Sem descrição.'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Instrução técnica</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text">
              {previewTrack?.track.technicalInstruction?.trim() || 'Sem instrução técnica.'}
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={mode === 'materials' && !!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        title="Dados do material"
        footer={<Button variant="secondary" onClick={() => setPreviewMaterial(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <DetailFieldList
            items={[
              { label: 'Projeto', value: previewMaterial?.project.name ?? '—' },
              { label: 'Faixa', value: previewMaterial?.track.title ?? '—' },
              { label: 'Título', value: previewMaterial?.material.title ?? '—' },
              { label: 'Ordem', value: previewMaterial ? String(previewMaterial.material.order) : '—' },
              { label: 'Atualizado em', value: previewMaterial ? formatDate(previewMaterial.material.updatedAt) : '—' },
            ]}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Tipo</p>
            <div className="mt-1">
              {previewMaterial ? (
                <Badge variant={TRACK_MATERIAL_TYPE_VARIANT[previewMaterial.material.type]}>
                  {TRACK_MATERIAL_TYPE_LABELS[previewMaterial.material.type]}
                </Badge>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          </div>
          {previewMaterial?.material.type === 'TEXT' ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Conteúdo em texto</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-text">
                {previewMaterial?.material.defaultTextContent?.trim() || 'Não informado.'}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Conteúdo</p>
              {!previewMaterialContentKey ? (
                <p className="mt-1 text-sm text-text">Não informado.</p>
              ) : isLoadingPreviewMaterialContent ? (
                <p className="mt-1 text-sm text-muted">Carregando prévia...</p>
              ) : (
                <div className="mt-2">
                  <FilePreview
                    fileName={previewMaterialContentKey.split('/').pop() ?? 'arquivo'}
                    sourceUrl={previewMaterialContentUrl ?? null}
                    compact
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={mode === 'study-tracks' && !!previewStudyTrack}
        onClose={() => setPreviewStudyTrack(null)}
        title="Dados da trilha"
        footer={<Button variant="secondary" onClick={() => setPreviewStudyTrack(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <DetailFieldList
            items={[
              { label: 'Projeto', value: previewStudyTrack?.project.name ?? '—' },
              { label: 'Faixa', value: previewStudyTrack?.track.title ?? '—' },
              { label: 'Trilha', value: previewStudyTrack?.studyTrack.title ?? '—' },
              { label: 'Ordem', value: previewStudyTrack ? String(previewStudyTrack.studyTrack.order) : '—' },
              { label: 'Atualizado em', value: previewStudyTrack ? formatDate(previewStudyTrack.studyTrack.updatedAt) : '—' },
            ]}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Descrição</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text">
              {previewStudyTrack?.studyTrack.description?.trim() || 'Sem descrição.'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Notas técnicas</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text">
              {previewStudyTrack?.studyTrack.technicalNotes?.trim() || 'Sem notas técnicas.'}
            </p>
          </div>
          <DetailFieldList
            items={[
              {
                label: 'Tipo de arquivo',
                value: previewStudyTrack?.studyTrack.attachmentType
                  ? STUDY_TRACK_ATTACHMENT_TYPE_LABELS[previewStudyTrack.studyTrack.attachmentType]
                  : 'Não enviado.',
              },
            ]}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Arquivo</p>
            {!studyTrackAttachmentKey ? (
              <p className="mt-1 text-sm text-text">Não enviado.</p>
            ) : isLoadingPreviewStudyTrackAttachment ? (
              <p className="mt-1 text-sm text-muted">Carregando prévia...</p>
            ) : (
              <div className="mt-2 space-y-2">
                <FilePreview
                  fileName={studyTrackAttachmentKey.split('/').pop() ?? 'arquivo'}
                  sourceUrl={previewStudyTrackAttachmentUrl ?? null}
                  compact
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={mode === 'press-quizzes' && !!previewQuiz}
        onClose={() => setPreviewQuiz(null)}
        title="Dados do quiz"
        footer={<Button variant="secondary" onClick={() => setPreviewQuiz(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <DetailFieldList
            items={[
              { label: 'Projeto', value: previewQuiz?.project.name ?? '—' },
              { label: 'Faixa', value: previewQuiz?.track.title ?? '—' },
              { label: 'Quiz', value: previewQuiz?.quiz.title ?? '—' },
              { label: 'Questões', value: previewQuiz ? String(previewQuiz.quiz.questionsJson?.length ?? 0) : '—' },
              { label: 'Tentativas máximas', value: previewQuiz ? String(previewQuiz.quiz.maxAttempts) : '—' },
              { label: 'Nota mínima', value: previewQuiz ? `${previewQuiz.quiz.passingScore}%` : '—' },
              { label: 'Versão', value: previewQuiz ? `v${previewQuiz.quiz.version}` : '—' },
              { label: 'Atualizado em', value: previewQuiz ? formatDate(previewQuiz.quiz.updatedAt) : '—' },
            ]}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Descrição</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text">
              {previewQuiz?.quiz.description?.trim() || 'Sem descrição.'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted">Perguntas</p>
            {!previewQuiz?.quiz.questionsJson?.length ? (
              <p className="text-sm text-muted">Nenhuma pergunta cadastrada.</p>
            ) : (
              <div className="space-y-3">
                {previewQuiz.quiz.questionsJson.map((question, index) => (
                  <div
                    key={`${previewQuiz.quiz.id}-${index}`}
                    className="rounded-lg border border-border bg-surface px-3 py-3"
                  >
                    <p className="text-sm font-medium text-text">
                      {index + 1}. {question.question || 'Sem enunciado'}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {question.options.map((option, optionIndex) => (
                        <li
                          key={`${previewQuiz.quiz.id}-${index}-${optionIndex}`}
                          className="text-sm"
                        >
                          <span className={question.correctIndex === optionIndex ? 'font-medium text-success' : 'text-muted'}>
                            {String.fromCharCode(65 + optionIndex)}. {option || 'Sem texto'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={mode === 'materials' && (createMaterialOpen || !!editingMaterial)}
        onClose={() => {
          setCreateMaterialOpen(false)
          setEditingMaterial(null)
          setIsMaterialContentUploading(false)
        }}
        title={editingMaterial ? 'Editar material' : 'Adicionar material'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreateMaterialOpen(false)
                setEditingMaterial(null)
                setIsMaterialContentUploading(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => (editingMaterial ? updateMaterialMutation.mutate() : createMaterialMutation.mutate())}
              isLoading={createMaterialMutation.isPending || updateMaterialMutation.isPending}
              disabled={!materialForm.trackSceneTemplateId || !materialForm.title.trim() || isMaterialContentUploading}
            >
              {isMaterialContentUploading ? 'Aguardando upload...' : editingMaterial ? 'Salvar alterações' : 'Cadastrar'}
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
            onChange={(event) => {
              const nextType = event.target.value as TrackMaterialTemplate['type']
              setMaterialForm((prev) => ({
                ...prev,
                type: nextType,
                defaultContentUrl: nextType === 'TEXT' ? '' : prev.defaultContentUrl,
                defaultTextContent: nextType === 'TEXT' ? prev.defaultTextContent : '',
              }))
            }}
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
          ) : materialForm.type === 'LINK' ? (
            <Input
              id="materialContentUrl"
              label="Conteúdo (URL)"
              value={materialForm.defaultContentUrl}
              onChange={(event) => setMaterialForm((prev) => ({ ...prev, defaultContentUrl: event.target.value }))}
              placeholder="https://..."
            />
          ) : (
            <FileUpload
              fileType={MATERIAL_FILE_TYPE_BY_CONTENT_TYPE[materialForm.type] ?? 'materials'}
              entityType="track-material-template"
              entityId={editingMaterial?.material.id || 'draft'}
              currentValue={materialForm.defaultContentUrl || null}
              onUploadComplete={(key) => setMaterialForm((prev) => ({ ...prev, defaultContentUrl: key }))}
              onUploadingChange={setIsMaterialContentUploading}
              onRemove={() => setMaterialForm((prev) => ({ ...prev, defaultContentUrl: '' }))}
              label={`Arquivo do material (${TRACK_MATERIAL_TYPE_LABELS[materialForm.type]})`}
              compact
            />
          )}
        </div>
      </Modal>

      <Modal
        isOpen={mode === 'study-tracks' && (createStudyTrackOpen || !!editingStudyTrack)}
        onClose={() => {
          setCreateStudyTrackOpen(false)
          setEditingStudyTrack(null)
          setIsStudyTrackAttachmentUploading(false)
        }}
        title={editingStudyTrack ? 'Editar trilha' : 'Adicionar trilha'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreateStudyTrackOpen(false)
                setEditingStudyTrack(null)
                setIsStudyTrackAttachmentUploading(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => (editingStudyTrack ? updateStudyTrackMutation.mutate() : createStudyTrackMutation.mutate())}
              isLoading={createStudyTrackMutation.isPending || updateStudyTrackMutation.isPending}
              disabled={!studyTrackForm.trackSceneTemplateId || !studyTrackForm.title.trim() || isStudyTrackAttachmentUploading}
            >
              {isStudyTrackAttachmentUploading ? 'Aguardando upload...' : editingStudyTrack ? 'Salvar alterações' : 'Cadastrar'}
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
          <Select
            id="studyTrackAttachmentType"
            label="Tipo de arquivo"
            value={studyTrackForm.attachmentType}
            onChange={(event) =>
              setStudyTrackForm((prev) => ({
                ...prev,
                attachmentType: event.target.value as StudyTrackAttachmentType,
                attachmentUrl: '',
              }))
            }
            options={Object.entries(STUDY_TRACK_ATTACHMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FileUpload
            fileType={STUDY_TRACK_ATTACHMENT_FILE_TYPE[studyTrackForm.attachmentType]}
            entityType="study-track-template"
            entityId={editingStudyTrack?.studyTrack.id || 'draft'}
            currentValue={studyTrackForm.attachmentUrl || null}
            onUploadComplete={(key) => setStudyTrackForm((prev) => ({ ...prev, attachmentUrl: key }))}
            onUploadingChange={setIsStudyTrackAttachmentUploading}
            onRemove={() => setStudyTrackForm((prev) => ({ ...prev, attachmentUrl: '' }))}
            label={`Arquivo da trilha (${STUDY_TRACK_ATTACHMENT_TYPE_LABELS[studyTrackForm.attachmentType]})`}
            compact
          />
        </div>
      </Modal>

      <Modal
        isOpen={mode === 'press-quizzes' && (createQuizOpen || !!editingQuiz)}
        onClose={() => {
          setCreateQuizOpen(false)
          setEditingQuiz(null)
        }}
        title={editingQuiz ? 'Editar quiz' : 'Adicionar quiz'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreateQuizOpen(false)
                setEditingQuiz(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => (editingQuiz ? updateQuizMutation.mutate() : createQuizMutation.mutate())}
              isLoading={createQuizMutation.isPending || updateQuizMutation.isPending}
              disabled={!quizForm.trackSceneTemplateId || !quizForm.title.trim()}
            >
              {editingQuiz ? 'Salvar alterações' : 'Cadastrar'}
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
          <div className="space-y-2">
            <p className="block text-sm font-medium text-text">Questões</p>
            <QuizBuilder
              value={quizForm.questions}
              onChange={(questions) => setQuizForm((prev) => ({ ...prev, questions }))}
              footerActions={
                <AIButton
                  label="Adicionar pergunta com IA"
                  extraInputLabel="Instruções extras (opcional)"
                  extraInputPlaceholder="Ex.: dificuldade intermediária, foco em interpretação..."
                  onGenerate={(userExtra) =>
                    generateQuizQuestion({
                      title: quizForm.title || selectedQuizTrack?.title || 'Quiz da faixa',
                      description: quizForm.description || undefined,
                      project: selectedQuizProject
                        ? {
                            name: selectedQuizProject.name,
                            type: selectedQuizProject.type,
                            description: selectedQuizProject.description,
                          }
                        : undefined,
                      track: selectedQuizTrack
                        ? {
                            title: selectedQuizTrack.title,
                            artist: selectedQuizTrack.artist,
                            description: selectedQuizTrack.description,
                            technicalInstruction: selectedQuizTrack.technicalInstruction,
                            lyrics: selectedQuizTrack.lyrics,
                          }
                        : undefined,
                      existingQuestions: quizForm.questions,
                      userExtra,
                    })
                  }
                  onAccept={(raw) => {
                    try {
                      const parsed = JSON.parse(raw)
                      const candidate = Array.isArray(parsed) ? parsed[0] : parsed
                      const question = String(candidate?.question ?? '').trim()
                      const optionsRaw = Array.isArray(candidate?.options) ? candidate.options : []
                      const options = optionsRaw.slice(0, 4).map((opt: unknown) => String(opt ?? '').trim())
                      const correctIndex = Number(candidate?.correctIndex)

                      if (!question || options.length !== 4 || options.some((opt: string) => !opt) || Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
                        throw new Error('Formato inválido')
                      }

                      setQuizForm((prev) => ({
                        ...prev,
                        questions: [...prev.questions, { question, options, correctIndex }],
                      }))
                      toast.success('Pergunta adicionada com IA.')
                    } catch {
                      toast.error('A IA retornou um formato inválido para pergunta.')
                    }
                  }}
                />
              }
            />
          </div>
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
