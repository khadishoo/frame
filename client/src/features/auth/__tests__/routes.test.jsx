import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../authStore';
import { GuestRoute } from '../components/GuestRoute';
import { ProtectedRoute } from '../components/ProtectedRoute';

function LoginProbe() {
  const location = useLocation();
  return <p>Страница входа; from={location.state?.from ?? '—'}</p>;
}

const renderAt = (entry) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginProbe />} />
        </Route>
        <Route path="/app" element={<ProtectedRoute />}>
          <Route index element={<p>Дашборд</p>} />
          <Route path="projects" element={<p>Проекты</p>} />
          <Route path="onboarding" element={<p>Онбординг</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

const setAuth = (state) =>
  useAuthStore.setState({
    status: 'guest',
    user: null,
    accessToken: null,
    endReason: null,
    redirectTo: null,
    ...state,
  });

const signedIn = { status: 'authenticated', user: { id: '1' }, accessToken: 'jwt' };

describe('ProtectedRoute', () => {
  beforeEach(() => setAuth({}));

  it('без сессии отправляет на /login и запоминает, куда шли', () => {
    renderAt('/app/projects?view=list');
    expect(screen.getByText('Страница входа; from=/app/projects?view=list')).toBeInTheDocument();
  });

  it('после явного выхода страницу не запоминает', () => {
    setAuth({ endReason: 'logout' });
    renderAt('/app/projects');
    expect(screen.getByText('Страница входа; from=—')).toBeInTheDocument();
  });

  it('пока идёт тихий refresh — сплэш, а не страница входа', () => {
    setAuth({ status: 'loading' });
    renderAt('/app/projects');
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка Frame');
    expect(screen.queryByText(/Страница входа/)).not.toBeInTheDocument();
  });

  it('с сессией пускает внутрь', () => {
    setAuth(signedIn);
    renderAt('/app/projects');
    expect(screen.getByText('Проекты')).toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  beforeEach(() => setAuth({}));

  it('вошедшего с /login уводит туда, куда он шёл', () => {
    setAuth(signedIn);
    renderAt({ pathname: '/login', state: { from: '/app/projects' } });
    expect(screen.getByText('Проекты')).toBeInTheDocument();
  });

  it('без «откуда» — на дашборд', () => {
    setAuth(signedIn);
    renderAt('/login');
    expect(screen.getByText('Дашборд')).toBeInTheDocument();
  });

  it('после регистрации — на онбординг', () => {
    setAuth({ ...signedIn, redirectTo: '/app/onboarding' });
    renderAt('/login');
    expect(screen.getByText('Онбординг')).toBeInTheDocument();
  });

  it('гостю показывает страницу входа', () => {
    renderAt('/login');
    expect(screen.getByText(/Страница входа/)).toBeInTheDocument();
  });
});
