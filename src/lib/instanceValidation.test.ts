import { describe, expect, it } from 'vitest'
import { getReadyTemplatesForSeason, isInstantiationSelectionComplete } from '@/lib/instanceValidation'
import type { ProjectTemplate, Season } from '@/types'

const season: Season = {
  id: 'season-1',
  slug: 'season-1',
  courseId: 'course-a',
  name: '2026.1',
  startDate: '2026-01-01',
  endDate: '2026-06-30',
  status: 'ACTIVE',
  isActive: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

const templates: ProjectTemplate[] = [
  {
    id: 'tpl-ready-matching',
    slug: 'tpl-ready-matching',
    courseId: 'course-a',
    name: 'Template A',
    type: 'ALBUM',
    description: null,
    coverImage: null,
    version: 1,
    isInstantiationAllowed: true,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'tpl-ready-other-course',
    slug: 'tpl-ready-other-course',
    courseId: 'course-b',
    name: 'Template B',
    type: 'PLAY',
    description: null,
    coverImage: null,
    version: 1,
    isInstantiationAllowed: true,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('instanceValidation', () => {
  it('aceita envio apenas quando selecao esta completa', () => {
    expect(
      isInstantiationSelectionComplete({
        templateId: 'tpl',
        classId: 'class',
        seasonId: 'season',
      })
    ).toBe(true)

    expect(
      isInstantiationSelectionComplete({
        templateId: '',
        classId: 'class',
        seasonId: 'season',
      })
    ).toBe(false)
  })

  it('filtra templates aptos pelo contexto do semestre', () => {
    const result = getReadyTemplatesForSeason(
      templates,
      {
        'tpl-ready-matching': true,
        'tpl-ready-other-course': true,
      },
      season
    )

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tpl-ready-matching')
  })
})
