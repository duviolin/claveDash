import type {
  UserRole,
  UserStatus,
  SeasonStatus,
  ProjectStatus,
  ProjectType,
  DailyMissionTemplateStatus,
} from '@/types'

// ── Roles ──────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  DIRECTOR: 'Diretor',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
}

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const ROLE_BADGE_VARIANT: Record<UserRole, 'accent' | 'info' | 'success' | 'warning'> = {
  ADMIN: 'accent',
  DIRECTOR: 'warning',
  TEACHER: 'info',
  STUDENT: 'success',
}

// ── User Status ────────────────────────────────────────────

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
}

// ── Season Status ──────────────────────────────────────────

export const SEASON_STATUS_LABELS: Record<SeasonStatus, string> = {
  PLANNED: 'Planejado',
  ACTIVE: 'Ativo',
  CLOSED: 'Encerrado',
}

export const SEASON_STATUS_VARIANT: Record<SeasonStatus, 'warning' | 'success' | 'error'> = {
  PLANNED: 'warning',
  ACTIVE: 'success',
  CLOSED: 'error',
}

// ── Project Status ─────────────────────────────────────────

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  COMPLETED: 'Concluído',
}

export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, 'warning' | 'success' | 'info'> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  COMPLETED: 'info',
}

// ── Project Type ───────────────────────────────────────────

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  ALBUM: 'Álbum',
  PLAY: 'Peça',
}

// ── Daily Mission Status ───────────────────────────────────

export const DAILY_MISSION_STATUS_LABELS: Record<DailyMissionTemplateStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
}

export const DAILY_MISSION_STATUS_VARIANT: Record<DailyMissionTemplateStatus, 'warning' | 'success' | 'error'> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'error',
}
