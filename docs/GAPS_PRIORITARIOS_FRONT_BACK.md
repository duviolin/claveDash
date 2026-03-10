# Gaps Prioritarios (Front + Back) - Foco Dashboard

## 1) Instanciacao sem consistencia completa de dominio

- Impacto: alto.
- Sintoma: validacoes de coerencia entre template, turma e semestre ainda insuficientes.
- Dependencias: regras de dominio e checks no backend.

## 2) Replica parcial de configuracoes do template para instancia

- Impacto: alto.
- Sintoma: flags importantes da faixa instanciada podem divergir do template.
- Dependencias: ajuste no repositorio de instancia.

## 3) Fluxo de quiz de press na instancia sem regra unica

- Impacto: medio-alto.
- Sintoma: criacao do quiz ainda depende de etapa separada, gerando risco operacional.
- Dependencias: definicao de comportamento padrao no back e reflexo no front.

## 4) UX operacional da tela de instancias ainda suscetivel a erro

- Impacto: medio-alto.
- Sintoma: formulario e filtros nao guiam totalmente o admin para combinacoes validas.
- Dependencias: ajustes de filtro, validacao e mensagens no front.

## 5) Contrato e docs de dashboard ainda com ruido historico

- Impacto: medio.
- Sintoma: arquivos antigos e extensos dificultam enxergar o proximo passo.
- Dependencias: limpeza de docs + indice enxuto orientado a execucao.
