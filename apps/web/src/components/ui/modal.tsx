import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

export interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  showBackdrop?: boolean;
}

export function Modal({ children, isOpen, onClose, className, showBackdrop = true }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) as NodeListOf<HTMLElement>;

        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Focus the first element on open
    setTimeout(() => {
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) as NodeListOf<HTMLElement>;
        if (focusableElements.length > 0) focusableElements[0].focus();
      }
    }, 10);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
    >
      {showBackdrop && <div className='fixed inset-0 bg-black/50 dark:bg-black/70' />}

      <div
        className={cn(
          'relative rounded-lg border border-gray-200 bg-white p-6 shadow-lg',
          'dark:border-gray-700 dark:bg-gray-900 dark:shadow-xl',
          'max-h-[80vh] w-full max-w-md overflow-y-auto',
          className,
        )}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
