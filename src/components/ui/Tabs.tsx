import type { KeyboardEvent } from 'react'
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
  const activeIndex = tabs.findIndex((tab) => tab.key === activeKey)

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!tabs.length) return

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const nextIndex = (index + 1) % tabs.length
      onChange(tabs[nextIndex].key)
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const prevIndex = (index - 1 + tabs.length) % tabs.length
      onChange(tabs[prevIndex].key)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      onChange(tabs[0].key)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      onChange(tabs[tabs.length - 1].key)
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-1 rounded-lg bg-surface-2 p-1" role="tablist" aria-label="Abas de conteúdo">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={activeKey === tab.key}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer sm:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
              activeKey === tab.key
                ? 'bg-accent text-on-accent'
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
