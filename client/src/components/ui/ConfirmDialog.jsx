import { useRef, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

/**
 * Подтверждение действия. onConfirm может вернуть промис — пока он выполняется,
 * кнопка показывает загрузку. Для опасных действий фокус ставится на «Отмена».
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
}) {
  const [pending, setPending] = useState(false);
  const cancelRef = useRef(null);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm?.();
      onClose();
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
      initialFocusRef={danger ? cancelRef : undefined}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={pending}>
            {cancelText}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={handleConfirm} loading={pending}>
            {confirmText}
          </Button>
        </>
      }
    />
  );
}
