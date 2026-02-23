import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ArchiveRestore } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Pagination } from '@/components/ui/Pagination'
import type { AxiosError } from 'axios'
import { listStudyTrackCategories, listDeletedStudyTrackCategories, restoreStudyTrackCategory, createStudyTrackCategory, updateStudyTrackCategory, deleteStudyTrackCategory } from '@/api/templates'
import { listCourses } from '@/api/courses'
import { formatDate } from '@/lib/utils'
import type { StudyTrackCategory, Course, DeactivationErrorDetails } from '@/types'
import toast from 'react-hot-toast'

const STUDY_TRACK_PAGE_LIMIT = 10
const tabs = [
  { key: 'active', label: 'Ativas' },
  { key: 'TRASH', label: 'Lixeira' },
]

export function StudyTrackCategoriesPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StudyTrackCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudyTrackCategory | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<StudyTrackCategory | null>(null)
  const [blockedInfo, setBlockedInfo] = useState<{ name: string; id: string; details: DeactivationErrorDetails } | null>(null)
  const [courseFilter, setCourseFilter] = useState('')
  const [form, setForm] = useState({ courseId: '', name: '', key: '', icon: '', color: '', description: '' })
  const [activeTab, setActiveTab] = useState('active')
  const [page, setPage] = useState(1)

  const isTrash = activeTab === 'TRASH'

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => listCourses() })

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['study-track-categories', courseFilter],
    queryFn: () => listStudyTrackCategories(courseFilter || undefined),
    enabled: !!courseFilter && !isTrash,
  })

  const { data: deletedResponse, isLoading: isLoadingDeleted } = useQuery({
    queryKey: ['study-track-categories', 'deleted', page],
    queryFn: () => listDeletedStudyTrackCategories({ page, limit: STUDY_TRACK_PAGE_LIMIT }),
    enabled: isTrash,
  })
  const deletedCategories = deletedResponse?.data ?? []
  const pagination = deletedResponse?.pagination

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        courseId: form.courseId,
        name: form.name,
        key: form.key,
        icon: form.icon || undefined,
        color: form.color || undefined,
        description: form.description || undefined,
      }
      return editing ? updateStudyTrackCategory(editing.id, payload) : createStudyTrackCategory(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Categoria atualizada!' : 'Categoria criada!')
      queryClient.invalidateQueries({ queryKey: ['study-track-categories'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteStudyTrackCategory(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Categoria desativada!')
      queryClient.invalidateQueries({ queryKey: ['study-track-categories'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ details: DeactivationErrorDetails }>
      if (err.response?.status === 409 && err.response?.data?.details) {
        setBlockedInfo({ name: deleteTarget!.name, id: deleteTarget!.id, details: err.response.data.details })
      }
      setDeleteTarget(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreStudyTrackCategory(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Categoria restaurada!')
      queryClient.invalidateQueries({ queryKey: ['study-track-categories'] })
      setRestoreTarget(null)
    },
  })

  const openCreate = () => { setEditing(null); setForm({ courseId: '', name: '', key: '', icon: '', color: '', description: '' }); setModalOpen(true) }
  const openEdit = (cat: StudyTrackCategory) => {
    setEditing(cat)
    setForm({ courseId: cat.courseId, name: cat.name, key: cat.key, icon: cat.icon || '', color: cat.color || '', description: cat.description || '' })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const columns = [
    { key: 'name', header: 'Nome', render: (c: StudyTrackCategory) => <span className="font-medium text-text">{c.name}</span> },
    { key: 'key', header: 'Chave', render: (c: StudyTrackCategory) => <code className="text-xs text-muted bg-surface-2 px-2 py-0.5 rounded">{c.key}</code> },
    {
      key: 'color',
      header: 'Cor',
      render: (c: StudyTrackCategory) => c.color ? (
        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: c.color }} /><span className="text-xs text-muted">{c.color}</span></div>
      ) : <span className="text-muted">—</span>,
    },
    { key: 'order', header: 'Ordem', render: (c: StudyTrackCategory) => <span className="text-muted">{c.order}</span> },
    {
      key: 'actions',
      header: 'Ações',
      render: (c: StudyTrackCategory) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setDeleteTarget(c)} className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ]

  const trashColumns = [
    {
      key: 'name',
      header: 'Nome',
      render: (c: StudyTrackCategory) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">{c.name}</span>
          <Badge variant="error">Excluída</Badge>
        </div>
      ),
    },
    {
      key: 'key',
      header: 'Chave',
      render: (c: StudyTrackCategory) => <code className="text-xs text-muted bg-surface-2 px-2 py-0.5 rounded">{c.key}</code>,
    },
    {
      key: 'deletedAt',
      header: 'Excluída em',
      render: (c: StudyTrackCategory) => <span className="text-muted">{formatDate(c.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (c: StudyTrackCategory) => (
        <button
          onClick={() => setRestoreTarget(c)}
          className="rounded-lg p-1.5 text-muted hover:bg-success/10 hover:text-success transition-colors cursor-pointer"
          title="Restaurar"
        >
          <ArchiveRestore className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <PageContainer
      title="Categorias de Trilha de Estudo"
      count={isTrash ? (pagination?.total ?? deletedCategories.length) : categories.length}
      action={!isTrash ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Criar Categoria</Button> : undefined}
    >
      <Tabs tabs={tabs} activeKey={activeTab} onChange={(key) => { setActiveTab(key); setPage(1) }} />

      {isTrash ? (
        <>
          <Table
            columns={trashColumns}
            data={deletedCategories}
            keyExtractor={(c) => c.id}
            isLoading={isLoadingDeleted}
            emptyMessage="A lixeira está vazia"
          />
          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <>
      <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} placeholder="Todos os cursos" options={courses.map((c: Course) => ({ value: c.id, label: c.name }))} className="max-w-xs" />

      <Table columns={columns} data={categories} keyExtractor={(c) => c.id} isLoading={isLoading} />
        </>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Editar Categoria' : 'Criar Categoria'} footer={
        <><Button variant="secondary" onClick={closeModal}>Cancelar</Button><Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>{editing ? 'Salvar' : 'Criar'}</Button></>
      }>
        <div className="space-y-4">
          {!editing && <Select id="catCourseId" label="Curso" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} placeholder="Selecionar..." options={courses.map((c: Course) => ({ value: c.id, label: c.name }))} />}
          <div className="grid grid-cols-2 gap-4">
            <Input id="catName" label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input id="catKey" label="Chave (key)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="catIcon" label="Ícone" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="ex: 🎵" />
            <Input id="catColor" label="Cor" type="color" value={form.color || '#6c5ce7'} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <Textarea id="catDesc" label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate()} isLoading={deleteMutation.isPending} title="Desativar Categoria" message={`Desativar "${deleteTarget?.name}"?`} />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar Categoria"
        message={`Tem certeza que deseja restaurar "${restoreTarget?.name}"?`}
        confirmLabel="Restaurar"
      />

      <DeactivationBlockedModal
        isOpen={!!blockedInfo}
        onClose={() => setBlockedInfo(null)}
        entityName={blockedInfo?.name ?? ''}
        parentId={blockedInfo?.id ?? ''}
        details={blockedInfo?.details ?? null}
      />
    </PageContainer>
  )
}
