# Clave Admin Portal

Portal administrativo da plataforma **Clave** — educação musical gamificada.

## Stack

- **React 19** + **Vite 7** (SPA com TypeScript)
- **Tailwind CSS 4** (tema escuro customizado)
- **React Router 7** (roteamento client-side)
- **@tanstack/react-query** (data fetching + cache)
- **react-hook-form** + **zod** (formulários + validação)
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
- **Missões Diárias**: Templates com quizzes embutidos
- **Categorias de Trilha**: Gestão por curso
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
