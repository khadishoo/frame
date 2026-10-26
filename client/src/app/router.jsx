/* eslint-disable react-refresh/only-export-components -- карта маршрутов, а не компонент: lazy-страницы объявлены здесь же, горячая замена этому файлу не нужна */
import { Suspense, lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import { AuthLayout, PageSkeleton, PublicLayout } from '@/components/layout';
import { GuestRoute } from '@/features/auth/components/GuestRoute';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { SplashScreen } from '@/features/auth/components/SplashScreen';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import NotFoundPage from './NotFoundPage';
import { AppNotFound, PageError } from './PageError';
import RouteErrorPage from './RouteErrorPage';

// Каждая страница — отдельный чанк: код грузится, только когда её открыли.
// Пока чанк едет — скелетон в форме страницы (у входа/регистрации — в форме формы).
// Каркас приложения (сайдбар, топбар, окна проекта/задачи/идеи с формами) лендингу и входу
// не нужен — он приезжает, только когда открыли /app.
const AppLayout = lazy(() =>
  import('@/components/layout/AppLayout').then((m) => ({ default: m.AppLayout })),
);
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const CalendarPage = lazy(() => import('@/features/calendar/pages/CalendarPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const FavoritesPage = lazy(() => import('@/features/favorites/pages/FavoritesPage'));
const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'));
const IdeaEditorPage = lazy(() => import('@/features/notes/pages/IdeaEditorPage'));
const IdeasPage = lazy(() => import('@/features/notes/pages/IdeasPage'));
const OnboardingPage = lazy(() => import('@/features/onboarding/pages/OnboardingPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'));
const ProjectPage = lazy(() => import('@/features/projects/pages/ProjectPage'));
const ProjectsPage = lazy(() => import('@/features/projects/pages/ProjectsPage'));
const AccountSettingsPage = lazy(() => import('@/features/settings/pages/AccountSettingsPage'));
const AppearanceSettingsPage = lazy(
  () => import('@/features/settings/pages/AppearanceSettingsPage'),
);
const LabelsSettingsPage = lazy(() => import('@/features/settings/pages/LabelsSettingsPage'));
const ProfileSettingsPage = lazy(() => import('@/features/settings/pages/ProfileSettingsPage'));
const MyTasksPage = lazy(() => import('@/features/tasks/pages/MyTasksPage'));
const InvitePage = lazy(() => import('@/features/workspace/pages/InvitePage'));
const WorkspaceSettingsPage = lazy(
  () => import('@/features/workspace/pages/WorkspaceSettingsPage'),
);

function page(Component, variant = 'app') {
  return (
    <Suspense fallback={<PageSkeleton variant={variant} />}>
      <Component />
    </Suspense>
  );
}

// У каждой страницы приложения — своя граница ошибок: упала страница — каркас остаётся
const withPageErrors = (routes) =>
  routes.map((route) => ({
    errorElement: <PageError />,
    ...route,
    ...(route.children && { children: withPageErrors(route.children) }),
  }));

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
        children: [{ path: '/', element: page(LandingPage) }],
      },
      {
        element: <AuthLayout />,
        children: [
          {
            element: <GuestRoute />,
            children: [
              { path: '/login', element: page(LoginPage, 'form') },
              { path: '/register', element: page(RegisterPage, 'form') },
            ],
          },
          { path: '/forgot-password', element: page(ForgotPasswordPage, 'form') },
          { path: '/invite/:token', element: page(InvitePage, 'form') },
        ],
      },
      {
        path: '/app',
        element: <ProtectedRoute />,
        children: [
          // Онбординг — без сайдбара и топбара
          { path: 'onboarding', element: page(OnboardingPage, 'form') },
          {
            element: (
              <Suspense fallback={<SplashScreen />}>
                <AppLayout />
              </Suspense>
            ),
            children: withPageErrors([
              { index: true, element: page(DashboardPage) },
              { path: 'projects', element: page(ProjectsPage) },
              { path: 'projects/:id', element: page(ProjectPage) },
              { path: 'tasks', element: page(MyTasksPage) },
              { path: 'calendar', element: page(CalendarPage) },
              { path: 'ideas', element: page(IdeasPage) },
              // Markdown-библиотеки (~170 КБ) приезжают вместе с этим чанком — только в редакторе
              { path: 'ideas/:id', element: page(IdeaEditorPage) },
              { path: 'favorites', element: page(FavoritesPage) },
              { path: 'analytics', element: page(AnalyticsPage) },
              { path: 'notifications', element: page(NotificationsPage) },
              {
                path: 'settings',
                element: <SettingsLayout />,
                children: [
                  { index: true, element: <Navigate to="profile" replace /> },
                  { path: 'profile', element: page(ProfileSettingsPage) },
                  { path: 'account', element: page(AccountSettingsPage) },
                  { path: 'appearance', element: page(AppearanceSettingsPage) },
                  { path: 'labels', element: page(LabelsSettingsPage) },
                ],
              },
              { path: 'workspace/settings', element: page(WorkspaceSettingsPage) },
              // Неизвестный адрес внутри /app — 404 в каркасе приложения
              { path: '*', element: <AppNotFound /> },
            ]),
          },
        ],
      },
      ...devRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
