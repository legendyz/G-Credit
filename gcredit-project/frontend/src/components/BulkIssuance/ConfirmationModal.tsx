import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmationModalProps {
  isOpen: boolean;
  badgeCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation modal for bulk badge issuance (AC4)
 * Replaces window.confirm() with a proper accessible dialog
 */
export default function ConfirmationModal({
  isOpen,
  badgeCount,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>⚠️</span>
            <span>Confirm Bulk Issuance</span>
          </DialogTitle>
          <DialogDescription>
            You are about to issue <strong>{badgeCount}</strong> badges. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Confirm and Issue
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
