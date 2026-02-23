import { Plus, Trash2 } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'
import type { QuizQuestion } from '@/types'

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const

const emptyQuestion = (): QuizQuestion => ({
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0
})

interface QuizBuilderProps {
  value: QuizQuestion[]
  onChange: (questions: QuizQuestion[]) => void
  className?: string
}

export function QuizBuilder({ value, onChange, className }: QuizBuilderProps) {
  const handleAdd = () => {
    onChange([...value, emptyQuestion()])
  }

  const handleRemove = (index: number) => {
    const next = value.filter((_, i) => i !== index)
    onChange(next)
  }

  const handleQuestionChange = (index: number, question: string) => {
    const next = value.map((q, i) => (i === index ? { ...q, question } : q))
    onChange(next)
  }

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    const next = value.map((q, i) => {
      if (i !== qIndex) return q
      const options = [...q.options]
      options[optIndex] = text
      return { ...q, options }
    })
    onChange(next)
  }

  const handleCorrectChange = (qIndex: number, correctIndex: number) => {
    const next = value.map((q, i) => (i === qIndex ? { ...q, correctIndex } : q))
    onChange(next)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {value.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma pergunta adicionada</p>
      ) : (
        value.map((q, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface-2/50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-accent">
                Pergunta {index + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1.5 rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors"
                aria-label="Remover pergunta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={q.question}
              onChange={(e) => handleQuestionChange(index, e.target.value)}
              placeholder="Texto da pergunta"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />

            <div className="space-y-2">
              {OPTION_LETTERS.map((letter, optIndex) => (
                <label
                  key={optIndex}
                  className="flex items-center gap-2"
                >
                  <input
                    type="radio"
                    name={`q-${index}`}
                    checked={q.correctIndex === optIndex}
                    onChange={() => handleCorrectChange(index, optIndex)}
                    className="accent-accent"
                  />
                  <span className="text-xs font-medium text-muted w-4 shrink-0">
                    {letter}:
                  </span>
                  <input
                    type="text"
                    value={q.options[optIndex] ?? ''}
                    onChange={(e) =>
                      handleOptionChange(index, optIndex, e.target.value)
                    }
                    placeholder={`Opção ${letter}`}
                    className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                  />
                </label>
              ))}
            </div>
          </div>
        ))
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAdd}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Adicionar Pergunta
      </Button>
    </div>
  )
}
