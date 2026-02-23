import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { getUser, updateUser } from '@/api/users'
import { formatDateTime } from '@/lib/utils'
import { ROLE_LABELS, ROLE_BADGE_VARIANT, USER_STATUS_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setIsLoading(true)
    try {
      await updateUser(id, form)
      toast.success('Usuário atualizado!')
      navigate('/users')
    } catch {
      // handled by interceptor
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <PageContainer title="Carregando...">
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Editar Usuário">
      <div className="max-w-lg">
        <div className="mb-4 flex items-center gap-3">
          <Badge variant={ROLE_BADGE_VARIANT[user.role]}>{ROLE_LABELS[user.role]}</Badge>
          <Badge variant={user.status === 'ACTIVE' ? 'success' : 'error'}>{USER_STATUS_LABELS[user.status]}</Badge>
          <span className="text-xs text-muted">Criado em {formatDateTime(user.createdAt)}</span>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <Input
            id="name"
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isLoading}>
              Salvar
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
              Voltar
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}
