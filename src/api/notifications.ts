import { api } from './client'
import type { Notification } from '@/types'

export async function listNotifications(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>('/notifications')
  return data
}

export async function markAsRead(id: string): Promise<Notification> {
  const { data } = await api.patch<Notification>(`/notifications/${id}/read`)
  return data
}

export async function markAllAsRead(): Promise<{ count: number }> {
  const { data } = await api.patch<{ count: number }>('/notifications/read-all')
  return data
}
