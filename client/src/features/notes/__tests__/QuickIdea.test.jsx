import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNote } from '@/api/notes';
import { listWorkspaces } from '@/api/workspaces';
import { useAuthStore } from '@/features/auth/authStore';
import { useToastStore } from '@/lib/toast';
import { demoWorkspace, renderWithProviders } from '@/test/utils';
import { QuickIdeaModal } from '../components/QuickIdeaModal';
import { plainText } from '../noteColors';
import { useQuickIdea } from '../quickIdeaStore';

vi.mock('@/api/notes', () => ({ createNote: vi.fn(), listNotes: vi.fn() }));
vi.mock('@/api/projects', () => ({
  listProjects: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 }),
}));
vi.mock('@/api/workspaces', () => ({ listWorkspaces: vi.fn() }));

const renderApp = () =>
  renderWithProviders(
    [
      {
        path: '/',
        element: (
          <>
            <input aria-label="Другое поле" />
            <QuickIdeaModal />
          </>
        ),
      },
      { path: '/app/ideas/:id', element: <p>Редактор</p> },
    ],
    { url: '/' },
  );

beforeEach(() => {
  vi.mocked(listWorkspaces).mockResolvedValue({ items: [demoWorkspace] });
  useAuthStore.setState({ status: 'authenticated', user: { id: 'u-1' }, accessToken: 'jwt' });
  useToastStore.setState({ toasts: [] });
  vi.mocked(createNote)
    .mockReset()
    .mockImplementation(async (_ws, data) => ({ id: 'n-9', ...data }));
});
afterEach(() => useQuickIdea.setState({ open: false, projectId: null }));

describe('Быстрая идея по клавише N', () => {
  it('N открывает окно; буква не печатается в поле с автофокусом', async () => {
    const ui = userEvent.setup();
    renderApp();

    await ui.keyboard('[KeyN]');
    expect(await screen.findByRole('dialog', { name: 'Быстрая идея' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Заголовок' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Заголовок' })).toHaveFocus();
  });

  it('в русской раскладке: браузер шлёт key «т», но code тот же — KeyN', async () => {
    renderApp();
    fireEvent.keyDown(document.body, { key: 'т', code: 'KeyN' });
    expect(await screen.findByRole('dialog', { name: 'Быстрая идея' })).toBeInTheDocument();
  });

  it('другая клавиша с буквой «n» (например, раскладка Dvorak: code KeyL) — не открывает', () => {
    renderApp();
    fireEvent.keyDown(document.body, { key: 'n', code: 'KeyL' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('когда фокус в поле ввода — N печатается, окно не открывается', async () => {
    const ui = userEvent.setup();
    renderApp();
    const field = screen.getByRole('textbox', { name: 'Другое поле' });
    await ui.click(field);
    await ui.keyboard('[KeyN]');
    expect(field).toHaveValue('n');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Ctrl+N (браузерное «новое окно») не перехватываем', async () => {
    const ui = userEvent.setup();
    renderApp();
    await ui.keyboard('{Control>}[KeyN]{/Control}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('сохранение: пустую идею не отправляет; Ctrl+Enter создаёт; тост с «Открыть»', async () => {
    const ui = userEvent.setup();
    const { router } = renderApp();
    await ui.keyboard('[KeyN]');
    await screen.findByRole('dialog');

    await ui.click(screen.getByRole('button', { name: 'Сохранить идею' }));
    expect(screen.getByText('Напишите заголовок или текст идеи')).toBeInTheDocument();
    expect(createNote).not.toHaveBeenCalled();

    await ui.type(screen.getByRole('textbox', { name: 'Заголовок' }), 'Комикс');
    await ui.type(
      screen.getByRole('textbox', { name: /Текст/ }),
      'про кота{Control>}{Enter}{/Control}',
    );

    await waitFor(() =>
      expect(createNote).toHaveBeenCalledWith(demoWorkspace.id, {
        title: 'Комикс',
        content: 'про кота',
        projectId: null,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const [saved] = useToastStore.getState().toasts;
    expect(saved).toMatchObject({ title: 'Идея сохранена', action: { label: 'Открыть' } });
    saved.action.onClick();
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/ideas/n-9'));
  });
});

describe('plainText — превью Markdown в карточке', () => {
  it('убирает разметку, оставляя текст', () => {
    expect(
      plainText(
        '# Заголовок\n\n- **жирный** и `код`\n- [x] сделано\n> цитата\n[ссылка](https://x.y)',
      ),
    ).toBe('Заголовок\n\nжирный и код\nсделано\nцитата\nссылка');
    expect(plainText('```js\nconsole.log(1)\n```')).toBe('console.log(1)');
  });
});
