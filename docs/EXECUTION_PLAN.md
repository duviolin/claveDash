# Plano de Execucao Integrado (Agora / Proximo / Depois)

Atualizado em: 2026-03-09
Owner sugerido: Produto + Tech Lead Front + Tech Lead Back

## Agora (0-30 dias)

1. Validar consistencia de instancia (`template`, `turma`, `semestre`) no back.
2. Corrigir copia fiel de flags do template para instancia.
3. Ajustar UX da tela de instancias (filtros guiados e bloqueio de submit invalido).
4. Validar fluxo ponta-a-ponta: instanciar -> listar -> editar -> publicar.

## Proximo (31-60 dias)

1. Consolidar regra unica de quiz de press na instancia.
2. Criar suite minima de testes de integracao para fluxos criticos.
3. Definir pipeline baseline (lint, typecheck e testes criticos).
4. Revisar e padronizar erros operacionais da area administrativa.

## Depois (61-90 dias)

1. Expandir cobertura de testes para fluxos adjacentes.
2. Evoluir observabilidade operacional basica para suporte de release.
3. Revisar backlog fora do dashboard (somente apos fechamento desta fase).

## Ondas de implementacao (execucao curta)

### Onda 1 - Contrato e consistencia

- padronizar shape de resposta e erro para endpoints criticos do dashboard;
- corrigir tipos do front para refletir DTO real;
- validar paginação com regra unica.

### Onda 2 - Instanciacao madura

- fechar validacoes de coerencia de dominio;
- remover hardcode de flags na instancia;
- fechar regra de quiz de press (automatica ou checklist obrigatorio).

### Onda 3 - Padronizacao e reuso

- reduzir n+1 de consultas no front em listas de templates;
- padronizar listagem paginada nas telas administrativas;
- centralizar tratamento de 409.

### Onda 4 - Limpeza final

- reduzir paginas monoliticas com extracao de hooks/componentes;
- remover codigo morto e caminhos legados de erro.

## Quadro de acompanhamento

| Item | Repo | Owner | Status | Dependencia |
|---|---|---|---|---|
| Validacao template/turma/semestre | back | Backend Lead | Pendente | Regras de dominio |
| Copia fiel de flags na instancia | back | Backend Lead | Pendente | Repositorio de instancia |
| Ajuste de UX da tela de instancias | front | Front Lead | Pendente | Contrato de API |
| Fluxo quiz de press na instancia | back/front | Backend + Front Lead | Pendente | Definicao de regra unica |
| Testes de fluxo de instancia | back/front | Backend + Front Lead | Pendente | Casos de uso fechados |
| CI baseline | ambos | Tech Lead | Pendente | Suite minima de testes |

## Regra de governanca

- Toda tarefa entra com dono, dependencia e criterio de aceite.
- Toda sexta-feira: atualizar status deste arquivo.
- Todo fechamento de sprint: registrar mudancas em `CHANGELOG.md`.
- Todo epico novo deve usar `TEMPLATE_CRITERIO_ACEITE_EPICO.md`.
- Board operacional unico: `FRONT_BACK_EXECUTION_BOARD.md`.
- Revisao quinzenal com decisao explicita do proximo bloco: `QUINZENAL_REVIEW_LOG.md`.
