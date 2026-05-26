import { cn } from '@/lib/utils';

export interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  showBackdrop?: boolean;
}

export function Modal({
  children,
  isOpen,
  onClose,
  className,
  showBackdrop = true,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {showBackdrop && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70" />
      )}

      <div
        className={cn(
          'relative rounded-lg border border-gray-200 bg-white p-6 shadow-lg',
          'dark:border-gray-700 dark:bg-gray-900 dark:shadow-xl',
          'max-h-[90vh] w-full max-w-md overflow-y-auto',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
