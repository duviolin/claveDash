import { api } from './client'
import type { User, UserRole } from '@/types'

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

export async function listUsers(params?: ListUsersParams) {
  const { data } = await api.get('/users', { params })
  return data
}

export async function getUser(id: string) {
  const { data } = await api.get<User>(`/users/${id}`)
  return data
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post<User>('/users', payload)
  return data
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const { data } = await api.patch<User>(`/users/${id}`, payload)
  return data
}

export async function suspendUser(id: string) {
  const { data } = await api.patch(`/users/${id}/suspend`)
  return data
}

export async function reactivateUser(id: string) {
  const { data } = await api.patch(`/users/${id}/reactivate`)
  return data
}
