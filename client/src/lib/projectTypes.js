import { Brush, Camera, Clapperboard, CodeXml, Feather, Music, Shapes } from 'lucide-react';

/**
 * Творческие типы проектов (PLAN.md 1.1, часть 6).
 * Классы записаны целиком, чтобы Tailwind нашёл их при сборке.
 */
export const PROJECT_TYPES = {
  art: {
    label: 'Рисунок',
    icon: Brush,
    dot: 'bg-type-art',
    text: 'text-type-art',
    soft: 'bg-type-art/10',
  },
  music: {
    label: 'Музыка',
    icon: Music,
    dot: 'bg-type-music',
    text: 'text-type-music',
    soft: 'bg-type-music/10',
  },
  video: {
    label: 'Видео',
    icon: Clapperboard,
    dot: 'bg-type-video',
    text: 'text-type-video',
    soft: 'bg-type-video/10',
  },
  photo: {
    label: 'Фото',
    icon: Camera,
    dot: 'bg-type-photo',
    text: 'text-type-photo',
    soft: 'bg-type-photo/10',
  },
  script: {
    label: 'Сценарий',
    icon: Feather,
    dot: 'bg-type-script',
    text: 'text-type-script',
    soft: 'bg-type-script/10',
  },
  dev: {
    label: 'Разработка',
    icon: CodeXml,
    dot: 'bg-type-dev',
    text: 'text-type-dev',
    soft: 'bg-type-dev/10',
  },
  other: {
    label: 'Другое',
    icon: Shapes,
    dot: 'bg-type-other',
    text: 'text-type-other',
    soft: 'bg-type-other/10',
  },
};

export const PROJECT_TYPE_KEYS = Object.keys(PROJECT_TYPES);
