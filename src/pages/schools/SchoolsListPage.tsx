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
import { listSchools, createSchool, updateSchool } from '@/api/schools'
import { listUsers } from '@/api/users'
import type { School, User } from '@/types'
import toast from 'react-hot-toast'

export function SchoolsListPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<School | null>(null)
  const [form, setForm] = useState({ name: '', directorId: '' })

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: listSchools,
  })

  const { data: directorsData } = useQuery({
    queryKey: ['users', 'DIRECTOR'],
    queryFn: () => listUsers({ role: 'DIRECTOR' }),
  })

  const directors: User[] = Array.isArray(directorsData) ? directorsData : directorsData?.data ?? []

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name: form.name, directorId: form.directorId || undefined }
      return editing ? updateSchool(editing.id, payload) : createSchool(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Escola atualizada!' : 'Escola criada!')
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      closeModal()
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', directorId: '' })
    setModalOpen(true)
  }

  const openEdit = (school: School) => {
    setEditing(school)
    setForm({ name: school.name, directorId: school.directorId || '' })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (s: School) => <span className="font-medium text-text">{s.name}</span>,
    },
    {
      key: 'director',
      header: 'Diretor',
      render: (s: School) => {
        const director = directors.find((d) => d.id === s.directorId)
        return <span className="text-muted">{director?.name || '—'}</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: School) => (
        <Badge variant={s.isActive ? 'success' : 'error'}>{s.isActive ? 'Ativa' : 'Inativa'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (s: School) => (
        <button
          onClick={() => openEdit(s)}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <PageContainer
      title="Escolas"
      count={schools.length}
      action={
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Criar Escola
        </Button>
      }
    >
      <Table columns={columns} data={schools} keyExtractor={(s) => s.id} isLoading={isLoading} />

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Escola' : 'Criar Escola'}
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
          <Input
            id="schoolName"
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            id="directorId"
            label="Diretor"
            value={form.directorId}
            onChange={(e) => setForm({ ...form, directorId: e.target.value })}
            placeholder="Selecionar diretor..."
            options={directors.map((d) => ({ value: d.id, label: d.name }))}
          />
        </div>
      </Modal>
    </PageContainer>
  )
}
