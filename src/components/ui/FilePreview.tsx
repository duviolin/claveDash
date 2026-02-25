import { ExternalLink, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

type PreviewKind = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'office' | 'unknown'

interface FilePreviewProps {
  fileName: string
  sourceUrl: string | null
  mimeType?: string | null
  className?: string
  compact?: boolean
}

const OFFICE_EXTENSIONS = new Set([
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'pps',
  'ppsx',
])

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'csv',
  'json',
  'xml',
  'yaml',
  'yml',
  'log',
  'ts',
  'tsx',
  'js',
  'jsx',
  'css',
  'html',
  'sql',
])

function getExtension(fileName: string): string {
  const maybeExt = fileName.split('.').pop()?.toLowerCase()
  if (!maybeExt || maybeExt === fileName.toLowerCase()) return ''
  return maybeExt
}

function getPreviewKind(fileName: string, mimeType?: string | null): PreviewKind {
  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType?.startsWith('video/')) return 'video'
  if (mimeType?.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType?.startsWith('text/')) return 'text'

  const extension = getExtension(fileName)
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension)) return 'image'
  if (['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v'].includes(extension)) return 'video'
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(extension)) return 'audio'
  if (extension === 'pdf') return 'pdf'
  if (OFFICE_EXTENSIONS.has(extension)) return 'office'
  if (TEXT_EXTENSIONS.has(extension)) return 'text'
  return 'unknown'
}

function buildOfficePreviewUrl(sourceUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(sourceUrl)}`
}

export function FilePreview({ fileName, sourceUrl, mimeType, className, compact = false }: FilePreviewProps) {
  if (!sourceUrl) return null

  const previewKind = getPreviewKind(fileName, mimeType)
  const isLocalBlobUrl = sourceUrl.startsWith('blob:')
  const frameHeight = compact ? 'h-56' : 'h-72'

  if (previewKind === 'image') {
    return (
      <img
        src={sourceUrl}
        alt={`Preview de ${fileName}`}
        className={cn('w-full rounded-lg border border-border object-cover', frameHeight, className)}
      />
    )
  }

  if (previewKind === 'video') {
    return (
      <video
        src={sourceUrl}
        controls
        preload="metadata"
        className={cn('w-full rounded-lg border border-border bg-black/50', frameHeight, className)}
      />
    )
  }

  if (previewKind === 'audio') {
    return (
      <div className={cn('rounded-lg border border-border bg-surface p-3', className)}>
        <p className="mb-2 truncate text-xs text-muted">{fileName}</p>
        <audio src={sourceUrl} controls preload="metadata" className="w-full" />
      </div>
    )
  }

  if (previewKind === 'pdf' || previewKind === 'text') {
    return (
      <iframe
        src={sourceUrl}
        title={`Preview de ${fileName}`}
        className={cn('w-full rounded-lg border border-border bg-surface', frameHeight, className)}
      />
    )
  }

  if (previewKind === 'office' && !isLocalBlobUrl) {
    return (
      <iframe
        src={buildOfficePreviewUrl(sourceUrl)}
        title={`Preview de ${fileName}`}
        className={cn('w-full rounded-lg border border-border bg-surface', frameHeight, className)}
      />
    )
  }

  return (
    <div className={cn('flex items-center justify-between rounded-lg border border-border bg-surface p-3', className)}>
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-muted" />
        <span className="truncate text-sm text-text">{fileName}</span>
      </div>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
      >
        Abrir <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}
