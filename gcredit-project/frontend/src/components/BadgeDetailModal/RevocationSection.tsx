import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface RevocationSectionProps {
  revokedAt: string;
  revocationReason: string;
  revocationNotes?: string | null;
  isPublicReason: boolean;
  revokedBy?: {
    name: string;
    role: string;
  } | null;
}

/**
 * Story 9.3 AC2: Revocation Details Section
 * Displays categorized revocation information in badge detail modal
 */
const RevocationSection: React.FC<RevocationSectionProps> = ({
  revokedAt,
  revocationReason,
  revocationNotes,
  isPublicReason,
  revokedBy,
}) => {
  const formattedDate = new Date(revokedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="px-6 py-4 bg-red-50 border-l-4 border-red-600">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-900 mb-2">🚫 Badge Revoked</h3>

          <p className="text-red-800 mb-3">This badge was revoked on {formattedDate}</p>

          {/* Story 9.3 Decision #2: Categorized reason display */}
          {isPublicReason ? (
            <>
              <div className="mb-2">
                <span className="font-semibold text-red-900">Reason:</span>
                <span className="text-red-800 ml-2">{revocationReason}</span>
              </div>

              {revocationNotes && (
                <div className="mb-2">
                  <span className="font-semibold text-red-900">Notes:</span>
                  <p className="text-red-800 text-sm mt-1">{revocationNotes}</p>
                </div>
              )}

              {revokedBy && (
                <div className="text-sm text-red-700 mt-3">
                  Revoked by {revokedBy.name} ({revokedBy.role})
                </div>
              )}
            </>
          ) : (
            <p className="text-red-800 italic">
              This badge has been revoked. Contact admin@gcredit.com for details.
            </p>
          )}

          <div className="mt-4 pt-3 border-t border-red-200">
            <p className="text-sm text-red-700">
              Original badge information is shown below for historical reference only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevocationSection;
