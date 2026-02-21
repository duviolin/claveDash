import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createUser } from '@/api/users'
import type { UserRole } from '@/types'
import toast from 'react-hot-toast'

export function UserCreatePage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TEACHER' as UserRole,
    mustChangePassword: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await createUser(form)
      toast.success('Usuário criado com sucesso!')
      navigate('/users')
    } catch {
      // handled by interceptor
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageContainer title="Criar Usuário">
      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <Input
            id="name"
            label="Nome"
            placeholder="Nome completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="usuario@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            id="password"
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Select
            id="role"
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            options={[
              { value: 'ADMIN', label: 'Admin' },
              { value: 'DIRECTOR', label: 'Director' },
              { value: 'TEACHER', label: 'Teacher' },
              { value: 'STUDENT', label: 'Student' },
            ]}
          />
          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input
              type="checkbox"
              checked={form.mustChangePassword}
              onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })}
              className="rounded border-border bg-surface accent-accent"
            />
            Exigir troca de senha no primeiro acesso
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isLoading}>
              Criar Usuário
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}
