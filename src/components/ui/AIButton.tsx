import { useState } from 'react'
import { Sparkles, Loader2, RotateCcw, Check } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'
import { cn } from '@/lib/utils'

interface AIButtonProps {
  /** Função de geração. Recebe opcionalmente o texto extra do usuário quando extraInputLabel está definido. */
  onGenerate: (userExtra?: string) => Promise<string>
  onAccept: (value: string) => void
  label?: string
  className?: string
  /** Se definido, exibe textarea para o usuário fornecer instruções extras antes de gerar */
  extraInputLabel?: string
  extraInputPlaceholder?: string
}

export function AIButton({ onGenerate, onAccept, label = 'Gerar com IA', className, extraInputLabel, extraInputPlaceholder = 'Ex.: foco em teoria musical, dificuldade intermediária...' }: AIButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [userExtra, setUserExtra] = useState('')

  const handleOpen = () => {
    setIsOpen(true)
    setError('')
    setResult('')
    setUserExtra('')
    handleGenerate('')
  }

  const handleGenerate = async (extra?: string) => {
    setIsLoading(true)
    setError('')
    setResult('')
    try {
      const generated = await onGenerate((extra ?? userExtra) || undefined)
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

  const handleClose = () => {
    setIsOpen(false)
    setResult('')
    setError('')
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors cursor-pointer border border-accent/30',
          className
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Assistente IA"
        size="lg"
        footer={
          result ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
              <Button variant="ghost" size="sm" onClick={() => handleGenerate(userExtra || undefined)} disabled={isLoading}>
                <RotateCcw className="h-3.5 w-3.5" /> Regenerar
              </Button>
              <Button onClick={handleAccept}>
                <Check className="h-3.5 w-3.5" /> Usar este
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleGenerate(userExtra || undefined)} disabled={isLoading}>
                <RotateCcw className="h-3.5 w-3.5" /> Regenerar
              </Button>
              <Button variant="secondary" onClick={handleClose}>Fechar</Button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          {extraInputLabel && (
            <div>
              <label htmlFor="ai-extra-input" className="block text-sm font-medium text-text mb-1">{extraInputLabel}</label>
              <textarea
                id="ai-extra-input"
                value={userExtra}
                onChange={(e) => setUserExtra(e.target.value)}
                placeholder={extraInputPlaceholder}
                rows={3}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando conteúdo...
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}

          {result && !isLoading && (
            <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-surface-2 p-4 text-sm text-text whitespace-pre-wrap font-mono">
              {result}
            </div>
          )}

          {!isLoading && !error && !result && (
            <p className="text-sm text-muted py-4">Nenhum conteúdo gerado. Clique em Regenerar para tentar novamente.</p>
          )}
        </div>
      </Modal>
    </>
  )
}
