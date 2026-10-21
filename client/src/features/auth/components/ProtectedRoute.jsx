import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../authStore';
import { SplashScreen } from './SplashScreen';

/**
 * Пускает в /app/* только вошедших. Гостя отправляет на /login и запоминает,
 * куда он шёл (state.from), — после входа вернём туда же.
 * После явного «Выйти» страницу не запоминаем.
 */
export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const endReason = useAuthStore((s) => s.endReason);
  const location = useLocation();

  if (status === 'loading') return <SplashScreen />;

  // Аккаунт удалён — на главную, а не на вход
  if (status !== 'authenticated' && endReason === 'deleted') {
    return <Navigate to="/" replace />;
  }

  if (status !== 'authenticated') {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={endReason === 'logout' ? undefined : { from }} />;
  }

  return <Outlet />;
}
