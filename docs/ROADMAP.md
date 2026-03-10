# Roadmap - ClaveDash (Padrao por Fases)

Ultima Atualizacao: 2026-03-09
Escopo: concluir dashboard front + back com consistencia de instanciacao, operacao diaria estavel e qualidade minima de release.

## Status Geral

Progresso Total: ~75% concluido

- FASE 1 - Fundacao admin e contrato base: 100%
- FASE 2 - Fluxo de instanciacao consistente: 70%
- FASE 3 - Operacao diaria de instancias: 30%
- FASE 4 - Qualidade de release e otimizacoes: 0%

## FASE 1 - Fundacao admin e contrato base (100% Concluido)

Objetivo:
Ter base administrativa estavel no dashboard e contrato principal front/back funcional.

Concluido:
- Autenticacao JWT e contexto de usuario funcionando.
- CRUDs administrativos principais (usuarios, escolas, cursos, semestres e turmas).
- Estrutura inicial de templates e operacao admin pronta.
- Tratamento global de erros e padrao de integracao ativo.

## FASE 2 - Fluxo de instanciacao consistente (70% Em Progresso)

Objetivo:
Fechar consistencia de instancia entre template, semestre e turma, reduzindo erro operacional.

Concluido:
- Diagnostico tecnico consolidado do fluxo `instanciar -> listar -> editar -> publicar`.
- Contratos principais mapeados para ajuste de validacao no back e UX no front.
- Direcao de board unico E1/E2/E3 definida para execucao integrada.

Em Progresso:
- Validacao de coerencia `templateId` x `seasonId` x `classId`.
- Copia fiel de flags do template para instancia.
- Formulario guiado com bloqueio de submit invalido.

Proximos Passos:
- Fechar E1-01, E1-02 e E1-03 no board integrado.
- Rodar validacao ponta a ponta com evidencias.

## FASE 3 - Operacao diaria de instancias (30% Em Progresso)

Objetivo:
Tornar manutencao de instancias previsivel, com mensagens claras e menos retrabalho.

Concluido:
- Necessidades operacionais de conflito de estado e contexto de listagem mapeadas.

Em Progresso:
- Padronizacao de erro operacional com `CONFLICT_INVALID_STATE`.
- Evolucao do payload de listagem para trazer contexto minimo.
- Exibicao de contexto operacional na tela de instancias.

Proximos Passos:
- Fechar E2-01, E2-02 e E2-03 com criterio de aceite e evidencias.
- Validar fluxo de operacao com time administrativo.

## FASE 4 - Qualidade de release e otimizacoes (0% Planejado)

Objetivo:
Elevar confiabilidade de entrega com testes e pipeline minima de protecao.

Planejado:
- Script de `typecheck` no front.
- Baseline de testes criticos do fluxo de instancias.
- Pipeline minima front (`lint`, `typecheck`, testes criticos).
- Pipeline minima back (`build`, testes criticos).

Proximos Passos:
- Iniciar E3-01 e E3-02 em paralelo com fechamento final da Fase 2.
- Subir E3-03 e E3-04 apos baseline de testes pronta.

## Proximos Passos Imediatos

Prioridade Alta (esta semana):
- Fechar validacao de coerencia da instanciacao no back.
- Concluir UX guiada da tela de instancias no front.
- Validar fluxo ponta a ponta e registrar evidencias no board.

Prioridade Media (proximas 2 semanas):
- Padronizar conflitos de estado e melhorar payload de listagem.
- Consolidar feedback visual e contexto operacional no dashboard.

Prioridade Baixa (futuro):
- Expandir testes fora do fluxo critico.
- Evoluir observabilidade e melhorias de performance.

## Notas Importantes

O que esta funcionando:
- Base admin e autenticacao estao estaveis.
- Estrutura de integracao front/back esta definida.

O que precisa atencao:
- Fluxo de instanciacao ainda depende de fechamento de validacoes.
- Operacao diaria precisa de padronizacao final de erros e contexto.
- Qualidade de release ainda sem baseline completa de pipeline.

Foco atual:
- Concluir Fase 2 e acelerar Fase 3 sem perder rastreabilidade de evidencias.

## Metricas de Progresso

| Fase | Status | Progresso |
|---|---|---|
| FASE 1 - Fundacao admin e contrato base | Concluido | 100% |
| FASE 2 - Fluxo de instanciacao consistente | Em Progresso | 70% |
| FASE 3 - Operacao diaria de instancias | Em Progresso | 30% |
| FASE 4 - Qualidade de release e otimizacoes | Planejado | 0% |

Progresso Total: ~75%

## Links Uteis

- `docs/EXECUTION_PLAN.md` - execucao tatico-operacional por fase.
- `docs/FRONT_BACK_EXECUTION_BOARD.md` - tarefas integradas com dono, dependencia, criterio e evidencias.
- `docs/TEMPLATE_CRITERIO_ACEITE_EPICO.md` - template obrigatorio por entrega.
