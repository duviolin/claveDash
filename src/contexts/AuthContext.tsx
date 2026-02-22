import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { AuthUser, MeResponse, StudentProfile, TeacherProfile } from '@/types'
import * as authApi from '@/api/auth'

interface AuthContextType {
  user: AuthUser | null
  profile: StudentProfile | TeacherProfile | null
  userContext: MeResponse['context'] | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithToken: (token: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('clave_user')
    return stored ? JSON.parse(stored) : null
  })
  const [profile, setProfile] = useState<StudentProfile | TeacherProfile | null>(null)
  const [userContext, setUserContext] = useState<MeResponse['context'] | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('clave_token'))
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.getMe()
      setUser(me.user)
      setProfile(me.profile)
      setUserContext(me.context)
      localStorage.setItem('clave_user', JSON.stringify(me.user))
    } catch {
      setUser(null)
      setProfile(null)
      setUserContext(null)
      setToken(null)
      localStorage.removeItem('clave_token')
      localStorage.removeItem('clave_user')
    }
  }, [])

  // Sync with auth API on token change; loading cleared when done
  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loading cleared after async auth sync
      refreshUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token, refreshUser])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    setToken(response.token)
    setUser(response.user)
    localStorage.setItem('clave_token', response.token)
    localStorage.setItem('clave_user', JSON.stringify(response.user))
  }

  const loginWithToken = async (newToken: string) => {
    localStorage.setItem('clave_token', newToken)
    setToken(newToken)
    const me = await authApi.getMe()
    setUser(me.user)
    setProfile(me.profile)
    setUserContext(me.context)
    localStorage.setItem('clave_user', JSON.stringify(me.user))
  }

  const logout = () => {
    setUser(null)
    setProfile(null)
    setUserContext(null)
    setToken(null)
    localStorage.removeItem('clave_token')
    localStorage.removeItem('clave_user')
  }

  return (
    <AuthContext.Provider value={{ user, profile, userContext, token, isLoading, login, loginWithToken, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Context consumer hook - same file as provider is standard for React Context
/* eslint-disable-next-line react-refresh/only-export-components */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
