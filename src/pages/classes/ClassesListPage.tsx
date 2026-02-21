import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Eye } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { listClasses, createClass, updateClass } from '@/api/classes'
import { listSeasons } from '@/api/seasons'
import type { Class, Season } from '@/types'
import toast from 'react-hot-toast'

export function ClassesListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Class | null>(null)
  const [seasonFilter, setSeasonFilter] = useState('')
  const [form, setForm] = useState({ seasonId: '', name: '', maxStudents: 30 })

  const { data: seasons = [] } = useQuery({ queryKey: ['seasons'], queryFn: () => listSeasons() })

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes', seasonFilter],
    queryFn: () => listClasses(seasonFilter || undefined),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      return editing
        ? updateClass(editing.id, { name: form.name, maxStudents: form.maxStudents })
        : createClass(form)
    },
    onSuccess: () => {
      toast.success(editing ? 'Turma atualizada!' : 'Turma criada!')
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      closeModal()
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ seasonId: '', name: '', maxStudents: 30 })
    setModalOpen(true)
  }

  const openEdit = (cls: Class) => {
    setEditing(cls)
    setForm({ seasonId: cls.seasonId, name: cls.name, maxStudents: cls.maxStudents })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (c: Class) => <span className="font-medium text-text">{c.name}</span>,
    },
    {
      key: 'season',
      header: 'Semestre',
      render: (c: Class) => {
        const season = seasons.find((s: Season) => s.id === c.seasonId)
        return <span className="text-muted">{season?.name || '—'}</span>
      },
    },
    {
      key: 'maxStudents',
      header: 'Máx. Alunos',
      render: (c: Class) => <span className="text-muted">{c.maxStudents}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: Class) => <Badge variant={c.isActive ? 'success' : 'error'}>{c.isActive ? 'Ativa' : 'Inativa'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (c: Class) => (
        <div className="flex gap-1">
          <button
            onClick={() => navigate(`/classes/${c.id}`)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
            title="Detalhes"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEdit(c)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="Turmas"
      count={classes.length}
      action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Criar Turma</Button>}
    >
      <Select
        value={seasonFilter}
        onChange={(e) => setSeasonFilter(e.target.value)}
        placeholder="Todos os semestres"
        options={seasons.map((s: Season) => ({ value: s.id, label: s.name }))}
        className="max-w-xs"
      />

      <Table columns={columns} data={classes} keyExtractor={(c) => c.id} isLoading={isLoading} />

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Turma' : 'Criar Turma'}
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
              id="seasonId"
              label="Semestre"
              value={form.seasonId}
              onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
              placeholder="Selecionar semestre..."
              options={seasons.map((s: Season) => ({ value: s.id, label: s.name }))}
            />
          )}
          <Input id="className" label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input id="maxStudents" label="Máximo de Alunos" type="number" value={String(form.maxStudents)} onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })} required />
        </div>
      </Modal>
    </PageContainer>
  )
}
