# Docs do ClaveDash (padrao por fases)

Indice consolidado para execucao por fase, com status unico e atualizacao semanal.

## Leitura minima (5 minutos)

1. `ROADMAP.md` - fase atual, progresso total e prioridades.
2. `EXECUTION_PLAN.md` - plano tatico por fase e ondas de execucao.
3. `FRONT_BACK_EXECUTION_BOARD.md` - tarefas por fase com dono e evidencias.

## Fluxo oficial por fases

- Fonte de verdade de status: `ROADMAP.md`.
- Plano operacional da fase: `EXECUTION_PLAN.md`.
- Execucao diaria e rastreio de entrega: `FRONT_BACK_EXECUTION_BOARD.md`.
- Historico de mudancas entregues: `CHANGELOG.md`.

## Documentos ativos

- `ROADMAP.md` - fonte unica de status e prioridades.
- `EXECUTION_PLAN.md` - execucao tatico-operacional da fase atual.
- `FRONT_BACK_EXECUTION_BOARD.md` - tarefas integradas front/back.
- `DASHBOARD_DATA_ORIGEM_E_INTEGRACAO.md` - origem de dados e integracao.
- `MCP_INTEGRACAO_RAILWAY_NEON_API.md` - pacote minimo de integracao MCP (Railway, Neon e API).
- `../../claveBack/mcp/clave-api-server/README.md` - scaffold tecnico do servidor MCP da API (acoplado ao backend).
- `CHANGELOG.md` - historico de mudancas.
- `UX_A11Y_OPERATIONAL_GUIDE.md` - padrao operacional de experiencia e acessibilidade.

## Documentos de referencia complementar

- `RESUMO_EXECUTIVO.md`
- `AUDITORIA_FRONT_BACK_ISSUES_ONLY.md`
- `PROJECT_TEMPLATE_READINESS.md`
- `STYLE_GUIDE.md`
- `A11Y_THEME_CHECKLIST.md`
- `UX_A11Y_OPERATIONAL_GUIDE.md`
- `MAPA_NOMENCLATURA_UI.md`
- `PRODUCT_VISION.md`
- `TEMPLATE_CRITERIO_ACEITE_EPICO.md`
- `QUINZENAL_REVIEW_LOG.md`

## Regra de governanca

- Toda sexta-feira: atualizar status e percentual em `ROADMAP.md`.
- Toda sexta-feira: sincronizar `EXECUTION_PLAN.md` e `FRONT_BACK_EXECUTION_BOARD.md` com o mesmo status por fase.
- Sem criterio de pronto e evidencia, tarefa nao pode ser concluida no board.
- Fechamento de sprint/release deve atualizar `CHANGELOG.md`.
- Sempre manter alinhamento com `../README.md` e `../../claveBack/README.md`.
