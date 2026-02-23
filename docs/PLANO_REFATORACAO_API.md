# Plano de Refatoração — Integração Dashboard ↔ API

**Data:** 22/02/2026 | **Atualizado:** 23/02/2026  
**Referência:** `claveBack/docs/DASHBOARD_API.md`

---

## Status Geral

| Etapa | Escopo | Status |
|-------|--------|--------|
| 1 — Types | Alinhar interfaces TypeScript | ✅ Concluída |
| 2 — Auth | getMe completo, avatar | ✅ Concluída |
| 3 — Users | Paginação tipada | ✅ Concluída |
| 4 — Schools | Remover hardcode paginação | ✅ Concluída |
| 5 — Courses | Paginação + type no update | ✅ Concluída |
| 6 — Seasons | Expandir updateSeason | ✅ Concluída |
| 7 — Instances | Alinhar tipo Project | ✅ Concluída |
| 8 — Storage/Profiles | Tipos compartilhados | ✅ Concluída |
| 9 — Notifications API | Módulo de notificações | ✅ Concluída |
| 10 — Media Binding | Vinculação de mídia | ✅ Concluída |
| 11 — NotificationBell | Componente no header | ✅ Concluída |
| 12 — Paginação | Padronizar em todas as páginas | ✅ Concluída |
| 13 — Verificação Final | Build + lint | ✅ Concluída |

**Refatoração 100% concluída.**

---

## Melhorias adicionais realizadas (23/02/2026)

| Item | Descrição | Status |
|------|-----------|--------|
| Soft delete/restore | Tabs Ativas/Lixeira em todas as list pages | ✅ |
| DeactivationBlockedModal | Modal reutilizável para 409 com detalhes | ✅ |
| Delete functions → void | Todas as funções delete retornam void (204) | ✅ |
| restoreMutation | Adicionado em todas as list pages | ✅ |
| Error handling | onError usa `unknown` ao invés de `any` | ✅ |

---

## Gaps remanescentes

- ~~Backend precisa expandir validação de soft delete para templates (Fase 8)~~ ✅ Concluído
- ~~Frontend precisa expandir CHILD_NAV no DeactivationBlockedModal quando backend implementar~~ ✅ Concluído

Todos os gaps da Fase 8 foram resolvidos em 23/02/2026.
