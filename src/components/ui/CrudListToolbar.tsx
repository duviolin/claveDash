import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CrudListToolbarProps {
  primary: ReactNode
  secondary?: ReactNode
  className?: string
}

export function CrudListToolbar({ primary, secondary, className }: CrudListToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between', className)}>
      <div className="min-w-0">{primary}</div>
      {secondary ? <div className="w-full sm:w-auto">{secondary}</div> : null}
    </div>
  )
}
