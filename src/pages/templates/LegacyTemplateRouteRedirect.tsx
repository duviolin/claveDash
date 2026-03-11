import { Navigate, useParams } from 'react-router-dom'

type LegacyTemplateTarget = 'tracks' | 'materials' | 'study-tracks' | 'press-quizzes'

interface LegacyTemplateRouteRedirectProps {
  target: LegacyTemplateTarget
}

export function LegacyTemplateRouteRedirect({ target }: LegacyTemplateRouteRedirectProps) {
  const { slug } = useParams<{ slug: string }>()
  const query = slug ? `?projectSlug=${slug}` : ''

  return <Navigate to={`/templates/${target}${query}`} replace />
}
