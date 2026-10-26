import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useReducedMotion } from 'framer-motion';
import { ErrorState } from '@/components/ui';
import { BoardSkeleton } from './BoardSkeleton';
import { cn } from '@/lib/cn';
import { TASK_STATUSES, TASK_STATUS_KEYS } from '@/lib/taskMeta';
import { groupByStatus, locate, moveAcross, reorderWithin, toIds } from '../board';
import { useMoveTask, useProjectTasks } from '../hooks/useTasks';
import { QuickAddTask } from './QuickAddTask';
import { SortableTaskCard, TaskCardView } from './TaskCard';

const columnLabel = (status) => `«${TASK_STATUSES[status].label}»`;

/** Где цель перетаскивания: «колонка «В процессе», место 2 из 3». */
const describeOver = (over) => {
  const sortable = over?.data.current?.sortable;
  if (sortable) {
    return `колонка ${columnLabel(sortable.containerId)}, место ${sortable.index + 1} из ${sortable.items.length}`;
  }
  const status = over?.data.current?.status;
  return status ? `колонка ${columnLabel(status)}` : null;
};

const titleOf = (active) => `«${active.data.current?.task?.title ?? 'задача'}»`;

// Объявления для экранных дикторов (по умолчанию dnd-kit говорит по-английски)
const announcements = {
  onDragStart: ({ active }) => `Взята задача ${titleOf(active)}: ${describeOver(active)}.`,
  onDragOver: ({ active, over }) =>
    over
      ? `Задача ${titleOf(active)}: ${describeOver(over)}.`
      : `Задача ${titleOf(active)} вне колонок.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `Задача ${titleOf(active)} положена: ${describeOver(over)}.`
      : `Задача ${titleOf(active)} вернулась на место.`,
  onDragCancel: ({ active }) =>
    `Перемещение отменено. Задача ${titleOf(active)} вернулась на место.`,
};

const screenReaderInstructions = {
  draggable:
    'Пробел — взять задачу. Стрелки вверх и вниз — место в колонке, влево и вправо — другая колонка. ' +
    'Пробел — положить, Escape — отменить. Enter открывает задачу.',
};

// Только просмотр: без датчиков (undefined включил бы датчики по умолчанию)
const NO_SENSORS = [];

/**
 * Клавиатура на доске: ←/→ — в начало соседней колонки, ↑/↓ — соседнее место в колонке.
 * Стандартный sortableKeyboardCoordinates рассчитан на один список и между колонками
 * карточку не переносит.
 */
const boardKeyboardCoordinates = (event, args) => {
  const { active, over, droppableRects } = args.context;
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.code];
  if (!step) return sortableKeyboardCoordinates(event, args);

  event.preventDefault();
  const current =
    over?.data.current?.sortable?.containerId ??
    over?.data.current?.status ??
    active?.data.current?.sortable?.containerId;
  const target = TASK_STATUS_KEYS[TASK_STATUS_KEYS.indexOf(current) + step];
  const rect = target && droppableRects.get(target);
  // Левый верхний угол колонки — ближайшей окажется её первая карточка (или пустая колонка)
  return rect ? { x: rect.left, y: rect.top } : undefined;
};

const dropAnimation = {
  duration: 200,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
};

function BoardColumn({ status, ids, tasksById, projectId, readOnly, onOpenTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'column', status },
    disabled: readOnly,
  });
  const headingId = `board-column-${status}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-[82%] shrink-0 snap-start flex-col gap-2 rounded-xl bg-surface-2/60 p-2 xs:w-72 lg:w-auto"
    >
      <header className="flex items-center gap-2 px-1.5 pt-1">
        <span
          className={cn('size-2 shrink-0 rounded-full', TASK_STATUSES[status].dot)}
          aria-hidden="true"
        />
        <h3 id={headingId} className="text-sm font-semibold text-fg">
          {TASK_STATUSES[status].label}
        </h3>
        <span className="rounded-full bg-surface px-1.5 text-xs tabular-nums text-muted">
          <span className="sr-only">задач: </span>
          {ids.length}
        </span>
      </header>

      <SortableContext id={status} items={ids} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn(
            'flex min-h-24 flex-1 flex-col gap-2 rounded-lg p-0.5 transition-colors duration-150',
            isOver && 'bg-surface/70',
          )}
        >
          {ids.map((id) => (
            <li key={id}>
              <SortableTaskCard task={tasksById.get(id)} disabled={readOnly} onOpen={onOpenTask} />
            </li>
          ))}
          {ids.length === 0 && (
            <li
              aria-hidden="true"
              className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted"
            >
              {readOnly ? 'Пусто' : 'Перетащите сюда'}
            </li>
          )}
        </ul>
      </SortableContext>

      {!readOnly && <QuickAddTask projectId={projectId} status={status} />}
    </section>
  );
}

/**
 * Kanban-доска проекта. Пока карточку тащат, порядок живёт в локальном состоянии
 * (dragColumns); при «отпускании» он сразу пишется в кэш, а на сервер уходит запрос.
 */
export function BoardView({ projectId, readOnly = false, onOpenTask }) {
  const { data: tasks, isPending, error, refetch, isRefetching } = useProjectTasks(projectId);
  const moveTask = useMoveTask(projectId);
  const [dragColumns, setDragColumns] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const reduceMotion = useReducedMotion();

  const sensors = useSensors(
    // Мышь: перетаскивание после сдвига на 5 px — обычный клик открывает задачу
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Палец: удержание 150 мс — иначе нельзя было бы прокрутить страницу по карточкам
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: boardKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  if (isPending) return <BoardSkeleton />;
  if (error) {
    return (
      <ErrorState
        title="Не удалось загрузить задачи"
        error={error}
        onRetry={refetch}
        retrying={isRefetching}
      />
    );
  }

  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const cacheColumns = toIds(groupByStatus(tasks));
  const columns = dragColumns ?? cacheColumns;
  const activeTask = activeId ? tasksById.get(activeId) : null;

  const reset = () => {
    setActiveId(null);
    setDragColumns(null);
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
    setDragColumns(cacheColumns);
  };

  // Над другой колонкой — карточка сразу «переезжает» туда, соседи расступаются
  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    setDragColumns((current) => current && moveAcross(current, active.id, over.id));
  };

  const handleDragEnd = ({ active, over }) => {
    const final = over && dragColumns ? reorderWithin(dragColumns, active.id, over.id) : null;
    reset();
    if (!final) return;

    const to = locate(final, active.id);
    const from = locate(cacheColumns, active.id);
    if (!to || (to.status === from?.status && to.index === from.index)) return;
    moveTask.move({ id: active.id, status: to.status, index: to.index });
  };

  return (
    <DndContext
      sensors={readOnly ? NO_SENSORS : sensors}
      collisionDetection={closestCorners}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={reset}
    >
      <div
        className={cn(
          // Телефон: колонки листаются вбок с «примагничиванием»; от 1024 px — сетка 4 колонки.
          // relative — чтобы sr-only-тексты внутри (position: absolute) прокручивались вместе
          // с лентой, а не растягивали страницу вширь
          'relative -mx-4 flex scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0',
          // Во время перетаскивания «магнит» мешал бы автопрокрутке
          activeId ? 'snap-none' : 'snap-x snap-mandatory',
        )}
      >
        {TASK_STATUS_KEYS.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            ids={columns[status]}
            tasksById={tasksById}
            projectId={projectId}
            readOnly={readOnly}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={reduceMotion ? null : dropAnimation}>
        {activeTask && <TaskCardView task={activeTask} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
