# Auditoria Front + Back (Issues Only)

Escopo: dashboard/admin e instanciação.  
Método: 2 passadas (automática + hotspots).  
Excluído desta fase: mobile e gamificação.

## Alta

1. **Contrato de resposta inconsistente em endpoints de publish/activate**
- Evidência:
  - `c:/Users/eduar/Documents/claveBack/src/infrastructure/controllers/ProjectManagementController.ts`
  - `c:/Users/eduar/Documents/claveBack/src/infrastructure/controllers/InstanceManagementController.ts`
  - `c:/Users/eduar/Documents/claveDash/src/api/instances.ts`
- Impacto no dashboard: payload às vezes vem raw e às vezes em `{ message, data }`, gerando parsing frágil no front.
- Correção objetiva: padronizar retorno de sucesso para formato único por recurso (preferencialmente DTO raw nas operações CRUD e 201/200 consistentes).

2. **Tipagem de `Project` no front divergente do DTO de leitura**
- Evidência:
  - `c:/Users/eduar/Documents/claveDash/src/types/index.ts`
  - `c:/Users/eduar/Documents/claveDash/src/api/instances.ts`
  - `c:/Users/eduar/Documents/claveBack/src/application/services/ProjectService.ts`
- Impacto no dashboard: type safety enganosa e risco de regressão em consumo de campos inexistentes.
- Correção objetiva: separar tipos (`ProjectManagementDTO`, `ProjectReadDTO`) e tipar cada endpoint com DTO real.

3. **Instanciação com cópia parcial de configuração de template**
- Evidência:
  - `c:/Users/eduar/Documents/claveBack/src/infrastructure/repositories/ProjectManagementRepository.ts`
- Impacto no dashboard: instância pode nascer com comportamento divergente do template.
- Correção objetiva: copiar flags de `TrackSceneTemplate` para `TrackScene` sem hardcode.

4. **String-matching frágil entre service e controller em erros “not found”**
- Evidência:
  - `c:/Users/eduar/Documents/claveBack/src/application/services/ProjectTemplateService.ts`
  - `c:/Users/eduar/Documents/claveBack/src/infrastructure/controllers/ProjectTemplateController.ts`
  - padrão equivalente em controllers/services de `StudyTrackTemplate`, `DailyMissionTemplate`, `PressQuizTemplate`.
- Impacto no dashboard: respostas podem cair em 500 ou status incorreto quando texto muda.
- Correção objetiva: remover matching por texto e usar somente `AppError` com `code/status` padronizado.

5. **Validação de paginação frágil (`parseInt` sem guarda explícita)**
- Evidência:
  - `c:/Users/eduar/Documents/claveBack/src/infrastructure/controllers/*.ts` (múltiplos controllers de listagem)
- Impacto no dashboard: entrada inválida pode gerar comportamento imprevisível.
- Correção objetiva: utilitário único de paginação com `Number.isNaN` e limites centralizados.

## Média

6. **N+1 de queries no front por item**
- Evidência:
  - `c:/Users/eduar/Documents/claveDash/src/pages/templates/ProjectTemplatesListPage.tsx`
  - `c:/Users/eduar/Documents/claveDash/src/pages/templates/TemplateResourceListPage.tsx`
- Impacto no dashboard: degradação de performance e latência em listas maiores.
- Correção objetiva: agregar dados no backend ou criar endpoint batch (readiness/covers por lista).

7. **Contrato paginado vs array misturado em list pages**
- Evidência:
  - `c:/Users/eduar/Documents/claveDash/src/pages/courses/CoursesListPage.tsx`
  - `c:/Users/eduar/Documents/claveDash/src/api/courses.ts`
- Impacto no dashboard: lógica condicional extra e maior chance de bug de paginação/filtro.
- Correção objetiva: padronizar listagens de dashboard para resposta paginada.

8. **Tratamento 409 inconsistente**
- Evidência:
  - `c:/Users/eduar/Documents/claveDash/src/pages/templates/ProjectTemplatesListPage.tsx`
  - `c:/Users/eduar/Documents/claveDash/src/hooks/useDeactivationBlockedHandler.ts`
- Impacto no dashboard: UX e mensagens variam por página.
- Correção objetiva: centralizar handling 409 no hook compartilhado e remover variações locais.

9. **Uso de payload genérico `Record<string, unknown>` em API de instância**
- Evidência:
  - `c:/Users/eduar/Documents/claveDash/src/api/instances.ts`
- Impacto no dashboard: reduz segurança de contrato e dificulta refactor.
- Correção objetiva: criar tipos de payload por operação (`UpdateTrackScenePayload`, etc.).

10. **Semântica pública `slug` ainda inconsistente em partes do back**
- Evidência:
  - `c:/Users/eduar/Documents/claveBack/src/infrastructure/middleware/accessMiddleware.ts`
  - `c:/Users/eduar/Documents/claveBack/src/application/services/ProjectTemplateService.ts`
- Impacto no dashboard: risco de divergência de comportamento entre endpoints com `id` e `slug`.
- Correção objetiva: alinhar middleware/rotas à mesma regra de identificador público.

## Baixa

11. **Hook de tabs/lixeira pouco restritivo (stringly typed)**
- Evidência:
  - `c:/Users/eduar/Documents/claveDash/src/hooks/useTrashableListPage.ts`
- Impacto no dashboard: abre espaço para inconsistência de chave/tab.
- Correção objetiva: tipar hook com union explícita e chave única padrão.

12. **Ruído de código/complexidade excessiva em páginas grandes**
- Evidência:
  - `c:/Users/eduar/Documents/claveDash/src/pages/templates/TemplateResourceListPage.tsx`
- Impacto no dashboard: manutenção cara, alto risco de regressão.
- Correção objetiva: extrair hooks e subcomponentes por modo (tracks/materials/study/quizzes).
