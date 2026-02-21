import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { ConfirmModal } from '@/components/ui/Modal'
import { getClass, listClassTeachers, listClassStudents, addTeacher, removeTeacher, addStudent, removeStudent } from '@/api/classes'
import { listUsers } from '@/api/users'
import type { User } from '@/types'
import toast from 'react-hot-toast'

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('teachers')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [removeTarget, setRemoveTarget] = useState<{ user: User; type: 'teacher' | 'student' } | null>(null)

  const { data: classData } = useQuery({
    queryKey: ['class', id],
    queryFn: () => getClass(id!),
    enabled: !!id,
  })

  const { data: teachersRaw = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['class-teachers', id],
    queryFn: () => listClassTeachers(id!),
    enabled: !!id,
  })

  const { data: studentsRaw = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['class-students', id],
    queryFn: () => listClassStudents(id!),
    enabled: !!id,
  })

  const { data: allTeachersData } = useQuery({
    queryKey: ['users', 'TEACHER'],
    queryFn: () => listUsers({ role: 'TEACHER' }),
  })

  const { data: allStudentsData } = useQuery({
    queryKey: ['users', 'STUDENT'],
    queryFn: () => listUsers({ role: 'STUDENT' }),
  })

  const teachers: User[] = Array.isArray(teachersRaw) ? teachersRaw : []
  const students: User[] = Array.isArray(studentsRaw) ? studentsRaw : []
  const allTeachers: User[] = Array.isArray(allTeachersData) ? allTeachersData : allTeachersData?.data ?? []
  const allStudents: User[] = Array.isArray(allStudentsData) ? allStudentsData : allStudentsData?.data ?? []

  const addMutation = useMutation({
    mutationFn: () => {
      if (activeTab === 'teachers') return addTeacher(id!, selectedUserId)
      return addStudent(id!, selectedUserId)
    },
    onSuccess: () => {
      toast.success(activeTab === 'teachers' ? 'Professor vinculado!' : 'Aluno matriculado!')
      queryClient.invalidateQueries({ queryKey: [activeTab === 'teachers' ? 'class-teachers' : 'class-students', id] })
      setAddModalOpen(false)
      setSelectedUserId('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => {
      if (!removeTarget) throw new Error('No target')
      if (removeTarget.type === 'teacher') return removeTeacher(id!, removeTarget.user.id)
      return removeStudent(id!, removeTarget.user.id)
    },
    onSuccess: () => {
      toast.success('Removido com sucesso!')
      queryClient.invalidateQueries({ queryKey: [removeTarget?.type === 'teacher' ? 'class-teachers' : 'class-students', id] })
      setRemoveTarget(null)
    },
  })

  const availableUsers = activeTab === 'teachers'
    ? allTeachers.filter((t) => !teachers.some((ct) => ct.id === t.id))
    : allStudents.filter((s) => !students.some((cs) => cs.id === s.id))

  const userColumns = [
    {
      key: 'name',
      header: 'Nome',
      render: (u: User) => <span className="font-medium text-text">{u.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (u: User) => <span className="text-muted">{u.email}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: User) => <Badge variant={u.status === 'ACTIVE' ? 'success' : 'error'}>{u.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (u: User) => (
        <button
          onClick={() => setRemoveTarget({ user: u, type: activeTab === 'teachers' ? 'teacher' : 'student' })}
          className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
          title="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <PageContainer title={classData?.name || 'Turma'}>
      <div className="flex items-center gap-4">
        <Tabs
          tabs={[
            { key: 'teachers', label: 'Professores', count: teachers.length },
            { key: 'students', label: 'Alunos', count: students.length },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
        <Button size="sm" onClick={() => { setSelectedUserId(''); setAddModalOpen(true) }}>
          <Plus className="h-3.5 w-3.5" />
          {activeTab === 'teachers' ? 'Vincular Professor' : 'Matricular Aluno'}
        </Button>
      </div>

      <Table
        columns={userColumns}
        data={activeTab === 'teachers' ? teachers : students}
        keyExtractor={(u) => u.id}
        isLoading={activeTab === 'teachers' ? loadingTeachers : loadingStudents}
        emptyMessage={activeTab === 'teachers' ? 'Nenhum professor vinculado' : 'Nenhum aluno matriculado'}
      />

      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={activeTab === 'teachers' ? 'Vincular Professor' : 'Matricular Aluno'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => addMutation.mutate()} isLoading={addMutation.isPending} disabled={!selectedUserId}>
              {activeTab === 'teachers' ? 'Vincular' : 'Matricular'}
            </Button>
          </>
        }
      >
        <Select
          id="userId"
          label={activeTab === 'teachers' ? 'Professor' : 'Aluno'}
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          placeholder="Selecionar..."
          options={availableUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
        />
        {availableUsers.length === 0 && (
          <p className="mt-2 text-sm text-muted">
            {activeTab === 'teachers' ? 'Todos os professores já estão vinculados.' : 'Todos os alunos já estão matriculados.'}
          </p>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeMutation.mutate()}
        isLoading={removeMutation.isPending}
        title="Remover Vínculo"
        message={`Tem certeza que deseja remover "${removeTarget?.user.name}" desta turma?`}
      />
    </PageContainer>
  )
}
