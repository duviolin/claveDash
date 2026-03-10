# Plano de Execucao Integrado (Agora / Proximo / Depois)

Atualizado em: 2026-03-09
Owner sugerido: Produto + Tech Lead Front + Tech Lead Back

## Agora (0-30 dias)

1. Fechar validacoes de consistencia de instancia (template/turma/semestre).
2. Corrigir replicacao fiel de flags do template nas instancias.
3. Ajustar UX da tela de instancias para reduzir erro operacional.
4. Validar fluxo ponta-a-ponta de instancia e publicacao.

## Proximo (31-60 dias)

1. Consolidar comportamento de quiz de press na instancia.
2. Criar suite minima de testes de integracao dos fluxos de dashboard.
3. Definir pipeline CI baseline (lint, typecheck, testes criticos).
4. Revisar erros e mensagens operacionais da area administrativa.

## Depois (61-90 dias)

1. Expandir cobertura de testes para fluxos adjacentes.
2. Evoluir observabilidade operacional basica para suporte de release.
3. Revisar backlog fora do dashboard (somente apos fechamento desta fase).

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
