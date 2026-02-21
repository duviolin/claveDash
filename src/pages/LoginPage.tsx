import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Music } from 'lucide-react'
import toast from 'react-hot-toast'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(email, password)
      toast.success('Login realizado com sucesso!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { code?: string; error?: string }; status?: number } }
      const code = error.response?.data?.code

      if (code === 'AUTH_MUST_CHANGE_PASSWORD') {
        navigate('/first-access')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <Music className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text">Clave Admin</h1>
          <p className="mt-2 text-muted">Portal administrativo da plataforma Clave</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="admin@escola.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Entrar
          </Button>
          <p className="text-center text-xs text-muted">
            Primeiro acesso?{' '}
            <Link to="/first-access" className="text-accent hover:underline">
              Trocar senha temporária
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
