import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type IconButtonVariant = 'default' | 'danger' | 'success'
type IconButtonSize = 'sm' | 'md'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: IconButtonVariant
  size?: IconButtonSize
  children?: ReactNode
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: 'text-muted hover:bg-surface-2 hover:text-text',
  danger: 'text-muted hover:bg-error/10 hover:text-error',
  success: 'text-muted hover:bg-success/10 hover:text-success',
}

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'p-1',
  md: 'p-1.5',
}

export function IconButton({
  icon,
  label,
  variant = 'default',
  size = 'md',
  children,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon}
      {children ? <span className="text-xs">{children}</span> : null}
    </button>
  )
}
