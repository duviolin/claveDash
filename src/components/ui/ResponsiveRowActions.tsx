import type { ReactNode } from 'react'
import { useRef } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/utils'

type ResponsiveRowActionVariant = 'default' | 'danger' | 'success'

interface ResponsiveRowAction {
  key: string
  label: string
  icon: ReactNode
  onClick: () => void
  variant?: ResponsiveRowActionVariant
  disabled?: boolean
}

interface ResponsiveRowActionsProps {
  actions: ResponsiveRowAction[]
  className?: string
  desktopClassName?: string
}

export function ResponsiveRowActions({
  actions,
  className,
  desktopClassName,
}: ResponsiveRowActionsProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  const handleActionClick = (onClick: () => void) => {
    onClick()
    if (detailsRef.current) {
      detailsRef.current.open = false
    }
  }

  return (
    <div className={cn('flex items-center justify-end', className)}>
      <div className={cn('hidden items-center justify-end gap-1 sm:flex', desktopClassName)}>
        {actions.map((action) => (
          <IconButton
            key={action.key}
            label={action.label}
            icon={action.icon}
            onClick={action.onClick}
            variant={action.variant}
            disabled={action.disabled}
          />
        ))}
      </div>

      <details ref={detailsRef} className="relative sm:hidden">
        <summary className="list-none">
          <IconButton
            label="Abrir ações"
            icon={<MoreHorizontal className="h-4 w-4" />}
          />
        </summary>
        <div className="absolute right-0 top-10 z-20 min-w-44 rounded-lg border border-border bg-surface p-1 shadow-overlay">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text transition-colors hover:bg-surface-2 disabled:opacity-50',
                action.variant === 'danger' && 'text-error',
                action.variant === 'success' && 'text-success'
              )}
              onClick={() => handleActionClick(action.onClick)}
              disabled={action.disabled}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </details>
    </div>
  )
}
