import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'
import { PasswordInput } from '@/components/ui/PasswordInput'

const themes = ['light', 'dark'] as const

describe('acessibilidade smoke', () => {
  themes.forEach((theme) => {
    it(`Button nao possui violacoes axe no tema ${theme}`, async () => {
      document.documentElement.setAttribute('data-theme', theme)
      const { container } = render(<Button>Salvar</Button>)
      const results = await axe(container)
      expect(results.violations).toHaveLength(0)
    })

    it(`Tabs nao possui violacoes axe no tema ${theme}`, async () => {
      document.documentElement.setAttribute('data-theme', theme)
      const { container } = render(
        <Tabs
          tabs={[
            { key: 'active', label: 'Ativos' },
            { key: 'trash', label: 'Lixeira' },
          ]}
          activeKey="active"
          onChange={() => undefined}
        />
      )

      const results = await axe(container)
      expect(results.violations).toHaveLength(0)
    })

    it(`Modal nao possui violacoes axe no tema ${theme}`, async () => {
      document.documentElement.setAttribute('data-theme', theme)
      const { container } = render(
        <Modal isOpen onClose={() => undefined} title="Confirmar ação">
          <p>Deseja continuar?</p>
        </Modal>
      )

      const results = await axe(container)
      expect(results.violations).toHaveLength(0)
    })
  })

  it('PasswordInput renderiza botao de alternancia acessivel', () => {
    const { getByRole } = render(<PasswordInput id="password" label="Senha" value="123456" onChange={() => undefined} />)
    expect(getByRole('button', { name: 'Mostrar senha' })).toBeDefined()
  })
})
