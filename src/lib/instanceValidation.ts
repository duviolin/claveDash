import type { ProjectTemplate, Season } from '@/types'

export interface InstantiationForm {
  templateId: string
  classId: string
  seasonId: string
}

export function isInstantiationSelectionComplete(form: InstantiationForm): boolean {
  return !!form.templateId && !!form.classId && !!form.seasonId
}

export function getReadyTemplatesForSeason(
  templates: ProjectTemplate[],
  readinessById: Record<string, boolean>,
  season: Season | undefined
): ProjectTemplate[] {
  if (!season) {
    return []
  }

  return templates.filter((template) => {
    const isReady = readinessById[template.id]
    const isInstantiationAllowed = template.isInstantiationAllowed ?? template.isPublished ?? false
    return isReady && isInstantiationAllowed && template.courseId === season.courseId
  })
}
