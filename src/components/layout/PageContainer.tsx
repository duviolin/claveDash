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
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <h1 className="min-w-0 flex flex-1 items-baseline gap-2 text-xl font-bold text-text sm:text-2xl">
          {isStringTitle ? (
            <span className="min-w-0 truncate" title={title}>
              {title}
            </span>
          ) : (
            title
          )}
          {count !== undefined && (
            <span className="shrink-0 text-base font-normal text-muted sm:text-lg">({count})</span>
          )}
        </h1>
        <div className="w-full shrink-0 sm:w-auto">{action}</div>
      </div>
      {children}
    </div>
  )
}
