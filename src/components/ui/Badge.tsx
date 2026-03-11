import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'accent'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-2 text-muted border-border',
  success: 'bg-surface-2 text-success-strong border-success/35',
  error: 'bg-surface-2 text-error-strong border-error/35',
  warning: 'bg-surface-2 text-warning-strong border-warning/35',
  info: 'bg-surface-2 text-info-strong border-info/35',
  accent: 'bg-surface-2 text-accent-strong border-accent/35',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
