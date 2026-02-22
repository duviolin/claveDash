import { api } from './client'
import type { PresignUploadResponse, StorageConfig } from '@/types'

interface PresignUploadPayload {
  fileType: string
  fileName: string
  entityType: string
  entityId: string
  fileSize: number
}

interface OrphansResponse {
  totalR2: number
  totalDB: number
  orphanCount: number
  deleted: boolean
  orphans: string[]
}

export async function presignUpload(payload: PresignUploadPayload): Promise<PresignUploadResponse> {
  const { data } = await api.post<{ success: boolean; data: PresignUploadResponse }>('/storage/presign-upload', payload)
  return data.data
}

export async function presignDownload(key: string): Promise<{ downloadUrl: string; expiresIn: number }> {
  const { data } = await api.get<{ success: boolean; data: { downloadUrl: string; expiresIn: number } }>(`/storage/presign-download/${key}`)
  return data.data
}

export async function deleteFile(key: string) {
  const { data } = await api.delete(`/storage/file/${key}`)
  return data
}

export async function getStorageConfig(fileType: string): Promise<StorageConfig> {
  const { data } = await api.get<{ success: boolean; data: StorageConfig }>(`/storage/config/${fileType}`)
  return data.data
}

export async function listOrphans(deleteOrphans = false): Promise<OrphansResponse> {
  const { data } = await api.get<{ success: boolean; data: OrphansResponse }>('/storage/orphans', {
    params: deleteOrphans ? { delete: true } : undefined,
  })
  return data.data
}

export async function uploadFile(
  file: File,
  entityType: string,
  entityId: string,
  fileType: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const { uploadUrl, key } = await presignUpload({
    fileType,
    fileName: file.name,
    entityType,
    entityId,
    fileSize: file.size,
  })

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed: ${xhr.status}`))
    }

    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(file)
  })

  return key
}
