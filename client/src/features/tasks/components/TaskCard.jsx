import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/cn';
import { AssigneeAvatar, PriorityBadge, TaskDue } from './TaskBits';

/**
 * Карточка задачи (только вид). overlay — «приподнятая» копия под курсором при перетаскивании,
 * placeholder — место, куда карточка встанет.
 */
export function TaskCardView({ task, overlay = false, placeholder = false, className, ...props }) {
  const done = task.status === 'done';
  return (
    <div
      className={cn(
        'group flex select-none flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left shadow-soft',
        'transition-[box-shadow,border-color,opacity] duration-150',
        !overlay && !placeholder && 'hover:border-muted/40',
        overlay && 'rotate-2 scale-[1.03] cursor-grabbing shadow-pop',
        placeholder && 'border-dashed opacity-40 shadow-none',
        task.pending && 'opacity-60',
        className,
      )}
      {...props}
    >
      <p
        className={cn(
          'line-clamp-3 break-words text-sm font-medium text-fg',
          done && 'text-muted line-through decoration-muted/50',
        )}
      >
        {task.title}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <PriorityBadge priority={task.priority} />
        <TaskDue task={task} />
        <AssigneeAvatar assignee={task.assignee} className="ml-auto" />
      </div>
    </div>
  );
}

/**
 * Карточка на доске: перетаскивается мышью, пальцем (после 150 мс) и с клавиатуры
 * (Пробел — взять/положить). Клик или Enter открывает задачу.
 */
export function SortableTaskCard({ task, disabled, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
    disabled: disabled || task.pending,
    attributes: { roleDescription: 'перетаскиваемая задача' },
  });

  const open = () => {
    if (!task.pending) onOpen(task);
  };

  return (
    <TaskCardView
      ref={setNodeRef}
      task={task}
      placeholder={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'focus-ring touch-manipulation',
        disabled || task.pending ? 'cursor-pointer' : 'cursor-grab',
      )}
      {...attributes}
      {...listeners}
      aria-busy={task.pending || undefined}
      // Перетаскивание может быть выключено (архив), но открыть задачу можно всегда
      aria-disabled={undefined}
      onClick={open}
      onKeyDown={(event) => {
        // Enter открывает задачу; Пробел обрабатывает dnd-kit (взять карточку)
        if (event.key === 'Enter' && !isDragging) {
          event.preventDefault();
          open();
          return;
        }
        listeners?.onKeyDown?.(event);
      }}
    />
  );
}
