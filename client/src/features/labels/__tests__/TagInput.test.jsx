import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TagInput } from '../components/TagInput';

const allTags = [
  { id: 't-1', name: 'лофи', color: 'teal' },
  { id: 't-2', name: 'Лофи-хоп', color: 'violet' },
  { id: 't-3', name: 'черновик', color: 'gray' },
];

/** Обёртка с состоянием: как TagInput живёт внутри формы. */
function Harness({ initial = [], onCreate }) {
  const [value, setValue] = useState(initial);
  const [tags, setTags] = useState(allTags);
  return (
    <TagInput
      value={value}
      onChange={setValue}
      tags={tags}
      onCreate={async (name) => {
        const tag = await onCreate(name);
        setTags((list) => [...list, tag]);
        return tag;
      }}
    />
  );
}

const setup = (props = {}) => {
  const onCreate = vi.fn(async (name) => ({ id: `new-${name}`, name, color: 'gray' }));
  render(<Harness onCreate={onCreate} {...props} />);
  return { ui: userEvent.setup(), input: screen.getByRole('combobox'), onCreate };
};

const chips = () =>
  screen
    .queryAllByRole('button', { name: /^Убрать тег/ })
    .map((b) => b.getAttribute('aria-label').replace('Убрать тег ', ''));

describe('TagInput', () => {
  it('подсказки фильтруются без учёта регистра; Enter выбирает первую', async () => {
    const { ui, input } = setup();
    await ui.type(input, 'ЛОФ');

    const options = screen.getAllByRole('option');
    // Точного совпадения нет — последним пунктом предлагается создать тег
    expect(options.map((o) => o.textContent)).toEqual(['#лофи', '#Лофи-хоп', 'Создать тег «ЛОФ»']);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await ui.keyboard('{Enter}');
    expect(chips()).toEqual(['лофи']);
    expect(input).toHaveValue('');
  });

  it('стрелки двигают выделение, выбранный тег исчезает из подсказок', async () => {
    const { ui, input } = setup();
    await ui.type(input, 'лоф');
    await ui.keyboard('{ArrowDown}{Enter}');
    expect(chips()).toEqual(['Лофи-хоп']);

    await ui.type(input, 'лоф');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      '#лофи',
      'Создать тег «лоф»',
    ]);
  });

  it('Enter на новом названии создаёт тег и сразу добавляет его', async () => {
    const { ui, input, onCreate } = setup();
    await ui.type(input, 'зин');
    expect(screen.getByRole('option')).toHaveTextContent('Создать тег «зин»');

    await ui.keyboard('{Enter}');
    expect(onCreate).toHaveBeenCalledWith('зин');
    await vi.waitFor(() => expect(chips()).toEqual(['зин']));
    expect(input).toHaveFocus();
  });

  it('точное совпадение не создаёт дубликат', async () => {
    const { ui, input, onCreate } = setup();
    await ui.type(input, 'Черновик{Enter}');
    expect(onCreate).not.toHaveBeenCalled();
    expect(chips()).toEqual(['черновик']);
  });

  it('Backspace в пустом поле убирает последний тег — и после создания нового тоже', async () => {
    const { ui, input } = setup({ initial: ['t-1', 't-3'] });
    await ui.type(input, 'зин{Enter}');
    await vi.waitFor(() => expect(chips()).toEqual(['лофи', 'черновик', 'зин']));

    await ui.keyboard('{Backspace}');
    expect(chips()).toEqual(['лофи', 'черновик']);
    await ui.keyboard('{Backspace}');
    expect(chips()).toEqual(['лофи']);
  });

  it('пока тег создаётся, поле не отключается (иначе браузер снимет фокус)', async () => {
    let resolve;
    const onCreate = vi.fn(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    render(<Harness onCreate={onCreate} />);
    const ui = userEvent.setup();
    const input = screen.getByRole('combobox');

    await ui.type(input, 'зин{Enter}');
    // jsdom не снимает фокус с disabled-поля сам — поэтому проверяем причину бага напрямую
    expect(input).toBeEnabled();
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveAttribute('aria-busy', 'true');

    resolve({ id: 'new-зин', name: 'зин', color: 'gray' });
    await vi.waitFor(() => expect(chips()).toEqual(['зин']));
    expect(input).not.toHaveAttribute('readonly');
  });

  it('крестик на чипе убирает тег', async () => {
    const { ui } = setup({ initial: ['t-1', 't-3'] });
    await ui.click(screen.getByRole('button', { name: 'Убрать тег лофи' }));
    expect(chips()).toEqual(['черновик']);
  });

  it('Escape закрывает подсказки', async () => {
    const { ui, input } = setup();
    await ui.type(input, 'ло');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await ui.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
