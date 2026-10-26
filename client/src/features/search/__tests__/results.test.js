import { describe, expect, it } from 'vitest';
import { greetingFor, greetingText } from '@/features/dashboard/greeting';
import { flattenResults, isSearchHotkey, splitMatches } from '../results';

describe('splitMatches — подсветка совпадений', () => {
  it('без учёта регистра, все вхождения, регистр текста сохраняется', () => {
    expect(splitMatches('Свет и СВЕТОфор', 'свет')).toEqual([
      { text: 'Свет', match: true },
      { text: ' и ', match: false },
      { text: 'СВЕТ', match: true },
      { text: 'Офор', match: false },
    ]);
  });

  it('спецсимволы RegExp в запросе — обычные символы', () => {
    expect(splitMatches('цена (50%)', '(50%')).toEqual([
      { text: 'цена ', match: false },
      { text: '(50%', match: true },
      { text: ')', match: false },
    ]);
    expect(splitMatches('a.b', '.')).toEqual([
      { text: 'a', match: false },
      { text: '.', match: true },
      { text: 'b', match: false },
    ]);
  });

  it('пустой запрос или нет совпадений — текст целиком', () => {
    expect(splitMatches('текст', '')).toEqual([{ text: 'текст', match: false }]);
    expect(splitMatches('текст', 'zz')).toEqual([{ text: 'текст', match: false }]);
  });
});

describe('flattenResults', () => {
  it('группы подряд, сквозной index, ссылки по типу (задача — окно на доске проекта)', () => {
    const options = flattenResults({
      q: 'св',
      projects: [{ id: 'p1' }],
      tasks: [
        { id: 't1', project: { id: 'p1' } },
        { id: 't2', project: { id: 'p2' } },
      ],
      notes: [{ id: 'n1' }],
    });
    expect(options.map((o) => [o.group, o.index, o.href])).toEqual([
      ['projects', 0, '/app/projects/p1'],
      ['tasks', 1, '/app/projects/p1?tab=board&task=t1'],
      ['tasks', 2, '/app/projects/p2?tab=board&task=t2'],
      ['notes', 3, '/app/ideas/n1'],
    ]);
    expect(flattenResults(undefined)).toEqual([]);
  });
});

describe('isSearchHotkey', () => {
  it('Ctrl+K и Cmd+K — по физической клавише (в русской раскладке key = «л»)', () => {
    expect(isSearchHotkey({ code: 'KeyK', key: 'k', ctrlKey: true })).toBe(true);
    expect(isSearchHotkey({ code: 'KeyK', key: 'л', ctrlKey: true })).toBe(true);
    expect(isSearchHotkey({ code: 'KeyK', key: 'k', metaKey: true })).toBe(true);
    expect(isSearchHotkey({ code: 'KeyK', key: 'k' })).toBe(false);
    expect(isSearchHotkey({ code: 'KeyK', key: 'K', ctrlKey: true, shiftKey: true })).toBe(false);
  });
});

describe('Приветствие', () => {
  it('по времени суток и по первому слову имени', () => {
    const at = (h) => new Date(2026, 9, 26, h, 30);
    expect(greetingFor(at(3))).toBe('Доброй ночи');
    expect(greetingFor(at(5))).toBe('Доброе утро');
    expect(greetingFor(at(12))).toBe('Добрый день');
    expect(greetingFor(at(18))).toBe('Добрый вечер');
    expect(greetingText('Анна Петрова', at(9))).toBe('Доброе утро, Анна');
    expect(greetingText('', at(9))).toBe('Доброе утро');
  });
});
