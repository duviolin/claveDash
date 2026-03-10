# Board Integrado Front + Back (Padrao por Fases)

Atualizado em: 2026-03-09
Objetivo: acompanhar execucao por fase em um quadro unico com dono, dependencia, criterio de pronto e evidencias.

## Status Geral por Fase

| Fase | Status | Progresso | Dono principal | Repos |
|---|---|---|---|---|
| FASE 1 - Fundacao admin e contrato base | Concluida | 100% | Back Lead + Front Lead | ambos |
| FASE 2 - Fluxo de instanciacao consistente | Em Progresso | 70% | Back Lead + Front Lead | ambos |
| FASE 3 - Operacao diaria de instancias | Em Progresso | 30% | Back Lead + Front Lead | ambos |
| FASE 4 - Expansao funcional | Planejado | 0% | Tech Lead | ambos |

## Quadro de Execucao por Fase

### FASE 2 - Fluxo de instanciacao consistente

| ID | Entrega | Repo | Dono | Dependencia | Criterio de pronto | Evidencias |
|---|---|---|---|---|---|---|
| F2-01 (E1-01) | Validar coerencia `templateId` x `seasonId` x `classId` na instanciacao | back | Back Lead | Regras de dominio de curso/semestre/turma | Combinacao inconsistente retorna 409 com `code` e `details` | PR, log de erro |
| F2-02 (E1-02) | Copiar flags da faixa-template para faixa-instanciada (`demoRequired`, `pressQuizRequired`) | back | Back Lead | F2-01 | Instancia replica configuracao do template sem hardcode | PR, demonstracao funcional |
| F2-03 (E1-03) | Guiar formulario de instanciacao por contexto e bloquear submit invalido | front | Front Lead | F2-01 | Usuario nao consegue selecionar combinacao invalida nem enviar formulario incompleto | PR, gravacao do fluxo |
| F2-04 (E1-04) | Validar fluxo ponta a ponta `instanciar -> editar -> publicar` | ambos | Front + Back | F2-01 a F2-03 | Fluxo opera sem ajuste manual | checklist de homologacao |

### FASE 3 - Operacao diaria de instancias

| ID | Entrega | Repo | Dono | Dependencia | Criterio de pronto | Evidencias |
|---|---|---|---|---|---|---|
| F3-01 (E2-01) | Padronizar resposta de conflito/estado no modulo de instancias | back | Back Lead | F2-04 | Respostas de conflito usam `code: CONFLICT_INVALID_STATE` e `details` | PR, colecao de respostas |
| F3-02 (E2-02) | Melhorar payload de listagem de projetos instanciados para tela admin | back | Back Lead | F2-04 | Lista retorna contexto minimo (`template`, `season`, `class`) | PR, contrato atualizado |
| F3-03 (E2-03) | Exibir contexto operacional na tela de instancias | front | Front Lead | F3-02 | Tabela mostra contexto sem consulta manual | PR, print |

### FASE 4 - Expansao funcional

| ID | Entrega | Repo | Dono | Dependencia | Criterio de pronto | Evidencias |
|---|---|---|---|---|---|---|
| F4-01 (E4-01) | Refinar UX da tela de instancias (filtros, estados e mensagens) | front | Front Lead | F3-03 | Operacao diaria mais direta e sem ambiguidade visual | PR, gravacao curta |
| F4-02 (E4-02) | Melhorar performance de listagens e filtros mais usados | front | Front Lead | F3-03 | Tempo de resposta percebido reduzido em telas criticas | PR, comparativo antes/depois |
| F4-03 (E4-03) | Evoluir payload de contexto para reduzir chamadas redundantes | back | Back Lead | F3-02 | Front exibe contexto com menos roundtrips | PR, contrato atualizado |
| F4-04 (E4-04) | Consolidar backlog funcional complementar do dashboard | ambos | Produto + Leads | F4-01 a F4-03 | Lista priorizada pronta para proxima janela | registro no board |

## Regra Obrigatoria por Tarefa

- Toda tarefa deve ter card preenchido com base em `TEMPLATE_CRITERIO_ACEITE_EPICO.md`.
- Sem criterio de aceite e evidencia, a tarefa nao pode ser marcada como concluida.
- Toda alteracao de status deve refletir este board, `ROADMAP.md`, `EXECUTION_PLAN.md` e `CHANGELOG.md`.

## Rito de Acompanhamento

- Segunda-feira: priorizacao e ajuste de escopo da semana.
- Quarta-feira: checkpoint tecnico com bloqueios e dependencias.
- Sexta-feira: atualizacao oficial de status, percentual e evidencias.
