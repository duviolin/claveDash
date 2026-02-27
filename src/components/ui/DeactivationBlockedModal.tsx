import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import type { DeactivationErrorDetails } from '@/types'

interface DeactivationBlockedModalProps {
  isOpen: boolean
  onClose: () => void
  entityName: string
  /** Slug (or id) of the parent entity for building detail/list URLs. */
  parentSlug: string
  details: DeactivationErrorDetails | null
}

const CHILD_NAV: Record<string, { label: string; buildUrl: (identifier: string) => string }> = {
  courses: { label: 'Núcleos artísticos', buildUrl: (slug) => `/courses?schoolSlug=${slug}` },
  seasons: { label: 'Temporadas', buildUrl: (slug) => `/seasons?courseSlug=${slug}` },
  classes: { label: 'Grupos artísticos', buildUrl: (slug) => `/classes?seasonSlug=${slug}` },
  students: { label: 'Artistas', buildUrl: (slug) => `/classes/${slug}` },
  teachers: { label: 'Produtores', buildUrl: (slug) => `/classes/${slug}` },
  members: { label: 'Membros', buildUrl: (slug) => `/classes/${slug}` },
  projectTemplates: { label: 'Templates de Projeto', buildUrl: (slug) => `/templates/projects?courseSlug=${slug}` },
  dailyMissionTemplates: { label: 'Missões Diárias', buildUrl: (slug) => `/templates/daily-missions?courseSlug=${slug}` },
  trackSceneTemplates: { label: 'Cenas', buildUrl: (slug) => `/templates/projects/${slug}` },
  projects: { label: 'Projetos', buildUrl: () => `/instances/projects` },
  pressQuizTemplates: { label: 'Coletivas de imprensa', buildUrl: (slug) => `/templates/projects/${slug}` },
  studyTrackTemplates: { label: 'Trilhas de Estudo', buildUrl: (slug) => `/templates/projects/${slug}` },
  trackMaterialTemplates: { label: 'Materiais', buildUrl: (slug) => `/templates/projects/${slug}` },
  dailyMissionQuizzes: { label: 'Quizzes', buildUrl: () => `/templates/daily-missions` },
  schools: { label: 'Unidades artísticas', buildUrl: () => `/schools` },
}

export function DeactivationBlockedModal({
  isOpen,
  onClose,
  entityName,
  parentSlug,
  details,
}: DeactivationBlockedModalProps) {
  const navigate = useNavigate()

  if (!details) return null

  const nav = CHILD_NAV[details.childResource]
  const childLabel = nav?.label ?? details.childResource

  const handleNavigate = () => {
    if (nav) {
      navigate(nav.buildUrl(parentSlug))
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Não é possível desativar" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-error/5 border border-error/20 p-4">
          <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-text">
              {entityName} possui registros ativos vinculados
            </p>
            <p className="text-sm text-muted">
              {details.count != null
                ? `${details.count} ${childLabel.toLowerCase()} ativo(s) encontrado(s). Desative-os antes de continuar.`
                : details.studentsCount != null || details.teachersCount != null
                  ? buildMembersMessage(details)
                  : `Existem ${childLabel.toLowerCase()} ativos vinculados. Desative-os antes de continuar.`}
            </p>
          </div>
        </div>

        {details.names && details.names.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-2/50 p-3">
            <p className="text-xs font-medium text-muted mb-2">{childLabel} ativos:</p>
            <ul className="space-y-1">
              {details.names.map((name, i) => (
                <li key={i} className="text-sm text-text">• {name}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          {nav && (
            <Button variant="primary" onClick={handleNavigate}>
              <ExternalLink className="h-4 w-4" />
              Ir para {childLabel}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function buildMembersMessage(details: DeactivationErrorDetails): string {
  const parts: string[] = []
  if (details.studentsCount && details.studentsCount > 0) {
    parts.push(`${details.studentsCount} artista(s)`)
  }
  if (details.teachersCount && details.teachersCount > 0) {
    parts.push(`${details.teachersCount} produtor(es)`)
  }
  return `${parts.join(' e ')} vinculado(s). Remova os vínculos antes de continuar.`
}
