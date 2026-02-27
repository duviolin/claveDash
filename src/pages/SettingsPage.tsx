import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { changePassword } from '@/api/auth'
import {
  listProjectTemplateReadinessRules,
  updateProjectTemplateReadinessRule,
} from '@/api/templates'
import { useAuth } from '@/contexts/AuthContext'
import type { ProjectTemplateReadinessRule } from '@/types'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingReadinessRules, setEditingReadinessRules] = useState(false)
  const [readinessRulesForm, setReadinessRulesForm] = useState<Record<string, { title: string; description: string; targetValue: string; weight: string; isActive: boolean }>>({})

  const { data: readinessRules = [] } = useQuery({
    queryKey: ['project-template-readiness-rules'],
    queryFn: () => listProjectTemplateReadinessRules(),
    enabled: user?.role === 'ADMIN',
  })

  useEffect(() => {
    if (!readinessRules.length) return
    setReadinessRulesForm((prev) => {
      const next = { ...prev }
      for (const rule of readinessRules) {
        next[rule.id] = {
          title: rule.title,
          description: rule.description || '',
          targetValue: String(rule.targetValue),
          weight: String(rule.weight),
          isActive: rule.isActive,
        }
      }
      return next
    })
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
            title: form.title,
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
      setEditingReadinessRules(false)
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

  return (
    <PageContainer title="Configurações">
      <div className="max-w-2xl space-y-4">
        <div className="max-w-md rounded-xl border border-border bg-surface p-6">
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

        {user?.role === 'ADMIN' && (
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">Publicação de projetos</h2>
            <p className="mt-1 text-sm text-muted">
              Ajuste os critérios usados para avaliar aptidão de publicação dos templates.
            </p>
            <div className="mt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditingReadinessRules(true)}
              >
                Critérios de publicação
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={editingReadinessRules}
        onClose={() => setEditingReadinessRules(false)}
        title="Critérios de publicação (somente admin)"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingReadinessRules(false)}>Cancelar</Button>
            <Button onClick={() => saveReadinessRulesMutation.mutate()} isLoading={saveReadinessRulesMutation.isPending}>Salvar critérios</Button>
          </>
        }
      >
        <div className="space-y-3">
          {readinessRules.map((rule: ProjectTemplateReadinessRule) => {
            const form = readinessRulesForm[rule.id] ?? {
              title: rule.title,
              description: rule.description || '',
              targetValue: String(rule.targetValue),
              weight: String(rule.weight),
              isActive: rule.isActive,
            }

            return (
              <div key={rule.id} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    id={`rule-title-${rule.id}`}
                    label="Título"
                    value={form.title}
                    onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, title: e.target.value } }))}
                  />
                  <div className="flex items-end">
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
                    label="Critério de avaliação para IA (editável pelo admin)"
                    value={form.description}
                    onChange={(e) => setReadinessRulesForm((prev) => ({ ...prev, [rule.id]: { ...form, description: e.target.value } }))}
                    placeholder="Ex.: Avaliar se a progressão didática da faixa está clara e contextualizada para o artista."
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
      </Modal>
    </PageContainer>
  )
}
