import { api } from './client'
import type { User } from '@/types'

interface LoginResponse {
  token: string
  user: User
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export async function firstAccess(email: string, currentPassword: string, newPassword: string) {
  const { data } = await api.post('/auth/first-access', {
    email,
    temporaryPassword: currentPassword,
    newPassword,
  })
  return data
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}
