/**
 * NavigationGuardDialog — Styled AlertDialog for unsaved-changes warning
 * Story 15.12: Dirty-Form Guard
 *
 * Displays a shadcn/ui AlertDialog when the user attempts to navigate
 * away from a page with unsaved form changes.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TriangleAlert } from 'lucide-react';

interface NavigationGuardDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function NavigationGuardDialog({ open, onStay, onLeave }: NavigationGuardDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onStay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-amber-500" />
            Unsaved Changes
          </AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes that will be lost if you leave this page. Are you sure you want
            to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStay}>Stay on Page</AlertDialogCancel>
          <AlertDialogAction
            onClick={onLeave}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Leave Page
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
