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
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export async function generateQuiz(context: { title: string; description?: string; count?: number }): Promise<string> {
  const prompt = `Gere ${context.count || 5} questões de múltipla escolha sobre "${context.title}".
${context.description ? `Contexto: ${context.description}` : ''}

Retorne APENAS um JSON array, sem markdown, no formato:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]`

  return generateWithAI(prompt, 'Você gera quizzes educacionais de música. Retorne APENAS JSON válido, sem blocos de código markdown.')
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
