import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const past = new Date(date).getTime()
  const diffSec = Math.floor((now - past) / 1000)

  if (diffSec < 60) return 'agora'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `há ${diffMin}min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `há ${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `há ${diffDay}d`
  return formatDateTime(date)
}
