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
import { ResponsiveRowActions } from '@/components/ui/ResponsiveRowActions'
import { DetailFieldList } from '@/components/ui/DetailFieldList'
import { CrudListToolbar } from '@/components/ui/CrudListToolbar'
import { listCourses, listCoursesPaginated, createCourse, updateCourse, deleteCourse, listDeletedCourses, restoreCourse } from '@/api/courses'
import { listSchools } from '@/api/schools'
import { COURSE_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Course, CourseType, School } from '@/types'
import toast from 'react-hot-toast'
import { useTrashableListPage } from '@/hooks/useTrashableListPage'
import { useDeactivationBlockedHandler } from '@/hooks/useDeactivationBlockedHandler'

const COURSES_PAGE_LIMIT = 10

export function CoursesListPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const filterFromUrl = searchParams.get('schoolSlug') ?? searchParams.get('schoolId') ?? ''
  const [schoolFilter, setSchoolFilter] = useState(filterFromUrl)
  const { activeTab, isTrash, page, setPage, handleTabChange } = useTrashableListPage()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState({ schoolId: '', name: '', type: 'MUSIC' as CourseType })
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const { blockedInfo, setBlockedInfo, handleBlockedError } = useDeactivationBlockedHandler()
  const [restoreTarget, setRestoreTarget] = useState<Course | null>(null)
  const [previewTarget, setPreviewTarget] = useState<Course | null>(null)

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
      toast.success(editing ? 'Curso atualizado com sucesso.' : 'Curso cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCourse(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Curso desativado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      handleBlockedError(error, deleteTarget!)
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
      header: 'Escola',
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
        <ResponsiveRowActions
          actions={[
            {
              key: 'preview',
              label: 'Visualizar curso',
              icon: <Eye className="h-4 w-4" />,
              onClick: () => setPreviewTarget(c),
            },
            {
              key: 'edit',
              label: 'Editar cadastro',
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => openEdit(c),
            },
            {
              key: 'delete',
              label: 'Desativar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => setDeleteTarget(c),
            },
          ]}
        />
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
      header: 'Escola',
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
        <ResponsiveRowActions
          actions={[
            {
              key: 'restore',
              label: 'Restaurar',
              icon: <ArchiveRestore className="h-4 w-4" />,
              variant: 'success',
              onClick: () => setRestoreTarget(c),
            },
          ]}
        />
      ),
    },
  ]

  const restoreMutation = useMutation({
    mutationFn: () => restoreCourse(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Curso restaurado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setRestoreTarget(null)
    },
    onSettled: () => setRestoreTarget(null),
  })

  return (
    <PageContainer
      title="Cursos"
      count={pagination?.total ?? courses.length}
      action={!isTrash ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Cadastrar curso</Button> : undefined}
    >
      <CrudListToolbar
        primary={<Tabs tabs={courseTabs} activeKey={activeTab} onChange={handleTabChange} />}
        secondary={
          !isTrash ? (
            <Select
              value={schoolFilter}
              onChange={(e) => setSchoolFilterAndResetPage(e.target.value)}
              placeholder="Todas as escolas"
              options={schools.map((s: School) => ({ value: s.id, label: s.name }))}
              className="w-full sm:min-w-[280px]"
            />
          ) : undefined
        }
      />

      <Table
        columns={isTrash ? trashColumns : columns}
        data={courses}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia.' : 'Nenhum curso encontrado.'}
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
        title={editing ? 'Editar curso' : 'Cadastrar curso'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
              {editing ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!editing && (
            <Select
              id="schoolId"
              label="Escola"
              value={form.schoolId}
              onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
              placeholder="Selecionar escola..."
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
        title="Dados do curso"
        footer={<Button variant="secondary" onClick={() => setPreviewTarget(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <DetailFieldList
            items={[
              { label: 'Nome', value: previewTarget?.name ?? '—' },
              {
                label: 'Escola',
                value: previewTarget ? (schools.find((s: School) => s.id === previewTarget.schoolId)?.name || '—') : '—',
              },
              { label: 'Atualizado em', value: previewTarget ? formatDate(previewTarget.updatedAt) : '—' },
            ]}
          />
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
        title="Desativar curso"
        message={`Confirma a desativação de "${deleteTarget?.name}"?`}
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar curso"
        message={restoreTarget ? `Confirma a restauração de "${restoreTarget.name}"?` : ''}
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
