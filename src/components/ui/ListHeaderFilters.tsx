import type { ReactNode } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface ListHeaderFiltersProps {
  projectValue: string
  onProjectChange: (value: string) => void
  projectOptions: Array<{ value: string; label: string }>
  projectPlaceholder?: string
  trackValue?: string
  onTrackChange?: (value: string) => void
  trackOptions?: Array<{ value: string; label: string }>
  showTrackFilter?: boolean
  trackPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  searchDisabled?: boolean
  children?: ReactNode
}

export function ListHeaderFilters({
  projectValue,
  onProjectChange,
  projectOptions,
  projectPlaceholder = 'Todos os projetos',
  trackValue = '',
  onTrackChange,
  trackOptions = [],
  showTrackFilter = false,
  trackPlaceholder = 'Todas as faixas',
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchDisabled = false,
  children,
}: ListHeaderFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
      <Select
        value={projectValue}
        onChange={(event) => onProjectChange(event.target.value)}
        placeholder={projectPlaceholder}
        options={projectOptions}
        className="w-full md:min-w-[240px]"
      />
      {showTrackFilter && (
        <Select
          value={trackValue}
          onChange={(event) => onTrackChange?.(event.target.value)}
          placeholder={trackPlaceholder}
          options={trackOptions}
          className="w-full md:min-w-[240px]"
        />
      )}
      <Input
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="w-full md:min-w-[240px]"
        disabled={searchDisabled}
      />
      {children}
    </div>
  )
}
