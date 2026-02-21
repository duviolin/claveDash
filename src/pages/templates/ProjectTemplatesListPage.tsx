import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { listProjectTemplates, createProjectTemplate, deleteProjectTemplate } from '@/api/templates'
import { listCourses } from '@/api/courses'
import type { ProjectTemplate, ProjectType, Course } from '@/types'
import toast from 'react-hot-toast'

export function ProjectTemplatesListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProjectTemplate | null>(null)
  const [courseFilter, setCourseFilter] = useState('')
  const [form, setForm] = useState({ courseId: '', name: '', type: 'ALBUM' as ProjectType, description: '' })

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => listCourses() })

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['project-templates', courseFilter],
    queryFn: () => listProjectTemplates(courseFilter || undefined),
  })

  const createMutation = useMutation({
    mutationFn: () => createProjectTemplate({
      courseId: form.courseId,
      name: form.name,
      type: form.type,
      description: form.description || undefined,
    }),
    onSuccess: () => {
      toast.success('Template criado!')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      setModalOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProjectTemplate(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Template desativado!')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      setDeleteTarget(null)
    },
  })

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (t: ProjectTemplate) => <span className="font-medium text-text">{t.name}</span>,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (t: ProjectTemplate) => <Badge variant={t.type === 'ALBUM' ? 'accent' : 'info'}>{t.type}</Badge>,
    },
    {
      key: 'course',
      header: 'Curso',
      render: (t: ProjectTemplate) => {
        const course = courses.find((c: Course) => c.id === t.courseId)
        return <span className="text-muted">{course?.name || '—'}</span>
      },
    },
    {
      key: 'version',
      header: 'Versão',
      render: (t: ProjectTemplate) => <span className="text-muted">v{t.version}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (t: ProjectTemplate) => (
        <div className="flex gap-1">
          <button onClick={() => navigate(`/templates/projects/${t.id}`)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer" title="Detalhes">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteTarget(t)} className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer" title="Desativar">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="Templates de Projeto"
      count={templates.length}
      action={<Button onClick={() => { setForm({ courseId: '', name: '', type: 'ALBUM', description: '' }); setModalOpen(true) }}><Plus className="h-4 w-4" /> Criar Template</Button>}
    >
      <Select
        value={courseFilter}
        onChange={(e) => setCourseFilter(e.target.value)}
        placeholder="Todos os cursos"
        options={courses.map((c: Course) => ({ value: c.id, label: c.name }))}
        className="max-w-xs"
      />

      <Table columns={columns} data={templates} keyExtractor={(t) => t.id} isLoading={isLoading} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Criar Template de Projeto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} isLoading={createMutation.isPending}>Criar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select id="ptCourseId" label="Curso" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} placeholder="Selecionar curso..." options={courses.map((c: Course) => ({ value: c.id, label: c.name }))} />
          <Input id="ptName" label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select id="ptType" label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ProjectType })} options={[{ value: 'ALBUM', label: 'Álbum' }, { value: 'PLAY', label: 'Peça' }]} />
          <Textarea id="ptDesc" label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Desativar Template"
        message={`Tem certeza que deseja desativar "${deleteTarget?.name}"? Esta ação desativa o registro.`}
      />
    </PageContainer>
  )
}
