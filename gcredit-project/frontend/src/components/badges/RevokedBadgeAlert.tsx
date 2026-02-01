import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface RevokedBadgeAlertProps {
  revokedAt: string;
  reason: string;
  notes?: string;
  isPublicReason: boolean;
  revokedBy?: { name: string; role: string } | null;
}

export function RevokedBadgeAlert({ revokedAt, reason, notes, isPublicReason, revokedBy }: RevokedBadgeAlertProps) {
  const formattedDate = format(new Date(revokedAt), 'MMMM d, yyyy');

  return (
    <Alert 
      role="alert" 
      className="bg-red-100 border-red-500 text-red-900 mb-6"
    >
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <AlertTitle className="text-xl font-bold">
        BADGE REVOKED
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p className="font-semibold">
          This badge was revoked on {formattedDate}
        </p>
        
        {isPublicReason ? (
          <>
            <p>
              <span className="font-medium">Reason:</span> {reason}
            </p>
            {notes && (
              <p className="text-sm mt-1">
                <span className="font-medium">Notes:</span> {notes}
              </p>
            )}
            {revokedBy && (
              <p className="text-sm mt-1">
                <span className="font-medium">Revoked by:</span> {revokedBy.name} ({revokedBy.role})
              </p>
            )}
          </>
        ) : (
          <p className="italic">
            This badge has been revoked.
          </p>
        )}
        
        <p className="text-sm mt-4 border-t border-red-300 pt-2">
          Original badge information is shown below for historical reference only.
        </p>
      </AlertDescription>
    </Alert>
  );
}
