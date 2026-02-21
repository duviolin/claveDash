import { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, RotateCcw, Check, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface AIButtonProps {
  onGenerate: () => Promise<string>
  onAccept: (value: string) => void
  label?: string
  className?: string
}

export function AIButton({ onGenerate, onAccept, label = 'Gerar com IA', className }: AIButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleGenerate = async () => {
    setIsLoading(true)
    setError('')
    setResult('')
    try {
      const generated = await onGenerate()
      setResult(generated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar conteúdo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = () => {
    onAccept(result)
    setIsOpen(false)
    setResult('')
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) handleGenerate() }}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors cursor-pointer border border-accent/30"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 z-50 mt-2 w-96 rounded-xl border border-border bg-surface shadow-2xl"
        >
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-text flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" /> Assistente IA
            </span>
            <button onClick={() => setIsOpen(false)} className="text-muted hover:text-text cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando conteúdo...
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-sm text-error">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-3">
                <div className="max-h-60 overflow-y-auto rounded-lg bg-surface-2 p-3 text-sm text-text whitespace-pre-wrap">
                  {result}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={handleGenerate}>
                    <RotateCcw className="h-3.5 w-3.5" /> Regenerar
                  </Button>
                  <Button size="sm" onClick={handleAccept}>
                    <Check className="h-3.5 w-3.5" /> Usar este
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
