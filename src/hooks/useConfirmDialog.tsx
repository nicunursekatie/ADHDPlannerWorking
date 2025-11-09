import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmButtonVariant?: 'primary' | 'danger' | 'secondary';
}

// This interface defines the props that the ConfirmDialog component will receive.
interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    confirmButtonVariant?: 'primary' | 'danger' | 'secondary';
}

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolvePromise?.(true);
    setOptions(null);
    setResolvePromise(null);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    resolvePromise?.(false);
    setOptions(null);
    setResolvePromise(null);
  }, [resolvePromise]);

  // The hook now returns the props for the dialog, not a component.
  const dialogProps: DialogProps | null = options
    ? {
        isOpen: true,
        onClose: handleCancel,
        onConfirm: handleConfirm,
        ...options,
      }
    : null;

  return {
    confirm,
    dialogProps, // Return props for the dialog
  };
}
