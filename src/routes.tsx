import { createBrowserRouter, Navigate } from 'react-router-dom'
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

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/first-access', element: <FirstAccessPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'settings', element: <SettingsPage /> },
      // Users
      { path: 'users', element: <UsersListPage /> },
      { path: 'users/new', element: <UserCreatePage /> },
      { path: 'users/:id', element: <UserDetailPage /> },
      // Schools
      { path: 'schools', element: <SchoolsListPage /> },
      // Courses
      { path: 'courses', element: <CoursesListPage /> },
      // Seasons
      { path: 'seasons', element: <SeasonsListPage /> },
      // Classes
      { path: 'classes', element: <ClassesListPage /> },
      { path: 'classes/:id', element: <ClassDetailPage /> },
    ],
  },
])
