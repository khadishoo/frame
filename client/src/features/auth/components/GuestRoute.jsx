import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../authStore';
import { SplashScreen } from './SplashScreen';

/**
 * Страницы для гостей (/login, /register). Вошедшего сразу уводит в приложение:
 * туда, куда он шёл до входа, на онбординг после регистрации или на дашборд.
 */
export function GuestRoute() {
  const status = useAuthStore((s) => s.status);
  const redirectTo = useAuthStore((s) => s.redirectTo);
  const location = useLocation();

  if (status === 'loading') return <SplashScreen />;

  if (status === 'authenticated') {
    return <Navigate to={redirectTo ?? location.state?.from ?? '/app'} replace />;
  }

  return <Outlet />;
}
