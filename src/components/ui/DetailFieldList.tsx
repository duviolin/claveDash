interface DetailFieldItem {
  label: string
  value: string
}

interface DetailFieldListProps {
  items: DetailFieldItem[]
}

export function DetailFieldList({ items }: DetailFieldListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs uppercase tracking-wide text-muted">{item.label}</p>
          <p className="mt-1 text-text">{item.value || '—'}</p>
        </div>
      ))}
    </div>
  )
}
