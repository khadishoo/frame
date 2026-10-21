import { useId, useRef, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

/**
 * Подтверждение действия. onConfirm может вернуть промис — пока он выполняется,
 * кнопка показывает загрузку. Если onConfirm бросил ошибку, окно остаётся открытым
 * (ошибку показывает вызывающий код, например под полем пароля в children).
 * children — дополнительное содержимое (поле пароля и т. п.); Enter подтверждает.
 * Для опасных действий фокус ставится на «Отмена», если внутри нет своих полей.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Вы уверены?',
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  danger = false,
  confirmDisabled = false,
  initialFocusRef,
  children,
}) {
  const [pending, setPending] = useState(false);
  const cancelRef = useRef(null);
  const formId = useId();

  const handleConfirm = async (event) => {
    event?.preventDefault();
    if (pending || confirmDisabled) return;
    setPending(true);
    try {
      await onConfirm?.();
      onClose();
    } catch {
      // Окно остаётся открытым — ошибку уже показал вызывающий код
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={pending ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      hideClose
      initialFocusRef={initialFocusRef ?? (danger ? cancelRef : undefined)}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={pending}>
            {cancelText}
          </Button>
          <Button
            // С полями внутри — кнопка отправляет форму (работает Enter), без полей — просто клик
            type={children ? 'submit' : 'button'}
            form={children ? formId : undefined}
            onClick={children ? undefined : handleConfirm}
            variant={danger ? 'danger' : 'primary'}
            loading={pending}
            disabled={confirmDisabled}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {children && (
        <form id={formId} onSubmit={handleConfirm} noValidate>
          {children}
        </form>
      )}
    </Modal>
  );
}
