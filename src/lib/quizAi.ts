import type { QuizQuestion } from '@/types'

/**
 * Normaliza e valida o retorno da IA para 1 pergunta de quiz.
 * Aceita objeto único ou array com 1 item.
 */
export function parseAIQuizQuestion(raw: string): QuizQuestion {
  const parsed = JSON.parse(raw)
  const candidate = Array.isArray(parsed) ? parsed[0] : parsed

  const question = String(candidate?.question ?? '').trim()
  const optionsRaw = Array.isArray(candidate?.options) ? candidate.options : []
  const options = optionsRaw.slice(0, 4).map((opt: unknown) => String(opt ?? '').trim())
  const correctIndex = Number(candidate?.correctIndex)

  const hasValidShape =
    Boolean(question) &&
    options.length === 4 &&
    options.every((opt: string) => Boolean(opt)) &&
    !Number.isNaN(correctIndex) &&
    correctIndex >= 0 &&
    correctIndex <= 3

  if (!hasValidShape) {
    throw new Error('Formato inválido')
  }

  return { question, options, correctIndex }
}
