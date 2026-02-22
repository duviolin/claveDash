import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { listNotifications, markAsRead, markAllAsRead } from '@/api/notifications'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

const NOTIFICATIONS_QUERY_KEY = ['notifications']

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'agora'
  if (diffMin === 1) return '1 min atrás'
  if (diffMin < 60) return `${diffMin} min atrás`
  if (diffHour === 1) return '1h atrás'
  if (diffHour < 24) return `${diffHour}h atrás`
  if (diffDay === 1) return 'ontem'
  if (diffDay < 7) return `${diffDay} dias atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: listNotifications,
    refetchInterval: 30_000,
  })

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
    },
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) markAsReadMutation.mutate(n.id)
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
        title="Notificações"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white px-1"
            aria-label={`${unreadCount} não lidas`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-surface-2/50">
            <span className="text-sm font-medium text-text">Notificações</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted text-sm">
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-10 w-10 text-muted" />}
                title="Nenhuma notificação"
                description="Você não tem notificações no momento."
              />
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-surface-2/70 transition-colors cursor-pointer',
                        !n.isRead && 'bg-accent/5'
                      )}
                    >
                      <p className="text-sm font-medium text-text">{n.title}</p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
