import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { Plus, Eye, Pencil, Trash2, ArchiveRestore, Send, RotateCcw } from 'lucide-react'
import axios from 'axios'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Pagination } from '@/components/ui/Pagination'
import { ResponsiveRowActions } from '@/components/ui/ResponsiveRowActions'
import { ResponsiveDataView } from '@/components/ui/ResponsiveDataView'
import { DetailFieldList } from '@/components/ui/DetailFieldList'
import {
  instantiateProject,
  updateProject,
  publishProject,
  unpublishProject,
  listProjectInstancesPaginated,
  listDeletedProjectInstances,
  deleteProjectInstance,
  restoreProjectInstance,
} from '@/api/instances'
import { getProjectTemplateReadiness, listProjectTemplates } from '@/api/templates'
import { listClasses } from '@/api/classes'
import { listSeasons } from '@/api/seasons'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_VARIANT } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { truncateText } from '@/lib/text'
import { getReadyTemplatesForSeason, isInstantiationSelectionComplete } from '@/lib/instanceValidation'
import { useTrashableListPage } from '@/hooks/useTrashableListPage'
import type { Project, ProjectTemplate, Season } from '@/types'
import toast from 'react-hot-toast'

const TRASH_PAGE_LIMIT = 20
const ACTIVE_PAGE_LIMIT = 20

const tabs = [
  { key: 'active', label: 'Ativos' },
  { key: 'TRASH', label: 'Lixeira' },
]

export function ProjectInstancesPage() {
  const queryClient = useQueryClient()
  const { activeTab, isTrash, page, setPage, handleTabChange } = useTrashableListPage()
  const [instantiateOpen, setInstantiateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Project | null>(null)
  const [previewTarget, setPreviewTarget] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<Project | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [instForm, setInstForm] = useState({ templateId: '', classId: '', seasonId: '' })
  const [seasonFilter, setSeasonFilter] = useState('')

  const { data: seasons = [] } = useQuery({ queryKey: ['seasons'], queryFn: () => listSeasons() })

  const { data: activeResponse, isLoading: isLoadingActive } = useQuery({
    queryKey: ['project-instances', 'active', seasonFilter, page],
    queryFn: () =>
      listProjectInstancesPaginated({
        seasonId: seasonFilter || undefined,
        page,
        limit: ACTIVE_PAGE_LIMIT,
      }),
    enabled: !isTrash,
    placeholderData: (previousData) => previousData,
  })

  const { data: deletedResponse, isLoading: isLoadingTrash } = useQuery({
    queryKey: ['project-instances', 'deleted', page],
    queryFn: () => listDeletedProjectInstances({ page, limit: TRASH_PAGE_LIMIT }),
    enabled: isTrash,
    placeholderData: (previousData) => previousData,
  })

  const projectsList = isTrash ? (deletedResponse?.data ?? []) : (activeResponse?.data ?? [])
  const pagination = isTrash ? deletedResponse?.pagination : activeResponse?.pagination
  const isLoading = isTrash ? isLoadingTrash : isLoadingActive

  const selectedInstSeason = useMemo(
    () => seasons.find((season) => season.id === instForm.seasonId),
    [seasons, instForm.seasonId]
  )

  const { data: templates = [] } = useQuery({
    queryKey: ['project-templates', selectedInstSeason?.courseId ?? ''],
    enabled: instantiateOpen && !!selectedInstSeason,
    queryFn: () => listProjectTemplates(selectedInstSeason?.courseId),
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', instForm.seasonId],
    enabled: instantiateOpen && !!instForm.seasonId,
    queryFn: () => listClasses(instForm.seasonId),
  })

  const { data: templateReadinessById = {} } = useQuery<Record<string, boolean>>({
    queryKey: ['project-template-readiness-for-instantiate', templates.map((t) => t.id).join('|')],
    enabled: instantiateOpen && templates.length > 0,
    queryFn: async () => {
      const readinessEntries = await Promise.all(
        templates.map(async (template) => {
          try {
            const readiness = await getProjectTemplateReadiness(template.slug)
            return [template.id, readiness.isReady] as const
          } catch {
            return [template.id, false] as const
          }
        })
      )

      return Object.fromEntries(readinessEntries)
    },
  })

  const readinessResults = useQueries({
    queries: !isTrash
      ? projectsList.map((project) => ({
          queryKey: ['project-instance-readiness', project.id, project.templateSlug],
          queryFn: async () => {
            if (!project.templateSlug) return null
            return getProjectTemplateReadiness(project.templateSlug)
          },
          staleTime: 60 * 1000,
        }))
      : [],
  })

  const readinessByProjectId = !isTrash
    ? Object.fromEntries(projectsList.map((project, index) => [project.id, readinessResults[index]?.data]))
    : {}

  const readyTemplates = useMemo(() => templates.filter((template) => templateReadinessById[template.id]), [templates, templateReadinessById])
  const contextualReadyTemplates = useMemo(
    () => getReadyTemplatesForSeason(templates, templateReadinessById, selectedInstSeason),
    [templates, templateReadinessById, selectedInstSeason]
  )
  const blockedTemplateCount = templates.length - readyTemplates.length
  const canSubmitInstantiation = isInstantiationSelectionComplete(instForm)

  useEffect(() => {
    if (!pagination || page >= pagination.totalPages) return
    const nextPage = page + 1

    if (isTrash) {
      queryClient.prefetchQuery({
        queryKey: ['project-instances', 'deleted', nextPage],
        queryFn: () => listDeletedProjectInstances({ page: nextPage, limit: TRASH_PAGE_LIMIT }),
      })
      return
    }

    queryClient.prefetchQuery({
      queryKey: ['project-instances', 'active', seasonFilter, nextPage],
      queryFn: () =>
        listProjectInstancesPaginated({
          seasonId: seasonFilter || undefined,
          page: nextPage,
          limit: ACTIVE_PAGE_LIMIT,
        }),
    })
  }, [isTrash, page, pagination, queryClient, seasonFilter])

  const instantiateMut = useMutation({
    mutationFn: () => {
      const canInstantiate = !!templateReadinessById[instForm.templateId]
      if (!canInstantiate) {
        throw new Error('O template ainda não está apto para instanciação. Conclua os critérios antes de instanciar.')
      }
      if (!canSubmitInstantiation) {
        throw new Error('Selecione semestre, turma e template para instanciar o projeto.')
      }
      return instantiateProject(instForm)
    },
    onSuccess: (data) => {
      toast.success(`Projeto instanciado com sucesso.${JSON.stringify(data).includes('created') ? '' : ''}`)
      queryClient.invalidateQueries({ queryKey: ['project-instances'] })
      setInstantiateOpen(false)
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.data) {
        const responseData = error.response.data as {
          code?: string
          details?: {
            projectName?: string
            scorePercentage?: number
            missingTips?: string[]
          }
        }

        if (responseData.code === 'CONFLICT_ALREADY_EXISTS' && responseData.details?.projectName) {
          toast.error(`Esse projeto já foi instanciado: ${responseData.details.projectName}.`)
          return
        }

        if (responseData.code === 'CONFLICT_INVALID_STATE' && typeof responseData.details?.scorePercentage === 'number') {
          const score = responseData.details.scorePercentage
          const firstTip = responseData.details.missingTips?.[0]
          toast.error(firstTip ? `Template ainda não apto (${score}%). ${firstTip}` : `Template ainda não apto (${score}%).`)
          return
        }
      }

      const message = error instanceof Error ? error.message : 'Não foi possível instanciar o projeto.'
      toast.error(message)
    },
  })

  const updateMut = useMutation({
    mutationFn: () => updateProject(editTarget!.id, { name: editForm.name, description: editForm.description || undefined }),
    onSuccess: () => {
      toast.success('Projeto atualizado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['project-instances'] })
      setEditTarget(null)
    },
  })

  const togglePublishMut = useMutation({
    mutationFn: (project: Project) => project.isVisible ? unpublishProject(project.id) : publishProject(project.id),
    onSuccess: () => {
      toast.success('Visibilidade atualizada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['project-instances'] })
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.data) {
        const responseData = error.response.data as {
          code?: string
          details?: {
            scorePercentage?: number
            missingTips?: string[]
          }
        }

        if (responseData.code === 'CONFLICT_INVALID_STATE' && typeof responseData.details?.scorePercentage === 'number') {
          const score = responseData.details.scorePercentage
          const firstTip = responseData.details.missingTips?.[0]
          toast.error(firstTip ? `Projeto não apto para publicar (${score}%). ${firstTip}` : `Projeto não apto para publicar (${score}%).`)
          return
        }
      }

      toast.error('Não foi possível atualizar a visibilidade do projeto.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProjectInstance(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Instância desativada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['project-instances'] })
      setDeleteTarget(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreProjectInstance(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Instância restaurada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['project-instances'] })
      setRestoreTarget(null)
    },
  })

  const compactTopCellClass = 'align-top py-2.5'

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      className: `w-[45%] min-w-[320px] ${compactTopCellClass}`,
      render: (project: Project) => {
        const readiness = readinessByProjectId[project.id]
        return (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-text" title={project.name}>
                  {truncateText(project.name, 56)}
                </p>
                <p className="text-[11px] text-muted">
                  Atualizado em {formatDate(project.updatedAt ?? project.createdAt)} • v{project.projectTemplateVersion}
                </p>
              </div>
              <Badge variant={project.isVisible ? 'success' : 'warning'} className="px-2 py-0 text-[11px]">
                {project.isVisible ? 'Publicado para alunos' : 'Não publicado'}
              </Badge>
            </div>
            {readiness ? (
              <p className="text-[11px] text-muted">
                Aptidão do template: <span className="font-medium text-text">{readiness.scorePercentage}%</span>
              </p>
            ) : (
              <p className="text-[11px] text-muted">Aptidão: verificando...</p>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      className: `w-[130px] ${compactTopCellClass}`,
      render: (project: Project) => <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>{PROJECT_STATUS_LABELS[project.status]}</Badge>,
    },
    {
      key: 'context',
      header: 'Contexto',
      className: `w-[220px] ${compactTopCellClass}`,
      render: (project: Project) => (
        <span className="text-sm text-muted" title={`${project.seasonName ?? '—'} • ${project.className ?? '—'}`}>
          {truncateText(`${project.seasonName ?? '—'} • ${project.className ?? '—'}`, 34)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: `w-[156px] text-right ${compactTopCellClass}`,
      render: (project: Project) => (
        <ResponsiveRowActions
          desktopClassName="min-w-[132px]"
          actions={[
            {
              key: 'preview',
              label: 'Visualizar projeto',
              icon: <Eye className="h-4 w-4" />,
              onClick: () => setPreviewTarget(project),
            },
            {
              key: project.isVisible ? 'unpublish' : 'publish',
              label: project.isVisible ? 'Remover publicação' : 'Publicar para alunos',
              icon: project.isVisible ? <RotateCcw className="h-4 w-4" /> : <Send className="h-4 w-4" />,
              variant: project.isVisible ? undefined : 'success',
              disabled: !project.isVisible && !readinessByProjectId[project.id]?.isReady,
              onClick: () => {
                if (!project.isVisible && !readinessByProjectId[project.id]?.isReady) {
                  toast.error('Este projeto ainda não está apto para publicação.')
                  return
                }
                togglePublishMut.mutate(project)
              },
            },
            {
              key: 'edit',
              label: 'Editar projeto',
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => {
                setEditTarget(project)
                setEditForm({ name: project.name, description: project.description || '' })
              },
            },
            {
              key: 'delete',
              label: 'Desativar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => setDeleteTarget(project),
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
      className: `w-[52%] min-w-[340px] ${compactTopCellClass}`,
      render: (project: Project) => (
        <div className="space-y-1">
          <p className="truncate text-sm font-semibold leading-tight text-text">{truncateText(project.name, 56)}</p>
          <p className="text-[11px] text-muted">
            Desativado em {formatDate(project.updatedAt ?? project.createdAt)} • {project.seasonName ?? '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: `w-[130px] ${compactTopCellClass}`,
      render: () => <Badge variant="error">Excluído</Badge>,
    },
    {
      key: 'actions',
      header: 'Ações',
      className: `w-[156px] text-right ${compactTopCellClass}`,
      render: (project: Project) => (
        <ResponsiveRowActions
          desktopClassName="min-w-[132px]"
          actions={[
            {
              key: 'restore',
              label: 'Restaurar',
              icon: <ArchiveRestore className="h-4 w-4" />,
              variant: 'success',
              onClick: () => setRestoreTarget(project),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <PageContainer
      title="Instâncias de projeto"
      count={pagination?.total ?? projectsList.length}
    >
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {!isTrash && (
            <Select
              value={seasonFilter}
              onChange={(e) => {
                setSeasonFilter(e.target.value)
                setPage(1)
              }}
              placeholder="Todos os semestres"
              options={seasons.map((s: Season) => ({ value: s.id, label: s.name }))}
              className="w-full sm:min-w-[280px]"
            />
          )}
          {!isTrash && (
            <Button onClick={() => { setInstForm({ templateId: '', classId: '', seasonId: '' }); setInstantiateOpen(true) }}>
              <Plus className="h-4 w-4" />
              Criar instância
            </Button>
          )}
        </div>
      </div>

      <ResponsiveDataView
        columns={isTrash ? trashColumns : columns}
        data={projectsList}
        keyExtractor={(project) => project.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia.' : 'Nenhuma instância encontrada.'}
        tableMinWidthClassName="min-w-[560px] lg:min-w-[640px]"
        mobileCardRender={(project) => {
          const readiness = readinessByProjectId[project.id]
          return (
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <div className="px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-semibold leading-tight text-text">{project.name}</p>
                    <p className="text-xs text-muted">{project.seasonName ?? '—'} • {project.className ?? '—'}</p>
                    <p className="text-[11px] text-muted">Atualizado em {formatDate(project.updatedAt ?? project.createdAt)}</p>
                  </div>
                  {isTrash ? (
                    <Badge variant="error">Excluído</Badge>
                  ) : (
                    <Badge variant={project.isVisible ? 'success' : 'warning'} className="px-2 py-0 text-[11px]">
                      {project.isVisible ? 'Publicado para alunos' : 'Não publicado'}
                    </Badge>
                  )}
                </div>
              </div>
              {!isTrash && (
                <div className="border-t border-border bg-surface-2/40 px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
                    <span>{PROJECT_STATUS_LABELS[project.status]}</span>
                    <span>{readiness ? `${readiness.scorePercentage}% aptidão` : 'Aptidão: verificando...'}</span>
                  </div>
                </div>
              )}
              <ResponsiveRowActions
                className="justify-start px-3 pb-3"
                desktopClassName="justify-start"
                actions={
                  isTrash
                    ? [
                        {
                          key: 'restore',
                          label: 'Restaurar',
                          icon: <ArchiveRestore className="h-4 w-4" />,
                          variant: 'success',
                          onClick: () => setRestoreTarget(project),
                        },
                      ]
                    : [
                        {
                          key: 'preview',
                          label: 'Visualizar projeto',
                          icon: <Eye className="h-4 w-4" />,
                          onClick: () => setPreviewTarget(project),
                        },
                        {
                          key: project.isVisible ? 'unpublish' : 'publish',
                          label: project.isVisible ? 'Remover publicação' : 'Publicar para alunos',
                          icon: project.isVisible ? <RotateCcw className="h-4 w-4" /> : <Send className="h-4 w-4" />,
                          variant: project.isVisible ? undefined : 'success',
                          disabled: !project.isVisible && !readinessByProjectId[project.id]?.isReady,
                          onClick: () => {
                            if (!project.isVisible && !readinessByProjectId[project.id]?.isReady) {
                              toast.error('Este projeto ainda não está apto para publicação.')
                              return
                            }
                            togglePublishMut.mutate(project)
                          },
                        },
                        {
                          key: 'edit',
                          label: 'Editar projeto',
                          icon: <Pencil className="h-4 w-4" />,
                          onClick: () => {
                            setEditTarget(project)
                            setEditForm({ name: project.name, description: project.description || '' })
                          },
                        },
                        {
                          key: 'delete',
                          label: 'Desativar',
                          icon: <Trash2 className="h-4 w-4" />,
                          variant: 'danger',
                          onClick: () => setDeleteTarget(project),
                        },
                      ]
                }
              />
            </div>
          )
        }}
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
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        title="Dados da instância"
        footer={<Button variant="secondary" onClick={() => setPreviewTarget(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <DetailFieldList
            items={[
              { label: 'Nome', value: previewTarget?.name ?? '—' },
              { label: 'Template', value: previewTarget?.templateName ?? '—' },
              { label: 'Semestre', value: previewTarget?.seasonName ?? '—' },
              { label: 'Turma', value: previewTarget?.className ?? '—' },
              { label: 'Criado em', value: previewTarget ? formatDate(previewTarget.createdAt) : '—' },
            ]}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Publicação</p>
            <div className="mt-1">
              {previewTarget ? (
                <Badge variant={previewTarget.isVisible ? 'success' : 'warning'}>
                  {previewTarget.isVisible ? 'Publicado para alunos' : 'Não publicado'}
                </Badge>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={instantiateOpen} onClose={() => setInstantiateOpen(false)} title="Instanciar projeto" footer={
        <><Button variant="secondary" onClick={() => setInstantiateOpen(false)}>Cancelar</Button><Button onClick={() => instantiateMut.mutate()} isLoading={instantiateMut.isPending} disabled={!canSubmitInstantiation}>Instanciar</Button></>
      }>
        <div className="space-y-4">
          <Select
            id="instSeason"
            label="Semestre"
            value={instForm.seasonId}
            onChange={(e) => setInstForm({ seasonId: e.target.value, classId: '', templateId: '' })}
            placeholder="Selecionar semestre..."
            options={seasons.map((s: Season) => ({ value: s.id, label: s.name }))}
          />
          <Select
            id="instClass"
            label="Turma"
            value={instForm.classId}
            onChange={(e) => setInstForm({ ...instForm, classId: e.target.value })}
            placeholder={instForm.seasonId ? 'Selecionar turma...' : 'Selecione um semestre antes'}
            disabled={!instForm.seasonId}
            options={classes.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
          />
          <Select
            id="instTemplate"
            label="Template"
            value={instForm.templateId}
            onChange={(e) => setInstForm({ ...instForm, templateId: e.target.value })}
            placeholder={selectedInstSeason ? 'Selecionar template apto...' : 'Selecione um semestre antes'}
            disabled={!selectedInstSeason}
            options={contextualReadyTemplates.map((t: ProjectTemplate) => ({ value: t.id, label: t.name }))}
          />
          {blockedTemplateCount > 0 && (
            <p className="text-xs text-warning">
              {blockedTemplateCount} template(s) não exibido(s) por ainda não estarem aptos ou permitidos para instanciação.
            </p>
          )}
        </div>
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Editar projeto" footer={
        <><Button variant="secondary" onClick={() => setEditTarget(null)}>Cancelar</Button><Button onClick={() => updateMut.mutate()} isLoading={updateMut.isPending}>Salvar alterações</Button></>
      }>
        <div className="space-y-4">
          <Input id="projName" label="Nome" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Textarea id="projDesc" label="Descrição" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Desativar instância"
        message={`Confirma a desativação de "${deleteTarget?.name}"?`}
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar instância"
        message={`Confirma a restauração de "${restoreTarget?.name}"?`}
        confirmLabel="Restaurar"
      />
    </PageContainer>
  )
}
