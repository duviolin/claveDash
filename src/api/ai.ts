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

  parts.push(`\nRetorne APENAS um JSON array, sem markdown, no formato:`)
  parts.push(`[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]`)

  const prompt = parts.join('\n')
  return generateWithAI(prompt, 'Você gera quizzes educacionais de música e teatro. Use o contexto fornecido para criar questões assertivas e relevantes. Retorne APENAS JSON válido, sem blocos de código markdown.')
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

export async function generateStudyNotes(context: { title: string; estimatedMinutes?: number }): Promise<string> {
  const prompt = `Crie notas técnicas para a trilha de estudo "${context.title}"${context.estimatedMinutes ? ` com duração estimada de ${context.estimatedMinutes} minutos` : ''}. Inclua objetivos de aprendizagem, exercícios e dicas.`
  return generateWithAI(prompt)
}
