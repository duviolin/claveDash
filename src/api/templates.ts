import { api } from './client'
import type {
  ProjectTemplate,
  PaginatedResponse,
  TrackSceneTemplate,
  TrackMaterialTemplate,
  TrackMaterialType,
  StudyTrackTemplate,
  StudyTrackCategory,
  PressQuizTemplate,
  ProjectType,
  QuizQuestion,
} from '@/types'

// --- Project Templates ---
export async function listProjectTemplates(courseId?: string) {
  const { data } = await api.get<ProjectTemplate[]>('/project-templates', { params: { courseId } })
  return data
}

export async function getProjectTemplate(id: string) {
  const { data } = await api.get<ProjectTemplate>(`/project-templates/${id}`)
  return data
}

export async function createProjectTemplate(payload: { courseId: string; name: string; type: ProjectType; description?: string }) {
  const { data } = await api.post<ProjectTemplate>('/project-templates', payload)
  return data
}

export async function updateProjectTemplate(id: string, payload: { name?: string; description?: string; coverImage?: string }) {
  const { data } = await api.patch<ProjectTemplate>(`/project-templates/${id}`, payload)
  return data
}

export async function deleteProjectTemplate(id: string) {
  const { data } = await api.delete(`/project-templates/${id}`)
  return data
}

export async function listDeletedProjectTemplates(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<ProjectTemplate>>('/project-templates/deleted', { params })
  return data
}

export async function restoreProjectTemplate(id: string) {
  const { data } = await api.patch<ProjectTemplate>(`/project-templates/${id}/restore`)
  return data
}

// --- Track Scene Templates ---
export async function listTrackTemplates(projectTemplateId: string) {
  const { data } = await api.get<TrackSceneTemplate[]>(`/project-templates/${projectTemplateId}/tracks`)
  return data
}

export async function getTrackTemplate(id: string) {
  const { data } = await api.get<TrackSceneTemplate>(`/track-templates/${id}`)
  return data
}

export async function createTrackTemplate(projectTemplateId: string, payload: Partial<TrackSceneTemplate>) {
  const { data } = await api.post<TrackSceneTemplate>(`/project-templates/${projectTemplateId}/tracks`, payload)
  return data
}

export async function updateTrackTemplate(id: string, payload: Partial<TrackSceneTemplate>) {
  const { data } = await api.patch<TrackSceneTemplate>(`/track-templates/${id}`, payload)
  return data
}

export async function deleteTrackTemplate(id: string) {
  const { data } = await api.delete(`/track-templates/${id}`)
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

export async function updateMaterialTemplate(id: string, payload: Partial<TrackMaterialTemplate>) {
  const { data } = await api.patch<TrackMaterialTemplate>(`/material-templates/${id}`, payload)
  return data
}

export async function deleteMaterialTemplate(id: string) {
  const { data } = await api.delete(`/material-templates/${id}`)
  return data
}

// --- Study Track Categories ---
export async function listStudyTrackCategories(courseId?: string) {
  const { data } = await api.get<StudyTrackCategory[]>('/study-track-categories', { params: { courseId } })
  return data
}

export async function listDeletedStudyTrackCategories(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<StudyTrackCategory>>('/study-track-categories/deleted', { params })
  return data
}

export async function restoreStudyTrackCategory(id: string) {
  const { data } = await api.patch<StudyTrackCategory>(`/study-track-categories/${id}/restore`)
  return data
}

export async function createStudyTrackCategory(payload: { courseId: string; name: string; key: string; icon?: string; color?: string; description?: string }) {
  const { data } = await api.post<StudyTrackCategory>('/study-track-categories', payload)
  return data
}

export async function updateStudyTrackCategory(id: string, payload: Partial<StudyTrackCategory>) {
  const { data } = await api.patch<StudyTrackCategory>(`/study-track-categories/${id}`, payload)
  return data
}

export async function deleteStudyTrackCategory(id: string) {
  const { data } = await api.delete(`/study-track-categories/${id}`)
  return data
}

// --- Study Track Templates ---
export async function listStudyTrackTemplates(trackTemplateId: string) {
  const { data } = await api.get<StudyTrackTemplate[]>(`/track-templates/${trackTemplateId}/study-tracks`)
  return data
}

export async function createStudyTrackTemplate(trackTemplateId: string, payload: Partial<StudyTrackTemplate>) {
  const { data } = await api.post<StudyTrackTemplate>(`/track-templates/${trackTemplateId}/study-tracks`, payload)
  return data
}

export async function updateStudyTrackTemplate(id: string, payload: Partial<StudyTrackTemplate>) {
  const { data } = await api.patch<StudyTrackTemplate>(`/study-track-templates/${id}`, payload)
  return data
}

export async function deleteStudyTrackTemplate(id: string) {
  const { data } = await api.delete(`/study-track-templates/${id}`)
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

export async function updatePressQuizTemplate(id: string, payload: Partial<PressQuizTemplate>) {
  const { data } = await api.patch<PressQuizTemplate>(`/press-quiz-templates/${id}`, payload)
  return data
}

export async function deletePressQuizTemplate(id: string) {
  const { data } = await api.delete(`/press-quiz-templates/${id}`)
  return data
}
