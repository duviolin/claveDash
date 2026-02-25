import { api } from './client'
import type { User, UserRole, PaginatedResponse } from '@/types'

interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
  mustChangePassword?: boolean
}

interface UpdateUserPayload {
  name?: string
  email?: string
}

interface ListUsersParams {
  role?: UserRole
  page?: number
  limit?: number
}

export async function listUsers(params?: ListUsersParams): Promise<PaginatedResponse<User>> {
  const { data } = await api.get<PaginatedResponse<User>>('/users', { params })
  return data
}

export async function getUser(idOrSlug: string) {
  const { data } = await api.get<User>(`/users/${idOrSlug}`)
  return data
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post<User>('/users', payload)
  return data
}

export async function updateUser(idOrSlug: string, payload: UpdateUserPayload) {
  const { data } = await api.patch<User>(`/users/${idOrSlug}`, payload)
  return data
}

export async function suspendUser(idOrSlug: string) {
  const { data } = await api.patch(`/users/${idOrSlug}/suspend`)
  return data
}

export async function reactivateUser(idOrSlug: string) {
  const { data } = await api.patch(`/users/${idOrSlug}/reactivate`)
  return data
}

export async function softDeleteUser(idOrSlug: string) {
  await api.delete(`/users/${idOrSlug}`)
}

export async function restoreUser(idOrSlug: string) {
  const { data } = await api.patch(`/users/${idOrSlug}/restore`)
  return data
}

export async function listDeletedUsers(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>> {
  const { data } = await api.get<PaginatedResponse<User>>('/users/deleted', { params })
  return data
}
