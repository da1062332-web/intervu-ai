import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface DeleteSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteSectionDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: DeleteSectionDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose}>
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Section?</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone. Are you sure you want to delete this section?
          </p>
        </div>
        <div className="flex items-center justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
