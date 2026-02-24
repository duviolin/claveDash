# Débitos Técnicos — claveDash & claveBack

**Data:** 24/02/2026  
**Referência:** Auditoria pente fino + ROADMAP backend

---

## Status após refatoração 24/02/2026

### Frontend (claveDash) — Corrigidos

| # | Item | Status |
|---|------|--------|
| 1 | UsersListPage: DeactivationBlockedModal para 409 | ✅ Corrigido |
| 2 | classes.ts: removeTeacher/removeStudent destructuring incorreto (DELETE 204) | ✅ Corrigido |
| 3 | DailyMissionTemplatesPage: filtro courseFilter obrigatório | ✅ Corrigido (enabled: !isTrash) |
| 4 | client.ts: console.error em produção | ✅ Corrigido (apenas em DEV) |
| 5 | IA contextualizada: quiz com projeto, faixas, materiais + campo extras | ✅ Implementado |

### Backend (claveBack) — Status 24/02/2026

| # | Item | Status |
|---|------|--------|
| D3 | Sem testes em nenhuma camada (Fase 7) | ✅ Vitest configurado, 2 testes iniciais |
| D20 | Padronizar propriedades (private readonly + getters) em entidades | ⏳ Pendente |
| - | error: any em controllers → error: unknown | ✅ Corrigido |
| - | questionsJson/answersJson tipados | ✅ QuizQuestion type + entidades tipadas |

---

## IA Contextualizada (implementado)

### O que foi feito

1. **generateQuiz** em `src/api/ai.ts`:
   - Interface `QuizGenerationContext` com: project, track, materials, studyTracks, userExtra
   - Prompt enriquecido com contexto do projeto, faixa, materiais e trilhas
   - Campo `userExtra` para instruções específicas do usuário

2. **AIButton** em `src/components/ui/AIButton.tsx`:
   - Props `extraInputLabel` e `extraInputPlaceholder`
   - Textarea opcional para o usuário fornecer instruções extras
   - `onGenerate` recebe `(userExtra?: string)`

3. **ProjectTemplateDetailPage**:
   - Passa template, track, materials, studyTracks para generateQuiz
   - Busca materials e studyTracks quando modal de quiz abre

4. **DailyMissionTemplatesPage**:
   - Passa mission (título) como contexto
   - Campo de instruções extras disponível

---

## Recomendações futuras

- Remover ou documentar `deleteFile` em storage.ts se for código morto
- Backend: migrar `error: any` para `error: unknown` nos controllers
- Backend: Fase 7 (testes) e D20 (padronização de entidades)
