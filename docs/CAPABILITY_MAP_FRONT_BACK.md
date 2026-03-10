# Mapa de Capacidade Atual (Front + Back)

Legenda de status:
- Pronto: implementado e em uso.
- Parcial: existe base funcional, mas faltam blocos importantes.
- Faltando: nao implementado ou sem definicao executavel.

| Dominio | Front (claveDash) | Back (claveBack) | Status consolidado |
|---|---|---|---|
| Autenticacao e perfis | Login, primeiro acesso e sessao admin em producao | JWT, auth e endpoints de conta ativos | Pronto |
| Estrutura academica (usuarios, escolas, cursos, semestres, turmas) | CRUDs administrativos operacionais | CRUDs e regras de acesso implementados | Pronto |
| Templates pedagogicos | Fluxo de listagem/detalhe e CRUD principal ativo | Dominio e rotas de templates presentes | Pronto |
| Instanciacao de projetos | Tela e integracao presentes, mas com validacoes e UX incompletas | Fluxo principal existe, mas sem garantias fortes de consistencia entre template/turma/semestre | Parcial |
| Storage e midia | Upload e vinculo de midia no dashboard | R2/presigned e modulos de storage operacionais | Pronto |
| Readiness de publicacao | Card, regras e edicao admin no detalhe do template | Servico/read model/endpoints de readiness implementados | Pronto |
| Qualidade tecnica (testes, CI/CD) | Build/lint usados na rotina local | Testes iniciais existentes, cobertura e pipeline ainda insuficientes | Parcial |
| Governanca documental para Dashboard | Nova base criada, mas ainda com arquivos antigos misturados | Roadmap atualizado, mas precisava simplificar foco de execucao | Parcial |

## Leitura rapida

- O core administrativo e de conteudo esta maduro.
- Instanciacao ainda nao esta madura para fechamento do Dashboard.
- O principal risco agora e dispersao de foco por documentacao historica e backlog sem recorte de escopo.
