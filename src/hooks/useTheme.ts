import { useEffect } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'clavedash.theme'

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

export function resolveInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return 'dark'
    const parsed = JSON.parse(raw) as unknown
    return isThemeMode(parsed) ? parsed : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

export function useTheme() {
  const [theme, setTheme] = usePersistedState<ThemeMode>({
    storage: 'local',
    key: THEME_STORAGE_KEY,
    initialValue: resolveInitialTheme(),
  })

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return { theme, setTheme, toggleTheme }
}
