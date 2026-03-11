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
    <nav className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Paginação">
      <span className="text-sm text-muted">
        Página {page} de {totalPages}
        {total != null && ` (${total} no total)`}
      </span>
      <div className="flex w-full gap-2 sm:w-auto">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="flex-1 sm:flex-none"
          aria-label="Ir para página anterior"
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex-1 sm:flex-none"
          aria-label="Ir para próxima página"
        >
          Próximo
        </Button>
      </div>
    </nav>
  )
}
