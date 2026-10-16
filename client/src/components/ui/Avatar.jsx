import { useState } from 'react';
import { cn } from '@/lib/cn';

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};

// Цвет фона инициалов стабилен для одного имени
const palette = [
  'bg-type-art/15 text-type-art',
  'bg-type-music/15 text-type-music',
  'bg-type-video/15 text-type-video',
  'bg-type-photo/15 text-type-photo',
  'bg-type-script/15 text-type-script',
  'bg-type-dev/15 text-type-dev',
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
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold ring-1 ring-border',
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
        <span aria-hidden="true">{initialsOf(name) || '?'}</span>
      )}
    </span>
  );
}
