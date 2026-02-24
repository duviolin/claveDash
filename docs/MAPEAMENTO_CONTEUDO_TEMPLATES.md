# Mapeamento de Conteúdo/Templates (Front + Back)

**Data:** 23/02/2026  
**Objetivo:** centralizar onde está cada peça da etapa de conteúdo/templates para consulta rápida e economia de tokens.

## Referências de domínio

- **Frontend root:** `c:\Users\eduar\Documents\claveDash`
- **Backend root:** `c:\Users\eduar\Documents\claveBack`
- **Documento de domínio (fonte principal):** `c:\Users\eduar\Documents\claveBack\docs\DOMINIO.md`
- **Complementares úteis:** `docs\TEMPLATE_CRUD.md`, `docs\INTEGRIDADE_REFERENCIAL.md`, `prisma\schema.prisma`

---

## 1) Mapa rápido — Frontend (`claveDash`)

### Rotas e navegação

| Camada | Arquivo | O que cobre |
|---|---|---|
| Router | `src/routes.tsx` | Rotas: `/templates/projects`, `/templates/projects/:id`, `/templates/daily-missions` |
| Sidebar | `src/components/layout/Sidebar.tsx` | Menu Conteúdo > Templates |

### Páginas de templates

| Página | Arquivo | Escopo |
|---|---|---|
| Lista de templates de projeto | `src/pages/templates/ProjectTemplatesListPage.tsx` | Ativos/Lixeira, criar, desativar, restaurar |
| Detalhe de template de projeto | `src/pages/templates/ProjectTemplateDetailPage.tsx` | Edição, faixas, materiais, trilhas, press quizzes |
| Missões diárias | `src/pages/templates/DailyMissionTemplatesPage.tsx` | Ativos/Lixeira, CRUD, publish, quizzes |

### API modules (integração HTTP)

| Arquivo | Escopo |
|---|---|
| `src/api/templates.ts` | ProjectTemplate, TrackSceneTemplate, TrackMaterialTemplate, StudyTrackTemplate, PressQuizTemplate |
| `src/api/dailyMissions.ts` | DailyMissionTemplate e DailyMissionQuiz |
| `src/api/storage.ts` | Presign/upload/download/config |
| `src/api/media.ts` | Bind de mídia em recursos |
| `src/api/ai.ts` | Geração assistida (quiz/conteúdo). `generateQuiz` com contexto rico (projeto, faixa, materiais, trilhas, userExtra) |
| `src/api/client.ts` | Axios client/interceptors |
| `src/api/courses.ts` | Filtros e seleção por curso |

### Tipos, constantes e tratamento de erro

| Tipo | Arquivo | Notas |
|---|---|---|
| Tipos compartilhados | `src/types/index.ts` | Todos os tipos de templates, quizzes, paginação e 409 |
| Labels/variants | `src/lib/constants.ts` | Labels de status/tipos usados nas telas |
| Error codes | `src/lib/errorCodes.ts` | `CONFLICT_INVALID_STATE` e mensagens globais |
| Modal 409 | `src/components/ui/DeactivationBlockedModal.tsx` | Mapeia `childResource` para navegação |

### Componentes UI usados no fluxo

- `src/components/ui/FileUpload.tsx`
- `src/components/ui/QuizBuilder.tsx`
- `src/components/ui/AIButton.tsx`
- `src/components/ui/Modal.tsx` (`ConfirmModal`)
- `src/components/ui/Table.tsx`
- `src/components/ui/Tabs.tsx`
- `src/components/ui/Pagination.tsx`
- `src/components/layout/PageContainer.tsx`

---

## 2) Mapa rápido — Backend (`claveBack`)

## 2.1 Routes

- `src/infrastructure/routes/projectTemplateRoutes.ts`
- `src/infrastructure/routes/trackSceneTemplateRoutes.ts`
- `src/infrastructure/routes/trackMaterialTemplateRoutes.ts`
- `src/infrastructure/routes/studyTrackTemplateRoutes.ts`
- `src/infrastructure/routes/pressQuizTemplateRoutes.ts`
- `src/infrastructure/routes/dailyMissionTemplateRoutes.ts`
- `src/infrastructure/routes/storageRoutes.ts` (mídia/arquivos usados no conteúdo)

## 2.2 Controllers (controles)

- `src/infrastructure/controllers/ProjectTemplateController.ts`
- `src/infrastructure/controllers/TrackSceneTemplateController.ts`
- `src/infrastructure/controllers/TrackMaterialTemplateController.ts`
- `src/infrastructure/controllers/StudyTrackTemplateController.ts`
- `src/infrastructure/controllers/PressQuizTemplateController.ts`
- `src/infrastructure/controllers/DailyMissionTemplateController.ts` (inclui quizzes)
- `src/infrastructure/controllers/StorageController.ts`

## 2.3 Services (application)

- `src/application/services/ProjectTemplateService.ts`
- `src/application/services/TrackSceneTemplateService.ts`
- `src/application/services/TrackMaterialTemplateService.ts`
- `src/application/services/StudyTrackTemplateService.ts`
- `src/application/services/PressQuizTemplateService.ts`
- `src/application/services/DailyMissionTemplateService.ts`
- `src/application/services/StorageService.ts`

## 2.4 Domain (entities/use cases/repositories)

### Entidades

- `src/domain/projectTemplate/entities/ProjectTemplate.ts`
- `src/domain/trackSceneTemplate/entities/TrackSceneTemplate.ts`
- `src/domain/trackMaterialTemplate/entities/TrackMaterialTemplate.ts`
- `src/domain/studyTrackTemplate/entities/StudyTrackTemplate.ts`
- `src/domain/pressQuizTemplate/entities/PressQuizTemplate.ts`
- `src/domain/dailyMissionTemplate/entities/DailyMissionTemplate.ts`
- `src/domain/dailyMissionQuiz/entities/DailyMissionQuiz.ts`

### Use cases (pasta por domínio)

- `src/domain/projectTemplate/usecases/`
- `src/domain/trackSceneTemplate/usecases/`
- `src/domain/trackMaterialTemplate/usecases/`
- `src/domain/studyTrackTemplate/usecases/`
- `src/domain/pressQuizTemplate/usecases/`
- `src/domain/dailyMissionTemplate/usecases/`
- `src/domain/dailyMissionQuiz/usecases/`

### Interfaces de repositório

- `src/domain/projectTemplate/repositories/IProjectTemplateRepository.ts`
- `src/domain/trackSceneTemplate/repositories/ITrackSceneTemplateRepository.ts`
- `src/domain/trackMaterialTemplate/repositories/ITrackMaterialTemplateRepository.ts`
- `src/domain/studyTrackTemplate/repositories/IStudyTrackTemplateRepository.ts`
- `src/domain/pressQuizTemplate/repositories/IPressQuizTemplateRepository.ts`
- `src/domain/dailyMissionTemplate/repositories/IDailyMissionTemplateRepository.ts`
- `src/domain/dailyMissionQuiz/repositories/IDailyMissionQuizRepository.ts`

## 2.5 Repositórios Prisma (infra)

- `src/infrastructure/repositories/ProjectTemplateRepository.ts`
- `src/infrastructure/repositories/TrackSceneTemplateRepository.ts`
- `src/infrastructure/repositories/TrackMaterialTemplateRepository.ts`
- `src/infrastructure/repositories/StudyTrackTemplateRepository.ts`
- `src/infrastructure/repositories/PressQuizTemplateRepository.ts`
- `src/infrastructure/repositories/DailyMissionTemplateRepository.ts`
- `src/infrastructure/repositories/DailyMissionQuizRepository.ts`

## 2.6 DTOs

- `src/application/dto/ProjectTemplateDTO.ts`
- `src/application/dto/TrackSceneTemplateDTO.ts`
- `src/application/dto/TrackMaterialTemplateDTO.ts`
- `src/application/dto/StudyTrackTemplateDTO.ts`
- `src/application/dto/PressQuizTemplateDTO.ts`
- `src/application/dto/DailyMissionTemplateDTO.ts`
- `src/application/dto/DailyMissionQuizDTO.ts`

---

## 3) Banco de dados (tabelas de conteúdo/templates)

**Fonte:** `prisma/schema.prisma`

| Tabela | Relação principal | Pontos importantes |
|---|---|---|
| `ProjectTemplate` | `courseId -> Course` | `version`, `isActive`, gera `Project` instanciado |
| `TrackSceneTemplate` | `projectTemplateId -> ProjectTemplate` | `order`, `unlockAfterTrackId`, `demoRequired`, `pressQuizRequired`, `isActive`, `version` |
| `TrackMaterialTemplate` | `trackSceneTemplateId -> TrackSceneTemplate` | `type`, `defaultContentUrl`, `defaultTextContent`, `isActive`, `version` |
| `StudyTrackTemplate` | `trackSceneTemplateId -> TrackSceneTemplate` | `estimatedMinutes`, `isRequired` (sempre `true`), `isActive` |
| `PressQuizTemplate` | `trackSceneTemplateId -> TrackSceneTemplate` | `questionsJson`, `maxAttempts`, `passingScore`, `version`, `isActive` |
| `DailyMissionTemplate` | `courseId -> Course` | `order`, `status`, `isActive` |
| `DailyMissionQuiz` | `dailyMissionId -> DailyMissionTemplate` | `questionsJson`, `maxAttemptsPerDay`, `allowRecoveryAttempt`, `version`, `isActive` |

### Tabelas de instância relacionadas (impactam regras de bloqueio/versionamento)

- `Project` (`templateId`, `projectTemplateVersion`)
- `TrackScene` (`templateId`, `trackSceneTemplateVersion`)
- `TrackMaterial` (`templateId`, `trackMaterialTemplateVersion`)

---

## 4) Endpoints principais (resumo)

### ProjectTemplate

- `POST /project-templates`
- `GET /project-templates`
- `GET /project-templates/deleted`
- `GET /project-templates/:id`
- `PATCH /project-templates/:id`
- `DELETE /project-templates/:id`
- `PATCH /project-templates/:id/restore`

### TrackSceneTemplate

- `POST /project-templates/:ptId/tracks`
- `GET /project-templates/:ptId/tracks`
- `GET /track-templates/deleted`
- `GET /track-templates/:id`
- `PATCH /track-templates/reorder`
- `PATCH /track-templates/:id`
- `DELETE /track-templates/:id`
- `PATCH /track-templates/:id/restore`

### TrackMaterialTemplate

- `POST /track-templates/:ttId/materials`
- `GET /track-templates/:ttId/materials`
- `GET /material-templates/deleted`
- `PATCH /material-templates/:id`
- `DELETE /material-templates/:id`
- `PATCH /material-templates/:id/restore`

### StudyTrackTemplate

- `POST /track-templates/:ttId/study-tracks`
- `GET /track-templates/:ttId/study-tracks`
- `GET /study-track-templates/deleted`
- `PATCH /study-track-templates/:id`
- `DELETE /study-track-templates/:id`
- `PATCH /study-track-templates/:id/restore`

### PressQuizTemplate

- `POST /track-templates/:ttId/press-quizzes`
- `GET /track-templates/:ttId/press-quizzes`
- `GET /press-quiz-templates/deleted`
- `PATCH /press-quiz-templates/:id`
- `DELETE /press-quiz-templates/:id`
- `PATCH /press-quiz-templates/:id/restore`

### DailyMissionTemplate + DailyMissionQuiz

- `POST /daily-mission-templates`
- `GET /daily-mission-templates`
- `GET /daily-mission-templates/deleted`
- `PATCH /daily-mission-templates/:id`
- `DELETE /daily-mission-templates/:id`
- `PATCH /daily-mission-templates/:id/restore`
- `PATCH /daily-mission-templates/:id/publish`
- `POST /daily-mission-templates/:id/quizzes`
- `GET /daily-mission-templates/:id/quizzes`
- `GET /daily-mission-quizzes/deleted`
- `PATCH /daily-mission-quizzes/:id`
- `DELETE /daily-mission-quizzes/:id`
- `PATCH /daily-mission-quizzes/:id/restore`

---

## 5) Regras de negócio críticas (checklist rápido)

- Soft delete por `isActive` em templates/conteúdo.
- Lixeira via `GET /deleted` + restore via `PATCH /:id/restore`.
- `DELETE` retorna `204` (frontend deve tratar como `void`).
- Bloqueios de desativação retornam `409` com `code=CONFLICT_INVALID_STATE` e `details.childResource`.
- Versionamento em templates principais (`version`) e cópia da versão nas instâncias.
- Fluxo de camada no backend: **Route -> Controller -> Service -> UseCase -> Repository -> Prisma**.

---

## 6) Fluxo de leitura recomendado (economia de tokens)

Quando precisar entender/corrigir algo de templates, seguir esta ordem:

1. **Tela afetada (front):** `src/pages/templates/...`
2. **API client (front):** `src/api/templates.ts` ou `src/api/dailyMissions.ts`
3. **Rota (back):** `src/infrastructure/routes/*Template*Routes.ts`
4. **Controller (back):** `src/infrastructure/controllers/*Template*Controller.ts`
5. **Service/UseCase (back):** `src/application/services/*` + `src/domain/*/usecases/*`
6. **Tabela/campo (db):** `prisma/schema.prisma`
7. **Regra de domínio:** `docs/DOMINIO.md` e `docs/INTEGRIDADE_REFERENCIAL.md`

---

## 7) Índice mínimo por tema

- **Template de projeto:** `ProjectTemplatesListPage.tsx` + `ProjectTemplateDetailPage.tsx` + `projectTemplateRoutes.ts` + `ProjectTemplateController.ts`
- **Faixas/materiais/trilhas/quizzes de press:** `ProjectTemplateDetailPage.tsx` + `templates.ts` + rotas/controllers específicos
- **Missões diárias:** `DailyMissionTemplatesPage.tsx` + `dailyMissions.ts` + `dailyMissionTemplateRoutes.ts` + `DailyMissionTemplateController.ts`
- **Upload/mídia:** `FileUpload.tsx` + `storage.ts` + `StorageController.ts` + `StorageService.ts`
