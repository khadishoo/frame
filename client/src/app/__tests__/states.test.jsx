import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { Outlet } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listFavorites } from '@/api/favorites';
import { useAuthStore } from '@/features/auth/authStore';
import FavoritesPage from '@/features/favorites/pages/FavoritesPage';
import { renderWithProviders } from '@/test/utils';
import { AppNotFound, PageError } from '../PageError';

vi.mock('@/api/favorites', () => ({
  listFavorites: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ status: 'authenticated', user: { id: 'u-1', name: 'Анна' } });
});

describe('ErrorState: ошибка запроса и «Повторить»', () => {
  it('нет соединения → понятное сообщение; «Повторить» перезапрашивает и показывает данные', async () => {
    listFavorites
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK', {}, {}))
      .mockResolvedValueOnce({ projects: [], notes: [] });

    renderWithProviders([{ path: '/', element: <FavoritesPage /> }]);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Не удалось загрузить избранное');
    expect(alert).toHaveTextContent('Нет соединения с сервером');

    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    // Пустое состояние вместо ошибки
    expect(await screen.findByText('Здесь пока пусто')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(listFavorites).toHaveBeenCalledTimes(2);
  });
});

describe('PageError: граница ошибок страницы', () => {
  it('страница упала при отрисовке → «Эта страница сломалась», «Повторить» рисует её заново', async () => {
    let shouldThrow = true;
    function Fragile() {
      if (shouldThrow) throw new Error('boom');
      return <h1>Страница работает</h1>;
    }
    // Рядом с упавшей страницей каркас (здесь — абзац «Каркас») остаётся
    const routes = [
      {
        path: '/',
        element: (
          <div>
            <p>Каркас</p>
            <Outlet />
          </div>
        ),
        children: [{ index: true, element: <Fragile />, errorElement: <PageError /> }],
      },
    ];
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(routes);
    expect(await screen.findByText('Эта страница сломалась')).toBeInTheDocument();
    expect(screen.getByText('Каркас')).toBeInTheDocument();

    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('heading', { name: 'Страница работает' })).toBeInTheDocument();
  });

  it('не загрузился чанк после релиза → предлагает обновить страницу', async () => {
    function Stale() {
      throw new TypeError('Failed to fetch dynamically imported module: /assets/Page-abc.js');
    }
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProviders([{ path: '/', element: <Stale />, errorElement: <PageError /> }]);

    expect(await screen.findByText('Вышла новая версия Frame')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Обновить страницу' })).toBeInTheDocument();
  });

  it('неизвестный адрес внутри приложения → 404 со ссылкой на дашборд', async () => {
    renderWithProviders([{ path: '*', element: <AppNotFound /> }], { url: '/app/nope' });
    expect(await screen.findByText('Кадр не найден')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'На дашборд' })).toHaveAttribute('href', '/app');
  });
});
