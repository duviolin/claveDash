# ClaveDash (Frontend Admin)

Painel administrativo da Clave para operacao academica e de conteudo.

## Objetivo desta fase

Fechar o dashboard com foco em **consistencia de instanciacao**, **operacao diaria sem retrabalho** e **entrega com qualidade minima de release**.

## Escopo deste repositorio (Dash)

- SPA React para operacao administrativa (usuarios, escolas, cursos, semestres, turmas).
- Gestao de templates pedagogicos e fluxo de instanciacao.
- Integracao com API backend (`claveBack`) via JWT.
- Readiness de publicacao e suporte de UX para tratamento de conflitos.

## Status rapido (visao executiva)

- **Pronto**: autenticacao, estrutura academica, CRUDs principais, templates, storage e readiness.
- **Parcial**: fluxo de instanciacao (validacoes/UX) e maturidade de release (teste/pipeline).
- **Risco atual**: dispersao por excesso de documentacao historica e backlog sem recorte de execucao.

Base: `docs/RESUMO_EXECUTIVO.md` e `docs/EXECUTION_PLAN.md`.

## Proximos passos (Dash)

1. Fechar UX e regras de validacao do fluxo de instanciacao.
2. Garantir consistencia de estados (ativo/lixeira, bloqueio 409, restore).
3. Consolidar telas do dashboard para operacao sem ajustes manuais.
4. Subir cobertura minima de testes de fluxo critico e checklist de release.

## Setup rapido

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend em `http://localhost:5173`.

## Documentacao essencial (Dash)

- `docs/README.md` - rota de leitura minima.
- `docs/RESUMO_EXECUTIVO.md` - visao unica para decisao rapida.
- `docs/EXECUTION_PLAN.md` - plano Agora/Proximo/Depois.
- `docs/ROADMAP.md` - roadmap de 90 dias.
- `docs/DASHBOARD_DATA_ORIGEM_E_INTEGRACAO.md` - origem de dados e contrato de integracao.
- `docs/AUDITORIA_FRONT_BACK_ISSUES_ONLY.md` - gaps tecnicos priorizados.

## Dependencia com o Backend

- Repositorio backend: `../claveBack`.
- Contrato de API e alinhamento de entrega devem seguir o que esta em `claveBack/README.md` e `claveBack/docs/ROADMAP.md`.
- Todas as decisoes de front para dashboard devem manter sincronia com o plano do backend.
