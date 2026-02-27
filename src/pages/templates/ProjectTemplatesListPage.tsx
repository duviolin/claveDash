import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { Plus, Eye, Pencil, Trash2, ArchiveRestore } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Pagination } from '@/components/ui/Pagination'
import type { AxiosError } from 'axios'
import {
  listProjectTemplates,
  createProjectTemplate,
  updateProjectTemplate,
  deleteProjectTemplate,
  listDeletedProjectTemplates,
  restoreProjectTemplate,
  getProjectTemplateReadiness,
} from '@/api/templates'
import { presignDownload } from '@/api/storage'
import { listCourses } from '@/api/courses'
import { PROJECT_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { FileUpload } from '@/components/ui/FileUpload'
import type { ProjectTemplate, ProjectType, Course, DeactivationErrorDetails } from '@/types'
import toast from 'react-hot-toast'

const TRASH_PAGE_LIMIT = 20

const tabs = [
  { key: 'active', label: 'Ativos' },
  { key: 'TRASH', label: 'Lixeira' },
]

export function ProjectTemplatesListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const filterFromUrl = searchParams.get('courseSlug') ?? searchParams.get('courseId') ?? ''
  const [courseFilter, setCourseFilter] = useState(filterFromUrl)
  const [activeTab, setActiveTab] = useState('active')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<ProjectTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectTemplate | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<ProjectTemplate | null>(null)
  const [blockedInfo, setBlockedInfo] = useState<{ name: string; slug: string; details: DeactivationErrorDetails } | null>(null)
  const [form, setForm] = useState({ courseId: '', name: '', type: 'ALBUM' as ProjectType, description: '', coverImage: '' })

  const isTrash = activeTab === 'TRASH'
  const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}...` : text)

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => listCourses() })

  const { data: templates = [], isLoading: isLoadingActive } = useQuery({
    queryKey: ['project-templates', courseFilter],
    queryFn: () => listProjectTemplates(courseFilter || undefined),
    enabled: !isTrash,
  })

  const { data: deletedResponse, isLoading: isLoadingTrash } = useQuery({
    queryKey: ['project-templates', 'deleted', page],
    queryFn: () => listDeletedProjectTemplates({ page, limit: TRASH_PAGE_LIMIT }),
    enabled: isTrash,
  })

  const templatesList = isTrash ? (deletedResponse?.data ?? []) : templates
  const pagination = deletedResponse?.pagination
  const isLoading = isTrash ? isLoadingTrash : isLoadingActive

  const readinessResults = useQueries({
    queries: !isTrash
      ? templates.map((template) => ({
          queryKey: ['project-template-readiness', template.slug],
          queryFn: () => getProjectTemplateReadiness(template.slug),
          staleTime: 60 * 1000,
        }))
      : [],
  })

  const readinessBySlug = !isTrash
    ? Object.fromEntries(
        templates.map((template, index) => [template.slug, readinessResults[index]?.data])
      )
    : {}

  const coverResults = useQueries({
    queries: templatesList.map((template) => ({
      queryKey: ['project-template-cover-image', template.coverImage],
      queryFn: async () => {
        if (!template.coverImage) return null
        const { downloadUrl } = await presignDownload(template.coverImage)
        return downloadUrl
      },
      enabled: Boolean(template.coverImage),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const coverBySlug = Object.fromEntries(
    templatesList.map((template, index) => [template.slug, coverResults[index]?.data ?? undefined])
  )

  const createMutation = useMutation({
    mutationFn: () => createProjectTemplate({
      courseId: form.courseId,
      name: form.name,
      type: form.type,
      description: form.description || undefined,
      coverImage: form.coverImage || undefined,
    }),
    onSuccess: () => {
      toast.success('Template criado!')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      setModalOpen(false)
      setEditingTarget(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => updateProjectTemplate(editingTarget!.id, {
      courseId: form.courseId,
      name: form.name,
      type: form.type,
      description: form.description || undefined,
      coverImage: form.coverImage || undefined,
    }),
    onSuccess: () => {
      toast.success('Template atualizado!')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      setModalOpen(false)
      setEditingTarget(null)
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ code?: string; details?: { tracksCount?: number; projectsCount?: number } }>
      if (err.response?.status === 409 && err.response?.data?.code === 'CONFLICT_INVALID_STATE') {
        const tracksCount = err.response.data.details?.tracksCount ?? 0
        const projectsCount = err.response.data.details?.projectsCount ?? 0
        const parts: string[] = []
        if (tracksCount > 0) parts.push(`${tracksCount} ${tracksCount === 1 ? 'faixa/cena' : 'faixas/cenas'}`)
        if (projectsCount > 0) parts.push(`${projectsCount} ${projectsCount === 1 ? 'projeto ativo' : 'projetos ativos'}`)
        const reason = parts.length > 0 ? ` (${parts.join(' e ')})` : ''
        toast.error(`Não dá para alterar o tipo deste template porque ele já possui conteúdo vinculado${reason}.`)
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProjectTemplate(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Template desativado!')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
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

  const restoreMutation = useMutation({
    mutationFn: () => restoreProjectTemplate(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Template restaurado!')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      setRestoreTarget(null)
    },
  })

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (t: ProjectTemplate) => (
        <div className="flex items-center gap-3">
          {coverBySlug[t.slug] ? (
            <img
              src={coverBySlug[t.slug]}
              alt={`Capa do template ${t.name}`}
              className="h-9 w-9 rounded-lg border border-border object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-lg border border-border bg-surface-2" aria-hidden="true" />
          )}
          <span className="font-medium text-text" title={t.name}>
            {truncate(t.name, 42)}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (t: ProjectTemplate) => <Badge variant={t.type === 'ALBUM' ? 'accent' : 'info'}>{PROJECT_TYPE_LABELS[t.type]}</Badge>,
    },
    {
      key: 'course',
      header: 'Núcleo artístico',
      render: (t: ProjectTemplate) => {
        const course = courses.find((c: Course) => c.id === t.courseId)
        return (
          <span className="text-muted" title={course?.name}>
            {course?.name ? truncate(course.name, 30) : '—'}
          </span>
        )
      },
    },
    {
      key: 'version',
      header: 'Versão',
      render: (t: ProjectTemplate) => <span className="text-muted">v{t.version}</span>,
    },
    {
      key: 'readiness',
      header: 'Aptidão',
      render: (t: ProjectTemplate) => {
        const readiness = readinessBySlug[t.slug]
        if (!readiness) return <span className="text-xs text-muted">Calculando...</span>

        const variant = readiness.isReady ? 'success' : readiness.scorePercentage >= 70 ? 'warning' : 'error'
        return (
          <div className="flex items-center gap-2">
            <Badge variant={variant}>{readiness.scorePercentage}%</Badge>
            <span className="text-xs text-muted">{readiness.statusLabel}</span>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (t: ProjectTemplate) => (
        <div className="flex gap-1">
          <button onClick={() => navigate(`/templates/projects/${t.slug}`)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer" title="Detalhes">
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setEditingTarget(t)
              setForm({
                courseId: t.courseId,
                name: t.name,
                type: t.type,
                description: t.description || '',
                coverImage: t.coverImage || '',
              })
              setModalOpen(true)
            }}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteTarget(t)} className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer" title="Desativar">
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
      render: (t: ProjectTemplate) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            {coverBySlug[t.slug] ? (
              <img
                src={coverBySlug[t.slug]}
                alt={`Capa do template ${t.name}`}
                className="h-9 w-9 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-lg border border-border bg-surface-2" aria-hidden="true" />
            )}
            <span className="font-medium text-text" title={t.name}>
              {truncate(t.name, 42)}
            </span>
          </div>
          <Badge variant="error">Excluído</Badge>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (t: ProjectTemplate) => <Badge variant={t.type === 'ALBUM' ? 'accent' : 'info'}>{PROJECT_TYPE_LABELS[t.type]}</Badge>,
    },
    {
      key: 'course',
      header: 'Núcleo artístico',
      render: (t: ProjectTemplate) => {
        const course = courses.find((c: Course) => c.id === t.courseId)
        return (
          <span className="text-muted" title={course?.name}>
            {course?.name ? truncate(course.name, 30) : '—'}
          </span>
        )
      },
    },
    {
      key: 'deletedAt',
      header: 'Excluído em',
      render: (t: ProjectTemplate) => <span className="text-muted">{formatDate(t.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (t: ProjectTemplate) => (
        <button
          onClick={() => setRestoreTarget(t)}
          className="rounded-lg p-1.5 text-muted hover:bg-success/10 hover:text-success transition-colors cursor-pointer"
          title="Restaurar"
        >
          <ArchiveRestore className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <PageContainer
      title="Templates de Projeto"
      count={pagination?.total ?? templatesList.length}
      action={
        !isTrash ? (
          <Button onClick={() => { setEditingTarget(null); setForm({ courseId: courseFilter, name: '', type: 'ALBUM', description: '', coverImage: '' }); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Criar Template
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={(key) => { setActiveTab(key); setPage(1) }} />

        {!isTrash && (
          <Select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            placeholder="Todos os núcleos artísticos"
            options={courses.map((c: Course) => ({ value: c.id, label: c.name }))}
            className="w-full sm:max-w-xs"
          />
        )}
      </div>

      <Table
        columns={isTrash ? trashColumns : columns}
        data={templatesList}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia' : 'Nenhum template encontrado'}
      />

      {isTrash && pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTarget(null) }}
        title={editingTarget ? 'Editar Template de Projeto' : 'Criar Template de Projeto'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingTarget(null) }}>Cancelar</Button>
            <Button onClick={() => (editingTarget ? updateMutation.mutate() : createMutation.mutate())} isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingTarget ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            id="ptCourseId"
            label="Núcleo artístico"
            value={form.courseId}
            onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))}
            placeholder="Selecionar núcleo artístico..."
            options={courses.map((c: Course) => ({ value: c.id, label: c.name }))}
          />
          <Input
            id="ptName"
            label="Nome"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Select
            id="ptType"
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as ProjectType }))}
            options={[{ value: 'ALBUM', label: 'Álbum' }, { value: 'PLAY', label: 'Peça' }]}
          />
          <Textarea
            id="ptDesc"
            label="Descrição"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <FileUpload
            fileType="images"
            entityType="project-template"
            entityId={editingTarget?.id || 'draft'}
            currentValue={form.coverImage || null}
            onUploadComplete={(key) => setForm((prev) => ({ ...prev, coverImage: key }))}
            onRemove={() => setForm((prev) => ({ ...prev, coverImage: '' }))}
            label="Imagem de Capa"
            compact
          />
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

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar Template"
        message={`Tem certeza que deseja restaurar "${restoreTarget?.name}"?`}
        confirmLabel="Restaurar"
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
