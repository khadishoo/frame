import { splitMatches } from './results';

/** Текст с подсвеченными совпадениями (<mark>). */
export function Highlight({ text, query }) {
  return splitMatches(text, query).map((part, i) =>
    part.match ? (
      <mark key={i} className="rounded-sm bg-warning/25 px-px text-fg">
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  );
}
