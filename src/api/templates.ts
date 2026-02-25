import { api } from './client'
import type {
  ProjectTemplate,
  PaginatedResponse,
  TrackSceneTemplate,
  TrackMaterialTemplate,
  TrackMaterialType,
  StudyTrackTemplate,
  PressQuizTemplate,
  ProjectType,
  QuizQuestion,
  ProjectTemplateReadinessSummary,
  ProjectTemplateReadinessRule,
  ProjectTemplateQualitativeAnalysis,
} from '@/types'

// Payload types for template APIs (only updatable fields)
interface CreateTrackTemplatePayload {
  title: string
  artist?: string
  description?: string
  technicalInstruction?: string
  lyrics?: string
  unlockAfterTrackId?: string
}
interface UpdateTrackTemplatePayload {
  title?: string
  artist?: string | null
  description?: string | null
  technicalInstruction?: string | null
  lyrics?: string | null
  unlockAfterTrackId?: string | null
}
interface UpdateMaterialTemplatePayload {
  type?: TrackMaterialType
  title?: string
  defaultContentUrl?: string | null
  defaultTextContent?: string | null
}
interface CreateStudyTrackTemplatePayload {
  title: string
  description?: string
  technicalNotes?: string
  videoUrl?: string
  audioUrl?: string
  pdfUrl?: string
}
interface UpdateStudyTrackTemplatePayload {
  title?: string
  description?: string | null
  technicalNotes?: string | null
  videoUrl?: string | null
  audioUrl?: string | null
  pdfUrl?: string | null
}
interface UpdatePressQuizTemplatePayload {
  title?: string
  description?: string | null
  questionsJson?: QuizQuestion[] | null
  maxAttempts?: number
  passingScore?: number
}

// --- Project Templates ---
export async function listProjectTemplates(courseIdOrSlug?: string) {
  const { data } = await api.get<ProjectTemplate[]>('/project-templates', { params: { courseId: courseIdOrSlug } })
  return data
}

export async function getProjectTemplate(idOrSlug: string) {
  const { data } = await api.get<ProjectTemplate>(`/project-templates/${idOrSlug}`)
  return data
}

export async function createProjectTemplate(payload: { courseId: string; name: string; type: ProjectType; description?: string; coverImage?: string }) {
  const { data } = await api.post<ProjectTemplate>('/project-templates', payload)
  return data
}

export async function updateProjectTemplate(idOrSlug: string, payload: { courseId?: string; name?: string; description?: string; coverImage?: string }) {
  const { data } = await api.patch<ProjectTemplate>(`/project-templates/${idOrSlug}`, payload)
  return data
}

export async function deleteProjectTemplate(idOrSlug: string) {
  await api.delete(`/project-templates/${idOrSlug}`)
}

export async function listDeletedProjectTemplates(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<ProjectTemplate>>('/project-templates/deleted', { params })
  return data
}

export async function restoreProjectTemplate(idOrSlug: string) {
  const { data } = await api.patch<ProjectTemplate>(`/project-templates/${idOrSlug}/restore`)
  return data
}

// --- Track Scene Templates ---
export async function listTrackTemplates(projectTemplateIdOrSlug: string) {
  const { data } = await api.get<TrackSceneTemplate[]>(`/project-templates/${projectTemplateIdOrSlug}/tracks`)
  return data
}

export async function getTrackTemplate(id: string) {
  const { data } = await api.get<TrackSceneTemplate>(`/track-templates/${id}`)
  return data
}

export async function createTrackTemplate(projectTemplateId: string, payload: CreateTrackTemplatePayload) {
  const { data } = await api.post<TrackSceneTemplate>(`/project-templates/${projectTemplateId}/tracks`, payload)
  return data
}

export async function updateTrackTemplate(id: string, payload: UpdateTrackTemplatePayload) {
  const { data } = await api.patch<TrackSceneTemplate>(`/track-templates/${id}`, payload)
  return data
}

export async function deleteTrackTemplate(id: string) {
  await api.delete(`/track-templates/${id}`)
}

export async function listDeletedTrackTemplates(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<TrackSceneTemplate>>('/track-templates/deleted', { params })
  return data
}

export async function restoreTrackTemplate(id: string) {
  const { data } = await api.patch<TrackSceneTemplate>(`/track-templates/${id}/restore`)
  return data
}

export async function reorderTrackTemplates(items: { id: string; order: number }[]) {
  const { data } = await api.patch('/track-templates/reorder', { items })
  return data
}

// --- Track Material Templates ---
export async function listMaterialTemplates(trackTemplateId: string) {
  const { data } = await api.get<TrackMaterialTemplate[]>(`/track-templates/${trackTemplateId}/materials`)
  return data
}

export async function createMaterialTemplate(trackTemplateId: string, payload: { type: TrackMaterialType; title: string; defaultContentUrl?: string; defaultTextContent?: string }) {
  const { data } = await api.post<TrackMaterialTemplate>(`/track-templates/${trackTemplateId}/materials`, payload)
  return data
}

export async function updateMaterialTemplate(id: string, payload: UpdateMaterialTemplatePayload) {
  const { data } = await api.patch<TrackMaterialTemplate>(`/material-templates/${id}`, payload)
  return data
}

export async function deleteMaterialTemplate(id: string) {
  await api.delete(`/material-templates/${id}`)
}

export async function listDeletedMaterialTemplates(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<TrackMaterialTemplate>>('/material-templates/deleted', { params })
  return data
}

export async function restoreMaterialTemplate(id: string) {
  const { data } = await api.patch<TrackMaterialTemplate>(`/material-templates/${id}/restore`)
  return data
}

// --- Study Track Templates ---
export async function listStudyTrackTemplates(trackTemplateId: string) {
  const { data } = await api.get<StudyTrackTemplate[]>(`/track-templates/${trackTemplateId}/study-tracks`)
  return data
}

export async function createStudyTrackTemplate(trackTemplateId: string, payload: CreateStudyTrackTemplatePayload) {
  const { data } = await api.post<StudyTrackTemplate>(`/track-templates/${trackTemplateId}/study-tracks`, payload)
  return data
}

export async function updateStudyTrackTemplate(id: string, payload: UpdateStudyTrackTemplatePayload) {
  const { data } = await api.patch<StudyTrackTemplate>(`/study-track-templates/${id}`, payload)
  return data
}

export async function deleteStudyTrackTemplate(id: string) {
  await api.delete(`/study-track-templates/${id}`)
}

export async function listDeletedStudyTrackTemplates(params: { page: number; limit: number; trackSceneTemplateId?: string }) {
  const { data } = await api.get<PaginatedResponse<StudyTrackTemplate>>('/study-track-templates/deleted', { params })
  return data
}

export async function restoreStudyTrackTemplate(id: string) {
  const { data } = await api.patch<StudyTrackTemplate>(`/study-track-templates/${id}/restore`)
  return data
}

// --- Press Quiz Templates ---
export async function listPressQuizTemplates(trackTemplateId: string) {
  const { data } = await api.get<PressQuizTemplate[]>(`/track-templates/${trackTemplateId}/press-quizzes`)
  return data
}

export async function createPressQuizTemplate(trackTemplateId: string, payload: { title: string; description?: string; questionsJson?: QuizQuestion[]; maxAttempts?: number; passingScore?: number }) {
  const { data } = await api.post<PressQuizTemplate>(`/track-templates/${trackTemplateId}/press-quizzes`, payload)
  return data
}

export async function updatePressQuizTemplate(id: string, payload: UpdatePressQuizTemplatePayload) {
  const { data } = await api.patch<PressQuizTemplate>(`/press-quiz-templates/${id}`, payload)
  return data
}

export async function deletePressQuizTemplate(id: string) {
  await api.delete(`/press-quiz-templates/${id}`)
}

export async function listDeletedPressQuizTemplates(params: { page: number; limit: number; trackSceneTemplateId?: string }) {
  const { data } = await api.get<PaginatedResponse<PressQuizTemplate>>('/press-quiz-templates/deleted', { params })
  return data
}

export async function restorePressQuizTemplate(id: string) {
  const { data } = await api.patch<PressQuizTemplate>(`/press-quiz-templates/${id}/restore`)
  return data
}

// --- Project Template Readiness ---
export async function getProjectTemplateReadiness(idOrSlug: string) {
  const { data } = await api.get<ProjectTemplateReadinessSummary>(`/project-template-readiness/${idOrSlug}`)
  return data
}

export async function listProjectTemplateReadinessRules() {
  const { data } = await api.get<ProjectTemplateReadinessRule[]>('/project-template-readiness/rules')
  return data
}

export async function updateProjectTemplateReadinessRule(
  ruleId: string,
  payload: {
    title?: string
    description?: string | null
    targetValue?: number
    weight?: number
    isActive?: boolean
  }
) {
  const { data } = await api.patch<ProjectTemplateReadinessRule>(`/project-template-readiness/rules/${ruleId}`, payload)
  return data
}

export async function getProjectTemplateQualitativeAnalysis(idOrSlug: string) {
  const { data } = await api.get<ProjectTemplateQualitativeAnalysis>(`/project-template-readiness/${idOrSlug}/qualitative-analysis`)
  return data
}

export async function saveProjectTemplateQualitativeAnalysis(
  idOrSlug: string,
  payload: {
    analysis: string
    generatedForVersion?: number
  }
) {
  const { data } = await api.put<ProjectTemplateQualitativeAnalysis>(`/project-template-readiness/${idOrSlug}/qualitative-analysis`, payload)
  return data
}
