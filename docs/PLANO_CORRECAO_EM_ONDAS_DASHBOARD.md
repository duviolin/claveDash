# Plano de Correção em Ondas (Dashboard)

Objetivo: corrigir débitos de maior impacto com risco controlado e sem big-bang.

## Onda 1 — Contrato e consistência (prioridade máxima)

Foco:
- padronizar shape de resposta em `ProjectManagementController` e `InstanceManagementController`;
- padronizar erro com `code/status` (sem string matching);
- corrigir tipos de `instances.ts` no front para DTOs reais;
- validar paginação com utilitário comum.

Saída esperada:
- endpoints de dashboard com contrato estável;
- front tipado por DTO real;
- menor risco de quebra silenciosa.

## Onda 2 — Instanciação madura

Foco:
- corrigir cópia de flags de template na instância (`ProjectManagementRepository`);
- fechar regra clara para quiz de press no fluxo de instância;
- adicionar validações de coerência `template/turma/semestre`.

Saída esperada:
- instância previsível, sem divergência de configuração;
- operação admin sem retrabalho.

## Onda 3 — Padronização front e reutilização

Foco:
- reduzir N+1 em páginas de template;
- padronizar listagem paginada em páginas administrativas;
- centralizar tratamento 409 via hook compartilhado;
- substituir payloads genéricos por tipos específicos.

Saída esperada:
- menos duplicação;
- melhor desempenho;
- código mais previsível para manutenção.

## Onda 4 — Limpeza técnica e dívida residual

Foco:
- reduzir páginas monolíticas por extração de hooks/componentes;
- consolidar convenções de tabs e estados;
- remover código morto e branches legados de erro.

Saída esperada:
- base mais enxuta;
- queda de regressão em mudanças futuras.

## Sequência de execução recomendada

1. Onda 1 (contrato)  
2. Onda 2 (instanciação)  
3. Onda 3 (padronização/reuso)  
4. Onda 4 (limpeza final)
