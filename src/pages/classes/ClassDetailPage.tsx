import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArchiveRestore, Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { ConfirmModal } from '@/components/ui/Modal'
import {
  getClass,
  listClassTeachers,
  listDeletedClassTeachers,
  listClassStudents,
  listDeletedClassStudents,
  addTeacher,
  removeTeacher,
  addStudent,
  removeStudent,
} from '@/api/classes'
import { listUsers } from '@/api/users'
import toast from 'react-hot-toast'

interface ClassMember {
  id: string
  teacherId?: string
  studentId?: string
  name: string
  email: string
  stageName?: string
  joinedAt: string
  leftAt?: string | null
}

export function ClassDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('teachers')
  const [statusTab, setStatusTab] = useState('active')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [removeTarget, setRemoveTarget] = useState<{ member: ClassMember; type: 'teacher' | 'student' } | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<{ member: ClassMember; type: 'teacher' | 'student' } | null>(null)

  const { data: classData } = useQuery({
    queryKey: ['class', slug],
    queryFn: () => getClass(slug!),
    enabled: !!slug,
  })

  const classId = classData?.id

  const { data: teachersRaw = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['class-teachers', classId, 'active'],
    queryFn: () => listClassTeachers(classId!),
    enabled: !!classId,
  })

  const { data: deletedTeachersRaw = [], isLoading: loadingDeletedTeachers } = useQuery({
    queryKey: ['class-teachers', classId, 'deleted'],
    queryFn: () => listDeletedClassTeachers(classId!),
    enabled: !!classId,
  })

  const { data: studentsRaw = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['class-students', classId, 'active'],
    queryFn: () => listClassStudents(classId!),
    enabled: !!classId,
  })

  const { data: deletedStudentsRaw = [], isLoading: loadingDeletedStudents } = useQuery({
    queryKey: ['class-students', classId, 'deleted'],
    queryFn: () => listDeletedClassStudents(classId!),
    enabled: !!classId,
  })

  const { data: allTeachersData } = useQuery({
    queryKey: ['users', 'TEACHER'],
    queryFn: () => listUsers({ role: 'TEACHER' }),
  })

  const { data: allStudentsData } = useQuery({
    queryKey: ['users', 'STUDENT'],
    queryFn: () => listUsers({ role: 'STUDENT' }),
  })

  const teachers: ClassMember[] = Array.isArray(teachersRaw) ? teachersRaw : []
  const deletedTeachers: ClassMember[] = Array.isArray(deletedTeachersRaw) ? deletedTeachersRaw : []
  const students: ClassMember[] = Array.isArray(studentsRaw) ? studentsRaw : []
  const deletedStudents: ClassMember[] = Array.isArray(deletedStudentsRaw) ? deletedStudentsRaw : []
  const allTeachers = Array.isArray(allTeachersData) ? allTeachersData : allTeachersData?.data ?? []
  const allStudents = Array.isArray(allStudentsData) ? allStudentsData : allStudentsData?.data ?? []

  const getUserId = (member: ClassMember) => member.teacherId || member.studentId || member.id

  const addMutation = useMutation({
    mutationFn: () => {
      if (!classId) throw new Error('Turma não encontrada')
      if (activeTab === 'teachers') return addTeacher(classId, selectedUserId)
      return addStudent(classId, selectedUserId)
    },
    onSuccess: () => {
      toast.success(activeTab === 'teachers' ? 'Professor vinculado!' : 'Aluno matriculado!')
      queryClient.invalidateQueries({ queryKey: [activeTab === 'teachers' ? 'class-teachers' : 'class-students', classId, 'active'] })
      queryClient.invalidateQueries({ queryKey: [activeTab === 'teachers' ? 'class-teachers' : 'class-students', classId, 'deleted'] })
      setAddModalOpen(false)
      setSelectedUserId('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => {
      if (!removeTarget) throw new Error('Nenhum vínculo selecionado')
      if (!classId) throw new Error('Turma não encontrada')
      const userId = getUserId(removeTarget.member)
      if (removeTarget.type === 'teacher') return removeTeacher(classId, userId)
      return removeStudent(classId, userId)
    },
    onSuccess: () => {
      toast.success('Removido com sucesso!')
      queryClient.invalidateQueries({ queryKey: [removeTarget?.type === 'teacher' ? 'class-teachers' : 'class-students', classId, 'active'] })
      queryClient.invalidateQueries({ queryKey: [removeTarget?.type === 'teacher' ? 'class-teachers' : 'class-students', classId, 'deleted'] })
      setRemoveTarget(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => {
      if (!restoreTarget) throw new Error('Nenhum vínculo selecionado para restaurar')
      if (!classId) throw new Error('Turma não encontrada')
      const userId = getUserId(restoreTarget.member)
      if (restoreTarget.type === 'teacher') return addTeacher(classId, userId)
      return addStudent(classId, userId)
    },
    onSuccess: () => {
      if (!restoreTarget) return
      toast.success(restoreTarget.type === 'teacher' ? 'Professor restaurado com sucesso!' : 'Aluno restaurado com sucesso!')
      queryClient.invalidateQueries({ queryKey: [restoreTarget.type === 'teacher' ? 'class-teachers' : 'class-students', classId, 'active'] })
      queryClient.invalidateQueries({ queryKey: [restoreTarget.type === 'teacher' ? 'class-teachers' : 'class-students', classId, 'deleted'] })
      setRestoreTarget(null)
    },
    onSettled: () => setRestoreTarget(null),
  })

  const assignedTeacherIds = new Set(teachers.map((t) => t.teacherId))
  const assignedStudentIds = new Set(students.map((s) => s.studentId))

  const availableUsers = activeTab === 'teachers'
    ? allTeachers.filter((t: { id: string }) => !assignedTeacherIds.has(t.id))
    : allStudents.filter((s: { id: string }) => !assignedStudentIds.has(s.id))

  const memberColumns = [
    {
      key: 'name',
      header: 'Nome',
      render: (m: ClassMember) => <span className="font-medium text-text">{m.name}</span>,
    },
    {
      key: 'email',
      header: 'E-mail',
      render: (m: ClassMember) => <span className="text-muted">{m.email}</span>,
    },
    {
      key: statusTab === 'active' ? 'joinedAt' : 'leftAt',
      header: statusTab === 'active' ? 'Entrada' : 'Saída',
      render: (m: ClassMember) => (
        <span className="text-muted text-sm">
          {statusTab === 'active'
            ? (m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('pt-BR') : '—')
            : (m.leftAt ? new Date(m.leftAt).toLocaleDateString('pt-BR') : '—')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (m: ClassMember) => (
        statusTab === 'active' ? (
          <button
            onClick={() => setRemoveTarget({ member: m, type: activeTab === 'teachers' ? 'teacher' : 'student' })}
            className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setRestoreTarget({ member: m, type: activeTab === 'teachers' ? 'teacher' : 'student' })}
            className="rounded-lg p-1.5 text-muted hover:bg-success/10 hover:text-success transition-colors cursor-pointer"
            title="Restaurar"
          >
            <ArchiveRestore className="h-4 w-4" />
          </button>
        )
      ),
    },
  ]

  const selectedRows = activeTab === 'teachers'
    ? (statusTab === 'active' ? teachers : deletedTeachers)
    : (statusTab === 'active' ? students : deletedStudents)

  const isMembersLoading = activeTab === 'teachers'
    ? (statusTab === 'active' ? loadingTeachers : loadingDeletedTeachers)
    : (statusTab === 'active' ? loadingStudents : loadingDeletedStudents)

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
        {statusTab === 'active' && (
          <Button size="sm" onClick={() => { setSelectedUserId(''); setAddModalOpen(true) }}>
            <Plus className="h-3.5 w-3.5" />
            {activeTab === 'teachers' ? 'Vincular Professor' : 'Matricular Aluno'}
          </Button>
        )}
      </div>

      <Tabs
        tabs={[
          {
            key: 'active',
            label: 'Ativos',
            count: activeTab === 'teachers' ? teachers.length : students.length,
          },
          {
            key: 'deleted',
            label: 'Lixeira',
            count: activeTab === 'teachers' ? deletedTeachers.length : deletedStudents.length,
          },
        ]}
        activeKey={statusTab}
        onChange={setStatusTab}
      />

      <Table
        columns={memberColumns}
        data={selectedRows}
        keyExtractor={(m) => m.id}
        isLoading={isMembersLoading}
        emptyMessage={
          statusTab === 'active'
            ? (activeTab === 'teachers' ? 'Nenhum professor vinculado' : 'Nenhum aluno matriculado')
            : (activeTab === 'teachers' ? 'Nenhum professor na lixeira' : 'Nenhum aluno na lixeira')
        }
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
          options={availableUsers.map((u: { id: string; name: string; email: string }) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
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
        message={`Tem certeza que deseja remover "${removeTarget?.member.name}" desta turma?`}
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar Vínculo"
        message={`Tem certeza que deseja restaurar "${restoreTarget?.member.name}" nesta turma?`}
        confirmLabel="Restaurar"
      />
    </PageContainer>
  )
}
