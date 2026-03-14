# Refatoracao de Instancias com Paridade de Templates

## Objetivo

Substituir o fluxo antigo de "Instancias" por um fluxo administrativo com o mesmo padrao visual e funcional de `Templates > Projetos`, mudando apenas a regra de negocio principal:

- `Template`: permitir ou bloquear instanciação.
- `Instancia`: publicar ou despublicar para alunos.

## Escopo implementado

- Nova API administrativa de instancias consumida pelo dashboard:
  - `GET /project-instances`
  - `GET /project-instances/deleted`
  - `GET /project-instances/:id`
  - `POST /project-instances`
  - `PATCH /project-instances/:id`
  - `PATCH /project-instances/:id/publish`
  - `PATCH /project-instances/:id/unpublish`
  - `DELETE /project-instances/:id`
  - `PATCH /project-instances/:id/restore`
- Soft delete para instancias no banco via `Project.isActive`.
- Tela `Instancias > Projetos` refeita com:
  - tabs `Ativos` e `Lixeira`
  - paginacao
  - criar, editar, visualizar, desativar e restaurar
  - publicar e remover publicacao para alunos
  - validacoes de aptidao e tratamento de conflitos

## Frontend alterado

- `src/api/instances.ts`
  - passou a consumir `/project-instances` no padrao paginado e lixeira.
- `src/pages/instances/ProjectInstancesPage.tsx`
  - layout e UX alinhados ao padrao de listagem dos templates.
- `src/types/index.ts`
  - `Project` recebeu campos para suportar soft delete e listagem administrativa (`isActive`, `updatedAt`).
- `src/components/layout/Sidebar.tsx`
  - menu ajustado para `Instancias > Projetos`.

## Backend e banco alterados

Arquivos alterados no backend (`claveBack`):

- `prisma/schema.prisma`
  - `Project` recebeu `isActive` com default `true`.
  - indices para `isActive` e `isVisible`.
- `src/domain/project/repositories/IProjectManagementRepository.ts`
  - novos contratos para paginação e lixeira.
- `src/infrastructure/repositories/ProjectManagementRepository.ts`
  - queries de ativos/lixeira paginadas.
  - soft delete e restore.
- `src/application/services/ProjectManagementService.ts`
  - listagem, detalhe, desativação e restauração.
- `src/infrastructure/controllers/ProjectManagementController.ts`
  - handlers de listagem, detalhe, delete 204 e restore.
- `src/infrastructure/routes/projectManagementRoutes.ts`
  - novo bloco de rotas `/project-instances/*`.
- `src/infrastructure/repositories/ProjectRepository.ts`
  - listagens operacionais ignoram projetos inativos.

## Contrato da nova API de instancias

- `GET /project-instances?page&limit&seasonId?&classId?&templateId?`
- `GET /project-instances/deleted?page&limit`
- `GET /project-instances/:id`
- `POST /project-instances`
- `PATCH /project-instances/:id`
- `PATCH /project-instances/:id/publish`
- `PATCH /project-instances/:id/unpublish`
- `DELETE /project-instances/:id`
- `PATCH /project-instances/:id/restore`

## SQL de migracao (banco)

```sql
ALTER TABLE "Project"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "Project_isActive_idx" ON "Project"("isActive");
CREATE INDEX IF NOT EXISTS "Project_isVisible_idx" ON "Project"("isVisible");
```

### Pos-migracao obrigatorio

- executar `prisma generate` no backend para atualizar o client.

## Checklist funcional

- [ ] Criar instancia em semestre/turma validos.
- [ ] Publicar instancia apta para alunos.
- [ ] Bloquear publicacao quando nao apta (409).
- [ ] Desativar instancia (sair de Ativos e entrar na Lixeira).
- [ ] Restaurar instancia (voltar para Ativos).
- [ ] Editar nome/descricao com sucesso.
- [ ] Conferir paginacao em Ativos e Lixeira.

## Observacoes operacionais

- A regra de prontidao continua baseada na aptidao do template vinculado.
- Endpoints legados de projeto seguem existentes para compatibilidade, mas a tela administrativa agora usa exclusivamente `/project-instances`.
