# Gaps de Instanciacao para Fechar o Dashboard

Diagnostico focado na cadeia de dados e no uso real da tela de instancias.

## Estado atual

- Fluxo base existe (instanciar, listar por semestre, editar e publicar/ocultar).
- Maturidade geral: parcial.

## Gaps criticos

## G1 - Validacao de consistencia de contexto

- Problema: instancia recebe `templateId`, `classId` e `seasonId`, mas faltam validacoes completas de coerencia de dominio.
- Risco: criar projeto em combinacao inconsistente (ex.: turma fora do semestre esperado).
- Ajuste esperado:
  - validar existencia de turma e semestre;
  - validar se turma pertence ao semestre informado;
  - validar alinhamento de curso entre template e semestre.

## G2 - Copia de flags do template para instancia

- Problema: no repositório de instancia, `demoRequired` e `pressQuizRequired` sao definidos como `true` fixo.
- Risco: instancia diverge do template e gera comportamento incorreto.
- Ajuste esperado:
  - copiar `demoRequired` e `pressQuizRequired` de `TrackSceneTemplate`.

## G3 - Press quiz nao entra automaticamente na instancia

- Problema: quiz de press depende de fluxo separado (`/press-quizzes/from-template`).
- Risco: projeto instanciado fica incompleto por operacao manual extra.
- Ajuste esperado:
  - definir comportamento padrao de instancia para quizzes (automatica ou checklist obrigatorio no dashboard).

## G4 - UX operacional da tela de instancias

- Problema: selecao de turma/template ainda pouco guiada por contexto.
- Risco: erro humano na operacao (turma/semestre incompativeis).
- Ajuste esperado:
  - filtrar turmas por semestre selecionado;
  - validar formulario antes do submit com mensagens claras.

## G5 - Contrato e documentacao do fluxo ainda difusos

- Problema: documentacao historica mistura estados antigos com foco atual.
- Risco: time seguir instrucoes obsoletas e perder velocidade.
- Ajuste esperado:
  - manter docs enxutos: origem do dado, gaps, plano de execucao.

## Definicao objetiva de "instanciacao madura"

- [ ] Nao permite instancia inconsistente.
- [ ] Replica corretamente configuracao dos templates.
- [ ] Entrega projeto pronto para operacao sem passo manual oculto.
- [ ] Tela do dashboard previne erro operacional com validacoes simples e claras.
