import {
  CalendarDays,
  ChartColumn,
  FolderKanban,
  House,
  Lightbulb,
  ListChecks,
  Settings,
  Star,
  Users,
} from 'lucide-react';

// Единый источник пунктов меню для Sidebar, выдвижного меню и нижнего таб-бара
export const mainNav = [
  { to: '/app', label: 'Дашборд', shortLabel: 'Главная', icon: House, end: true },
  { to: '/app/projects', label: 'Проекты', icon: FolderKanban },
  { to: '/app/tasks', label: 'Мои задачи', shortLabel: 'Задачи', icon: ListChecks },
  { to: '/app/calendar', label: 'Календарь', icon: CalendarDays },
  { to: '/app/ideas', label: 'Идеи', icon: Lightbulb },
  { to: '/app/favorites', label: 'Избранное', icon: Star },
  { to: '/app/analytics', label: 'Аналитика', icon: ChartColumn },
];

export const secondaryNav = [
  { to: '/app/workspace/settings', label: 'Пространство', icon: Users },
  { to: '/app/settings', label: 'Настройки', icon: Settings },
];

// Нижний таб-бар на телефонах: самые частые разделы
export const mobileTabs = [
  '/app',
  '/app/projects',
  '/app/tasks',
  '/app/ideas',
  '/app/calendar',
].map((to) => mainNav.find((item) => item.to === to));
