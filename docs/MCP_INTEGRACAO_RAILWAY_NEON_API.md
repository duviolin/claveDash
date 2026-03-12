# MCP Integracao Total (Railway + Neon + API)

Guia operacional para integrar o Cursor com MCP em toda a stack e acelerar debug, validacao de contrato e operacao de deploy.

## Objetivo

- Unificar observabilidade e execucao em um fluxo unico no Cursor.
- Reduzir retrabalho entre frontend, backend, banco e deploy.
- Permitir diagnostico rapido com evidencias reais (API, DB e infraestrutura).

## Arquitetura alvo

`Cursor` -> `MCP Neon` + `MCP Railway` + `MCP API Clave`

### Servidores MCP no plano minimo

- `user-Neon` (ja disponivel): SQL, schema, branch temporaria, migracao e tuning.
- `railway` (novo): ambiente, servicos, deploys, logs, variaveis e comandos.
- `clave-api` (novo, custom): endpoints da API, contratos, healthcheck e chamadas autenticadas.

## O que voce passa a conseguir fazer

- Investigar erro de tela chamando endpoint real e cruzando com dado no Neon.
- Confirmar se regressao veio de deploy (Railway), banco (Neon) ou contrato de DTO (API).
- Validar migration em branch temporaria e aplicar com confirmacao.
- Executar smoke test de release sem sair do Cursor.
- Auditar divergencia entre `src/types/index.ts` e respostas reais da API.

## Pacote minimo de tools - Railway MCP

Implementar primeiro as tools abaixo.

### 1) `list_projects`

- Uso: listar projetos Railway disponiveis.
- Entrada minima:

```json
{
  "limit": 20
}
```

### 2) `list_services`

- Uso: listar servicos de um projeto (api, worker, cron).
- Entrada minima:

```json
{
  "projectId": "prj_xxx"
}
```

### 3) `list_deployments`

- Uso: consultar historico de deploy e status.
- Entrada minima:

```json
{
  "projectId": "prj_xxx",
  "serviceId": "svc_xxx",
  "limit": 10
}
```

### 4) `get_logs`

- Uso: coletar logs por janela de tempo para incidentes.
- Entrada minima:

```json
{
  "projectId": "prj_xxx",
  "serviceId": "svc_xxx",
  "fromMinutesAgo": 30,
  "limit": 200
}
```

### 5) `list_variables`

- Uso: auditar variaveis de ambiente (sem expor valores sensiveis).
- Entrada minima:

```json
{
  "projectId": "prj_xxx",
  "serviceId": "svc_xxx",
  "redactValues": true
}
```

### 6) `trigger_deploy`

- Uso: disparar novo deploy quando necessario.
- Entrada minima:

```json
{
  "projectId": "prj_xxx",
  "serviceId": "svc_xxx",
  "reason": "smoke fix release"
}
```

## Pacote minimo de tools - API MCP (custom)

O foco aqui e tornar contrato e chamadas da API verificaveis no chat.

### 1) `healthcheck`

- Uso: validar disponibilidade da API e versao ativa.
- Entrada minima:

```json
{
  "baseUrl": "https://api.suaapp.com"
}
```

### 2) `list_endpoints`

- Uso: listar rotas expostas por dominio e metodo.
- Entrada minima:

```json
{
  "groupBy": "resource"
}
```

### 3) `get_openapi`

- Uso: obter contrato OpenAPI atual para validacao de DTO/status.
- Entrada minima:

```json
{
  "format": "json"
}
```

### 4) `call_endpoint`

- Uso: chamar endpoint com autenticacao e payload controlado.
- Entrada minima:

```json
{
  "method": "GET",
  "path": "/users",
  "query": { "page": 1, "limit": 10 },
  "authProfile": "admin"
}
```

### 5) `assert_contract`

- Uso: validar se resposta real bate com schema esperado.
- Entrada minima:

```json
{
  "method": "GET",
  "path": "/users",
  "expectedStatus": 200,
  "expectedSchemaRef": "#/components/schemas/PaginatedUserResponse"
}
```

### 6) `run_smoke_suite`

- Uso: smoke test de endpoints criticos por ambiente.
- Entrada minima:

```json
{
  "suite": "release-minimo",
  "environment": "production"
}
```

## Fluxos prontos que voce pode usar no dia a dia

### Fluxo 1 - Bug de frontend em producao

1. `call_endpoint` para reproduzir a resposta.
2. `assert_contract` para detectar quebra de DTO/status.
3. `run_sql` no Neon para validar estado de dados.
4. `get_logs` no Railway para achar stacktrace correlata.

### Fluxo 2 - Lentidao de listagem

1. `list_slow_queries` no Neon para identificar query critica.
2. `prepare_query_tuning` para recomendacoes em branch temporaria.
3. `explain_sql_statement` para comparar plano.
4. `complete_query_tuning` apenas apos aprovacao.

### Fluxo 3 - Deploy com falha

1. `list_deployments` para localizar deploy quebrado.
2. `get_logs` para causa raiz.
3. `list_variables` para detectar chave ausente.
4. `trigger_deploy` apos ajuste.

## Checklist de seguranca (obrigatorio)

- Separar perfis MCP de `read-only` e `write`.
- Bloquear tools destrutivas em producao sem confirmacao explicita.
- Redigir segredos e tokens no retorno (`redactValues`, mascaramento parcial).
- Exigir `environment` e `projectId` em qualquer acao de escrita.
- Registrar trilha de auditoria (quem executou, quando, qual tool).
- Limitar janela de logs por padrao para evitar vazamento amplo.
- Definir timeout e retry controlado por tool.

## Checklist de implementacao (passo a passo)

- Criar servidor MCP Railway com as 6 tools minimas.
- Criar servidor MCP `clave-api` com as 6 tools minimas.
- Usar scaffold pronto em `../claveBack/mcp/clave-api-server` como base inicial.
- Publicar docs de schema/argumentos de cada tool.
- Conectar os servidores no Cursor e validar permissao.
- Rodar 3 fluxos prontos (bug, lentidao, deploy) como teste de aceite.

## Criterios de pronto

- Cursor lista projetos Railway e Neon corretamente.
- Cursor consegue chamar endpoint autenticado via MCP da API.
- Cursor cruza incidente com evidencia de API + DB + logs.
- Nenhuma tool de escrita executa sem confirmacao explicita.
- Time consegue executar smoke de release em menos de 10 minutos.
