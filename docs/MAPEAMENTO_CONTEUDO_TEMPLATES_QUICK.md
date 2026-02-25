# Mapeamento Quick - Templates de Projeto (Front + Back + DB)

Guia rápido de de/para para construir e manter o CRUD de templates de projeto com contrato consistente.

## Onde mexer primeiro

- Front page list: `src/pages/templates/ProjectTemplatesListPage.tsx`
- Front page detail: `src/pages/templates/ProjectTemplateDetailPage.tsx`
- Front API: `src/api/templates.ts`
- Front tipos: `src/types/index.ts`
- Front readiness UI: `src/pages/templates/ProjectTemplateDetailPage.tsx` e `src/pages/templates/ProjectTemplatesListPage.tsx`
- Back route: `src/infrastructure/routes/projectTemplateRoutes.ts`
- Back controller: `src/infrastructure/controllers/ProjectTemplateController.ts`
- Back service/DTO: `src/application/services/ProjectTemplateService.ts`, `src/application/dto/ProjectTemplateDTO.ts`
- Back readiness: `src/infrastructure/routes/projectTemplateReadinessRoutes.ts`, `src/application/services/ProjectTemplateReadinessService.ts`, `src/application/dto/ProjectTemplateReadinessDTO.ts`
- DB model: `c:\Users\eduar\Documents\claveBack\prisma\schema.prisma` (`model ProjectTemplate`)

---

## De/para de campos - ProjectTemplate

| Dominio | Front type (`ProjectTemplate`) | API create/update | Back DTO (`ProjectTemplateResponseDTO`) | Prisma (`ProjectTemplate`) |
|---|---|---|---|---|
| Identificador | `id: string` | - | `id: string` | `id String @id` |
| Curso | `courseId: string` | create: `courseId` (obrigatório) | `courseId: string` | `courseId String` |
| Nome | `name: string` | create: `name` (obrigatório), update: `name?` | `name: string` | `name String` |
| Tipo | `type: 'ALBUM' | 'PLAY'` | create: `type` (obrigatório) | `type: 'ALBUM' | 'PLAY'` | `type ProjectType` |
| Descrição | `description: string \| null` | create: `description?`, update: `description? \| null` | `description: string \| null` | `description String?` |
| Capa | `coverImage: string \| null` | create: `coverImage?`, update: `coverImage? \| null` | `coverImage: string \| null` | `coverImage String?` |
| Versão | `version: number` | - (controlado no back) | `version: number` | `version Int @default(1)` |
| Ativo/inativo | `isActive: boolean` | - (delete/restore) | `isActive: boolean` | `isActive Boolean @default(true)` |
| Datas | `createdAt`, `updatedAt` | - | `createdAt`, `updatedAt` | `createdAt DateTime`, `updatedAt DateTime` |

Notas:
- No front, o `createProjectTemplate` envia exatamente: `{ courseId, name, type, description?, coverImage? }`.
- No update, o front envia: `{ name?, description?, coverImage? }`.
- O backend converte `undefined` para `null` no domínio quando necessário.
- O versionamento deve ser automático no backend (não editável manualmente pelo front): quando `name`, `description` ou `coverImage` mudar, incrementa `version`.

---

## CRUD ProjectTemplate - contrato HTTP atual

| Acao | Front (`src/api/templates.ts`) | Endpoint | Back controller/service | Retorno esperado |
|---|---|---|---|---|
| Criar | `createProjectTemplate(payload)` | `POST /project-templates` | `create()` | `201` + objeto |
| Listar ativos por curso | `listProjectTemplates(courseId?)` | `GET /project-templates?courseId=` | `getAll()` | `200` + lista |
| Buscar por id | `getProjectTemplate(id)` | `GET /project-templates/:id` | `getById()` | `200` + objeto |
| Atualizar | `updateProjectTemplate(id, payload)` | `PATCH /project-templates/:id` | `update()` | `200` + objeto |
| Desativar (soft delete) | `deleteProjectTemplate(id)` | `DELETE /project-templates/:id` | `deactivate()` | `204` sem body |
| Lixeira | `listDeletedProjectTemplates({page,limit})` | `GET /project-templates/deleted` | `getDeleted()` | `200` + paginado |
| Restaurar | `restoreProjectTemplate(id)` | `PATCH /project-templates/:id/restore` | `restore()` | `200` + objeto |

Importante para CRUD assertivo:
- O front trata delete como `void` (`await api.delete(...)`), padrão recomendado.
- O endpoint de desativação deve responder `204` sem body, seguindo o contrato padrão do projeto.

---

## ProjectTemplate Readiness - contrato rápido

| Ação | Front (`src/api/templates.ts`) | Endpoint | Permissão | Retorno |
|---|---|---|---|---|
| Ler aptidão | `getProjectTemplateReadiness(idOrSlug)` | `GET /project-template-readiness/:idOrSlug` | `ADMIN`, `TEACHER` | `200` + summary com `scorePercentage`, `statusLabel`, `missingTips`, `requirements[]` |
| Listar regras | `listProjectTemplateReadinessRules()` | `GET /project-template-readiness/rules` | `ADMIN`, `TEACHER` | `200` + regras ativas/inativas |
| Editar regra | `updateProjectTemplateReadinessRule(ruleId, payload)` | `PATCH /project-template-readiness/rules/:ruleId` | **`ADMIN`** | `200` + regra atualizada |
| Ler análise qualitativa | `getProjectTemplateQualitativeAnalysis(idOrSlug)` | `GET /project-template-readiness/:idOrSlug/qualitative-analysis` | `ADMIN`, `TEACHER` | `200` + análise salva |
| Salvar análise qualitativa | `saveProjectTemplateQualitativeAnalysis(idOrSlug, payload)` | `PUT /project-template-readiness/:idOrSlug/qualitative-analysis` | `ADMIN`, `TEACHER` | `200` + análise salva |

Regras seedadas padrão:

- `PROJECT_MIN_TRACKS` (mínimo 6 faixas)
- `TRACKS_WITH_MIN_QUIZZES` (cada faixa com 3 quizzes)
- `TRACKS_WITH_MIN_MATERIALS` (cada faixa com 1 material)
- `TRACKS_WITH_MIN_STUDY_TRACKS` (cada faixa com 6 trilhas)

Status calculado:

- `Apto para publicação`: 100% dos requisitos ativos atendidos
- `Quase pronto`: score >= 70% e ainda pendências
- `Não pronto`: score < 70%

---

## Regras de negócio que impactam o CRUD

- Validações create:
  - `courseId` obrigatório
  - `name` obrigatório e não vazio
  - `type` obrigatório: `ALBUM` ou `PLAY`
- Validação update:
  - `name` não pode ser vazio quando enviado
- Soft delete:
  - Desativar seta `isActive = false`
  - Restaurar seta `isActive = true`
- Bloqueio de desativação (409 `CONFLICT_INVALID_STATE`):
  - Se houver `trackSceneTemplates` ativos
  - Se houver `projects` ativos instanciados
  - `details.childResource` pode vir como `trackSceneTemplates` ou `projects`

---

## Encadeamento de filhos do Template de Projeto

O detalhe do template (`ProjectTemplateDetailPage`) gerencia CRUD de:

- Faixas (`TrackSceneTemplate`):
  - `POST /project-templates/:ptId/tracks`
  - `GET /project-templates/:ptId/tracks`
  - `PATCH/DELETE /track-templates/:id`
- Materiais (`TrackMaterialTemplate`):
  - `POST /track-templates/:ttId/materials`
  - `GET /track-templates/:ttId/materials`
  - `PATCH/DELETE /material-templates/:id`
- Trilhas de estudo (`StudyTrackTemplate`):
  - `POST /track-templates/:ttId/study-tracks`
  - `GET /track-templates/:ttId/study-tracks`
  - `PATCH/DELETE /study-track-templates/:id`
  - `isRequired` é sempre `true` no template e `isVisible` não faz parte do contrato de template
- Quiz de coletiva (`PressQuizTemplate`):
  - `POST /track-templates/:ttId/press-quizzes`
  - `GET /track-templates/:ttId/press-quizzes`
  - `PATCH/DELETE /press-quiz-templates/:id`

Dependencia de banco (cadeia):

`ProjectTemplate` -> `TrackSceneTemplate` -> (`TrackMaterialTemplate`, `StudyTrackTemplate`, `PressQuizTemplate`)

---

## Checklist rápido para implementar ajuste de CRUD

1. Confirmar campos em `src/types/index.ts` e DTOs do backend.
2. Ajustar payloads em `src/api/templates.ts` (sem `any`, sem campos extras).
3. Garantir list page com Ativos/Lixeira + delete/restore + tratamento 409.
4. Garantir `DeactivationBlockedModal` cobrindo `childResource` recebido.
5. Validar comportamento com curso selecionado e sem curso selecionado na listagem.
