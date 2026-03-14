import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { Plus, Eye, Pencil, Trash2, ArchiveRestore, Send, RotateCcw } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { DeactivationBlockedModal } from '@/components/ui/DeactivationBlockedModal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Pagination } from '@/components/ui/Pagination'
import { ResponsiveRowActions } from '@/components/ui/ResponsiveRowActions'
import { ResponsiveDataView } from '@/components/ui/ResponsiveDataView'
import { DetailFieldList } from '@/components/ui/DetailFieldList'
import {
  listProjectTemplatesPaginated,
  createProjectTemplate,
  updateProjectTemplate,
  deleteProjectTemplate,
  listDeletedProjectTemplates,
  restoreProjectTemplate,
  allowProjectTemplateInstantiation,
  blockProjectTemplateInstantiation,
  getProjectTemplateReadiness,
} from '@/api/templates'
import { presignDownload } from '@/api/storage'
import { listCourses } from '@/api/courses'
import { PROJECT_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { truncateText } from '@/lib/text'
import { FileUpload } from '@/components/ui/FileUpload'
import type { ProjectTemplate, ProjectType, Course } from '@/types'
import toast from 'react-hot-toast'
import { useTrashableListPage } from '@/hooks/useTrashableListPage'
import { useDeactivationBlockedHandler } from '@/hooks/useDeactivationBlockedHandler'

const TRASH_PAGE_LIMIT = 20
const ACTIVE_PAGE_LIMIT = 20

const tabs = [
  { key: 'active', label: 'Ativos' },
  { key: 'TRASH', label: 'Lixeira' },
]

export function ProjectTemplatesListPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const filterFromUrl = searchParams.get('courseSlug') ?? searchParams.get('courseId') ?? ''
  const [courseFilter, setCourseFilter] = useState(filterFromUrl)
  const { activeTab, isTrash, page, setPage, handleTabChange } = useTrashableListPage()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<ProjectTemplate | null>(null)
  const [isCoverUploading, setIsCoverUploading] = useState(false)
  const [previewTarget, setPreviewTarget] = useState<ProjectTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectTemplate | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<ProjectTemplate | null>(null)
  const { blockedInfo, setBlockedInfo, handleBlockedError } = useDeactivationBlockedHandler()
  const [form, setForm] = useState({ courseId: '', name: '', type: 'ALBUM' as ProjectType, description: '', coverImage: '' })

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => listCourses() })

  const { data: activeResponse, isLoading: isLoadingActive } = useQuery({
    queryKey: ['project-templates', 'active', courseFilter, page],
    queryFn: () =>
      listProjectTemplatesPaginated({
        courseIdOrSlug: courseFilter || undefined,
        page,
        limit: ACTIVE_PAGE_LIMIT,
      }),
    enabled: !isTrash,
    placeholderData: (previousData) => previousData,
  })

  const { data: deletedResponse, isLoading: isLoadingTrash } = useQuery({
    queryKey: ['project-templates', 'deleted', page],
    queryFn: () => listDeletedProjectTemplates({ page, limit: TRASH_PAGE_LIMIT }),
    enabled: isTrash,
    placeholderData: (previousData) => previousData,
  })

  const activeTemplates = activeResponse?.data ?? []
  const templatesList = isTrash ? (deletedResponse?.data ?? []) : activeTemplates
  const pagination = isTrash ? deletedResponse?.pagination : activeResponse?.pagination
  const isLoading = isTrash ? isLoadingTrash : isLoadingActive

  useEffect(() => {
    if (!pagination || page >= pagination.totalPages) return
    const nextPage = page + 1

    if (isTrash) {
      queryClient.prefetchQuery({
        queryKey: ['project-templates', 'deleted', nextPage],
        queryFn: () => listDeletedProjectTemplates({ page: nextPage, limit: TRASH_PAGE_LIMIT }),
      })
      return
    }

    queryClient.prefetchQuery({
      queryKey: ['project-templates', 'active', courseFilter, nextPage],
      queryFn: () =>
        listProjectTemplatesPaginated({
          courseIdOrSlug: courseFilter || undefined,
          page: nextPage,
          limit: ACTIVE_PAGE_LIMIT,
        }),
    })
  }, [courseFilter, isTrash, page, pagination, queryClient])

  const readinessResults = useQueries({
    queries: !isTrash
      ? activeTemplates.map((template) => ({
          queryKey: ['project-template-readiness', template.slug],
          queryFn: () => getProjectTemplateReadiness(template.slug),
          staleTime: 60 * 1000,
        }))
      : [],
  })

  const readinessBySlug = !isTrash
    ? Object.fromEntries(
        activeTemplates.map((template, index) => [template.slug, readinessResults[index]?.data])
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
      toast.success('Template cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      setModalOpen(false)
      setEditingTarget(null)
      setIsCoverUploading(false)
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
      toast.success('Template atualizado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      setModalOpen(false)
      setEditingTarget(null)
      setIsCoverUploading(false)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number; data?: { code?: string; details?: { tracksCount?: number; projectsCount?: number } } } }
      if (err.response?.status === 409 && err.response?.data?.code === 'CONFLICT_INVALID_STATE') {
        const tracksCount = err.response.data.details?.tracksCount ?? 0
        const projectsCount = err.response.data.details?.projectsCount ?? 0
        const parts: string[] = []
        if (tracksCount > 0) parts.push(`${tracksCount} ${tracksCount === 1 ? 'faixa/cena' : 'faixas/cenas'}`)
        if (projectsCount > 0) parts.push(`${projectsCount} ${projectsCount === 1 ? 'projeto ativo' : 'projetos ativos'}`)
        const reason = parts.length > 0 ? ` (${parts.join(' e ')})` : ''
        toast.error(`Não é possível alterar o tipo deste template, pois ele já possui conteúdo vinculado${reason}.`)
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProjectTemplate(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Template desativado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      handleBlockedError(error, deleteTarget!)
      setDeleteTarget(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreProjectTemplate(restoreTarget!.id),
    onSuccess: () => {
      toast.success('Template restaurado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      setRestoreTarget(null)
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => allowProjectTemplateInstantiation(id),
    onSuccess: () => {
      toast.success('Instanciação permitida com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { details?: { scorePercentage?: number; missingTips?: string[] } } } }
      const score = err.response?.data?.details?.scorePercentage
      const firstTip = err.response?.data?.details?.missingTips?.[0]
      if (typeof score === 'number') {
        toast.error(firstTip ? `Template não apto para instanciação (${score}%). ${firstTip}` : `Template não apto para instanciação (${score}%).`)
        return
      }
      toast.error('Não foi possível permitir a instanciação do template.')
    },
  })

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => blockProjectTemplateInstantiation(id),
    onSuccess: () => {
      toast.success('Permissão de instanciação removida com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    },
  })

  const getReadinessVariant = (score: number, isReady: boolean) => {
    if (isReady) return 'success' as const
    if (score >= 70) return 'warning' as const
    return 'default' as const
  }

  const isTemplateInstantiationAllowed = (template: ProjectTemplate) => template.isInstantiationAllowed ?? template.isPublished ?? false

  const getReadinessLabel = (statusLabel: 'Não pronto' | 'Quase pronto' | 'Apto para publicação' | 'Apto para instanciação' | 'Apto para instanciacao') => {
    if (statusLabel === 'Não pronto') return 'Em construção'
    if (statusLabel === 'Quase pronto') return 'Em validação'
    return 'Apto para instanciação'
  }

  const compactTopCellClass = 'align-top py-2.5'

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      className: `w-[48%] min-w-[320px] ${compactTopCellClass}`,
      render: (t: ProjectTemplate) => {
        const readiness = readinessBySlug[t.slug]

        return (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {coverBySlug[t.slug] ? (
                  <img
                    src={coverBySlug[t.slug]}
                    alt={`Capa do template ${t.name}`}
                    className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 shrink-0 rounded-lg border border-border bg-surface-2" aria-hidden="true" />
                )}
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-semibold leading-tight text-text" title={t.name}>
                    {truncateText(t.name, 56)}
                  </p>
                  <p className="text-[11px] text-muted">Atualizado em {formatDate(t.updatedAt)} • v{t.version}</p>
                </div>
              </div>

              <Badge variant={isTemplateInstantiationAllowed(t) ? 'success' : 'warning'} className="px-2 py-0 text-[11px]">
                {isTemplateInstantiationAllowed(t) ? 'Instanciação permitida' : 'Instanciação bloqueada'}
              </Badge>
            </div>

            {readiness ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={getReadinessVariant(readiness.scorePercentage, readiness.isReady)}
                    className={readiness.statusLabel === 'Não pronto' ? 'px-2 py-0 text-[11px] text-muted' : 'px-2 py-0 text-[11px]'}
                  >
                    {getReadinessLabel(readiness.statusLabel)}
                  </Badge>
                  <span className="text-[11px] font-medium text-muted">{readiness.scorePercentage}% concluído</span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${Math.max(0, Math.min(readiness.scorePercentage, 100))}%` }}
                  />
                </div>

                <p className="text-[11px] text-muted/90">
                  <span className="font-medium text-text">{readiness.trackCount}</span> faixas
                  {' • '}
                  <span className="font-medium text-text">{readiness.quizCount}</span> coletivas
                  {' • '}
                  <span className="font-medium text-text">{readiness.materialCount}</span> materiais
                  {' • '}
                  <span className="font-medium text-text">{readiness.studyTrackCount}</span> trilhas
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted">Calculando aptidão...</p>
            )}
          </div>
        )
      },
    },
    {
      key: 'type',
      header: 'Tipo',
      className: `w-[130px] ${compactTopCellClass}`,
      render: (t: ProjectTemplate) => <Badge variant={t.type === 'ALBUM' ? 'accent' : 'info'}>{PROJECT_TYPE_LABELS[t.type]}</Badge>,
    },
    {
      key: 'course',
      header: 'Curso',
      className: `w-[180px] ${compactTopCellClass}`,
      render: (t: ProjectTemplate) => {
        const course = courses.find((c: Course) => c.id === t.courseId)
        return (
          <span className="text-sm text-muted" title={course?.name}>
            {course?.name ? truncateText(course.name, 30) : '—'}
          </span>
        )
      },
    },
    {
      key: 'version',
      header: 'Versão',
      className: `w-[110px] ${compactTopCellClass}`,
      render: (t: ProjectTemplate) => <span className="text-sm text-muted">v{t.version}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      className: `w-[156px] text-right ${compactTopCellClass}`,
      render: (t: ProjectTemplate) => (
        <ResponsiveRowActions
          desktopClassName="min-w-[132px]"
          actions={[
            {
              key: 'preview',
              label: 'Visualizar projeto',
              icon: <Eye className="h-4 w-4" />,
              onClick: () => setPreviewTarget(t),
            },
            {
              key: isTemplateInstantiationAllowed(t) ? 'block-instantiation' : 'allow-instantiation',
              label: isTemplateInstantiationAllowed(t) ? 'Bloquear instanciação' : 'Permitir instanciação',
              icon: isTemplateInstantiationAllowed(t) ? <RotateCcw className="h-4 w-4" /> : <Send className="h-4 w-4" />,
              variant: isTemplateInstantiationAllowed(t) ? undefined : 'success',
              disabled: !isTemplateInstantiationAllowed(t) && !readinessBySlug[t.slug]?.isReady,
              onClick: () => {
                if (!isTemplateInstantiationAllowed(t) && !readinessBySlug[t.slug]?.isReady) {
                  toast.error('Este template ainda não está apto para instanciação.')
                  return
                }
                if (isTemplateInstantiationAllowed(t)) {
                  unpublishMutation.mutate(t.id)
                  return
                }
                publishMutation.mutate(t.id)
              },
            },
            {
              key: 'edit',
              label: 'Editar cadastro',
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => {
                setEditingTarget(t)
                setForm({
                  courseId: t.courseId,
                  name: t.name,
                  type: t.type,
                  description: t.description || '',
                  coverImage: t.coverImage || '',
                })
                setModalOpen(true)
              },
            },
            {
              key: 'delete',
              label: 'Desativar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => setDeleteTarget(t),
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
      className: `w-[48%] min-w-[320px] ${compactTopCellClass}`,
      render: (t: ProjectTemplate) => (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {coverBySlug[t.slug] ? (
              <img
                src={coverBySlug[t.slug]}
                alt={`Capa do template ${t.name}`}
                className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-lg border border-border bg-surface-2" aria-hidden="true" />
            )}
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm font-semibold leading-tight text-text" title={t.name}>
                {truncateText(t.name, 50)}
              </p>
              <p className="text-[11px] text-muted">Atualizado em {formatDate(t.updatedAt)} • v{t.version}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge variant="error" className="px-2 py-0 text-[11px]">Excluído</Badge>
            <span className="text-[11px] text-muted">{formatDate(t.updatedAt)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      className: `w-[130px] ${compactTopCellClass}`,
      render: (t: ProjectTemplate) => <Badge variant={t.type === 'ALBUM' ? 'accent' : 'info'}>{PROJECT_TYPE_LABELS[t.type]}</Badge>,
    },
    {
      key: 'course',
      header: 'Curso',
      className: `w-[180px] ${compactTopCellClass}`,
      render: (t: ProjectTemplate) => {
        const course = courses.find((c: Course) => c.id === t.courseId)
        return (
          <span className="text-sm text-muted" title={course?.name}>
            {course?.name ? truncateText(course.name, 30) : '—'}
          </span>
        )
      },
    },
    {
      key: 'deletedAt',
      header: 'Excluído em',
      className: `w-[150px] ${compactTopCellClass}`,
      render: (t: ProjectTemplate) => <span className="text-sm text-muted">{formatDate(t.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      className: `w-[156px] text-right ${compactTopCellClass}`,
      render: (t: ProjectTemplate) => (
        <ResponsiveRowActions
          desktopClassName="min-w-[132px]"
          actions={[
            {
              key: 'restore',
              label: 'Restaurar',
              icon: <ArchiveRestore className="h-4 w-4" />,
              variant: 'success',
              onClick: () => setRestoreTarget(t),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <PageContainer
      title="Templates de projeto"
      count={pagination?.total ?? templatesList.length}
    >
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {!isTrash && (
            <Select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value)
                setPage(1)
              }}
              placeholder="Todos os cursos"
              options={courses.map((c: Course) => ({ value: c.id, label: c.name }))}
              className="w-full sm:min-w-[280px]"
            />
          )}

          {!isTrash && (
            <Button
              onClick={() => {
                setEditingTarget(null)
                setForm({ courseId: courseFilter, name: '', type: 'ALBUM', description: '', coverImage: '' })
                setModalOpen(true)
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Cadastrar template
            </Button>
          )}
        </div>
      </div>

      <ResponsiveDataView
        columns={isTrash ? trashColumns : columns}
        data={templatesList}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        emptyMessage={isTrash ? 'A lixeira está vazia.' : 'Nenhum template encontrado.'}
        tableMinWidthClassName="min-w-[560px] lg:min-w-[640px]"
        mobileCardRender={(t) => {
          const course = courses.find((c: Course) => c.id === t.courseId)
          const readiness = readinessBySlug[t.slug]
          return (
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <div className="px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-semibold leading-tight text-text">{t.name}</p>
                    <p className="text-xs text-muted">{course?.name || '—'}</p>
                    <p className="text-[11px] text-muted">Atualizado em {formatDate(t.updatedAt)} • v{t.version}</p>
                  </div>
                  {isTrash ? <Badge variant="error">Excluído</Badge> : (
                    <Badge variant={isTemplateInstantiationAllowed(t) ? 'success' : 'warning'} className="px-2 py-0 text-[11px]">
                      {isTemplateInstantiationAllowed(t) ? 'Instanciação permitida' : 'Instanciação bloqueada'}
                    </Badge>
                  )}
                </div>
              </div>

              {!isTrash && readiness && (
                <div className="border-t border-border bg-surface-2/40 px-3.5 py-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant={getReadinessVariant(readiness.scorePercentage, readiness.isReady)} className="px-2 py-0 text-[11px]">
                      {getReadinessLabel(readiness.statusLabel)}
                    </Badge>
                    <span className="text-[11px] font-medium text-muted">{readiness.scorePercentage}%</span>
                  </div>
                  <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.max(0, Math.min(readiness.scorePercentage, 100))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted/90">
                    <span className="font-medium text-text">{readiness.trackCount}</span> faixas
                    {' • '}
                    <span className="font-medium text-text">{readiness.quizCount}</span> coletivas
                  </p>
                </div>
              )}

              <div className="border-t border-border bg-surface px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-muted">
                  <span>{PROJECT_TYPE_LABELS[t.type]}</span>
                  <span>v{t.version}</span>
                </div>
              </div>

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
                          onClick: () => setRestoreTarget(t),
                        },
                      ]
                    : [
                        {
                          key: 'preview',
                          label: 'Visualizar projeto',
                          icon: <Eye className="h-4 w-4" />,
                          onClick: () => setPreviewTarget(t),
                        },
                        {
                          key: isTemplateInstantiationAllowed(t) ? 'block-instantiation' : 'allow-instantiation',
                          label: isTemplateInstantiationAllowed(t) ? 'Bloquear instanciação' : 'Permitir instanciação',
                          icon: isTemplateInstantiationAllowed(t) ? <RotateCcw className="h-4 w-4" /> : <Send className="h-4 w-4" />,
                          variant: isTemplateInstantiationAllowed(t) ? undefined : 'success',
                          disabled: !isTemplateInstantiationAllowed(t) && !readinessBySlug[t.slug]?.isReady,
                          onClick: () => {
                            if (!isTemplateInstantiationAllowed(t) && !readinessBySlug[t.slug]?.isReady) {
                              toast.error('Este template ainda não está apto para instanciação.')
                              return
                            }
                            if (isTemplateInstantiationAllowed(t)) {
                              unpublishMutation.mutate(t.id)
                              return
                            }
                            publishMutation.mutate(t.id)
                          },
                        },
                        {
                          key: 'edit',
                          label: 'Editar cadastro',
                          icon: <Pencil className="h-4 w-4" />,
                          onClick: () => {
                            setEditingTarget(t)
                            setForm({
                              courseId: t.courseId,
                              name: t.name,
                              type: t.type,
                              description: t.description || '',
                              coverImage: t.coverImage || '',
                            })
                            setModalOpen(true)
                          },
                        },
                        {
                          key: 'delete',
                          label: 'Desativar',
                          icon: <Trash2 className="h-4 w-4" />,
                          variant: 'danger',
                          onClick: () => setDeleteTarget(t),
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
        title="Dados do projeto"
        footer={<Button variant="secondary" onClick={() => setPreviewTarget(null)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <DetailFieldList
            items={[
              { label: 'Nome', value: previewTarget?.name ?? '—' },
              {
                label: 'Curso',
                value: previewTarget ? (courses.find((c: Course) => c.id === previewTarget.courseId)?.name || '—') : '—',
              },
              { label: 'Versão', value: previewTarget ? `v${previewTarget.version}` : '—' },
              { label: 'Atualizado em', value: previewTarget ? formatDate(previewTarget.updatedAt) : '—' },
            ]}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Tipo</p>
            <div className="mt-1">
              {previewTarget ? (
                <Badge variant={previewTarget.type === 'ALBUM' ? 'accent' : 'info'}>
                  {PROJECT_TYPE_LABELS[previewTarget.type]}
                </Badge>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>
            <div className="mt-1">
              {previewTarget ? (
                <Badge variant={previewTarget.isActive ? 'success' : 'error'}>
                  {previewTarget.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Descrição</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text">
              {previewTarget?.description?.trim() || 'Sem descrição.'}
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTarget(null) }}
        title={editingTarget ? 'Editar template de projeto' : 'Cadastrar template de projeto'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingTarget(null); setIsCoverUploading(false) }}>Cancelar</Button>
            <Button
              onClick={() => (editingTarget ? updateMutation.mutate() : createMutation.mutate())}
              isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim() || !form.courseId || isCoverUploading}
            >
              {isCoverUploading ? 'Aguardando upload...' : editingTarget ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            id="ptCourseId"
            label="Curso"
            value={form.courseId}
            onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))}
            placeholder="Selecionar curso..."
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
            onUploadingChange={setIsCoverUploading}
            onRemove={() => setForm((prev) => ({ ...prev, coverImage: '' }))}
            label="Imagem de capa"
            compact
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Desativar template"
        message={`Confirma a desativação de "${deleteTarget?.name}"?`}
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreMutation.mutate()}
        isLoading={restoreMutation.isPending}
        title="Restaurar template"
        message={`Confirma a restauração de "${restoreTarget?.name}"?`}
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
