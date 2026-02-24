import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, FileText, Check, AlertCircle } from 'lucide-react'
import { uploadFile, getStorageConfig, presignDownload } from '@/api/storage'
import { cn } from '@/lib/utils'
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
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [config, setConfig] = useState<StorageConfig | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [justUploadedKey, setJustUploadedKey] = useState<string | null>(null)

  useEffect(() => {
    getStorageConfig(fileType)
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [fileType])

  useEffect(() => {
    if (currentValue && currentValue === justUploadedKey) {
      setJustUploadedKey(null)
    }
  }, [currentValue, justUploadedKey])

  useEffect(() => {
    const keyToPreview = currentValue ?? justUploadedKey
    const supportsImagePreview = fileType === 'avatars' || fileType === 'images'
    if (!supportsImagePreview || !keyToPreview) {
      setPreviewUrl(null)
      return
    }
    let cancelled = false
    presignDownload(keyToPreview)
      .then(({ downloadUrl }) => {
        if (!cancelled) setPreviewUrl(downloadUrl)
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [fileType, currentValue, justUploadedKey])

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
      setUploading(true)
      setProgress(0)
      uploadFile(file, entityType, entityId, fileType, setProgress)
        .then((key) => {
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

  const displayKey = currentValue ?? justUploadedKey
  const displayFileName = displayKey ? fileNameFromKey(displayKey) : null
  const showSuccessCheck = Boolean(justUploadedKey && !currentValue)

  if (uploading) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <label className="block text-sm font-medium text-text">{label}</label>
        )}
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text">Enviando...</p>
              <div className="mt-2 h-2 rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
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
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center gap-3">
            {showSuccessCheck ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-5 w-5 text-green-500" />
              </div>
            ) : (fileType === 'avatars' || fileType === 'images') && previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <FileText className="h-5 w-5 shrink-0 text-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">
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
                  handleClick()
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
              >
                Substituir
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors"
                  aria-label="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
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
          'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          'border-border hover:border-accent/50 bg-surface',
          dragActive && 'border-accent bg-accent/5'
        )}
      >
        <Upload className="mx-auto h-10 w-10 text-muted" />
        <p className="mt-2 text-sm font-medium text-text">
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
