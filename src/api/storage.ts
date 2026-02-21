import { api } from './client'

interface PresignUploadPayload {
  fileType: string
  fileName: string
  entityType: string
  entityId: string
  fileSize: number
}

interface PresignUploadResponse {
  uploadUrl: string
  key: string
  expiresIn: number
}

export async function presignUpload(payload: PresignUploadPayload) {
  const { data } = await api.post<PresignUploadResponse>('/storage/presign-upload', payload)
  return data
}

export async function presignDownload(key: string) {
  const { data } = await api.get<{ downloadUrl: string }>(`/storage/presign-download/${key}`)
  return data
}

export async function deleteFile(key: string) {
  const { data } = await api.delete(`/storage/file/${key}`)
  return data
}

export async function getStorageConfig(fileType: string) {
  const { data } = await api.get(`/storage/config/${fileType}`)
  return data
}

export async function listOrphans(deleteOrphans = false) {
  const { data } = await api.get('/storage/orphans', { params: deleteOrphans ? { delete: true } : undefined })
  return data
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
