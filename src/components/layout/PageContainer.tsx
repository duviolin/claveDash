import type { ReactNode } from 'react'

interface PageContainerProps {
  title: ReactNode
  count?: number
  action?: ReactNode
  children: ReactNode
}

export function PageContainer({ title, count, action, children }: PageContainerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">
          {title}
          {count !== undefined && (
            <span className="ml-2 text-lg font-normal text-muted">({count})</span>
          )}
        </h1>
        {action}
      </div>
      {children}
    </div>
  )
}
