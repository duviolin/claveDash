# Mapa de Nomenclatura — Clave Dashboard

Este documento consolida os nomes de domínio do Clave para padronizar a UI do dashboard sem quebrar contrato técnico de API.

## Princípios

- Código/DTO/rotas continuam com nomes técnicos (`student`, `teacher`, `school`, etc.).
- A UI usa a linguagem de produto (carreira artística gamificada).
- Quando houver dois contextos (Música e Teatro), usamos:
  - nome genérico na UI principal;
  - variação específica quando o contexto do curso/tipo estiver explícito.

## Mapeamento principal (dashboard)

| Técnico (backend/front) | UI recomendada (genérica) | Música | Teatro | Observação |
|---|---|---|---|---|
| User | Pessoa da equipe | Pessoa da equipe | Pessoa da equipe | Entidade de autenticação e acesso |
| STUDENT / student / aluno | Artista | Artista | Ator/Atriz | Termo central da experiência |
| TEACHER / teacher / professor | Produtor | Produtor Musical | Diretor Artístico | Pode variar por curso |
| DIRECTOR / diretor | Diretor da unidade | Diretor da Gravadora | Diretor da Companhia | Papel de gestão local (escola) |
| ADMIN / admin | Administrador | Administrador | Administrador | Gestão global da plataforma |
| School / school / escola | Unidade artística | Gravadora | Companhia Teatral | Estrutura de topo |
| Course / course / curso | Núcleo artístico | Selo | Companhia | Recomenda-se este nível para Música/Teatro |
| Season / season / semestre | Temporada | Temporada | Temporada | Já definido nas docs |
| Class / class / turma | Turma | Turma | Turma | Pode manter "Turma" no admin |
| ProjectTemplate | Template de projeto | Template de álbum | Template de peça | Conteúdo reutilizável |
| Project | Projeto da temporada | Álbum | Peça | Instância do template |
| TrackScene / TrackSceneTemplate | Faixa/Cena | Faixa | Cena | Unidade de estudo do projeto |
| StudyTrack / StudyTrackTemplate | Trilha de estudo | Trilha de estudo | Trilha de estudo | Apoio guiado |
| TrackMaterial / TrackMaterialTemplate | Material de apoio | Material de apoio | Material de apoio | PDF, vídeo, áudio, texto, link |
| Submission / demo | Demo | Demo | Demo | Envio de performance |
| PressQuiz / PressQuizTemplate / quiz | Coletiva de imprensa | Coletiva de imprensa | Coletiva de imprensa | "Quiz" pode aparecer só em contexto técnico |
| DailyMission | Rotina diária | Passagem de som | Aquecimento | Missão diária do artista |
| DailyMissionQuiz | Quiz da rotina | Quiz da passagem de som | Quiz do aquecimento | Nome secundário |
| Career | Carreira | Carreira | Carreira | Perfil de progresso |
| Fans | Fãs | Fãs | Fãs | Pontuação principal |
| Tour | Turnê | Turnê | Turnê | Consistência semanal |
| Streak | Sequência | Sequência | Sequência | Dias consecutivos |
| Home (student) / Palco | Palco | Palco | Palco | Hub do artista |
| Studio | Estúdio | Estúdio | Estúdio | Gravação e envio de demo |
| Review / feedback | Feedback | Feedback | Feedback | Avaliação do produtor |

## Mapeamento solicitado (atalho)

- aluno -> artista
- professor -> produtor
- diretor -> diretor da unidade
- escola -> gravadora (ou companhia teatral, conforme contexto)
- quiz do projeto -> coletiva de imprensa
- semestre -> temporada

## Recomendações para termos ainda ambíguos

### `curso`

Opções avaliadas:

- `Selo` (forte para Música, já aparece nas docs)
- `Companhia` (forte para Teatro, já aparece nas docs)
- `Núcleo artístico` (genérico para UI global)

Recomendação prática:

- Tela genérica/mista: **Núcleo artístico**
- Quando `type=MUSIC`: **Selo**
- Quando `type=THEATER`: **Companhia**

### `diretor` (role `DIRECTOR`)

Como `TEACHER` já vira Produtor/Diretor Artístico, para evitar conflito a melhor opção é:

- **Diretor da unidade** (genérico)
- variações: **Diretor da Gravadora** / **Diretor da Companhia**

## Regras de implementação no dash

- Alterar apenas labels/textos da UI.
- Não renomear chaves técnicas de API, tipos e enums.

## Fontes consultadas

- `claveBack/docs/FEATURES.md` (visão de produto e equivalências)
- `claveBack/README.md` (resumo e docs oficiais)
- `claveBack/src/domain/event/EventTypes.ts` (vocabulário técnico completo de eventos)
