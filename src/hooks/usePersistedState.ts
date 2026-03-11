import { useEffect, useState } from 'react'

type PersistStorage = 'local' | 'session'

interface UsePersistedStateOptions<T> {
  storage: PersistStorage
  key: string
  initialValue: T
}

function getStorage(storage: PersistStorage): Storage | null {
  if (typeof window === 'undefined') return null
  return storage === 'local' ? window.localStorage : window.sessionStorage
}

export function usePersistedState<T>({ storage, key, initialValue }: UsePersistedStateOptions<T>) {
  const [value, setValue] = useState<T>(() => {
    const targetStorage = getStorage(storage)
    if (!targetStorage) return initialValue

    try {
      const raw = targetStorage.getItem(key)
      if (!raw) return initialValue
      return JSON.parse(raw) as T
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    const targetStorage = getStorage(storage)
    if (!targetStorage) return

    try {
      targetStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage failures to avoid breaking UI interactions.
    }
  }, [key, storage, value])

  return [value, setValue] as const
}
