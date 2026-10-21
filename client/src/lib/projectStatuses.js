/** Рабочие статусы проекта (архив — отдельно, полем archivedAt). */
export const PROJECT_STATUSES = {
  idea: { label: 'Идея', badge: 'outline' },
  active: { label: 'В работе', badge: 'success' },
  paused: { label: 'На паузе', badge: 'warning' },
  completed: { label: 'Завершён', badge: 'neutral' },
};

export const PROJECT_STATUS_KEYS = Object.keys(PROJECT_STATUSES);

export const statusOptions = PROJECT_STATUS_KEYS.map((value) => ({
  value,
  label: PROJECT_STATUSES[value].label,
}));
