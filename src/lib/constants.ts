import type {
  UserRole,
  UserStatus,
  CourseType,
  SeasonStatus,
  ProjectStatus,
  ProjectType,
  DailyMissionTemplateStatus,
  TrackMaterialType,
  ReadinessRuleCode,
} from '@/types'

// ── Roles ──────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  DIRECTOR: 'Diretor da unidade',
  TEACHER: 'Produtor',
  STUDENT: 'Artista',
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

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  MUSIC: 'Música',
  THEATER: 'Teatro',
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  ALBUM: 'Álbum',
  PLAY: 'Peça',
}

export const READINESS_RULE_LABELS: Record<ReadinessRuleCode, string> = {
  PROJECT_MIN_TRACKS: 'Quantidade mínima de faixas ativas no projeto',
  TRACKS_WITH_MIN_QUIZZES: 'Quantidade mínima de quizzes por faixa',
  TRACKS_WITH_MIN_MATERIALS: 'Quantidade mínima de materiais por faixa',
  TRACKS_WITH_MIN_STUDY_TRACKS: 'Quantidade mínima de trilhas de estudo por faixa',
}

// ── Track Material Type ─────────────────────────────────────

export const TRACK_MATERIAL_TYPE_LABELS: Record<TrackMaterialType, string> = {
  TEXT: 'Texto',
  PDF: 'PDF',
  AUDIO: 'Áudio',
  VIDEO: 'Vídeo',
  LINK: 'Link',
}

export const TRACK_MATERIAL_TYPE_VARIANT: Record<TrackMaterialType, 'accent' | 'info' | 'warning' | 'success' | 'error'> = {
  PDF: 'error',
  AUDIO: 'accent',
  VIDEO: 'info',
  TEXT: 'success',
  LINK: 'warning',
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

// ── Domain Events ───────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<string, string> = {
  USER_CREATED: 'Equipe criada',
  USER_UPDATED: 'Equipe atualizada',
  USER_SUSPENDED: 'Equipe suspensa',
  USER_REACTIVATED: 'Equipe reativada',
  USER_SOFT_DELETED: 'Equipe removida',
  USER_RESTORED: 'Equipe restaurada',
  PASSWORD_CHANGED: 'Senha alterada',

  STUDENT_PROFILE_CREATED: 'Perfil de artista criado',
  STUDENT_PROFILE_UPDATED: 'Perfil de artista atualizado',
  TEACHER_PROFILE_CREATED: 'Perfil de produtor criado',
  TEACHER_PROFILE_UPDATED: 'Perfil de produtor atualizado',
  STUDENT_CONTEXT_ACTIVATED: 'Contexto de artista ativado',
  STUDENT_CONTEXT_DEACTIVATED: 'Contexto de artista desativado',

  SCHOOL_CREATED: 'Unidade artística criada',
  SCHOOL_UPDATED: 'Unidade artística atualizada',
  SCHOOL_ACTIVATED: 'Unidade artística ativada',
  SCHOOL_DEACTIVATED: 'Unidade artística desativada',
  SCHOOL_RESTORED: 'Unidade artística restaurada',

  COURSE_CREATED: 'Núcleo artístico criado',
  COURSE_UPDATED: 'Núcleo artístico atualizado',
  COURSE_ACTIVATED: 'Núcleo artístico ativado',
  COURSE_DEACTIVATED: 'Núcleo artístico desativado',
  COURSE_RESTORED: 'Núcleo artístico restaurado',

  SEASON_CREATED: 'Temporada criada',
  SEASON_UPDATED: 'Temporada atualizada',
  SEASON_STARTED: 'Temporada iniciada',
  SEASON_CLOSED: 'Temporada encerrada',
  SEASON_DEACTIVATED: 'Temporada desativada',
  SEASON_RESTORED: 'Temporada restaurada',

  CLASS_CREATED: 'Grupo artístico criado',
  CLASS_UPDATED: 'Grupo artístico atualizado',
  CLASS_DEACTIVATED: 'Grupo artístico desativado',
  CLASS_RESTORED: 'Grupo artístico restaurado',
  CLASS_STUDENT_ENROLLED: 'Artista matriculado',
  CLASS_STUDENT_TRANSFERRED: 'Artista transferido',
  CLASS_STUDENT_DROPPED: 'Artista desligado',
  CLASS_TEACHER_ASSIGNED: 'Produtor atribuído',
  CLASS_TEACHER_REMOVED: 'Produtor removido',

  PROJECT_TEMPLATE_CREATED: 'Template de projeto criado',
  PROJECT_TEMPLATE_UPDATED: 'Template de projeto atualizado',
  PROJECT_TEMPLATE_ACTIVATED: 'Template de projeto ativado',
  PROJECT_TEMPLATE_DEACTIVATED: 'Template de projeto desativado',
  PROJECT_TEMPLATE_RESTORED: 'Template de projeto restaurado',
  PROJECT_INSTANTIATED: 'Projeto instanciado',
  PROJECT_UPDATED: 'Projeto atualizado',
  PROJECT_PUBLISHED: 'Projeto publicado',
  PROJECT_UNPUBLISHED: 'Projeto despublicado',
  PROJECT_COMPLETED: 'Projeto concluído',

  TRACK_SCENE_TEMPLATE_CREATED: 'Cena de faixa criada',
  TRACK_SCENE_TEMPLATE_UPDATED: 'Cena de faixa atualizada',
  TRACK_SCENE_TEMPLATE_DELETED: 'Cena de faixa removida',
  TRACK_SCENE_TEMPLATE_REORDERED: 'Cena de faixa reordenada',
  TRACK_SCENE_TEMPLATE_RESTORED: 'Cena de faixa restaurada',
  TRACK_MATERIAL_TEMPLATE_CREATED: 'Material de faixa criado',
  TRACK_MATERIAL_TEMPLATE_UPDATED: 'Material de faixa atualizado',
  TRACK_MATERIAL_TEMPLATE_DELETED: 'Material de faixa removido',
  TRACK_MATERIAL_TEMPLATE_RESTORED: 'Material de faixa restaurado',

  DAILY_MISSION_TEMPLATE_CREATED: 'Missão diária criada',
  DAILY_MISSION_TEMPLATE_UPDATED: 'Missão diária atualizada',
  DAILY_MISSION_TEMPLATE_DEACTIVATED: 'Missão diária desativada',
  DAILY_MISSION_TEMPLATE_RESTORED: 'Missão diária restaurada',
  DAILY_MISSION_TEMPLATE_PUBLISHED: 'Missão diária publicada',
  DAILY_MISSION_QUIZ_CREATED: 'Quiz de missão criado',
  DAILY_MISSION_QUIZ_UPDATED: 'Quiz de missão atualizado',
  DAILY_MISSION_QUIZ_DEACTIVATED: 'Quiz de missão desativado',
  DAILY_MISSION_QUIZ_RESTORED: 'Quiz de missão restaurado',
  DAILY_MISSION_RELEASED: 'Missão diária liberada',
  DAILY_MISSION_COMPLETED: 'Missão diária concluída',
  DAILY_MISSION_COMPLETED_WITH_PENALTY: 'Missão concluída com penalidade',
  DAILY_MISSION_SKIPPED: 'Missão diária pulada',

  STUDY_TRACK_TEMPLATE_CREATED: 'Template de estudo criado',
  STUDY_TRACK_TEMPLATE_UPDATED: 'Template de estudo atualizado',
  STUDY_TRACK_TEMPLATE_DEACTIVATED: 'Template de estudo desativado',
  STUDY_TRACK_TEMPLATE_RESTORED: 'Template de estudo restaurado',

  PRESS_QUIZ_TEMPLATE_CREATED: 'Template de coletiva de imprensa criado',
  PRESS_QUIZ_TEMPLATE_UPDATED: 'Template de coletiva de imprensa atualizado',
  PRESS_QUIZ_TEMPLATE_DEACTIVATED: 'Template de coletiva de imprensa desativado',
  PRESS_QUIZ_TEMPLATE_RESTORED: 'Template de coletiva de imprensa restaurado',
  PRESS_QUIZ_INSTANTIATED: 'Coletiva de imprensa instanciada',
  PRESS_QUIZ_UPDATED: 'Coletiva de imprensa atualizada',
  PRESS_QUIZ_ACTIVATED: 'Coletiva de imprensa ativada',
  PRESS_QUIZ_PUBLISHED: 'Coletiva de imprensa publicada',
  PRESS_QUIZ_ATTEMPTED: 'Coletiva de imprensa realizada',
  PRESS_QUIZ_PASSED: 'Coletiva de imprensa aprovada',
  PRESS_QUIZ_FAILED: 'Coletiva de imprensa reprovada',

  SUBMISSION_CREATED: 'Submissão criada',
  SUBMISSION_REJECTED: 'Submissão rejeitada',
  SUBMISSION_REVIEWED_POSITIVE: 'Avaliação positiva',
  SUBMISSION_REVIEWED_CONSTRUCTIVE: 'Avaliação construtiva',
  SUBMISSION_REVIEWED_CRITICAL: 'Avaliação crítica',

  TRACK_SCENE_UPDATED: 'Cena atualizada',
  TRACK_SCENE_PUBLISHED: 'Cena publicada',
  TRACK_SCENE_ARCHIVED: 'Cena arquivada',
  TRACK_SCENE_COMPLETED: 'Cena concluída',
  TRACK_MATERIAL_UPDATED: 'Material atualizado',
  STUDY_TRACK_UPDATED: 'Faixa de estudo atualizada',

  TOUR_STARTED: 'Turnê iniciada',
  TOUR_PAUSED: 'Turnê pausada',
  TOUR_RESUMED: 'Turnê retomada',
  TOUR_BROKEN: 'Turnê quebrada',
  TOUR_FINISHED: 'Turnê finalizada',
  STREAK_DAY_DONE: 'Dia de sequência concluído',
  STREAK_DAY_MISSED: 'Dia de sequência perdido',
  STREAK_DAY_PAUSED: 'Dia de sequência pausado',

  FAN_EARNED: 'Fã conquistado',
  FAN_LOST: 'Fã perdido',
  FAN_ADJUSTED: 'Fãs ajustados',
  FAN_RECALCULATED: 'Fãs recalculados',
  FAN_RULE_APPLIED: 'Regra de fã aplicada',
  CAREER_UPDATED: 'Carreira atualizada',
  CAREER_LEVEL_UP: 'Nível de carreira subiu',
  CAREER_RECALCULATED: 'Carreira recalculada',

  STREAK_RULE_APPLIED: 'Regra de sequência aplicada',
  STREAK_RECALCULATED: 'Sequência recalculada',

  NOTIFICATION_READ: 'Notificação lida',
  NOTIFICATION_ALL_READ: 'Notificações marcadas como lidas',

  DOMAIN_EVENT_REPLAYED: 'Evento reprocessado',
  PROJECTION_REBUILT: 'Projeção reconstruída',
}

export type EventAction = 'created' | 'updated' | 'deleted' | 'restored' | 'status' | 'system'

export function getEventAction(type: string): EventAction {
  if (type.includes('CREATED') || type.includes('ENROLLED') || type.includes('ASSIGNED') || type.includes('INSTANTIATED')) return 'created'
  if (type.includes('UPDATED') || type.includes('CHANGED')) return 'updated'
  if (type.includes('DELETED') || type.includes('DEACTIVATED') || type.includes('REMOVED') || type.includes('DROPPED') || type.includes('SOFT_DELETED') || type.includes('SUSPENDED')) return 'deleted'
  if (type.includes('RESTORED') || type.includes('REACTIVATED')) return 'restored'
  if (type.includes('REPLAYED') || type.includes('REBUILT') || type.includes('RECALCULATED')) return 'system'
  return 'status'
}

export const EVENT_ACTION_COLORS: Record<EventAction, string> = {
  created: 'bg-success',
  updated: 'bg-info',
  deleted: 'bg-error',
  restored: 'bg-warning',
  status: 'bg-accent',
  system: 'bg-muted',
}

export const ACTOR_TYPE_LABELS: Record<string, string> = {
  USER: 'Equipe',
  SYSTEM: 'Sistema',
  RULE_ENGINE: 'Motor de Regras',
}
