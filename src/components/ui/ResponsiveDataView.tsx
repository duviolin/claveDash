import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { Table } from '@/components/ui/Table'

interface ResponsiveDataViewColumn<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
}

interface ResponsiveDataViewProps<T> {
  columns: ResponsiveDataViewColumn<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  mobileCardRender: (item: T) => ReactNode
  emptyMessage?: string
  isLoading?: boolean
  tableMinWidthClassName?: string
}

export function ResponsiveDataView<T>({
  columns,
  data,
  keyExtractor,
  mobileCardRender,
  emptyMessage = 'Nenhum registro encontrado',
  isLoading = false,
  tableMinWidthClassName,
}: ResponsiveDataViewProps<T>) {
  if (isLoading) {
    return (
      <Card>
        <LoadingState />
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <div className="px-4 py-8 text-center text-sm text-muted">{emptyMessage}</div>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {data.map((item) => (
          <Card key={keyExtractor(item)}>
            {mobileCardRender(item)}
          </Card>
        ))}
      </div>
      <div className="hidden md:block">
        <Table
          columns={columns}
          data={data}
          keyExtractor={keyExtractor}
          emptyMessage={emptyMessage}
          minWidthClassName={tableMinWidthClassName}
        />
      </div>
    </>
  )
}
