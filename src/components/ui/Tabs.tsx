import { cn } from '@/lib/utils'

interface Tab {
  key: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeKey: string
  onChange: (key: string) => void
}

export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-1 rounded-lg bg-surface-2 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer sm:px-4',
              activeKey === tab.key
                ? 'bg-accent text-white'
                : 'text-muted hover:text-text hover:bg-surface'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
