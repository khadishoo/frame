import { CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { describeDue } from '@/lib/dates';
import { labelColor } from '@/lib/labelColors';
import { PROJECT_STATUSES } from '@/lib/projectStatuses';

/** Чип категории или тега в его цвете. */
export function LabelChip({ label, kind = 'tag', className }) {
  const color = labelColor(label.color);
  return (
    <span
      className={cn(
        'inline-flex h-6 max-w-40 items-center gap-1.5 rounded-full px-2 text-xs font-medium',
        color.chip,
        className,
      )}
      title={kind === 'category' ? `Категория: ${label.name}` : `Тег: ${label.name}`}
    >
      {kind === 'category' && (
        <span className={cn('size-1.5 shrink-0 rounded-full', color.dot)} aria-hidden="true" />
      )}
      <span className="truncate">{kind === 'tag' ? `#${label.name}` : label.name}</span>
    </span>
  );
}

/** До max тегов и «+N» для остальных. */
export function TagList({ tags, max = 3, className }) {
  if (!tags?.length) return null;
  const visible = tags.slice(0, max);
  const hidden = tags.length - visible.length;
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visible.map((tag) => (
        <LabelChip key={tag.id} label={tag} />
      ))}
      {hidden > 0 && (
        <span
          className="inline-flex h-6 items-center rounded-full bg-surface-2 px-2 text-xs font-medium text-muted"
          title={tags
            .slice(max)
            .map((t) => t.name)
            .join(', ')}
        >
          +{hidden}
        </span>
      )}
    </div>
  );
}

const dueTones = {
  overdue: 'font-medium text-danger',
  soon: 'font-medium text-warning',
  normal: 'text-muted',
  done: 'text-muted line-through decoration-muted/50',
};

/** Дедлайн: «Просрочено на 2 дня» красным, «через 3 дня», «12 дек». */
export function DueDate({ project, className }) {
  const due = describeDue(project.dueDate, { completed: project.status === 'completed' });
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

export function StatusBadge({ project, className }) {
  if (project.archivedAt) {
    return (
      <Badge variant="outline" className={className}>
        В архиве
      </Badge>
    );
  }
  const status = PROJECT_STATUSES[project.status];
  return (
    <Badge variant={status.badge} dot={project.status === 'active'} className={className}>
      {status.label}
    </Badge>
  );
}
