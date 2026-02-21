import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Upload, Trash2, AlertTriangle } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { ConfirmModal } from '@/components/ui/Modal'
import { getStorageConfig, listOrphans, uploadFile } from '@/api/storage'
import toast from 'react-hot-toast'

const FILE_TYPES = [
  { value: 'avatars', label: 'Avatares (5MB)' },
  { value: 'demos', label: 'Demos (50MB)' },
  { value: 'videos', label: 'Vídeos (500MB)' },
  { value: 'materials', label: 'Materiais (100MB)' },
  { value: 'documents', label: 'Documentos (20MB)' },
]

export function StoragePage() {
  const [selectedType, setSelectedType] = useState('avatars')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: config } = useQuery({
    queryKey: ['storage-config', selectedType],
    queryFn: () => getStorageConfig(selectedType),
  })

  const { data: orphans, refetch: refetchOrphans, isLoading: loadingOrphans } = useQuery({
    queryKey: ['storage-orphans'],
    queryFn: () => listOrphans(),
  })

  const cleanOrphansMut = useMutation({
    mutationFn: () => listOrphans(true),
    onSuccess: () => {
      toast.success('Arquivos órfãos removidos!')
      refetchOrphans()
      setDeleteConfirm(false)
    },
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(0)
    try {
      const key = await uploadFile(file, 'general', 'test', selectedType, setProgress)
      toast.success(`Upload concluído! Key: ${key}`)
    } catch {
      toast.error('Falha no upload')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const orphanList = Array.isArray(orphans) ? orphans : orphans?.files ?? []

  return (
    <PageContainer title="Storage">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent" /> Upload de Teste
          </h2>
          <Select
            id="fileType"
            label="Tipo de Arquivo"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={FILE_TYPES}
          />
          {config && (
            <div className="text-xs text-muted space-y-1">
              <p>Limite: {JSON.stringify(config)}</p>
            </div>
          )}
          <div className="relative">
            <input type="file" onChange={handleUpload} disabled={uploading} className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-accent-hover file:cursor-pointer" />
            {uploading && (
              <div className="mt-2">
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted mt-1">{progress}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" /> Arquivos Órfãos
            </h2>
            {orphanList.length > 0 && (
              <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Limpar
              </Button>
            )}
          </div>
          {loadingOrphans ? (
            <div className="flex justify-center py-4"><div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
          ) : orphanList.length > 0 ? (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {orphanList.map((key: string, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
                  <span className="flex-1 truncate">{key}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted py-4 text-center">Nenhum arquivo órfão encontrado</p>
          )}
        </div>
      </div>

      <ConfirmModal isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} onConfirm={() => cleanOrphansMut.mutate()} isLoading={cleanOrphansMut.isPending} title="Limpar Órfãos" message="Tem certeza que deseja deletar todos os arquivos órfãos? Esta ação é irreversível." />
    </PageContainer>
  )
}
