'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export interface ConfirmationDialogProps {
  title: string;
  description?: string;
  trigger?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  destructive?: boolean;
}

export function ConfirmationDialog({
  title,
  description,
  trigger,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  isLoading,
  isOpen,
  onOpenChange,
  destructive = false,
}: ConfirmationDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (onCancel) {
      onCancel();
    }
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            variant={destructive ? 'destructive' : 'default'}
          >
            {isLoading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
