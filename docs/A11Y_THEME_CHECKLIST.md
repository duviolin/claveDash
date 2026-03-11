# Checklist A11y para Temas (WCAG 2.1 AA)

## Objetivo
Garantir consistencia visual e contraste minimo AA na alternancia manual entre tema claro e escuro.

## Escopo de validacao
- Login (`/login`)
- Primeiro acesso (`/first-access`)
- Painel (`/dashboard`)
- Configuracoes (`/settings/password`, `/settings/publication`)
- List pages principais (`/users`, `/schools`, `/courses`, `/classes`, `/templates/*`)

## Checklist de contraste (AA)
- Texto normal: contraste minimo `4.5:1`.
- Texto grande (>= 18px ou 14px bold): contraste minimo `3:1`.
- Elementos de interface e bordas essenciais: contraste minimo `3:1`.
- Estados interativos (`hover`, `focus-visible`, `disabled`) precisam manter contraste valido.
- Labels dentro de superficies semanticas (`accent`, `success`, `warning`, `error`, `info`) devem usar tokens `on-*`.

## Checklist de navegacao e foco
- Todos os controles sao acessiveis por teclado (`Tab` e `Shift+Tab`).
- Ordem de foco segue a leitura visual da pagina.
- Dialogs usam `role=\"dialog\"`, `aria-modal=\"true\"` e titulo associado.
- Indicador de foco e visivel em componentes clicaveis.

## Checklist de tema
- Troca de tema atualiza `data-theme` no `html`.
- Preferencia do usuario persiste em `localStorage`.
- Scrollbar/autofill/input nativo respeitam o tema ativo.
- Nao usar `text-white`, `bg-black/*` ou hex hardcoded em componentes/paginas.

## Ferramentas recomendadas
- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npx @axe-core/cli http://127.0.0.1:5173/login`
- Lighthouse (categoria accessibility) nas rotas priorizadas
