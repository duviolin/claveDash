import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { changePassword } from '@/api/auth'
import {
  listProjectTemplateReadinessRules,
  updateProjectTemplateReadinessRule,
} from '@/api/templates'
import { READINESS_RULE_LABELS } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import type { ProjectTemplateReadinessRule } from '@/types'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [readinessRulesForm, setReadinessRulesForm] = useState<Record<string, { description: string; targetValue: string; weight: string; isActive: boolean }>>({})

  const { data: readinessRules = [] } = useQuery({
    queryKey: ['project-template-readiness-rules'],
    queryFn: () => listProjectTemplateReadinessRules(),
    enabled: user?.role === 'ADMIN',
  })

  useEffect(() => {
    if (!readinessRules.length) return
    const next: Record<string, { description: string; targetValue: string; weight: string; isActive: boolean }> = {}
    for (const rule of readinessRules) {
      next[rule.id] = {
        description: rule.description || '',
        targetValue: String(rule.targetValue),
        weight: String(rule.weight),
        isActive: rule.isActive,
      }
    }
    setReadinessRulesForm(next)
  }, [readinessRules])

  const saveReadinessRulesMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        readinessRules.map((rule) => {
          const form = readinessRulesForm[rule.id]
          if (!form) return Promise.resolve()

          const targetValue = Math.max(1, Number(form.targetValue) || 1)
          const weight = Math.max(1, Number(form.weight) || 1)

          return updateProjectTemplateReadinessRule(rule.id, {
            description: form.description.trim() || null,
            targetValue,
            weight,
            isActive: form.isActive,
          })
        })
      )
    },
    onSuccess: () => {
      toast.success('Critérios de publicação atualizados!')
      queryClient.invalidateQueries({ queryKey: ['project-template-readiness-rules'] })
    },
  })

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

  const isPasswordPage = location.pathname === '/settings/password'
  const isPublicationPage = location.pathname === '/settings/publication'

  useEffect(() => {
    if (location.pathname !== '/settings') return
    if (user?.role === 'ADMIN') {
      navigate('/settings/publication', { replace: true })
      return
    }
    navigate('/settings/password', { replace: true })
  }, [location.pathname, navigate, user?.role])

  useEffect(() => {
    if (location.pathname !== '/settings/publication') return
    if (user?.role === 'ADMIN') return
    navigate('/settings/password', { replace: true })
  }, [location.pathname, navigate, user?.role])

  return (
    <PageContainer title="Configurações">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-xl border border-border bg-surface p-3">
          <nav className="flex flex-wrap gap-2">
            <NavLink
              to="/settings/password"
              className={({ isActive }) =>
                isActive
                  ? 'rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white'
                  : 'rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text'
              }
            >
              Senha
            </NavLink>
            {user?.role === 'ADMIN' && (
              <NavLink
                to="/settings/publication"
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white'
                    : 'rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text'
                }
              >
                Critérios de publicação
              </NavLink>
            )}
          </nav>
        </div>

        {isPasswordPage && (
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">Trocar senha</h2>
            <p className="mt-1 text-sm text-muted">Atualize sua senha de acesso.</p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <div className="md:col-span-2">
                  <PasswordInput
                    id="confirmPassword"
                    label="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" isLoading={isLoading}>
                  Alterar senha
                </Button>
              </div>
            </form>
          </section>
        )}

        {isPublicationPage && user?.role === 'ADMIN' && (
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">Critérios de publicação</h2>
            <p className="mt-1 text-sm text-muted">
              Defina as regras usadas para liberar publicação dos templates.
            </p>
            <div className="mt-5 space-y-3">
              {readinessRules.map((rule: ProjectTemplateReadinessRule) => {
                const form = readinessRulesForm[rule.id] ?? {
                  description: rule.description || '',
                  targetValue: String(rule.targetValue),
                  weight: String(rule.weight),
                  isActive: rule.isActive,
                }

                return (
                  <div key={rule.id} className="rounded-lg border border-border bg-surface-2 p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-semibold text-text">
                        {READINESS_RULE_LABELS[rule.code]}
                      </h3>
                      <div className="flex items-center">
                        <label className="inline-flex items-center gap-2 text-sm text-text">
                          <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, isActive: e.target.checked } }))}
                          />
                          Regra ativa
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Textarea
                        id={`rule-description-${rule.id}`}
                        label="Critério de avaliação para IA"
                        value={form.description}
                        onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, description: e.target.value } }))}
                        placeholder="Ex.: Avaliar se a progressão didática da faixa está clara e contextualizada para o artista."
                        className="sm:col-span-2"
                      />
                      <Input
                        id={`rule-target-${rule.id}`}
                        label="Meta mínima"
                        type="number"
                        min={1}
                        value={form.targetValue}
                        onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, targetValue: e.target.value } }))}
                      />
                      <Input
                        id={`rule-weight-${rule.id}`}
                        label="Peso no score"
                        type="number"
                        min={1}
                        value={form.weight}
                        onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, weight: e.target.value } }))}
                      />
                    </div>
                    {rule.description && <p className="mt-2 text-xs text-muted">{rule.description}</p>}
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  const next: Record<string, { description: string; targetValue: string; weight: string; isActive: boolean }> = {}
                  for (const rule of readinessRules) {
                    next[rule.id] = {
                      description: rule.description || '',
                      targetValue: String(rule.targetValue),
                      weight: String(rule.weight),
                      isActive: rule.isActive,
                    }
                  }
                  setReadinessRulesForm(next)
                }}
              >
                Restaurar valores
              </Button>
              <Button onClick={() => saveReadinessRulesMutation.mutate()} isLoading={saveReadinessRulesMutation.isPending}>
                Salvar critérios
              </Button>
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  )
}
