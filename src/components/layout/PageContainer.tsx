import type { ReactNode } from 'react'

interface PageContainerProps {
  title: ReactNode
  count?: number
  action?: ReactNode
  children: ReactNode
}

export function PageContainer({ title, count, action, children }: PageContainerProps) {
  const isStringTitle = typeof title === 'string'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 flex flex-1 items-baseline gap-2 text-2xl font-bold text-text">
          {isStringTitle ? (
            <span className="min-w-0 truncate" title={title}>
              {title}
            </span>
          ) : (
            title
          )}
          {count !== undefined && (
            <span className="shrink-0 text-lg font-normal text-muted">({count})</span>
          )}
        </h1>
        <div className="shrink-0">{action}</div>
      </div>
      {children}
    </div>
  )
}
