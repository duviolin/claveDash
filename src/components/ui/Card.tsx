import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CardVariant = 'default' | 'subtle'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: CardVariant
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-surface border-border',
  subtle: 'bg-surface-2/60 border-border',
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  return (
    <div className={cn('rounded-xl border overflow-hidden', variantStyles[variant], className)}>
      {children}
    </div>
  )
}
