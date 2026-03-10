# Roadmap Integrado Clave (90 dias)

Atualizado em: 2026-03-09
Escopo: concluir Dashboard (front + back), com foco em consistencia de dados e operacao admin.

## Norte do trimestre

1. Fechar instancia e operacao de projetos no Dashboard.
2. Reduzir risco operacional com contratos claros e validacoes.
3. Manter documentacao enxuta e orientada a execucao.

## Epicos e ordem de execucao

## E1 - Instanciacao madura e consistente (Agora)

Objetivo: concluir fluxo de instancia com consistencia entre template, turma e semestre.

Entregas:
- Back: validacoes de coerencia de instancia.
- Back: copia fiel de flags/configuracoes de template para instancias.
- Front: formulario de instancia guiado por contexto (semestre/turma/template).
- Front + Back: mensagens de erro claras para operacao admin.

Criterio de pronto:
- Fluxo instanciar -> listar -> editar -> publicar validado ponta-a-ponta.
- Nenhuma instancia inconsistente criada por combinacao invalida.

## E2 - Operacao de conteudo instanciado (Agora/Proximo)

Objetivo: tornar manutencao de instancias previsivel e segura no dia a dia.

Entregas:
- Back: consolidar comportamento de quiz de press na instancia.
- Back: padronizar retorno de erro para conflitos de estado.
- Front: melhorar feedback visual de acao e status nas telas de instancia.

Criterio de pronto:
- Admin executa operacoes de instancia sem ambiguidade e sem retrabalho.

## E3 - Qualidade e estabilidade do Dashboard (Proximo)

Objetivo: reduzir regressao nos fluxos criticos do Dashboard.

Entregas:
- Back: testes de integracao para instancia e projetos.
- Front: testes de fluxo da tela de instancias.
- Repos: pipeline minima (lint, typecheck, testes criticos de dashboard).

Criterio de pronto:
- PR bloqueia merge quando fluxo critico de dashboard quebra.

## E4 - Governanca documental enxuta (Proximo/Depois)

Objetivo: manter so o essencial para execucao rapida e assertiva.

Entregas:
- Front e back com indice de docs ativos e foco de dashboard.
- Plano de execucao semanal sincronizado.
- Limpeza de docs historicos/depreciados.

Criterio de pronto:
- Qualquer pessoa do time entende origem do dado, gaps e proximo passo em menos de 10 minutos.

## Cadencia de revisao

- Semanal: revisar `EXECUTION_PLAN.md` (status, bloqueios e repriorizacao).
- Quinzenal: revisar roadmap de epicos.
- Mensal: revisar aderencia a narrativa de produto por trilha.

## Padrao obrigatorio para epicos

Antes de iniciar qualquer epico, preencher `TEMPLATE_CRITERIO_ACEITE_EPICO.md` e anexar a evidência no card/tarefa correspondente.
