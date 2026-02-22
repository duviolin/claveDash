import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { listCoursesPaginated, createCourse, updateCourse } from '@/api/courses'
import { listSchools } from '@/api/schools'
import type { Course, CourseType, School } from '@/types'
import toast from 'react-hot-toast'

const COURSES_PAGE_LIMIT = 10

export function CoursesListPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [schoolFilter, setSchoolFilter] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ schoolId: '', name: '', type: 'MUSIC' as CourseType })

  const setSchoolFilterAndResetPage = (value: string) => {
    setSchoolFilter(value)
    setPage(1)
  }

  const { data: schoolsResponse } = useQuery({
    queryKey: ['schools'],
    queryFn: () => listSchools({ limit: 500 }),
  })
  const schools = schoolsResponse?.data ?? []

  const { data: coursesResponse, isLoading } = useQuery({
    queryKey: ['courses', 'paginated', schoolFilter || 'all', page],
    queryFn: () =>
      listCoursesPaginated({
        schoolId: schoolFilter || undefined,
        page,
        limit: COURSES_PAGE_LIMIT,
      }),
  })
  const courses = coursesResponse?.data ?? []
  const pagination = coursesResponse?.pagination

  const saveMutation = useMutation({
    mutationFn: () => {
      return editing
        ? updateCourse(editing.id, { name: form.name, type: form.type })
        : createCourse({ schoolId: form.schoolId, name: form.name, type: form.type })
    },
    onSuccess: () => {
      toast.success(editing ? 'Curso atualizado!' : 'Curso criado!')
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      closeModal()
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ schoolId: '', name: '', type: 'MUSIC' })
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
      render: (c: Course) => <Badge variant={c.type === 'MUSIC' ? 'accent' : 'info'}>{c.type}</Badge>,
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
        <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer">
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <PageContainer
      title="Cursos"
      count={pagination?.total ?? courses.length}
      action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Criar Curso</Button>}
    >
      <div className="flex items-center gap-4">
        <Select
          value={schoolFilter}
          onChange={(e) => setSchoolFilterAndResetPage(e.target.value)}
          placeholder="Todas as escolas"
          options={schools.map((s: School) => ({ value: s.id, label: s.name }))}
          className="max-w-xs"
        />
      </div>

      <Table columns={columns} data={courses} keyExtractor={(c) => c.id} isLoading={isLoading} />

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted">
            Página {pagination.page} de {pagination.totalPages}
            {pagination.total != null && ` (${pagination.total} no total)`}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Curso' : 'Criar Curso'}
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
              { value: 'MUSIC', label: 'Música' },
              { value: 'THEATER', label: 'Teatro' },
            ]}
          />
        </div>
      </Modal>
    </PageContainer>
  )
}
