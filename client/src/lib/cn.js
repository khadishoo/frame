import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Склеивает классы и разрешает конфликты Tailwind:
 * cn('px-2 text-sm', isLarge && 'px-4') → 'text-sm px-4'
 */
export const cn = (...inputs) => twMerge(clsx(inputs));
