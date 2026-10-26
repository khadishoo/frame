import { CalendarClock, Flag } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import { describeDue } from '@/lib/dates';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/taskMeta';

/** Бейдж приоритета: серый · синий · янтарный · красный. */
export function PriorityBadge({ priority, className }) {
  const meta = TASK_PRIORITIES[priority];
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full px-1.5 text-xs font-medium',
        meta.chip,
        className,
      )}
      title={`Приоритет: ${meta.label.toLowerCase()}`}
    >
      <Flag className="size-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

const dueTones = {
  overdue: 'font-medium text-danger',
  soon: 'font-medium text-warning',
  normal: 'text-muted',
  done: 'text-muted line-through decoration-muted/50',
};

/** Дедлайн по-человечески: «Сегодня», «Завтра», «Просрочено на 3 дня», «12 дек». */
export function TaskDue({ task, className }) {
  const due = describeDue(task.dueDate, { completed: task.status === 'done' });
  if (!due) return null;
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs', dueTones[due.tone], className)}
      title={due.title}
      data-tone={due.tone}
    >
      <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
      {due.label}
    </span>
  );
}

export function AssigneeAvatar({ assignee, size = 'xs', className }) {
  if (!assignee) return null;
  return (
    <span title={`Исполнитель: ${assignee.name}`} className={cn('inline-flex', className)}>
      <Avatar src={assignee.avatarUrl} name={assignee.name} size={size} />
    </span>
  );
}

export function StatusDot({ status, className }) {
  return (
    <span
      className={cn('size-2 shrink-0 rounded-full', TASK_STATUSES[status].dot, className)}
      aria-hidden="true"
    />
  );
}
