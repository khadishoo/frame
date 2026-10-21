import { Button, Modal } from '@/components/ui';

/** Диалог «уйти без сохранения?» для blocker из useUnsavedChanges. */
export function UnsavedChangesDialog({ blocker }) {
  const open = blocker.state === 'blocked';

  return (
    <Modal
      open={open}
      onClose={() => blocker.reset?.()}
      size="sm"
      hideClose
      title="Уйти без сохранения?"
      description="Изменения профиля ещё не сохранены — если уйти, они пропадут."
      footer={
        <>
          <Button variant="secondary" onClick={() => blocker.reset?.()}>
            Остаться
          </Button>
          <Button variant="danger" onClick={() => blocker.proceed?.()}>
            Уйти без сохранения
          </Button>
        </>
      }
    />
  );
}
