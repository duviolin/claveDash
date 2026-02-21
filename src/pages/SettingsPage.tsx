import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { changePassword } from '@/api/auth'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setIsLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      toast.success('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      // Error handled by interceptor
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageContainer title="Configurações">
      <div className="max-w-md">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Trocar Senha</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              id="currentPassword"
              label="Senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <PasswordInput
              id="newPassword"
              label="Nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <PasswordInput
              id="confirmPassword"
              label="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" isLoading={isLoading}>
              Alterar Senha
            </Button>
          </form>
        </div>
      </div>
    </PageContainer>
  )
}
