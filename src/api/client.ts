import axios from 'axios'
import toast from 'react-hot-toast'

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
    const message = error.response?.data?.error || 'Erro inesperado'
    const status = error.response?.status

    if (status === 401) {
      localStorage.removeItem('clave_token')
      localStorage.removeItem('clave_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (status !== 422) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)
