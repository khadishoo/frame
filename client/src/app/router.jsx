import { Navigate, createBrowserRouter } from 'react-router';
import { AppLayout, AuthLayout, PublicLayout } from '@/components/layout';
import AnalyticsPage from '@/features/analytics/pages/AnalyticsPage';
import { GuestRoute } from '@/features/auth/components/GuestRoute';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import CalendarPage from '@/features/calendar/pages/CalendarPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import FavoritesPage from '@/features/favorites/pages/FavoritesPage';
import LandingPage from '@/features/landing/pages/LandingPage';
import IdeasPage from '@/features/notes/pages/IdeasPage';
import OnboardingPage from '@/features/onboarding/pages/OnboardingPage';
import NotificationsPage from '@/features/notifications/pages/NotificationsPage';
import ProjectPage from '@/features/projects/pages/ProjectPage';
import ProjectsPage from '@/features/projects/pages/ProjectsPage';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import AccountSettingsPage from '@/features/settings/pages/AccountSettingsPage';
import AppearanceSettingsPage from '@/features/settings/pages/AppearanceSettingsPage';
import LabelsSettingsPage from '@/features/settings/pages/LabelsSettingsPage';
import ProfileSettingsPage from '@/features/settings/pages/ProfileSettingsPage';
import MyTasksPage from '@/features/tasks/pages/MyTasksPage';
import InvitePage from '@/features/workspace/pages/InvitePage';
import WorkspaceSettingsPage from '@/features/workspace/pages/WorkspaceSettingsPage';
import NotFoundPage from './NotFoundPage';
import RouteErrorPage from './RouteErrorPage';

// Витрина UI-кита только в dev: в production-сборку этот код не попадает
const devRoutes = import.meta.env.DEV
  ? [
      {
        path: '/dev/ui',
        lazy: async () => ({
          Component: (await import('@/features/dev/pages/UiKitPage')).default,
        }),
      },
    ]
  : [];

// Карта сайта MVP. /login и /register — только для гостей, /app/* — только для вошедших.
export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicLayout />,
        children: [{ path: '/', element: <LandingPage /> }],
      },
      {
        element: <AuthLayout />,
        children: [
          {
            element: <GuestRoute />,
            children: [
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
            ],
          },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/invite/:token', element: <InvitePage /> },
        ],
      },
      {
        path: '/app',
        element: <ProtectedRoute />,
        children: [
          // Онбординг — без сайдбара и топбара
          { path: 'onboarding', element: <OnboardingPage /> },
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'projects', element: <ProjectsPage /> },
              { path: 'projects/:id', element: <ProjectPage /> },
              { path: 'tasks', element: <MyTasksPage /> },
              { path: 'calendar', element: <CalendarPage /> },
              { path: 'ideas', element: <IdeasPage /> },
              {
                path: 'ideas/:id',
                // Лениво: Markdown-библиотеки (~190 КБ) грузятся, только когда открыли идею
                lazy: async () => ({
                  Component: (await import('@/features/notes/pages/IdeaEditorPage')).default,
                }),
              },
              { path: 'favorites', element: <FavoritesPage /> },
              { path: 'analytics', element: <AnalyticsPage /> },
              { path: 'notifications', element: <NotificationsPage /> },
              {
                path: 'settings',
                element: <SettingsLayout />,
                children: [
                  { index: true, element: <Navigate to="profile" replace /> },
                  { path: 'profile', element: <ProfileSettingsPage /> },
                  { path: 'account', element: <AccountSettingsPage /> },
                  { path: 'appearance', element: <AppearanceSettingsPage /> },
                  { path: 'labels', element: <LabelsSettingsPage /> },
                ],
              },
              { path: 'workspace/settings', element: <WorkspaceSettingsPage /> },
            ],
          },
        ],
      },
      ...devRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
