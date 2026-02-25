# Project Template Readiness (Frontend)

Este guia explica como usar e evoluir o card de aptidão de publicação dos templates.

## Onde aparece

- Lista de templates: `src/pages/templates/ProjectTemplatesListPage.tsx`
- Detalhe de template: `src/pages/templates/ProjectTemplateDetailPage.tsx`

## O que o usuário vê

- percentual de aptidão (`scorePercentage`)
- status (`Nao pronto`, `Quase pronto`, `Apto para publicacao`)
- contadores de faixas/quizzes/materiais/trilhas
- dicas do que falta (`missingTips`)

## Fluxo de dados

### API client

`src/api/templates.ts`

- `getProjectTemplateReadiness(idOrSlug)`
- `listProjectTemplateReadinessRules()`
- `updateProjectTemplateReadinessRule(ruleId, payload)`

### Tipos

`src/types/index.ts`

- `ProjectTemplateReadinessSummary`
- `ProjectTemplateReadinessRequirement`
- `ProjectTemplateReadinessRule`
- `ReadinessMetric`

## Permissões

- leitura da aptidão e das regras: `ADMIN` e `TEACHER`
- edição de regras: apenas `ADMIN`

No frontend, o botão **Critérios de Publicação** aparece apenas quando `user.role === 'ADMIN'`.

## Como usar no dia a dia

1. abrir um template em `/templates/projects/:slug`
2. analisar score/status e dicas
3. criar/ajustar conteúdo faltante (faixas, quizzes, materiais, trilhas)
4. (admin) ajustar metas e pesos se a coordenação pedagógica mudar critérios

## Evolução

Quando o backend adicionar nova métrica de readiness:

1. atualizar tipos em `src/types/index.ts`
2. atualizar UI de exibição do requisito no detalhe (se necessário)
3. revisar docs e checklist pedagógico
