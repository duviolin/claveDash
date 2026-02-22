import { api } from './client'
import type { AuthUser, MeResponse } from '@/types'

interface LoginResponse {
  token: string
  user: AuthUser
  mustChangePassword: boolean
}

interface FirstAccessResponse {
  success: boolean
  token: string
}

interface ChangePasswordResponse {
  success: boolean
  token: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export async function firstAccess(email: string, currentPassword: string, newPassword: string): Promise<FirstAccessResponse> {
  const { data } = await api.post<FirstAccessResponse>('/auth/first-access', {
    email,
    temporaryPassword: currentPassword,
    newPassword,
  })
  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
  const { data } = await api.post<ChangePasswordResponse>('/auth/change-password', { currentPassword, newPassword })
  return data
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>('/me')
  return data
}

export async function updateAvatar(key: string): Promise<{ success: boolean; avatarUrl: string }> {
  const { data } = await api.patch<{ success: boolean; avatarUrl: string }>('/me/avatar', { key })
  return data
}
