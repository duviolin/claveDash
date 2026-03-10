# Baby Steps para Concluir o Dashboard

Foco: finalizar Dashboard com previsibilidade (sem mobile e sem gamificacao).

## Passo 1 - Travar escopo

- Congelar escopo em 3 blocos:
  1. CRUD de estrutura (usuarios/escolas/cursos/semestres/turmas) - manter.
  2. Templates + readiness - manter.
  3. Instanciacao + operacao de projetos - fechar.

Saida esperada:
- backlog limpo com itens fora de escopo removidos desta fase.

## Passo 2 - Fechar instancia com consistencia de dados

- Implementar validacoes de coerencia (`template`, `turma`, `semestre`).
- Corrigir copia de flags do template para instancia.
- Definir regra unica para quiz de press na instancia.

Saida esperada:
- instancia previsivel e sem passos manuais ocultos.

## Passo 3 - Ajustar UX da tela de instancias

- Filtrar turma por semestre.
- Bloquear submit de formulario incompleto/inconsistente.
- Exibir mensagens de erro operacionais claras.

Saida esperada:
- operacao do admin sem tentativa-e-erro.

## Passo 4 - Validar contrato ponta-a-ponta

- Revisar endpoints usados no dashboard de instancia.
- Validar tipos no front e DTOs no back.
- Executar checklist rapido de fluxo principal.

Saida esperada:
- fluxo instanciar -> listar -> editar -> publicar funcionando sem quebra.

## Passo 5 - Fechar documentacao enxuta

- Manter somente docs ativos de execucao:
  - origem do dado e integracao;
  - gaps de instancia;
  - roadmap e plano operacional.

Saida esperada:
- equipe encontra direcao em menos de 10 minutos.
