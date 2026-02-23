/**
 * Mapa de error codes da API para mensagens amigáveis e ações automáticas.
 *
 * O interceptor do Axios usa este mapa para:
 * 1. Exibir mensagens em PT-BR no toast
 * 2. Executar ações automáticas (redirect, logout)
 *
 * Se o backend retornar um `code` que não está aqui, o interceptor
 * faz fallback para a mensagem crua da response.
 */

export interface ErrorHandler {
  message?: string
  action?: 'logout' | `redirect:${string}`
}

export const ERROR_HANDLERS: Record<string, ErrorHandler> = {
  // ── Auth ──────────────────────────────────────────
  AUTH_INVALID_CREDENTIALS: { message: 'Email ou senha inválidos' },
  AUTH_MUST_CHANGE_PASSWORD: {
    message: 'Primeiro acesso. Troque sua senha.',
  },
  AUTH_PASSWORD_ALREADY_CHANGED: {
    message: 'Senha já foi alterada. Faça login normalmente.',
  },
  AUTH_WRONG_TEMP_PASSWORD: { message: 'Senha temporária incorreta' },
  AUTH_SAME_PASSWORD: {
    message: 'A nova senha deve ser diferente da atual',
  },
  AUTH_TOKEN_EXPIRED: {
    message: 'Sessão expirada. Faça login novamente.',
    action: 'logout',
  },
  AUTH_TOKEN_INVALID: {
    message: 'Sessão inválida. Faça login novamente.',
    action: 'logout',
  },
  AUTH_TOKEN_MISSING: {
    message: 'Sessão não encontrada. Faça login.',
    action: 'logout',
  },
  AUTH_UNAUTHORIZED: {
    message: 'Não autorizado',
    action: 'logout',
  },
  AUTH_FORBIDDEN: { message: 'Acesso negado' },

  // ── Validation ────────────────────────────────────
  VALIDATION_REQUIRED_FIELD: { message: 'Campo obrigatório não preenchido' },
  VALIDATION_INVALID_FORMAT: { message: 'Formato inválido' },
  VALIDATION_MIN_LENGTH: { message: 'Valor muito curto' },
  VALIDATION_INVALID_VALUE: { message: 'Valor inválido' },

  // ── Resource ──────────────────────────────────────
  RESOURCE_NOT_FOUND: { message: 'Registro não encontrado' },

  // ── Conflict ──────────────────────────────────────
  CONFLICT_DUPLICATE: { message: 'Este registro já existe' },
  CONFLICT_ALREADY_EXISTS: { message: 'Registro já cadastrado' },
  CONFLICT_INVALID_STATE: {},

  // ── Business ──────────────────────────────────────
  BUSINESS_SELF_ACTION: { message: 'Não é possível realizar esta ação em si mesmo' },
  BUSINESS_WRONG_ROLE: { message: 'Perfil de usuário incompatível' },
  BUSINESS_MAX_ATTEMPTS: { message: 'Número máximo de tentativas atingido' },
  BUSINESS_NOT_AVAILABLE: { message: 'Recurso não disponível' },

  // ── Storage ───────────────────────────────────────
  STORAGE_FILE_TOO_LARGE: { message: 'Arquivo muito grande' },
  STORAGE_INVALID_TYPE: { message: 'Tipo de arquivo não permitido' },

  // ── Internal ──────────────────────────────────────
  INTERNAL_ERROR: { message: 'Erro interno do servidor' },
}
