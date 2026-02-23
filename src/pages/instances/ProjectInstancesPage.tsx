import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, EyeOff, Pencil } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { instantiateProject, listProjects, updateProject, publishProject, unpublishProject } from '@/api/instances'
import { listProjectTemplates } from '@/api/templates'
import { listClasses } from '@/api/classes'
import { listSeasons } from '@/api/seasons'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_VARIANT } from '@/lib/constants'
import type { Project, ProjectTemplate, Season } from '@/types'
import toast from 'react-hot-toast'

export function ProjectInstancesPage() {
  const queryClient = useQueryClient()
  const [instantiateOpen, setInstantiateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Project | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [instForm, setInstForm] = useState({ templateId: '', classId: '', seasonId: '' })
  const [selectedSeasonId, setSelectedSeasonId] = useState('')

  const { data: seasons = [] } = useQuery({ queryKey: ['seasons'], queryFn: () => listSeasons() })

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', selectedSeasonId],
    queryFn: () => listProjects(selectedSeasonId),
    enabled: !!selectedSeasonId,
  })

  const { data: templates = [] } = useQuery({ queryKey: ['project-templates'], queryFn: () => listProjectTemplates() })
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => listClasses() })

  const instantiateMut = useMutation({
    mutationFn: () => instantiateProject(instForm),
    onSuccess: (data) => {
      toast.success(`Projeto instanciado! ${JSON.stringify(data).includes('created') ? '' : ''}`)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setInstantiateOpen(false)
    },
  })

  const updateMut = useMutation({
    mutationFn: () => updateProject(editTarget!.id, { name: editForm.name, description: editForm.description || undefined }),
    onSuccess: () => {
      toast.success('Projeto atualizado!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setEditTarget(null)
    },
  })

  const togglePublishMut = useMutation({
    mutationFn: (project: Project) => project.isVisible ? unpublishProject(project.id) : publishProject(project.id),
    onSuccess: () => {
      toast.success('Visibilidade alterada!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const columns = [
    { key: 'name', header: 'Nome', render: (p: Project) => <span className="font-medium text-text">{p.name}</span> },
    { key: 'status', header: 'Status', render: (p: Project) => <Badge variant={PROJECT_STATUS_VARIANT[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</Badge> },
    {
      key: 'visible',
      header: 'Visível',
      render: (p: Project) => <Badge variant={p.isVisible ? 'success' : 'error'}>{p.isVisible ? 'Sim' : 'Não'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (p: Project) => (
        <div className="flex gap-1">
          <button onClick={() => { setEditTarget(p); setEditForm({ name: p.name, description: p.description || '' }) }} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => togglePublishMut.mutate(p)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer" title={p.isVisible ? 'Ocultar' : 'Publicar'}>
            {p.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="Projetos Instanciados"
      count={selectedSeasonId ? projects.length : undefined}
      action={<Button onClick={() => { setInstForm({ templateId: '', classId: '', seasonId: '' }); setInstantiateOpen(true) }}><Plus className="h-4 w-4" /> Instanciar Projeto</Button>}
    >
      <div className="mb-4 max-w-xs">
        <Select
          id="filterSeason"
          label="Filtrar por Semestre"
          value={selectedSeasonId}
          onChange={(e) => setSelectedSeasonId(e.target.value)}
          placeholder="Selecionar semestre..."
          options={seasons.map((s: Season) => ({ value: s.id, label: s.name }))}
        />
      </div>

      {!selectedSeasonId ? (
        <p className="text-muted text-sm">Selecione um semestre para ver os projetos.</p>
      ) : (
        <Table columns={columns} data={projects} keyExtractor={(p) => p.id} isLoading={isLoading} />
      )}

      <Modal isOpen={instantiateOpen} onClose={() => setInstantiateOpen(false)} title="Instanciar Projeto" footer={
        <><Button variant="secondary" onClick={() => setInstantiateOpen(false)}>Cancelar</Button><Button onClick={() => instantiateMut.mutate()} isLoading={instantiateMut.isPending}>Instanciar</Button></>
      }>
        <div className="space-y-4">
          <Select id="instTemplate" label="Template" value={instForm.templateId} onChange={(e) => setInstForm({ ...instForm, templateId: e.target.value })} placeholder="Selecionar template..." options={templates.map((t: ProjectTemplate) => ({ value: t.id, label: t.name }))} />
          <Select id="instSeason" label="Semestre" value={instForm.seasonId} onChange={(e) => setInstForm({ ...instForm, seasonId: e.target.value })} placeholder="Selecionar semestre..." options={seasons.map((s: Season) => ({ value: s.id, label: s.name }))} />
          <Select id="instClass" label="Turma" value={instForm.classId} onChange={(e) => setInstForm({ ...instForm, classId: e.target.value })} placeholder="Selecionar turma..." options={classes.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))} />
        </div>
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Projeto" footer={
        <><Button variant="secondary" onClick={() => setEditTarget(null)}>Cancelar</Button><Button onClick={() => updateMut.mutate()} isLoading={updateMut.isPending}>Salvar</Button></>
      }>
        <div className="space-y-4">
          <Input id="projName" label="Nome" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Textarea id="projDesc" label="Descrição" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        </div>
      </Modal>
    </PageContainer>
  )
}
