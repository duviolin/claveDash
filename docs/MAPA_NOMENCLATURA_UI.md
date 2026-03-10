# Mapa de Nomenclatura UI (Dashboard)

Este documento padroniza termos de interface sem quebrar nomes tecnicos de API e tipos.

## Principios

- DTOs, rotas e entidades continuam com nomenclatura tecnica (`student`, `teacher`, etc.).
- A interface usa linguagem de produto, conforme contexto (musica/teatro).
- Quando o contexto nao estiver explicito, usar termo generico.

## Mapeamento principal

| Tecnico | UI generica | Musica | Teatro |
|---|---|---|---|
| student | Artista | Artista | Ator/Atriz |
| teacher | Produtor | Produtor Musical | Diretor Artistico |
| director | Diretor da unidade | Diretor da Gravadora | Diretor da Companhia |
| school | Unidade artistica | Gravadora | Companhia Teatral |
| course | Nucleo artistico | Selo | Companhia |
| season | Temporada | Temporada | Temporada |
| class | Turma | Turma | Turma |
| project template | Template de projeto | Template de album | Template de peca |
| project | Projeto da temporada | Album | Peca |
| press quiz | Coletiva de imprensa | Coletiva de imprensa | Coletiva de imprensa |

## Regras de implementacao

- Alterar apenas labels e textos de UI.
- Nao renomear chaves tecnicas de API, enums e tipos.
