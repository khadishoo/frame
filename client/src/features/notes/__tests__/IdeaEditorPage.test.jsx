import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getNote, updateNote } from '@/api/notes';
import { listWorkspaces } from '@/api/workspaces';
import { useAuthStore } from '@/features/auth/authStore';
import { demoWorkspace, renderWithProviders } from '@/test/utils';
import IdeaEditorPage, { AUTOSAVE_DELAY } from '../pages/IdeaEditorPage';

vi.mock('@/api/notes', () => ({
  getNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  convertNote: vi.fn(),
  listNotes: vi.fn(),
}));
vi.mock('@/api/projects', () => ({
  listProjects: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 }),
}));
vi.mock('@/api/workspaces', () => ({ listWorkspaces: vi.fn() }));

const makeNote = (overrides = {}) => ({
  id: 'n-1',
  workspaceId: demoWorkspace.id,
  authorId: 'u-1',
  title: 'Комикс',
  content: '',
  isPinned: false,
  color: null,
  project: null,
  isFavorite: false,
  createdAt: '2026-10-20T10:00:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
  ...overrides,
});

const renderEditor = () =>
  renderWithProviders(
    [
      { path: '/app/ideas/:id', element: <IdeaEditorPage /> },
      { path: '/app/ideas', element: <p>Список идей</p> },
    ],
    { url: '/app/ideas/n-1' },
  );

beforeEach(() => {
  vi.mocked(listWorkspaces).mockResolvedValue({ items: [demoWorkspace] });
  useAuthStore.setState({ status: 'authenticated', user: { id: 'u-1' }, accessToken: 'jwt' });
  vi.mocked(updateNote)
    .mockReset()
    .mockImplementation(async (id, data) => makeNote({ ...data }));
});

describe('Редактор идеи: автосохранение', () => {
  it(`сохраняет один раз — через ${AUTOSAVE_DELAY} мс после последней буквы — и пишет «Сохранено»`, async () => {
    vi.mocked(getNote).mockResolvedValue(makeNote());
    const ui = userEvent.setup();
    renderEditor();

    const title = await screen.findByRole('textbox', { name: 'Заголовок' });
    await ui.type(title, ' про кота');
    await ui.type(screen.getByRole('textbox', { name: 'Текст идеи (Markdown)' }), 'Сюжет');

    // Печатали только что — запроса ещё нет
    expect(updateNote).not.toHaveBeenCalled();

    await waitFor(() => expect(updateNote).toHaveBeenCalledTimes(1), {
      timeout: AUTOSAVE_DELAY + 1000,
    });
    expect(updateNote).toHaveBeenCalledWith('n-1', { title: 'Комикс про кота', content: 'Сюжет' });
    expect(await screen.findByText('Сохранено')).toBeInTheDocument();
  });

  it('ушли со страницы раньше 800 мс — недописанное сохраняется сразу', async () => {
    vi.mocked(getNote).mockResolvedValue(makeNote());
    const ui = userEvent.setup();
    const { router } = renderEditor();

    await ui.type(await screen.findByRole('textbox', { name: 'Заголовок' }), '!');
    await act(() => router.navigate('/app/ideas'));

    expect(screen.getByText('Список идей')).toBeInTheDocument();
    await waitFor(() =>
      expect(updateNote).toHaveBeenCalledWith('n-1', { title: 'Комикс!', content: '' }),
    );
  });
});

describe('Редактор идеи: Markdown безопасно', () => {
  it('разметка показывается, а HTML-атаки из текста — нет', async () => {
    vi.mocked(getNote).mockResolvedValue(
      makeNote({
        content: [
          '## План',
          '- **жирный** пункт',
          '<script>window.hacked = true</script>',
          '<img src="x" onerror="window.hacked = true">',
          '[ссылка](javascript:alert(1)) и [сайт](https://example.com)',
        ].join('\n\n'),
      }),
    );
    const { container } = renderEditor();

    // Текст есть — открывается в режиме «Просмотр»
    expect(await screen.findByRole('heading', { name: 'План' })).toBeInTheDocument();
    expect(screen.getByText('жирный').tagName).toBe('STRONG');

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(window.hacked).toBeUndefined();
    // javascript:-ссылка обезврежена, обычная — открывается в новой вкладке без доступа к нам
    expect(screen.getByText('ссылка').closest('a')?.getAttribute('href') ?? '').not.toMatch(
      /javascript/i,
    );
    expect(screen.getByRole('link', { name: 'сайт' })).toHaveAttribute(
      'rel',
      'noopener noreferrer nofollow',
    );
  });

  it('несуществующая идея — «Идея не найдена»', async () => {
    vi.mocked(getNote).mockRejectedValue({ response: { status: 404 } });
    renderEditor();
    expect(await screen.findByText('Идея не найдена')).toBeInTheDocument();
  });
});
