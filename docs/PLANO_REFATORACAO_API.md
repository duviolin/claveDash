# Plano de Refatoração — Integração Dashboard ↔ API

**Data:** 22/02/2026  
**Referência:** `claveBack/docs/DASHBOARD_API.md`

---

## Mapeamento de Gaps

### Legenda
- ✅ OK — já está alinhado com a API
- ⚠️ PARCIAL — funciona mas precisa ajuste
- ❌ FALTANDO — não existe no dashboard

| Área | Status | Problema |
|------|--------|----------|
| **Types** `src/types/index.ts` | ⚠️ | `PaginatedResponse` com estrutura errada (flat vs nested `pagination`). `Project` com campos inventados (`progress`, `tracks`). `AuthUser` sem `status`. Faltam tipos de Notification. |
| **Auth API** `src/api/auth.ts` | ⚠️ | `getMe()` só retorna `user`, mas API retorna `{ user, profile, context }`. Falta `PATCH /me/avatar`. |
| **AuthContext** `src/contexts/AuthContext.tsx` | ⚠️ | Não armazena `profile` nem `context` do `/me`. |
| **Users API** `src/api/users.ts` | ⚠️ | `listUsers` sem tipo de retorno explícito (deveria ser `PaginatedResponse<User>`). |
| **Schools API** `src/api/schools.ts` | ⚠️ | Hardcoda `page:1, limit:100` e descarta pagination. |
| **Courses API** `src/api/courses.ts` | ⚠️ | Retorna `Course[]` direto, mas API pode paginar. `updateCourse` falta campo `type`. |
| **Seasons API** `src/api/seasons.ts` | ⚠️ | `updateSeason` aceita só `{ name? }`, mas API aceita `{ name?, startDate?, endDate?, status? }`. |
| **Classes API** `src/api/classes.ts` | ✅ | Endpoints corretos. |
| **Templates API** `src/api/templates.ts` | ✅ | Endpoints corretos e completos. |
| **Daily Missions API** `src/api/dailyMissions.ts` | ✅ | OK. |
| **Instances API** `src/api/instances.ts` | ⚠️ | `listProjects` usa `/seasons/:id/projects` que não existe na API doc. |
| **Storage API** `src/api/storage.ts` | ⚠️ | Tipos locais em vez de compartilhados. Wrapper `{ success, data }` precisa verificar. |
| **Profiles API** `src/api/profiles.ts` | ✅ | OK, mas tipos são locais (deveriam estar em `types/index.ts`). |
| **Notifications** | ❌ | Não existe. API tem 3 endpoints. |
| **Media Binding** | ❌ | Não existe. API tem 4 endpoints. |
| **Error Codes** `src/lib/errorCodes.ts` | ✅ | Completo e funcional. |
| **API Client** `src/api/client.ts` | ✅ | Interceptors OK. |

---

## Etapas de Execução

Cada etapa é um commit isolado. Execute o prompt no agente, revise, e comite.

---

### ETAPA 1 — Atualizar Types (`src/types/index.ts`)

**Arquivos:** `src/types/index.ts`  
**Escopo:** Alinhar todas as interfaces TypeScript com a documentação da API.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivo a editar: src/types/index.ts

Atualize o arquivo de tipos para alinhar com a API documentada. Mudanças necessárias:

1. `PaginatedResponse<T>` — mudar de estrutura flat para nested:
   ATUAL: { data: T[]; total: number; page: number; limit: number; totalPages: number }
   CORRETO: { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

2. `AuthUser` — adicionar campo `status: UserStatus`

3. `Project` — substituir completamente. A interface atual está errada.
   CORRETO:
   {
     id: string; templateId: string; classId: string; seasonId: string;
     name: string; description: string | null; coverImage: string | null;
     status: ProjectStatus; isVisible: boolean; releasedAt: string | null;
     projectTemplateVersion: number; createdAt: string;
   }

4. Adicionar interfaces novas:
   - StudentProfile { id, userId, stageName, avatarUrl: string|null, bio: string|null, createdAt }
   - TeacherProfile { id, userId, avatarUrl: string|null, bio: string|null, createdAt }
   - StorageConfig { fileType, maxSizeMB: number, maxSizeBytes: number, allowedMimeTypes: string[], allowedExtensions: string[] }
   - PresignUploadResponse { uploadUrl, key, expiresIn: number }
   - Notification { id, userId, type: string, title: string, message: string, data: Record<string,unknown>|null, isRead: boolean, createdAt }
   - MeResponse { user: AuthUser; profile: StudentProfile | TeacherProfile | null; context: { schoolId: string|null; courseId: string|null; seasonId: string|null; classId: string|null } }

5. No `TrackSceneTemplate`, remover campo `unlockAfterTrackId` (não existe na API) e remover `updatedAt` dele.

6. Confirmar que `QuizQuestion` tem apenas: { question: string; options: string[]; correctIndex: number }

NÃO mude nenhum outro arquivo. Apenas src/types/index.ts.
Rode o linter ao final para garantir que não há erros.
---
```

**Commit:** `refactor(types): align TypeScript interfaces with API documentation`

---

### ETAPA 2 — Atualizar Auth (API + Context)

**Arquivos:** `src/api/auth.ts`, `src/contexts/AuthContext.tsx`  
**Escopo:** Alinhar autenticação com `/me` completo, adicionar avatar.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivos a editar: src/api/auth.ts, src/contexts/AuthContext.tsx

CONTEXTO: Na etapa anterior, atualizamos src/types/index.ts. Agora temos os tipos
MeResponse, AuthUser (com status), StudentProfile, TeacherProfile.

MUDANÇAS em src/api/auth.ts:
1. Importar MeResponse de @/types
2. getMe() deve retornar MeResponse completo (não só user):
   async function getMe(): Promise<MeResponse> {
     const { data } = await api.get<MeResponse>('/me')
     return data
   }
3. Adicionar função updateAvatar:
   async function updateAvatar(key: string): Promise<{ success: boolean; avatarUrl: string }> {
     const { data } = await api.patch('/me/avatar', { key })
     return data
   }
4. Exportar updateAvatar

MUDANÇAS em src/contexts/AuthContext.tsx:
1. Importar MeResponse, StudentProfile, TeacherProfile de @/types
2. Adicionar ao state: profile (StudentProfile | TeacherProfile | null) e userContext (MeResponse['context'] | null)
3. Atualizar AuthContextType para incluir: profile, userContext
4. refreshUser() agora recebe MeResponse completo:
   - setUser(me.user)
   - setProfile(me.profile)
   - setUserContext(me.context)
5. loginWithToken() também deve chamar getMe() e setar profile/context
6. logout() deve limpar profile e userContext
7. Expor profile e userContext no Provider value

IMPORTANTE: Não quebre nenhum componente existente. O useAuth().user deve continuar funcionando.
Rode o linter ao final.
---
```

**Commit:** `refactor(auth): update getMe to return full context, add avatar endpoint`

---

### ETAPA 3 — Atualizar Users (API + Pages)

**Arquivos:** `src/api/users.ts`, `src/pages/users/UsersListPage.tsx`  
**Escopo:** Tipar retorno de listUsers, alinhar com paginação da API.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivos a editar: src/api/users.ts, src/pages/users/UsersListPage.tsx

CONTEXTO: PaginatedResponse<T> agora tem formato { data: T[]; pagination: { page, limit, total, totalPages } }

MUDANÇAS em src/api/users.ts:
1. Importar PaginatedResponse de @/types
2. listUsers() deve retornar Promise<PaginatedResponse<User>>:
   const { data } = await api.get<PaginatedResponse<User>>('/users', { params })
   return data
3. Manter todas as outras funções iguais.

MUDANÇAS em src/pages/users/UsersListPage.tsx:
1. Ler o arquivo atual para entender como listUsers é consumido.
2. Adaptar para o novo formato de retorno:
   - Antes: provavelmente usava response diretamente como array
   - Agora: response.data é o array, response.pagination tem os metadados
3. Se a página já tem paginação visual, conectar com pagination.total, pagination.totalPages etc.
4. Se não tem paginação visual, adicionar controles básicos de paginação (anterior/próximo) usando o componente de UI existente ou botões simples.

Rode o linter ao final.
---
```

**Commit:** `refactor(users): type listUsers response with proper pagination`

---

### ETAPA 4 — Atualizar Schools (API + Page)

**Arquivos:** `src/api/schools.ts`, `src/pages/schools/SchoolsListPage.tsx`  
**Escopo:** Remover hardcode de paginação, expor dados de paginação.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivos a editar: src/api/schools.ts, src/pages/schools/SchoolsListPage.tsx

CONTEXTO: PaginatedResponse<T> = { data: T[]; pagination: { page, limit, total, totalPages } }

MUDANÇAS em src/api/schools.ts:
1. Importar PaginatedResponse de @/types
2. listSchools() — REMOVER o hardcode de page:1, limit:100.
   Mudar assinatura para aceitar { page?, limit? } e retornar PaginatedResponse<School>:
   async function listSchools(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<School>> {
     const { data } = await api.get<PaginatedResponse<School>>('/schools', { params })
     return data
   }
3. Manter getSchool, createSchool, updateSchool, deleteSchool iguais.

MUDANÇAS em src/pages/schools/SchoolsListPage.tsx:
1. Ler o arquivo para entender como listSchools é usado.
2. Adaptar: antes recebia School[], agora recebe { data: School[], pagination }.
3. Onde antes era `schools = response`, agora é `schools = response.data`.
4. Se há selects/dropdowns que precisam da lista completa de schools sem paginar,
   criar uma chamada separada com limit alto ou usar os params existentes.

Rode o linter ao final.
---
```

**Commit:** `refactor(schools): remove hardcoded pagination, expose pagination data`

---

### ETAPA 5 — Atualizar Courses (API + Page)

**Arquivos:** `src/api/courses.ts`, `src/pages/courses/CoursesListPage.tsx`  
**Escopo:** Suportar paginação e campo `type` no update.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivos a editar: src/api/courses.ts, src/pages/courses/CoursesListPage.tsx

CONTEXTO: A API retorna paginação quando se passa page/limit. Sem esses params, retorna array direto.

MUDANÇAS em src/api/courses.ts:
1. updateCourse — adicionar campo `type?: CourseType` ao payload:
   async function updateCourse(id: string, payload: { name?: string; type?: CourseType })
2. listCourses — a API aceita ?schoolId=X&page=N&limit=N.
   Quando sem page/limit, retorna Course[] direto.
   Manter a assinatura atual que retorna Course[] (sem paginação) pois é usado em dropdowns.
   Mas adicionar uma segunda função listCoursesPaginated para a página de lista:
   async function listCoursesPaginated(params: { schoolId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Course>> {
     const { data } = await api.get<PaginatedResponse<Course>>('/courses', { params })
     return data
   }
3. Importar PaginatedResponse e CourseType de @/types.

MUDANÇAS em src/pages/courses/CoursesListPage.tsx:
1. Ler o arquivo para entender o uso atual.
2. Se usa listCourses como array para a tabela, avaliar se vale trocar por listCoursesPaginated.
3. Adaptar conforme necessário.

Rode o linter ao final.
---
```

**Commit:** `refactor(courses): add type to updateCourse, support paginated listing`

---

### ETAPA 6 — Atualizar Seasons (API + Page)

**Arquivos:** `src/api/seasons.ts`, `src/pages/seasons/SeasonsListPage.tsx`  
**Escopo:** Expandir updateSeason payload.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivos a editar: src/api/seasons.ts, src/pages/seasons/SeasonsListPage.tsx

MUDANÇAS em src/api/seasons.ts:
1. updateSeason — expandir payload para aceitar todos os campos editáveis:
   async function updateSeason(id: string, payload: {
     name?: string; startDate?: string; endDate?: string; status?: SeasonStatus
   })
2. Importar SeasonStatus de @/types.
3. listSeasons — mesma lógica dos courses. API retorna array direto sem page/limit.
   Manter assinatura atual. Se a página precisar de paginação, criar listSeasonsPaginated.

MUDANÇAS em src/pages/seasons/SeasonsListPage.tsx:
1. Ler o arquivo e verificar se o formulário de edição já permite editar startDate, endDate, status.
2. Se não permite, adicionar esses campos ao formulário de edição (modal ou inline).
3. Se já permite, apenas garantir que os tipos batem.

Rode o linter ao final.
---
```

**Commit:** `refactor(seasons): expand updateSeason payload with all editable fields`

---

### ETAPA 7 — Atualizar Instances (API + Page)

**Arquivos:** `src/api/instances.ts`, `src/pages/instances/ProjectInstancesPage.tsx`  
**Escopo:** Corrigir endpoint de listagem, alinhar tipos.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivos a editar: src/api/instances.ts, src/pages/instances/ProjectInstancesPage.tsx

CONTEXTO: A API doc não lista GET /seasons/:id/projects. Os endpoints de projeto são:
  POST   /projects/from-template  (instanciar)
  PATCH  /projects/:id            (editar)
  PATCH  /projects/:id/publish
  PATCH  /projects/:id/unpublish

Gestão de instâncias:
  PATCH  /track-scenes/:id
  PATCH  /track-scenes/:id/publish
  PATCH  /track-materials/:id
  PATCH  /study-tracks/:id
  POST   /press-quizzes/from-template
  PATCH  /press-quizzes/:id
  PATCH  /press-quizzes/:id/activate

O tipo Project em types/index.ts agora é:
  { id, templateId, classId, seasonId, name, description, coverImage, status, isVisible, releasedAt, projectTemplateVersion, createdAt }

MUDANÇAS em src/api/instances.ts:
1. Importar Project de @/types
2. listProjects — verificar o endpoint correto. Se a API não tem um endpoint de listagem
   de projetos, precisamos entender como a página atual busca os dados.
   LEIA a página ProjectInstancesPage.tsx primeiro para entender.
   Se o endpoint /seasons/:id/projects realmente não existe,
   precisamos descobrir a alternativa ou manter como está se funcionar no backend.
   NOTA: pode ser que o backend tenha esse endpoint mas não foi documentado.
   Neste caso, mantenha o endpoint atual e apenas ajuste os tipos.
3. Tipar todas as funções com o tipo Project correto onde aplicável.
4. Garantir que updateProject, publishProject, unpublishProject estão corretos.

MUDANÇAS em src/pages/instances/ProjectInstancesPage.tsx:
1. Ler e adaptar ao tipo Project atualizado.
2. Remover referências a campos que não existem mais (progress, tracks).

Rode o linter ao final.
---
```

**Commit:** `refactor(instances): align Project type and verify endpoints`

---

### ETAPA 8 — Atualizar Storage e Profiles (Types compartilhados)

**Arquivos:** `src/api/storage.ts`, `src/api/profiles.ts`  
**Escopo:** Usar tipos compartilhados de `types/index.ts`.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivos a editar: src/api/storage.ts, src/api/profiles.ts

CONTEXTO: Em types/index.ts agora existem: StorageConfig, PresignUploadResponse, StudentProfile, TeacherProfile.

MUDANÇAS em src/api/storage.ts:
1. Remover as interfaces locais PresignUploadResponse e StorageConfig.
2. Importar StorageConfig e PresignUploadResponse de @/types.
3. Manter PresignUploadPayload e OrphansResponse como interfaces locais (são específicas deste módulo).
4. Verificar que as assinaturas das funções continuam corretas.

MUDANÇAS em src/api/profiles.ts:
1. Remover as interfaces locais StudentProfile e TeacherProfile.
2. Importar StudentProfile e TeacherProfile de @/types.
3. Manter as funções iguais.

Rode o linter ao final.
---
```

**Commit:** `refactor(storage,profiles): use shared types from types/index.ts`

---

### ETAPA 9 — Adicionar API de Notificações

**Arquivos:** `src/api/notifications.ts` (novo)  
**Escopo:** Criar módulo de API para notificações.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivo a criar: src/api/notifications.ts

Crie o módulo de API de notificações seguindo o padrão dos outros módulos em src/api/.
Use o client importado de './client' e tipos de '@/types'.

Endpoints da API:
1. GET /notifications — lista notificações do usuário logado
   Retorna: Notification[] (importar de @/types)

2. PATCH /notifications/:id/read — marca uma notificação como lida
   Retorna: Notification

3. PATCH /notifications/read-all — marca todas como lidas
   Retorna: { count: number }

Funções a exportar:
- listNotifications(): Promise<Notification[]>
- markAsRead(id: string): Promise<Notification>
- markAllAsRead(): Promise<{ count: number }>

Use o mesmo estilo dos outros arquivos em src/api/ (sem comentários desnecessários).
Rode o linter ao final.
---
```

**Commit:** `feat(notifications): add notifications API module`

---

### ETAPA 10 — Adicionar API de Media Binding

**Arquivos:** `src/api/media.ts` (novo)  
**Escopo:** Criar módulo para vincular mídia a entidades.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivo a criar: src/api/media.ts

Crie o módulo de API de vinculação de mídia.
Use o client importado de './client'.

Endpoints da API:
1. PATCH /submissions/:id/media
   Body: { key: string } (key R2 do arquivo)

2. PATCH /tracks/scenes/:id/video
   Body: { key: string }

3. PATCH /tracks/materials/:id/content
   Body: { key: string }

4. PATCH /daily-missions/templates/:id/video
   Body: { key: string }

Funções a exportar:
- bindSubmissionMedia(submissionId: string, key: string)
- bindTrackSceneVideo(trackSceneId: string, key: string)
- bindTrackMaterialContent(materialId: string, key: string)
- bindDailyMissionVideo(templateId: string, key: string)

Todas retornam o data da response. Siga o estilo dos outros arquivos em src/api/.
Rode o linter ao final.
---
```

**Commit:** `feat(media): add media binding API module`

---

### ETAPA 11 — Componente de Notificações no Header

**Arquivos:** `src/components/layout/NotificationBell.tsx` (novo), `src/components/layout/Header.tsx`  
**Escopo:** Adicionar sino de notificações no header.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash
Arquivos: src/components/layout/Header.tsx (editar), src/components/layout/NotificationBell.tsx (criar)

Crie um componente NotificationBell que:
1. Usa useQuery para buscar listNotifications() de @/api/notifications
2. Mostra um ícone de sino (Bell do lucide-react) com badge de contagem de não-lidas
3. Ao clicar, abre um dropdown/popover com a lista de notificações recentes
4. Cada notificação mostra título, mensagem e tempo relativo (ex: "2h atrás")
5. Tem botão "Marcar todas como lidas" que chama markAllAsRead()
6. Clicar em uma notificação individual chama markAsRead(id)
7. Use os componentes UI existentes em src/components/ui/ quando possível
8. Use Tailwind CSS para estilização, seguindo o design system existente
9. Polling: refetchInterval de 30 segundos para buscar novas notificações

Depois, edite Header.tsx para adicionar <NotificationBell /> ao lado dos outros elementos do header.

Leia Header.tsx primeiro para entender o layout atual.
Rode o linter ao final.
---
```

**Commit:** `feat(notifications): add notification bell component to header`

---

### ETAPA 12 — Revisar Páginas com Paginação

**Arquivos:** Todas as páginas de lista  
**Escopo:** Verificar e padronizar paginação em todas as listagens.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash

Revise TODAS as páginas de listagem para garantir que a paginação está funcionando corretamente
com o novo formato PaginatedResponse { data: T[], pagination: { page, limit, total, totalPages } }.

Páginas a verificar:
1. src/pages/users/UsersListPage.tsx
2. src/pages/schools/SchoolsListPage.tsx
3. src/pages/courses/CoursesListPage.tsx
4. src/pages/seasons/SeasonsListPage.tsx
5. src/pages/classes/ClassesListPage.tsx
6. src/pages/templates/ProjectTemplatesListPage.tsx
7. src/pages/templates/DailyMissionTemplatesPage.tsx
8. src/pages/instances/ProjectInstancesPage.tsx

Para cada página:
1. Leia o arquivo
2. Verifique se a chamada de API está tipada corretamente
3. Se o response é usado como array direto mas agora vem como PaginatedResponse, ajuste
4. Se a página já tem paginação visual, confirme que os controles funcionam
5. Se NÃO tem paginação visual mas a API pagina, adicione controles simples

IMPORTANTE: Algumas APIs (courses, seasons, classes, templates, dailyMissions) retornam
array direto quando chamadas sem page/limit. Nesses casos, se a página não usa paginação,
pode continuar como está. Apenas ajuste se a API obriga paginação.

Crie um componente reutilizável Pagination se ainda não existir em src/components/ui/:
- Props: page, totalPages, onPageChange
- Botões Previous/Next com estado disabled quando aplicável
- Indicador "Página X de Y"

Rode o linter ao final.
---
```

**Commit:** `refactor(pages): standardize pagination across all list pages`

---

### ETAPA 13 — Verificação Final e Testes

**Escopo:** Compilação, lint, e smoke test.

```
PROMPT:
---
Projeto: c:\Users\eduar\Documents\claveDash

Faça uma verificação final de toda a refatoração:

1. Rode `npm run build` (ou o build command do projeto) e corrija TODOS os erros de TypeScript.
2. Rode o linter e corrija warnings/errors.
3. Verifique que todos os imports estão corretos:
   - Busque por imports de tipos que foram movidos (StudentProfile, TeacherProfile, StorageConfig, etc.)
   - Busque por referências ao formato antigo de PaginatedResponse (campos .total, .page, .limit, .totalPages no nível raiz)
   - Busque por referências a Project.progress ou Project.tracks (campos removidos)
4. Verifique que src/api/client.ts não foi modificado (deve estar intacto).
5. Verifique que src/lib/errorCodes.ts não foi modificado (deve estar intacto).
6. Liste todos os arquivos modificados com git diff --stat para review.

Se encontrar erros, corrija-os. Se encontrar inconsistências, documente.
---
```

**Commit:** `fix: resolve all TypeScript and lint errors from API refactoring`

---

## Ordem de Execução

```
Etapa  1 → Types                    (foundation - tudo depende disso)
Etapa  2 → Auth API + Context       (depende de 1)
Etapa  3 → Users API + Page         (depende de 1)
Etapa  4 → Schools API + Page       (depende de 1)
Etapa  5 → Courses API + Page       (depende de 1)
Etapa  6 → Seasons API + Page       (depende de 1)
Etapa  7 → Instances API + Page     (depende de 1)
Etapa  8 → Storage + Profiles       (depende de 1)
Etapa  9 → Notifications API        (depende de 1)
Etapa 10 → Media Binding API        (depende de 1)
Etapa 11 → Notification Bell UI     (depende de 9)
Etapa 12 → Paginação nas páginas    (depende de 3-7)
Etapa 13 → Verificação final        (depende de tudo)
```

**Etapas 2-10 podem ser executadas em qualquer ordem** (desde que 1 esteja feita).  
**Etapa 11** depende de 9.  
**Etapa 12** depende de 3-7.  
**Etapa 13** é sempre por último.

## Resumo de Impacto

| Métrica | Valor |
|---------|-------|
| Arquivos a editar | ~15 |
| Arquivos a criar | 3 (notifications.ts, media.ts, NotificationBell.tsx) |
| Commits | 13 |
| Risco de breaking change | Médio (PaginatedResponse e Project são os mais impactantes) |
| Endpoints novos no dash | 7 (3 notifications + 4 media binding) |
