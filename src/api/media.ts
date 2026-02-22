import { api } from './client'

export async function bindSubmissionMedia(submissionId: string, key: string): Promise<Record<string, unknown>> {
  const { data } = await api.patch<Record<string, unknown>>(`/submissions/${submissionId}/media`, { key })
  return data
}

export async function bindTrackSceneVideo(trackSceneId: string, key: string): Promise<Record<string, unknown>> {
  const { data } = await api.patch<Record<string, unknown>>(`/tracks/scenes/${trackSceneId}/video`, { key })
  return data
}

export async function bindTrackMaterialContent(materialId: string, key: string): Promise<Record<string, unknown>> {
  const { data } = await api.patch<Record<string, unknown>>(`/tracks/materials/${materialId}/content`, { key })
  return data
}

export async function bindDailyMissionVideo(templateId: string, key: string): Promise<Record<string, unknown>> {
  const { data } = await api.patch<Record<string, unknown>>(`/daily-missions/templates/${templateId}/video`, { key })
  return data
}
