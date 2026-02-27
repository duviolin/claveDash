import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Pencil, Trash2, ArchiveRestore } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import { Pagination } from '@/components/ui/Pagination'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { AxiosError } from 'axios'
import { listCourses, listCoursesPaginated, createCourse, updateCourse, deleteCourse, listDeletedCourses, restoreCourse } from '@/api/courses'
import { listSchools } from '@/api/schools'
import { COURSE_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Course, CourseType, School, DeactivationErrorDetails } from '@/types'
import toast from 'react-hot-toast'

const COURSES_PAGE_LIMIT = 10

export function CoursesListPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const filterFromUrl = searchParams.get('schoolSlug') ?? searchParams.get('schoolId') ?? ''
  const [schoolFilter, setSchoolFilter] = useState(filterFromUrl)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ schoolId: '', name: '', type: 'MUSIC' as CourseType })
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [blockedInfo, setBlockedInfo] = useState<{ name: string; slug: string; details: DeactivationErrorDetails } | null>(null)
  const [activeTab, setActiveTab] = useState('active')
  const [restoreTarget, setRestoreTarget] = useState<Course | null>(null)
  const [previewTarget, setPreviewTarget] = useState<Course | null>(null)

  const isTrash = activeTab === 'TRASH'

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setPage(1)
  }

  const setSchoolFilterAndResetPage = (value: string) => {
    setSchoolFilter(value)
    setPage(1)
  }

  const courseTabs = [
    { key: 'active', label: 'Ativos' },
    { key: 'TRASH', label: 'Lixeira' },
  ]

  const { data: schoolsResponse } = useQuery({
    queryKey: ['schools'],
    queryFn: () => listSchools({ limit: 100 }),
  })
  const schools = schoolsResponse?.data ?? []

  const { data: activeResponse, isLoading: isLoadingActive } = useQuery({
    queryKey: ['courses', schoolFilter || 'all', page],
    queryFn: async (): Promise<{ data: Course[]; pagination?: { page: number; totalPages: number; total: number } }> =>
      schoolFilter
        ? listCoursesPaginated({ schoolId: schoolFilter, page, limit: COURSES_PAGE_LIMIT })
        : listCourses().then((data) => ({ data })),
    enabled: !isTrash,
  })

  const { data: deletedResponse, isLoading: isLoadingTrash } = useQuery({
    queryKey: ['courses', 'deleted', page],
    queryFn: () => listDeletedCourses({ page, limit: COURSES_PAGE_LIMIT }),
    enabled: isTrash,
  })

  const courses = isTrash ? (deletedResponse?.data ?? []) : (activeResponse?.data ?? [])
  const pagination = isTrash ? deletedResponse?.pagination : activeResponse?.pagination
  const isLoading = isTrash ? isLoadingTrash : isLoadingActive

  const saveMutation = useMutation({
    mutationFn: () => {
      return editing
        ? updateCourse(editing.id, { name: form.name })
        : createCourse({ schoolId: form.schoolId, name: form.name, type: form.type })
    },
    onSuccess: () => {
      toast.success(editing ? 'Núcleo artístico atualizado!' : 'Núcleo artístico criado!')
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCourse(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Núcleo artístico desativado!')
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ details: DeactivationErrorDetails }>
      if (err.response?.status === 409 && err.response?.data?.details) {
        setBlockedInfo({ name: deleteTarget!.name, slug: deleteTarget!.slug, details: err.response.data.details })
      }
      setDeleteTarget(null)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ schoolId: schoolFilter, name: '', type: 'MUSIC' })
    setModalOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setForm({ schoolId: course.schoolId, name: course.name, type: course.type })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (c: Course) => <span className="font-medium text-text">{c.name}</span>,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (c: Course) => <Badge variant={c.type === 'MUSIC' ? 'accent' : 'info'}>{COURSE_TYPE_LABELS[c.type]}</Badge>,
    },
    {
      key: 'school',
      header: 'Unidade artística',
      render: (c: Course) => {
        const school = schools.find((s: School) => s.id === c.schoolId)
        return <span className="text-muted">{school?.name || '—'}</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: Course) => <Badge variant={c.isActive ? 'success' : 'error'}>{c.isActive ? 'Ativo' : 'Inativo'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (c: Course) => (
        <div className="flex gap-1">
          <button
            onClick={() => setPreviewTarget(c)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
            title="Visualizar núcleo artístico"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer" title="Editar">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteTarget(c)} className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer" title="Excluir">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const trashColumns = [
    {
      key: 'name',
      header: 'Nome',
      render: (c: Course) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">{c.name}</span>
          <Badge variant="error">Excluído</Badge>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (c: Course) => <Badge variant={c.type === 'MUSIC' ? 'accent' : 'info'}>{COURSE_TYPE_LABELS[c.type]}</Badge>,
    },
    {
      key: 'school',
      header: 'Unidade artística',
      render: (c: Course) => {
        const school = schools.find((s: School) => s.id === c.schoolId)
        return <span className="text-muted">{school?.name || '—'}</span>
      },
    },
    {
      key: 'deletedAt',
      header: 'Excluído em',
      render: (c: Course) => <span className="text-muted">{formatDate(c.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (c: Course) => (
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

  const restoreMutation = useMutation({
    mutationFn: () => restoreCourse(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Núcleo artístico restaurado!')
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setRestoreTarget(null)
    },
    onSettled: () => setRestoreTarget(null),
  })

  return (
    <PageContainer
      title="Núcleos artísticos"
      count={pagination?.total ?? courses.length}
      action={!isTrash ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Criar Núcleo artístico</Button> : undefined}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={courseTabs} activeKey={activeTab} onChange={handleTabChange} />
        {!isTrash && (
          <Select
            value={schoolFilter}
            onChange={(e) => setSchoolFilterAndResetPage(e.target.value)}
            placeholder="Todas as unidades artísticas"
            options={schools.map((s: School) => ({ value: s.id, label: s.name }))}
            className="w-full sm:max-w-xs"
          />
        )}
      </div>

      <Table
        columns={isTrash ? trashColumns : columns}
        data={courses}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia' : 'Nenhum núcleo artístico encontrado'}
      />

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Núcleo artístico' : 'Criar Núcleo artístico'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!editing && (
            <Select
              id="schoolId"
              label="Unidade artística"
              value={form.schoolId}
              onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
              placeholder="Selecionar unidade artística..."
              options={schools.map((s: School) => ({ value: s.id, label: s.name }))}
            />
          )}
          <Input
            id="courseName"
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            id="courseType"
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as CourseType })}
            options={[
              { value: 'MUSIC', label: COURSE_TYPE_LABELS.MUSIC },
              { value: 'THEATER', label: COURSE_TYPE_LABELS.THEATER },
            ]}
            disabled={!!editing}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        title="Preview do Núcleo artístico"
        footer={<Button variant="secondary" onClick={() => setPreviewTarget(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Nome</p>
            <p className="mt-1 font-medium text-text">{previewTarget?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Tipo</p>
            <div className="mt-1">
              {previewTarget ? (
                <Badge variant={previewTarget.type === 'MUSIC' ? 'accent' : 'info'}>
                  {COURSE_TYPE_LABELS[previewTarget.type]}
                </Badge>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Unidade artística</p>
            <p className="mt-1 text-text">
              {previewTarget
                ? (schools.find((s: School) => s.id === previewTarget.schoolId)?.name || '—')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>
            <div className="mt-1">
              {previewTarget ? (
                <Badge variant={previewTarget.isActive ? 'success' : 'error'}>
                  {previewTarget.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Excluir Núcleo artístico"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? O núcleo artístico será desativado.`}
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar Núcleo artístico"
        message={restoreTarget ? `Tem certeza que deseja restaurar "${restoreTarget.name}"?` : ''}
        confirmLabel="Restaurar"
        variant="primary"
      />

      <DeactivationBlockedModal
        isOpen={!!blockedInfo}
        onClose={() => setBlockedInfo(null)}
        entityName={blockedInfo?.name ?? ''}
        parentSlug={blockedInfo?.slug ?? ''}
        details={blockedInfo?.details ?? null}
      />
    </PageContainer>
  )
}
