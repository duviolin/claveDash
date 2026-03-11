# Guia Operacional de UX + A11y (Frontend)

Atualizado em: 2026-03-10  
Objetivo: manter experiencia consistente, autoexplicativa e acessivel em todo o admin.

## 1) Principios de experiencia

- Clareza primeiro: o usuario precisa entender "onde estou", "o que posso fazer" e "o que acontece depois".
- Consistencia de fluxo: CRUDs seguem a mesma estrutura, sem reaprendizado por tela.
- Baixa friccao: acao principal visivel, linguagem simples, feedback imediato.
- Acessibilidade por padrao: teclado, foco, semantica e contraste nao sao opcionais.

## 2) Regra de contraste (WCAG AA)

- Texto normal: minimo `4.5:1`.
- Texto grande (>= 18px ou >= 14px bold): minimo `3:1`.
- Controles, bordas e estados essenciais: minimo `3:1`.
- Estados semanticos (`success`, `warning`, `error`, `info`, `accent`) devem priorizar tokens fortes para texto.

### Tokens e uso recomendado

- Sempre usar tokens de `src/index.css` (`--color-*`).
- Evitar texto semantico claro sobre fundo semantico muito suave.
- Para badges e labels de status, usar variantes com contraste reforcado (`*-strong`) quando houver texto pequeno.
- Evitar `text-muted/60` em texto pequeno informativo.

## 3) Hierarquia tipografica (padrao unico)

- Titulo de pagina: `text-2xl font-bold`.
- Titulo de secao/card: `text-lg font-semibold`.
- Label de campo/coluna: `text-sm font-medium`.
- Corpo principal: `text-sm font-normal`.
- Metadado/ajuda: `text-xs font-normal text-muted`.

## 4) Semantica e navegacao por teclado

- Todo componente interativo deve ter foco visivel com `focus-visible`.
- `Tabs` devem expor `tablist/tab`, `aria-selected` e navegacao por seta.
- `Modal` deve:
  - abrir com foco gerenciado;
  - manter foco interno (focus trap);
  - devolver foco ao gatilho ao fechar.
- Acoes por icone devem usar `IconButton` com `aria-label`.
- Tabela deve usar `scope="col"` no cabecalho.

## 5) Padrao obrigatorio de CRUD

Todos os CRUDs devem seguir a mesma estrutura visual e funcional:

1. Header: `PageContainer` com titulo + contagem + CTA.
2. Toolbar: `CrudListToolbar` com:
   - esquerda: `Tabs` (Ativos/Lixeira ou variacao por dominio);
   - direita: filtros e/ou busca.
3. Lista: `Table` com colunas consistentes de nome/status/acoes.
4. Rodape: `Pagination` em posicao fixa.
5. Estados: loading, vazio ativo, vazio lixeira, erro.
6. Fluxo de exclusao:
   - `deleteMutation` + `restoreMutation`;
   - tratamento de 409 com `DeactivationBlockedModal`.

## 6) Checklist obrigatorio para PR

Antes de abrir PR, validar:

- [ ] Segui `components/ui` e hooks compartilhados, sem duplicacao local.
- [ ] CRUD segue `PageContainer + CrudListToolbar + Table + Pagination`.
- [ ] Acoes de linha usam `IconButton` com label acessivel.
- [ ] Contraste de textos/estados esta dentro de AA.
- [ ] Foco por teclado esta visivel e em ordem logica.
- [ ] Modal e tabs foram testados com teclado.
- [ ] Mensagens estao em portugues claro e simples.
- [ ] Rodei `npm run lint`.
- [ ] Rodei `npm run test -- accessibility.smoke.test.tsx`.

## 7) Roteiro rapido de revisao manual (5 minutos)

1. Navegar so com teclado (`Tab`, `Shift+Tab`, setas nos tabs).
2. Abrir e fechar modais sem mouse.
3. Confirmar leitura visual:
   - titulos destacam o que e principal;
   - metadados nao competem com conteudo principal.
4. Trocar tema claro/escuro e validar legibilidade.
5. Validar CRUD completo: filtrar, buscar, excluir, restaurar, paginar.

## 8) Antipadroes (evitar)

- Criar botao/input/tabela "inline" quando ja existe componente base.
- Hardcode de cor em hex em paginas/componentes.
- Usar somente cor para comunicar estado sem texto de apoio.
- Misturar padroes de layout entre CRUDs.
- Acao critica sem confirmacao clara.
