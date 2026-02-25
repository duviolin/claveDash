# Clave Admin Portal

Portal administrativo da plataforma **Clave** — educação musical gamificada.

## Stack

- **React 19** + **Vite 7** (SPA com TypeScript)
- **Tailwind CSS 4** (tema escuro customizado)
- **React Router 7** (roteamento client-side)
- **@tanstack/react-query** (data fetching + cache)
- **useState** (estado local de formulários)
- **Lucide React** (ícones)
- **react-hot-toast** (notificações)
- **Axios** (HTTP client com interceptors JWT)
- **OpenAI API** (assistente IA para gerar conteúdo)

## Setup

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env com sua API URL e OpenAI key
# VITE_API_URL=http://localhost:3000
# VITE_OPENAI_API_KEY=sk-your-key
# VITE_OPENAI_MODEL=gpt-4o-mini

# Iniciar dev server
npm run dev
```

O portal roda em `http://localhost:5173` e conecta ao backend em `http://localhost:3000`.

## Funcionalidades

- **Autenticação**: Login, primeiro acesso (troca de senha), JWT
- **Gestão de Usuários**: CRUD completo com filtro por role e busca
- **Escolas**: CRUD com vínculo de diretor
- **Cursos**: CRUD filtrado por escola (MUSIC/THEATER)
- **Semestres**: CRUD filtrado por curso com datas e status
- **Turmas**: CRUD com vínculo de professores e matrícula de alunos
- **Templates de Projeto**: CRUD hierárquico (Projeto > Faixas > Materiais > Trilhas > Quizzes)
- **Aptidão de Publicação**: Progress bar por template com score, status e dicas do que falta
- **Análise Qualitativa de Publicação**: diagnóstico curto com IA, salvo por template/versão
- **Missões Diárias**: Templates com quizzes embutidos
- **Instanciação**: Criar projetos a partir de templates para turmas/semestres
- **Storage**: Upload com presigned URLs (R2), gestão de órfãos
- **IA**: Assistente OpenAI para gerar quizzes, descrições e conteúdo
- **Dashboard**: Métricas resumidas da plataforma

## Estrutura

```
src/
├── api/            # Camada de requisições HTTP por domínio
├── components/
│   ├── ui/         # Componentes genéricos (Button, Input, Modal, Table, etc.)
│   └── layout/     # Sidebar, Header, PageContainer, AppLayout
├── contexts/       # AuthContext
├── lib/            # Utilitários (cn, formatDate, etc.)
├── pages/          # Páginas organizadas por domínio
├── types/          # TypeScript types espelhando o backend
└── routes.tsx      # Definição de rotas
```

## Aptidão de Publicação (Project Template Readiness)

Na tela de detalhe de template (`/templates/projects/:slug`) existe um card de aptidão que mostra:

- **Score (%):** progresso calculado no backend com base nas regras ativas
- **Status:** `Nao pronto`, `Quase pronto` ou `Apto para publicacao`
- **Checklist visual:** quantidades atuais de faixas, quizzes, materiais e trilhas
- **Dicas automáticas:** frases objetivas do que falta para publicar

### Critérios configuráveis (somente ADMIN)

No detalhe do template, admins podem abrir **"Critérios de Publicação"** e editar:

- título da regra
- meta mínima (`targetValue`)
- peso no score (`weight`)
- ativo/inativo (`isActive`)

As regras são persistidas no backend e o card de aptidão é recalculado após salvar.

### Endpoints usados pelo frontend

- `GET /project-template-readiness/:idOrSlug`
- `GET /project-template-readiness/rules`
- `PATCH /project-template-readiness/rules/:ruleId` (**somente ADMIN**)
- `GET /project-template-readiness/:idOrSlug/qualitative-analysis`
- `PUT /project-template-readiness/:idOrSlug/qualitative-analysis`
