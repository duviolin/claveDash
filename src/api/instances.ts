import { api } from './client'
import type {
  PaginatedResponse,
  PressQuizTemplate,
  Project,
  StudyTrackTemplate,
  TrackMaterialTemplate,
  TrackMaterialType,
  TrackSceneTemplate,
} from '@/types'
import { fetchAllPaginated } from '@/lib/pagination'

interface ListProjectInstancesParams {
  page: number
  limit: number
  seasonId?: string
  classId?: string
  templateId?: string
}

function isProjectInstance(project: Project): boolean {
  return Boolean(project.templateId && project.classId && project.seasonId)
}

export async function listProjectInstancesPaginated(params: ListProjectInstancesParams) {
  const { data } = await api.get<PaginatedResponse<Project>>('/project-instances', { params })
  return {
    ...data,
    data: data.data.filter(isProjectInstance),
  }
}

export async function listDeletedProjectInstances(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<Project>>('/project-instances/deleted', { params })
  return {
    ...data,
    data: data.data.filter(isProjectInstance),
  }
}

export async function listAllProjectInstances(filters?: Omit<ListProjectInstancesParams, 'page' | 'limit'>): Promise<Project[]> {
  return fetchAllPaginated((pagination) => listProjectInstancesPaginated({ ...filters, ...pagination }))
}

export async function instantiateProject(payload: {
  templateId: string
  classId: string
  seasonId: string
}): Promise<Project> {
  const { data } = await api.post<Project>('/project-instances', payload)
  return data
}

/** Lista projetos do semestre. Endpoint pode existir no backend mesmo não documentado. */
export async function listProjects(seasonId: string): Promise<Project[]> {
  const { data } = await api.get<Project[]>(`/seasons/${seasonId}/projects`)
  return data
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get<Project>(`/projects/${id}`)
  return data
}

export async function updateProject(
  id: string,
  payload: { name?: string; description?: string; coverImage?: string }
): Promise<Project> {
  const { data } = await api.patch<Project>(`/project-instances/${id}`, payload)
  return data
}

export async function publishProject(id: string): Promise<Project> {
  const { data } = await api.patch<Project>(`/project-instances/${id}/publish`)
  return data
}

export async function unpublishProject(id: string): Promise<Project> {
  const { data } = await api.patch<Project>(`/project-instances/${id}/unpublish`)
  return data
}

export async function deleteProjectInstance(id: string): Promise<void> {
  await api.delete(`/project-instances/${id}`)
}

export async function restoreProjectInstance(id: string): Promise<Project> {
  const { data } = await api.patch<Project>(`/project-instances/${id}/restore`)
  return data
}

export async function updateTrackScene(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/track-scenes/${id}`, payload)
  return data
}

export async function publishTrackScene(id: string) {
  const { data } = await api.patch(`/track-scenes/${id}/publish`)
  return data
}

export async function updateTrackMaterial(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/track-materials/${id}`, payload)
  return data
}

export async function updateStudyTrack(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/study-tracks/${id}`, payload)
  return data
}

export async function instantiatePressQuiz(payload: { templateId: string; trackSceneId: string; seasonId: string }) {
  const { data } = await api.post('/press-quizzes/from-template', payload)
  return data
}

export async function updatePressQuiz(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/press-quizzes/${id}`, payload)
  return data
}

export async function activatePressQuiz(id: string) {
  const { data } = await api.patch(`/press-quizzes/${id}/activate`)
  return data
}

export async function listTrackSceneInstances(projectId: string, search?: string): Promise<TrackSceneTemplate[]> {
  const { data } = await api.get<Array<{
    id: string
    title: string
    artist: string | null
    description: string | null
    technicalInstruction: string | null
    lyrics: string | null
    order: number
    demoRequired: boolean
    pressQuizRequired: boolean
    createdAt: string
    updatedAt: string
  }>>(`/project-instances/${projectId}/track-scenes`, {
    params: { search },
  })

  return data.map((item) => ({
    id: item.id,
    slug: item.id,
    projectTemplateId: projectId,
    title: item.title,
    artist: item.artist,
    description: item.description,
    technicalInstruction: item.technicalInstruction,
    lyrics: item.lyrics,
    order: item.order,
    unlockAfterTrackId: null,
    demoRequired: item.demoRequired,
    pressQuizRequired: item.pressQuizRequired,
    isActive: true,
    version: 1,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))
}

export async function createTrackSceneInstance(projectId: string, payload: {
  title: string
  artist?: string
  description?: string
  technicalInstruction?: string
  lyrics?: string
  demoRequired?: boolean
  pressQuizRequired?: boolean
}): Promise<void> {
  await api.post(`/project-instances/${projectId}/track-scenes`, payload)
}

export async function deleteTrackSceneInstance(id: string): Promise<void> {
  await api.delete(`/track-scenes/${id}`)
}

export async function listTrackMaterialInstances(trackSceneId: string, search?: string): Promise<TrackMaterialTemplate[]> {
  const { data } = await api.get<Array<{
    id: string
    title: string
    type: TrackMaterialType
    contentUrl: string | null
    textContent: string | null
    order: number
    createdAt: string
    updatedAt: string
  }>>(`/track-scenes/${trackSceneId}/materials`, {
    params: { search },
  })

  return data.map((item) => ({
    id: item.id,
    slug: item.id,
    trackSceneTemplateId: trackSceneId,
    type: item.type,
    title: item.title,
    defaultContentUrl: item.contentUrl,
    defaultTextContent: item.textContent,
    order: item.order,
    isActive: true,
    version: 1,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))
}

export async function createTrackMaterialInstance(trackSceneId: string, payload: {
  type: TrackMaterialType
  title: string
  contentUrl?: string
  textContent?: string
}): Promise<void> {
  await api.post(`/track-scenes/${trackSceneId}/materials`, payload)
}

export async function deleteTrackMaterialInstance(id: string): Promise<void> {
  await api.delete(`/track-materials/${id}`)
}

export async function listStudyTrackInstances(trackSceneId: string, search?: string): Promise<StudyTrackTemplate[]> {
  const { data } = await api.get<Array<{
    id: string
    title: string
    description: string | null
    technicalNotes: string | null
    attachmentType: StudyTrackTemplate['attachmentType']
    attachmentUrl: string | null
    order: number
    createdAt: string
    updatedAt: string
  }>>(`/track-scenes/${trackSceneId}/study-tracks`, {
    params: { search },
  })

  return data.map((item) => ({
    id: item.id,
    slug: item.id,
    trackSceneTemplateId: trackSceneId,
    title: item.title,
    description: item.description,
    technicalNotes: item.technicalNotes,
    attachmentType: item.attachmentType,
    attachmentUrl: item.attachmentUrl,
    order: item.order,
    isActive: true,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))
}

export async function createStudyTrackInstance(trackSceneId: string, payload: {
  title: string
  description?: string
  technicalNotes?: string
  attachmentType?: StudyTrackTemplate['attachmentType']
  attachmentUrl?: string
}): Promise<void> {
  await api.post(`/track-scenes/${trackSceneId}/study-tracks`, payload)
}

export async function deleteStudyTrackInstance(id: string): Promise<void> {
  await api.delete(`/study-tracks/${id}`)
}

export async function listPressQuizInstances(trackSceneId: string, search?: string): Promise<PressQuizTemplate[]> {
  const { data } = await api.get<Array<{
    id: string
    title: string
    description: string | null
    questionsJson: PressQuizTemplate['questionsJson']
    maxAttempts: number
    passingScore: number
    createdAt: string
    updatedAt: string
  }>>(`/track-scenes/${trackSceneId}/press-quizzes`, {
    params: { search },
  })

  return data.map((item) => ({
    id: item.id,
    slug: item.id,
    trackSceneTemplateId: trackSceneId,
    title: item.title,
    description: item.description,
    questionsJson: item.questionsJson,
    maxAttempts: item.maxAttempts,
    passingScore: item.passingScore,
    version: 1,
    isActive: true,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))
}

export async function createPressQuizInstance(trackSceneId: string, payload: {
  title: string
  description?: string
  questionsJson?: PressQuizTemplate['questionsJson']
  maxAttempts?: number
  passingScore?: number
}): Promise<void> {
  await api.post(`/track-scenes/${trackSceneId}/press-quizzes`, payload)
}

export async function deletePressQuizInstance(id: string): Promise<void> {
  await api.delete(`/press-quizzes/${id}`)
}
