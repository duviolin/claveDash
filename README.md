# ClaveDash (Frontend Admin)

Painel administrativo da Clave para operacao academica e de conteudo.

## Objetivo desta fase

Fechar o dashboard com foco em **consistencia de instanciacao** e **operacao diaria sem retrabalho**.

## Escopo deste repositorio (Dash)

- SPA React para operacao administrativa (usuarios, escolas, cursos, semestres, turmas).
- Gestao de templates pedagogicos e fluxo de instanciacao.
- Integracao com API backend (`claveBack`) via JWT.
- Readiness de publicacao e suporte de UX para tratamento de conflitos.

## Status rapido (visao executiva)

- **Pronto**: autenticacao, estrutura academica, CRUDs principais, templates, storage e readiness.
- **Parcial**: fluxo de instanciacao (validacoes/UX) e consolidacao da operacao diaria.
- **Risco atual**: dispersao por excesso de documentacao historica e backlog sem recorte de execucao.

Base: `docs/RESUMO_EXECUTIVO.md` e `docs/EXECUTION_PLAN.md`.

## Proximos passos (Dash)

1. Fechar UX e regras de validacao do fluxo de instanciacao.
2. Garantir consistencia de estados (ativo/lixeira, bloqueio 409, restore).
3. Consolidar telas do dashboard para operacao sem ajustes manuais.
4. Consolidar checklist operacional de entrega do fluxo critico.

## Setup rapido

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend em `http://localhost:5173`.

## Documentacao essencial

- `docs/ROADMAP.md` - fases, status e prioridades.
- `docs/EXECUTION_PLAN.md` - plano tatico da fase atual.
- `docs/FRONT_BACK_EXECUTION_BOARD.md` - tarefas integradas por fase.
- `docs/DASHBOARD_DATA_ORIGEM_E_INTEGRACAO.md` - origem de dados e contrato de integracao.

## Dependencia com o Backend

- Repositorio backend: `../claveBack`.
- Contrato de API e alinhamento de entrega devem seguir `../claveBack/README.md` e `../claveBack/docs/ROADMAP.md`.
