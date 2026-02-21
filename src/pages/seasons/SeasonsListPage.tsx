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
import { listSeasons, createSeason, updateSeason } from '@/api/seasons'
import { listCourses } from '@/api/courses'
import { formatDate } from '@/lib/utils'
import type { Season, SeasonStatus, Course } from '@/types'
import toast from 'react-hot-toast'

const statusVariant: Record<SeasonStatus, 'warning' | 'success' | 'error'> = {
  PLANNED: 'warning',
  ACTIVE: 'success',
  CLOSED: 'error',
}

export function SeasonsListPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Season | null>(null)
  const [courseFilter, setCourseFilter] = useState('')
  const [form, setForm] = useState({
    courseId: '',
    name: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED' as SeasonStatus,
  })

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => listCourses() })

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ['seasons', courseFilter],
    queryFn: () => listSeasons(courseFilter || undefined),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editing) {
        return updateSeason(editing.id, {
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
        })
      }
      return createSeason(form)
    },
    onSuccess: () => {
      toast.success(editing ? 'Semestre atualizado!' : 'Semestre criado!')
      queryClient.invalidateQueries({ queryKey: ['seasons'] })
      closeModal()
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ courseId: '', name: '', startDate: '', endDate: '', status: 'PLANNED' })
    setModalOpen(true)
  }

  const openEdit = (season: Season) => {
    setEditing(season)
    setForm({
      courseId: season.courseId,
      name: season.name,
      startDate: season.startDate.split('T')[0],
      endDate: season.endDate.split('T')[0],
      status: season.status,
    })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (s: Season) => <span className="font-medium text-text">{s.name}</span>,
    },
    {
      key: 'course',
      header: 'Curso',
      render: (s: Season) => {
        const course = courses.find((c: Course) => c.id === s.courseId)
        return <span className="text-muted">{course?.name || '—'}</span>
      },
    },
    {
      key: 'dates',
      header: 'Período',
      render: (s: Season) => (
        <span className="text-muted">{formatDate(s.startDate)} — {formatDate(s.endDate)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Season) => <Badge variant={statusVariant[s.status]}>{s.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (s: Season) => (
        <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer">
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <PageContainer
      title="Semestres"
      count={seasons.length}
      action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Criar Semestre</Button>}
    >
      <Select
        value={courseFilter}
        onChange={(e) => setCourseFilter(e.target.value)}
        placeholder="Todos os cursos"
        options={courses.map((c: Course) => ({ value: c.id, label: c.name }))}
        className="max-w-xs"
      />

      <Table columns={columns} data={seasons} keyExtractor={(s) => s.id} isLoading={isLoading} />

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Semestre' : 'Criar Semestre'}
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
              id="courseId"
              label="Curso"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              placeholder="Selecionar curso..."
              options={courses.map((c: Course) => ({ value: c.id, label: c.name }))}
            />
          )}
          <Input id="seasonName" label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input id="startDate" label="Início" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <Input id="endDate" label="Fim" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </div>
          <Select
            id="seasonStatus"
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as SeasonStatus })}
            options={[
              { value: 'PLANNED', label: 'Planejado' },
              { value: 'ACTIVE', label: 'Ativo' },
              { value: 'CLOSED', label: 'Encerrado' },
            ]}
          />
        </div>
      </Modal>
    </PageContainer>
  )
}
