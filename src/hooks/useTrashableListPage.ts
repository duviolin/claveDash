import { useState } from 'react'

interface UseTrashableListPageOptions {
  defaultTab?: string
  defaultPage?: number
}

export function useTrashableListPage(options: UseTrashableListPageOptions = {}) {
  const { defaultTab = 'active', defaultPage = 1 } = options
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [page, setPage] = useState(defaultPage)

  const isTrash = activeTab === 'TRASH'

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab)
    setPage(1)
  }

  return {
    activeTab,
    setActiveTab,
    isTrash,
    page,
    setPage,
    handleTabChange,
  }
}
