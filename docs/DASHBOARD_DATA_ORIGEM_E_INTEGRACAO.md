# Dashboard: Origem do Dado e Integracao

Escopo deste documento: apenas o que precisa para concluir o Dashboard (sem mobile e sem gamificacao).

## Fonte primaria de verdade

- Banco e contrato estrutural: `claveBack/prisma/schema.prisma`
- Regras de dominio e relacoes: `claveBack/docs/DOMINIO.md`
- Fluxo tecnico backend: `Route -> Controller -> Service -> Repository -> Prisma`

## Cadeia de origem de dados do Dashboard

## 1) Base organizacional

Origem:
- `School` -> `Course` -> `Season` -> `Class`

Integra no Dashboard:
- filtros e contexto de navegacao;
- escopo de templates por curso;
- escopo de projetos por semestre/turma.

## 2) Conteudo base (templates)

Origem:
- `ProjectTemplate`
- `TrackSceneTemplate`
- `TrackMaterialTemplate`
- `StudyTrackTemplate`
- `PressQuizTemplate`
- `DailyMissionTemplate` + `DailyMissionQuiz`

Integra no Dashboard:
- CRUD de templates;
- readiness de publicacao;
- materia-prima para instancia.

## 3) Instanciacao (execucao do template)

Origem:
- `Project` (instancia do `ProjectTemplate`)
- `TrackScene` (instancia do `TrackSceneTemplate`)
- `TrackMaterial` (instancia do `TrackMaterialTemplate`)
- `StudyTrack` (instancia do `StudyTrackTemplate`)
- `PressQuiz` (instancia do `PressQuizTemplate`)

Integra no Dashboard:
- tela de projetos instanciados;
- gestao de publicacao/visibilidade;
- ajustes de conteudo em instancias.

## 4) Qualidade de publicacao (antes da instancia)

Origem:
- `ProjectTemplateReadinessRule`
- calculo no service de readiness

Integra no Dashboard:
- bloquear templates nao aptos na acao de instancia;
- orientar ajustes de conteudo antes de publicar.

## Rotas criticas do Dashboard (hoje)

- Instanciar projeto: `POST /projects/from-template`
- Listar projetos por semestre: `GET /seasons/:seasonId/projects`
- Editar projeto: `PATCH /projects/:id`
- Publicar/ocultar projeto: `PATCH /projects/:id/publish` e `PATCH /projects/:id/unpublish`
- Gerenciar instancia de cena/material/trilha/quiz: rotas em `instanceManagementRoutes.ts`

## Pontos de atencao de integracao

1. Instancia depende de consistencia entre `templateId`, `classId` e `seasonId`.
2. Campos de instancia devem refletir flags do template (nao hardcode).
3. Dashboard precisa de UX guiada por filtro de semestre/turma para evitar erro operacional.
