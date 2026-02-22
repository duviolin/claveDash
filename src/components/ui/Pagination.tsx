import { Button } from '@/components/ui/Button'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  total?: number
}

export function Pagination({ page, totalPages, onPageChange, total }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <span className="text-sm text-muted">
        Página {page} de {totalPages}
        {total != null && ` (${total} no total)`}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}
