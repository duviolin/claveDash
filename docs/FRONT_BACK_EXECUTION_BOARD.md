# Board Integrado Front + Back (Dashboard)

Atualizado em: 2026-03-09
Objetivo: acompanhar E1, E2 e E3 em um único quadro com dono, dependência, critério de pronto e evidências.

## Status dos épicos

| Épico | Janela | Status | Dono principal | Repos |
|---|---|---|---|---|
| E1 - Instanciação consistente | Agora | Em andamento | Back Lead + Front Lead | ambos |
| E2 - Operação diária de instâncias | Agora/Próximo | Pendente | Back Lead + Front Lead | ambos |
| E3 - Qualidade de release | Próximo | Pendente | Tech Lead | ambos |

## Quadro único de execução

| ID | Entrega | Repo | Dono | Dependência | Critério de pronto | Evidências |
|---|---|---|---|---|---|---|
| E1-01 | Validar coerência `templateId` x `seasonId` x `classId` na instanciação | back | Back Lead | Regras de domínio de curso/semestre/turma | Combinação inconsistente retorna 409 com `code` e `details` | PR, teste de integração, log de erro |
| E1-02 | Copiar flags da faixa-template para faixa-instanciada (`demoRequired`, `pressQuizRequired`) | back | Back Lead | E1-01 | Instância replica configuração do template sem hardcode | PR, teste de integração |
| E1-03 | Guiar formulário de instanciação por contexto e bloquear submit inválido | front | Front Lead | E1-01 | Usuário não consegue selecionar combinação inválida nem enviar formulário incompleto | PR, gravação do fluxo |
| E1-04 | Validar fluxo ponta a ponta `instanciar -> editar -> publicar` | ambos | Front + Back | E1-01 a E1-03 | Fluxo opera sem ajuste manual | checklist homologação |
| E2-01 | Padronizar resposta de conflito/estado no módulo de instâncias | back | Back Lead | E1-04 | Respostas de conflito usam `code: CONFLICT_INVALID_STATE` e `details` | PR, coleção de respostas |
| E2-02 | Melhorar payload de listagem de projetos instanciados para tela admin | back | Back Lead | E1-04 | Lista retorna contexto mínimo (`template`, `season`, `class`) | PR, contrato atualizado |
| E2-03 | Exibir contexto operacional na tela de instâncias | front | Front Lead | E2-02 | Tabela mostra contexto sem consulta manual | PR, print |
| E3-01 | Adicionar script de `typecheck` no front | front | Front Lead | nenhum | `npm run typecheck` operacional | PR, log |
| E3-02 | Criar baseline de testes críticos no front para fluxo de instâncias | front | Front Lead | E1-04 | Teste cobre seleção guiada e bloqueio de submit | PR, execução local |
| E3-03 | Pipeline mínima do front (`lint`, `typecheck`, testes críticos) | front | Tech Lead | E3-01 e E3-02 | PR bloqueia merge quando fluxo crítico quebra | workflow + status checks |
| E3-04 | Pipeline mínima do back (`build`, testes críticos) | back | Tech Lead | E1 e E2 estáveis | Regressão crítica bloqueia merge | workflow + status checks |

## Critério obrigatório por tarefa

- Toda tarefa deve ter card preenchido com base em `TEMPLATE_CRITERIO_ACEITE_EPICO.md`.
- Sem critério de aceite e evidência, a tarefa não pode ser marcada como concluída.
- Toda alteração de status deve refletir este board e `CHANGELOG.md`.

## Rito de acompanhamento

- Segunda-feira: priorização e ajustes de escopo da semana.
- Quarta-feira: checkpoint técnico com bloqueios e dependências.
- Sexta-feira: atualização oficial de status e evidências.
