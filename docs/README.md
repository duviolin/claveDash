# Docs do ClaveDash (padrao por fases)

Indice consolidado para execucao por fase, com status unico e atualizacao semanal.

## Leitura minima (10 minutos)

1. `ROADMAP.md` - fase atual, progresso total e prioridades.
2. `EXECUTION_PLAN.md` - plano tatico por fase e ondas de execucao.
3. `FRONT_BACK_EXECUTION_BOARD.md` - tarefas por fase com dono, dependencia e evidencias.

## Fluxo oficial por fases

- Fonte de verdade de status: `ROADMAP.md`.
- Plano operacional da fase: `EXECUTION_PLAN.md`.
- Execucao diaria e rastreio de entrega: `FRONT_BACK_EXECUTION_BOARD.md`.
- Historico de mudancas entregues: `CHANGELOG.md`.

## Documentos ativos

- `ROADMAP.md` - roadmap principal no padrao backend (Fase 1..4, percentual e prioridades).
- `EXECUTION_PLAN.md` - execucao tatico-operacional por fase.
- `FRONT_BACK_EXECUTION_BOARD.md` - board integrado por fase com criterio de pronto e evidencia.
- `RESUMO_EXECUTIVO.md` - visao resumida para decisao rapida.
- `QUINZENAL_REVIEW_LOG.md` - registro de revisao quinzenal com decisao do proximo bloco.
- `DASHBOARD_DATA_ORIGEM_E_INTEGRACAO.md` - origem de dados e pontos de integracao.
- `AUDITORIA_FRONT_BACK_ISSUES_ONLY.md` - achados tecnicos priorizados.
- `STYLE_GUIDE.md` - padrao de Design System.
- `MAPA_NOMENCLATURA_UI.md` - padrao de termos de interface.
- `PROJECT_TEMPLATE_READINESS.md` - guia funcional/tecnico do readiness.
- `PRODUCT_VISION.md` - visao de produto por trilha.
- `TEMPLATE_CRITERIO_ACEITE_EPICO.md` - template obrigatorio por entrega.
- `CHANGELOG.md` - historico de mudancas.

## Regra de governanca

- Toda sexta-feira: atualizar status e percentual em `ROADMAP.md`.
- Toda sexta-feira: sincronizar `EXECUTION_PLAN.md` e `FRONT_BACK_EXECUTION_BOARD.md` com o mesmo status por fase.
- Sem criterio de pronto e evidencia, tarefa nao pode ser concluida no board.
- Fechamento de sprint/release deve atualizar `CHANGELOG.md`.
- Sempre manter alinhamento com `../README.md` e `../../claveBack/README.md`.
