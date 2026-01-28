import React from 'react';

interface TimelineSectionProps {
  issuedAt: string;
  claimedAt: string | null;
  expiresAt: string | null;
}

const TimelineSection: React.FC<TimelineSectionProps> = ({
  issuedAt,
  claimedAt,
  expiresAt,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // AC 4.5: Check if expiration is within 30 days
  const isExpiringNearby = () => {
    if (!expiresAt) return false;
    const daysUntilExpiration = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
  };

  return (
    <section className="px-6 py-6 border-b">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>

      <div className="space-y-3">
        {/* AC 4.5: Issued date */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <div>
            <p className="text-sm font-medium text-gray-900">Issued</p>
            <p className="text-sm text-gray-600">{formatDate(issuedAt)}</p>
          </div>
        </div>

        {/* AC 4.5: Claimed date (if claimed) */}
        {claimedAt && (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Claimed</p>
              <p className="text-sm text-gray-600">{formatDate(claimedAt)}</p>
            </div>
          </div>
        )}

        {/* AC 4.5: Expiration date (if applicable, with warning) */}
        {expiresAt && (
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                isExpiringNearby() ? 'bg-yellow-600' : 'bg-gray-400'
              }`}
            ></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Expires</p>
              <p
                className={`text-sm ${
                  isExpiringNearby() ? 'text-yellow-700 font-semibold' : 'text-gray-600'
                }`}
              >
                {formatDate(expiresAt)}
                {isExpiringNearby() && ' ⚠️ Expiring soon!'}
              </p>
            </div>
          </div>
        )}

        {!expiresAt && (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Validity</p>
              <p className="text-sm text-gray-600">Permanent (no expiration)</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TimelineSection;
