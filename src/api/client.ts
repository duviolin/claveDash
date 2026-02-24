import axios from 'axios'
import toast from 'react-hot-toast'
import { ERROR_HANDLERS } from '@/lib/errorCodes'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clave_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const data = error.response?.data
    const url = error.config?.url
    const method = error.config?.method?.toUpperCase()
    const code: string | undefined = data?.code

    if (import.meta.env.DEV) {
      console.error(`[API] ${method} ${url} → ${status || 'NETWORK'}`, code || data?.error || error.message)
    }

    if (!status) {
      toast.error(`Erro de conexão: não foi possível conectar ao servidor`)
      return Promise.reject(error)
    }

    const handler = code ? ERROR_HANDLERS[code] : undefined

    if (handler?.action) {
      if (handler.action === 'logout') {
        localStorage.removeItem('clave_token')
        localStorage.removeItem('clave_user')
        if (window.location.pathname !== '/login') {
          toast.error(handler.message || 'Sessão expirada')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      if (handler.action.startsWith('redirect:')) {
        const path = handler.action.replace('redirect:', '')
        toast.error(handler.message || data?.error || 'Erro')
        if (window.location.pathname !== path) {
          window.location.href = path
        }
        return Promise.reject(error)
      }
    }

    if (status === 401 && !handler) {
      localStorage.removeItem('clave_token')
      localStorage.removeItem('clave_user')
      if (window.location.pathname !== '/login') {
        toast.error('Sessão expirada. Faça login novamente.')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    const message = handler?.message || data?.error || data?.message || error.message || 'Erro inesperado'
    toast.error(message)

    return Promise.reject(error)
  }
)
