import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { FirstAccessPage } from '@/pages/FirstAccessPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { UsersListPage } from '@/pages/users/UsersListPage'
import { UserCreatePage } from '@/pages/users/UserCreatePage'
import { UserDetailPage } from '@/pages/users/UserDetailPage'
import { SchoolsListPage } from '@/pages/schools/SchoolsListPage'
import { CoursesListPage } from '@/pages/courses/CoursesListPage'
import { SeasonsListPage } from '@/pages/seasons/SeasonsListPage'
import { ClassesListPage } from '@/pages/classes/ClassesListPage'
import { ClassDetailPage } from '@/pages/classes/ClassDetailPage'
import { ProjectTemplatesListPage } from '@/pages/templates/ProjectTemplatesListPage'
import { DailyMissionTemplatesPage } from '@/pages/templates/DailyMissionTemplatesPage'
import {
  MaterialTemplatesListPage,
  PressQuizTemplatesListPage,
  StudyTrackTemplatesListPage,
  TrackTemplatesListPage,
} from '@/pages/templates/TemplateResourceListPage'
import { ProjectInstancesPage } from '@/pages/instances/ProjectInstancesPage'
import { StoragePage } from '@/pages/StoragePage'

type LegacyTemplateTarget = 'tracks' | 'materials' | 'study-tracks' | 'press-quizzes'

function LegacyTemplateRouteRedirect({ target }: { target: LegacyTemplateTarget }) {
  const { slug } = useParams<{ slug: string }>()
  const query = slug ? `?projectSlug=${slug}` : ''

  return <Navigate to={`/templates/${target}${query}`} replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/first-access', element: <FirstAccessPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'settings/*', element: <SettingsPage /> },
      // Users
      { path: 'users', element: <UsersListPage /> },
      { path: 'users/new', element: <UserCreatePage /> },
      { path: 'users/:slug', element: <UserDetailPage /> },
      // Schools
      { path: 'schools', element: <SchoolsListPage /> },
      // Courses
      { path: 'courses', element: <CoursesListPage /> },
      // Seasons
      { path: 'seasons', element: <SeasonsListPage /> },
      // Classes
      { path: 'classes', element: <ClassesListPage /> },
      { path: 'classes/:slug', element: <ClassDetailPage /> },
      // Templates
      { path: 'templates/projects', element: <ProjectTemplatesListPage /> },
      { path: 'templates/tracks', element: <TrackTemplatesListPage /> },
      { path: 'templates/materials', element: <MaterialTemplatesListPage /> },
      { path: 'templates/study-tracks', element: <StudyTrackTemplatesListPage /> },
      { path: 'templates/press-quizzes', element: <PressQuizTemplatesListPage /> },
      { path: 'templates/projects/:slug', element: <LegacyTemplateRouteRedirect target="tracks" /> },
      { path: 'templates/projects/:slug/tracks', element: <LegacyTemplateRouteRedirect target="tracks" /> },
      { path: 'templates/projects/:slug/tracks/:trackSlug', element: <LegacyTemplateRouteRedirect target="tracks" /> },
      { path: 'templates/projects/:slug/tracks/:trackSlug/materials', element: <LegacyTemplateRouteRedirect target="materials" /> },
      { path: 'templates/projects/:slug/tracks/:trackSlug/study-tracks', element: <LegacyTemplateRouteRedirect target="study-tracks" /> },
      { path: 'templates/projects/:slug/tracks/:trackSlug/press-quizzes', element: <LegacyTemplateRouteRedirect target="press-quizzes" /> },
      { path: 'templates/daily-missions', element: <DailyMissionTemplatesPage /> },
      // Instances
      { path: 'instances/projects', element: <ProjectInstancesPage /> },
      // Storage
      { path: 'storage', element: <StoragePage /> },
    ],
  },
])
