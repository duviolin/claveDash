# ClaveDash Style Guide (Design System)

## Objetivo
Manter a interface consistente, simples e escalavel em todo o `src/`.

## Fundacao visual
- **Tokens**: usar variaveis de `src/index.css` (`--color-*`, `--radius-*`, `--space-*`, `--shadow-*`).
- **Sem hardcode**: evitar hex direto em componentes/paginas.
- **Tema**: sempre respeitar surface/border/text/accent do tema dark.

## Componentes base (fonte unica)
Priorizar os componentes em `src/components/ui`:
- `Button`, `IconButton`, `Card`, `Table`, `Modal`, `Tabs`, `Pagination`
- `Badge`, `Input`, `Select`, `Textarea`
- `LoadingState`, `DetailFieldList`, `DeactivationBlockedModal`

Evitar recriar versoes locais desses componentes dentro de pages.

## Padroes de pagina
- **List pages CRUD**:
  - tabs `Ativos/Lixeira`
  - `deleteMutation` + `restoreMutation`
  - tratamento de 409 com `DeactivationBlockedModal`
  - acoes de linha com `IconButton`
- **Hooks compartilhados**:
  - `useTrashableListPage`
  - `useDeactivationBlockedHandler`
- **Helpers compartilhados**:
  - `truncateText` em `src/lib/text.ts`

## Conteudo e linguagem
- Interface em portugues claro, simples e popular.
- Labels e mensagens curtas e objetivas.
- Corrigir acentuacao (ex.: "está", "página", "vazio").

## Boas praticas de implementacao
- Reaproveitar componentes e hooks antes de criar novo codigo.
- Extrair repeticao para `components/ui`, `hooks` ou `lib`.
- Usar `error: unknown` em handlers.
- Nao usar `any`.

## Checklist rapido (antes de finalizar)
- [ ] Existe componente base para isso em `src/components/ui`?
- [ ] Estou usando tokens do `index.css`?
- [ ] Removi duplicacao local evitavel?
- [ ] Mantive padrao de tabs/lixeira/restore/409 nas list pages?
- [ ] Atualizei rule/documentacao se um novo padrao surgiu?
