const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export async function generateWithAI(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'

  if (!apiKey || apiKey === 'sk-change-me') {
    throw new Error('Configure VITE_OPENAI_API_KEY no arquivo .env')
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'Você é um assistente especializado em educação musical. Responda em português do Brasil.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    let msg = `OpenAI API error: ${response.status}`
    try {
      const parsed = JSON.parse(errBody)
      if (parsed.error?.message) msg = parsed.error.message
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (content == null || String(content).trim() === '') {
    const reason = data.choices?.[0]?.finish_reason || 'unknown'
    throw new Error(`A IA não retornou conteúdo (finish_reason: ${reason}). Tente novamente.`)
  }
  return String(content).trim()
}

/** Contexto rico para geração de quiz com IA */
export interface QuizGenerationContext {
  title: string
  description?: string
  count?: number
  /** Nome e descrição do projeto (template) */
  project?: { name: string; type?: string; description?: string | null }
  /** Faixa atual (título, artista, descrição, instrução técnica, letra) */
  track?: {
    title: string
    artist?: string | null
    description?: string | null
    technicalInstruction?: string | null
    lyrics?: string | null
  }
  /** Materiais didáticos da faixa (título e tipo) */
  materials?: Array<{ title: string; type: string }>
  /** Trilhas de estudo da faixa (título, descrição, notas técnicas) */
  studyTracks?: Array<{ title: string; description?: string | null; technicalNotes?: string | null }>
  /** Informações extras fornecidas pelo usuário */
  userExtra?: string
  /** Perguntas já existentes para evitar repetição e manter progressão */
  existingQuestions?: Array<{ question: string; options: string[]; correctIndex: number }>
}

export async function generateQuiz(context: QuizGenerationContext): Promise<string> {
  const parts: string[] = []

  parts.push(`Gere ${context.count || 5} questões de múltipla escolha sobre "${context.title}".`)

  if (context.project) {
    parts.push(`\n## Projeto`)
    parts.push(`- Nome: ${context.project.name}`)
    if (context.project.type) parts.push(`- Tipo: ${context.project.type === 'ALBUM' ? 'álbum musical' : 'peça teatral'}`)
    if (context.project.description) parts.push(`- Descrição: ${context.project.description}`)
  }

  if (context.track) {
    parts.push(`\n## Faixa atual`)
    parts.push(`- Título: ${context.track.title}`)
    if (context.track.artist) parts.push(`- Artista: ${context.track.artist}`)
    if (context.track.description) parts.push(`- Descrição: ${context.track.description}`)
    if (context.track.technicalInstruction) parts.push(`- Instrução técnica: ${context.track.technicalInstruction}`)
    if (context.track.lyrics) parts.push(`- Letra (trecho): ${context.track.lyrics.slice(0, 500)}${context.track.lyrics.length > 500 ? '...' : ''}`)
  }

  if (context.materials && context.materials.length > 0) {
    parts.push(`\n## Materiais didáticos disponíveis`)
    context.materials.forEach((m) => parts.push(`- ${m.title} (${m.type})`))
  }

  if (context.studyTracks && context.studyTracks.length > 0) {
    parts.push(`\n## Trilhas de estudo da faixa`)
    context.studyTracks.forEach((st) => {
      parts.push(`- ${st.title}`)
      if (st.description) parts.push(`  Descrição: ${st.description}`)
      if (st.technicalNotes) parts.push(`  Notas técnicas: ${st.technicalNotes}`)
    })
  }

  if (context.description) {
    parts.push(`\n## Contexto adicional`)
    parts.push(context.description)
  }

  if (context.userExtra?.trim()) {
    parts.push(`\n## Instruções específicas do usuário`)
    parts.push(context.userExtra.trim())
  }

  if (context.existingQuestions && context.existingQuestions.length > 0) {
    parts.push(`\n## Perguntas já existentes (não repetir)`)
    context.existingQuestions.forEach((q, index) => {
      parts.push(`- ${index + 1}. ${q.question}`)
    })
  }

  parts.push(`\nRetorne APENAS um JSON array, sem markdown, no formato:`)
  parts.push(`[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]`)

  const prompt = parts.join('\n')
  return generateWithAI(prompt, 'Você gera quizzes educacionais de música e teatro. Use o contexto fornecido para criar questões assertivas e relevantes. Retorne APENAS JSON válido, sem blocos de código markdown.')
}

export async function generateQuizQuestion(context: QuizGenerationContext): Promise<string> {
  const parts: string[] = []

  parts.push(`Gere APENAS 1 questão de múltipla escolha sobre "${context.title}".`)

  if (context.project) {
    parts.push(`\n## Projeto`)
    parts.push(`- Nome: ${context.project.name}`)
    if (context.project.type) parts.push(`- Tipo: ${context.project.type === 'ALBUM' ? 'álbum musical' : 'peça teatral'}`)
    if (context.project.description) parts.push(`- Descrição: ${context.project.description}`)
  }

  if (context.track) {
    parts.push(`\n## Faixa atual`)
    parts.push(`- Título: ${context.track.title}`)
    if (context.track.artist) parts.push(`- Artista: ${context.track.artist}`)
    if (context.track.description) parts.push(`- Descrição: ${context.track.description}`)
    if (context.track.technicalInstruction) parts.push(`- Instrução técnica: ${context.track.technicalInstruction}`)
    if (context.track.lyrics) parts.push(`- Letra (trecho): ${context.track.lyrics.slice(0, 500)}${context.track.lyrics.length > 500 ? '...' : ''}`)
  }

  if (context.materials && context.materials.length > 0) {
    parts.push(`\n## Materiais didáticos disponíveis`)
    context.materials.forEach((m) => parts.push(`- ${m.title} (${m.type})`))
  }

  if (context.studyTracks && context.studyTracks.length > 0) {
    parts.push(`\n## Trilhas de estudo da faixa`)
    context.studyTracks.forEach((st) => {
      parts.push(`- ${st.title}`)
      if (st.description) parts.push(`  Descrição: ${st.description}`)
      if (st.technicalNotes) parts.push(`  Notas técnicas: ${st.technicalNotes}`)
    })
  }

  if (context.existingQuestions && context.existingQuestions.length > 0) {
    parts.push(`\n## Perguntas já existentes (use como contexto e NÃO repita)`)
    context.existingQuestions.forEach((q, index) => {
      parts.push(`- ${index + 1}. ${q.question}`)
    })
    parts.push(`- Crie uma nova questão complementar, com foco diferente das acima.`)
  }

  if (context.userExtra?.trim()) {
    parts.push(`\n## Instruções específicas do usuário`)
    parts.push(context.userExtra.trim())
  }

  parts.push(`\nRetorne APENAS um JSON object, sem markdown, no formato:`)
  parts.push(`{"question":"...","options":["A","B","C","D"],"correctIndex":0}`)

  const prompt = parts.join('\n')
  return generateWithAI(
    prompt,
    'Você gera uma única questão de quiz educacional, contextualizada, sem repetir questões existentes. Retorne APENAS JSON válido, sem bloco markdown.'
  )
}

export async function generateDescription(context: { name: string; type?: string }): Promise<string> {
  const prompt = `Crie uma descrição envolvente para o projeto "${context.name}"${context.type ? ` do tipo ${context.type === 'ALBUM' ? 'álbum musical' : 'peça teatral'}` : ''}. Máximo 3 parágrafos.`
  return generateWithAI(prompt)
}

export async function generateTechnicalInstruction(context: { title: string; artist?: string }): Promise<string> {
  const prompt = `Escreva instruções técnicas detalhadas para a faixa "${context.title}"${context.artist ? ` do artista "${context.artist}"` : ''}. Inclua dicas de prática, técnicas vocais/instrumentais e pontos de atenção.`
  return generateWithAI(prompt)
}

export async function generateMaterialContent(context: { title: string; courseType?: string }): Promise<string> {
  const prompt = `Crie um texto explicativo sobre "${context.title}" para alunos de ${context.courseType === 'THEATER' ? 'teatro' : 'música'}. Inclua dicas de prática e referências úteis.`
  return generateWithAI(prompt)
}

export async function generateStudyNotes(context: { title: string }): Promise<string> {
  const prompt = `Crie notas técnicas para a trilha de estudo "${context.title}". Inclua objetivos de aprendizagem, exercícios e dicas.`
  return generateWithAI(prompt)
}

export interface PublicationQualitativeAnalysisRule {
  title: string
  description?: string | null
  targetValue: number
  actualValue?: number
  isMet?: boolean
  isActive?: boolean
}

export interface PublicationQualitativeAnalysisContext {
  project: {
    name: string
    type?: string
    description?: string | null
    version?: number
  }
  readiness: {
    scorePercentage: number
    statusLabel: string
    isReady: boolean
    metCount: number
    totalCount: number
    trackCount: number
    quizCount: number
    materialCount: number
    studyTrackCount: number
    missingTips?: string[]
  }
  publicationCriteria: PublicationQualitativeAnalysisRule[]
  userExtra?: string
}

export async function generatePublicationQualitativeAnalysis(context: PublicationQualitativeAnalysisContext): Promise<string> {
  const criteriaLines = context.publicationCriteria
    .filter((rule) => rule.isActive !== false)
    .map((rule) => {
      const target = `Meta: ${rule.targetValue}`
      const actual = typeof rule.actualValue === 'number' ? ` | Atual: ${rule.actualValue}` : ''
      const status = typeof rule.isMet === 'boolean' ? ` | Status: ${rule.isMet ? 'atendido' : 'nao atendido'}` : ''
      const description = rule.description?.trim() ? `\n  - Critério detalhado (editável pelo admin): ${rule.description.trim()}` : ''
      return `- ${rule.title} (${target}${actual}${status})${description}`
    })

  const promptParts: string[] = [
    'Faça uma análise qualitativa curta e direta sobre a aptidão de publicação de um template de projeto educacional.',
    '',
    '## Regras obrigatórias da resposta',
    '- Seja objetivo, com frases curtas e linguagem simples.',
    '- Evite texto longo e repetições.',
    '- Se o projeto não estiver pronto, diga isso de forma clara.',
    '- Traga ações práticas para o próximo passo.',
    '- Escrever em português do Brasil.',
    '',
    '## Projeto',
    `- Nome: ${context.project.name}`,
    `- Tipo: ${context.project.type || 'não informado'}`,
    `- Versão: ${context.project.version ?? 'não informada'}`,
    `- Descrição: ${context.project.description || 'não informada'}`,
    '',
    '## Indicadores de aptidão',
    `- Status: ${context.readiness.statusLabel}`,
    `- Score: ${context.readiness.scorePercentage}%`,
    `- Requisitos atendidos: ${context.readiness.metCount}/${context.readiness.totalCount}`,
    `- Faixas: ${context.readiness.trackCount}`,
    `- Quizzes: ${context.readiness.quizCount}`,
    `- Materiais: ${context.readiness.materialCount}`,
    `- Trilhas de estudo: ${context.readiness.studyTrackCount}`,
    '',
    '## Critérios de publicação ativos (texto editável pelo admin)',
    ...(criteriaLines.length > 0 ? criteriaLines : ['- Nenhum critério ativo informado.']),
  ]

  if (context.readiness.missingTips && context.readiness.missingTips.length > 0) {
    promptParts.push('', '## Pendências detectadas', ...context.readiness.missingTips.map((tip) => `- ${tip}`))
  }

  if (context.userExtra?.trim()) {
    promptParts.push('', '## Instruções adicionais do usuário', context.userExtra.trim())
  }

  promptParts.push(
    '',
    '## Formato obrigatório da resposta',
    '1) Diagnóstico (máximo 2 linhas).',
    '2) Pontos de atenção (máximo 3 bullets).',
    '3) Próximos passos (máximo 3 bullets, priorizados).',
    '4) Veredito final em 1 linha (apto ou não apto no momento).',
    'Resposta total com no máximo 900 caracteres.'
  )

  const prompt = promptParts.join('\n')

  return generateWithAI(
    prompt,
    'Você é um avaliador pedagógico especialista em curadoria de conteúdo educacional. Responda de forma concisa, direta e orientativa.'
  )
}
