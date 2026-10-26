import { useState } from 'react';
import { cn } from '@/lib/cn';

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};

// Цвет фона инициалов стабилен для одного имени. Сами инициалы — text-fg: цветной текст
// на бледном фоне того же цвета не набирает контраста 4.5:1 (у кораллового — 2.5)
const palette = [
  'bg-type-art/25',
  'bg-type-music/25',
  'bg-type-video/25',
  'bg-type-photo/25',
  'bg-type-script/25',
  'bg-type-dev/25',
];

const colorFor = (name = '') => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)) | 0;
  return palette[Math.abs(hash) % palette.length];
};

const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/** Аватар: картинка, а если её нет или она не загрузилась — инициалы. */
export function Avatar({ src, name = '', size = 'md', className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && failedSrc !== src;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-fg ring-1 ring-border',
        !showImage && colorFor(name),
        sizes[size],
        className,
      )}
      role="img"
      aria-label={name || 'Аватар'}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        // Инициалы — через CSS content, а не текстом: имя аватара уже в aria-label, а видимый
        // текст «АБ» внутри кнопки с подписью «Меню пользователя …» не совпадал бы с ней (WCAG 2.5.3)
        <span
          aria-hidden="true"
          data-initials={initialsOf(name) || '?'}
          className="before:content-[attr(data-initials)]"
        />
      )}
    </span>
  );
}
