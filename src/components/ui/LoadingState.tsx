import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  className?: string
  text?: string
}

export function LoadingState({ className, text }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 p-8 text-muted', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-accent" />
      {text ? <span className="text-sm">{text}</span> : null}
    </div>
  )
}
