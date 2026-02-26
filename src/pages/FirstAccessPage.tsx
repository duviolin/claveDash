import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { firstAccess } from '@/api/auth'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Music } from 'lucide-react'
import toast from 'react-hot-toast'

export function FirstAccessPage() {
  const location = useLocation()
  const state = location.state as { email?: string; tempPassword?: string } | null
  const [email, setEmail] = useState(state?.email || '')
  const [currentPassword, setCurrentPassword] = useState(state?.tempPassword || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const response = await firstAccess(email, currentPassword, newPassword)
      toast.success('Senha alterada com sucesso!')
      await loginWithToken(response.token)
      navigate('/dashboard')
    } catch {
      // Error handled by interceptor
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
          <h1 className="text-2xl font-bold text-text">Primeiro Acesso</h1>
          <p className="mt-2 text-sm text-muted">Troque sua senha temporária para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <Input
            id="email"
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordInput
            id="currentPassword"
            label="Senha temporária"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <PasswordInput
            id="newPassword"
            label="Nova senha"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <PasswordInput
            id="confirmPassword"
            label="Confirmar nova senha"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Trocar Senha e Entrar
          </Button>
          <p className="text-center text-xs text-muted">
            <Link to="/login" className="text-accent hover:underline">
              Voltar ao login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
