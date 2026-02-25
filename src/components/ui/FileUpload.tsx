import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import { uploadFile, getStorageConfig, presignDownload } from '@/api/storage'
import { cn } from '@/lib/utils'
import { FilePreview } from '@/components/ui/FilePreview'
import type { StorageConfig } from '@/types'
import toast from 'react-hot-toast'

export type FileUploadFileType = 'images' | 'avatars' | 'demos' | 'videos' | 'materials' | 'documents'

interface FileUploadProps {
  fileType: FileUploadFileType
  entityType: string
  entityId: string
  currentValue?: string | null
  onUploadComplete: (key: string) => void
  onRemove?: () => void
  accept?: string
  label?: string
  helperText?: string
  className?: string
  compact?: boolean
}

function fileNameFromKey(key: string): string {
  return key.split('/').pop()?.replace(/^[^_]+_[^_]+_[^_]+_/, '') || key
}

export function FileUpload({
  fileType,
  entityType,
  entityId,
  currentValue,
  onUploadComplete,
  onRemove,
  accept,
  label,
  helperText,
  className,
  compact = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [config, setConfig] = useState<StorageConfig | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [justUploadedKey, setJustUploadedKey] = useState<string | null>(null)
  const [lastUploadedMime, setLastUploadedMime] = useState<string | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [localPreviewName, setLocalPreviewName] = useState<string | null>(null)
  const [localPreviewMime, setLocalPreviewMime] = useState<string | null>(null)

  useEffect(() => {
    getStorageConfig(fileType)
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [fileType])

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const keyToPreview = currentValue ?? justUploadedKey

  const { data: previewUrl, isLoading: loadingPreview } = useQuery({
    queryKey: ['file-upload-preview', keyToPreview],
    queryFn: async () => {
      if (!keyToPreview) return null
      const { downloadUrl } = await presignDownload(keyToPreview)
      return downloadUrl
    },
    enabled: Boolean(keyToPreview),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!previewUrl) return
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setLocalPreviewName(null)
    setLocalPreviewMime(null)
  }, [previewUrl])

  const validateFile = useCallback(
    (file: File): boolean => {
      if (!config) return false
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
      if (!config.allowedExtensions.some((e) => e.toLowerCase() === ext)) {
        toast.error(`Formato não permitido. Use: ${config.allowedExtensions.join(', ')}`)
        return false
      }
      if (file.size > config.maxSizeBytes) {
        toast.error(`Arquivo muito grande. Máximo: ${config.maxSizeMB} MB`)
        return false
      }
      return true
    },
    [config]
  )

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file || !config) return
      setError(null)
      if (!validateFile(file)) return
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      setLocalPreviewName(file.name)
      setLocalPreviewMime(file.type || null)
      setUploading(true)
      setProgress(0)
      uploadFile(file, entityType, entityId, fileType, setProgress)
        .then((key) => {
          setLastUploadedMime(file.type || null)
          setJustUploadedKey(key)
          onUploadComplete(key)
          setUploading(false)
          setProgress(100)
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Falha no envio'
          setError(message)
          toast.error(message)
          setUploading(false)
        })
    },
    [config, entityType, entityId, fileType, onUploadComplete, validateFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile]
  )

  const helperContent =
    config != null
      ? `Formatos: ${config.allowedExtensions.join(', ')} | Máximo: ${config.maxSizeMB} MB`
      : 'Carregando configurações...'

  const displayKey = keyToPreview
  const displayFileName = displayKey ? fileNameFromKey(displayKey) : null
  const previewMimeType = justUploadedKey === displayKey ? lastUploadedMime : null
  const previewSourceUrl = previewUrl ?? localPreviewUrl
  const previewFileName = displayFileName ?? localPreviewName ?? displayKey ?? 'arquivo'

  if (uploading) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <label className="block text-sm font-medium text-text">{label}</label>
        )}
        <div className={cn('space-y-3 rounded-xl border border-border bg-surface-2', compact ? 'p-3' : 'p-4')}>
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text">{localPreviewName ?? 'Enviando...'}</p>
              <div className="mt-2 h-2 rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          {localPreviewUrl && (
            <FilePreview
              fileName={localPreviewName ?? 'Arquivo selecionado'}
              sourceUrl={localPreviewUrl}
              mimeType={localPreviewMime}
              compact={compact}
            />
          )}
        </div>
      </div>
    )
  }

  if (displayKey && !uploading) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <label className="block text-sm font-medium text-text">{label}</label>
        )}
        <div className={cn('space-y-3 rounded-xl border border-border bg-surface-2', compact ? 'p-3' : 'p-4')}>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <p className={cn('truncate font-medium text-text', compact ? 'text-xs' : 'text-sm')}>
                {displayFileName}
              </p>
              {helperText && (
                <p className="text-xs text-muted">{helperText}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  setJustUploadedKey(null)
                  setLastUploadedMime(null)
                  setLocalPreviewUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return null
                  })
                  setLocalPreviewName(null)
                  setLocalPreviewMime(null)
                  handleClick()
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
              >
                Substituir
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => {
                    setJustUploadedKey(null)
                    setLastUploadedMime(null)
                    setLocalPreviewUrl((prev) => {
                      if (prev) URL.revokeObjectURL(prev)
                      return null
                    })
                    setLocalPreviewName(null)
                    setLocalPreviewMime(null)
                    setError(null)
                    onRemove()
                  }}
                  className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors"
                  aria-label="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {loadingPreview && !localPreviewUrl ? (
            <div className="flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-6 text-xs text-muted">
              Carregando preview...
            </div>
          ) : (
            <FilePreview
              fileName={previewFileName}
              sourceUrl={previewSourceUrl}
              mimeType={previewMimeType ?? localPreviewMime}
              compact={compact}
            />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept ?? config?.allowedExtensions.join(',') ?? undefined}
          onChange={handleInputChange}
        />
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-text">{label}</label>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors',
          compact ? 'p-4' : 'p-6',
          'border-border hover:border-accent/50 bg-surface',
          dragActive && 'border-accent bg-accent/5'
        )}
      >
        <Upload className={cn('mx-auto text-muted', compact ? 'h-8 w-8' : 'h-10 w-10')} />
        <p className={cn('mt-2 font-medium text-text', compact ? 'text-xs' : 'text-sm')}>
          Clique ou arraste um arquivo
        </p>
        <p className="mt-1 text-xs text-muted">
          {helperText ?? helperContent}
        </p>
        {error && (
          <p className="mt-2 flex items-center justify-center gap-1 text-xs text-error">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept ?? config?.allowedExtensions.join(',') ?? undefined}
        onChange={handleInputChange}
      />
    </div>
  )
}
