import React, { useState, useEffect } from 'react';

interface SimilarBadge {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  issuerName: string;
  badgeCount: number;
  similarityScore: number;
}

interface SimilarBadgesSectionProps {
  badgeId: string;
  onBadgeClick?: (badgeId: string) => void;
}

const SimilarBadgesSection: React.FC<SimilarBadgesSectionProps> = ({
  badgeId,
  onBadgeClick,
}) => {
  const [similarBadges, setSimilarBadges] = useState<SimilarBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSimilarBadges();
  }, [badgeId]);

  const fetchSimilarBadges = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:3000/api/badges/${badgeId}/similar?limit=6`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch similar badges');
      }

      const data = await response.json();
      setSimilarBadges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (templateId: string) => {
    if (onBadgeClick) {
      onBadgeClick(templateId);
    } else {
      // Default: open in new tab (for MVP, can route to template details later)
      window.open(`/badges/templates/${templateId}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="py-6 border-t">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex gap-4 overflow-x-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-[200px] h-[240px] bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // AC 5.11: Hide section if no similar badges
  if (similarBadges.length === 0 || error) {
    return null;
  }

  return (
    <section className="px-6 py-6 border-t border-gray-200">
      {/* AC 5.8: Section heading */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span>üéØ</span>
        <span>Similar Badges You Might Like</span>
      </h3>

      {/* AC 5.8: Horizontal scrollable row */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth">
        {similarBadges.map((badge) => (
          <div
            key={badge.id}
            className="flex-shrink-0 w-[200px] p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer snap-start"
            onClick={() => handleCardClick(badge.id)}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${badge.name}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(badge.id);
              }
            }}
          >
            {/* AC 5.9: Badge image */}
            <div className="mb-3 flex justify-center">
              {badge.imageUrl ? (
                <img
                  src={badge.imageUrl}
                  alt={badge.name}
                  className="w-32 h-32 object-cover rounded-md"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-4xl">üèÜ</span>
                </div>
              )}
            </div>

            {/* AC 5.9: Badge title */}
            <h4
              className="font-semibold text-center mb-1 truncate text-gray-900"
              title={badge.name}
            >
              {badge.name}
            </h4>

            {/* AC 5.9: Issuer name */}
            <p className="text-sm text-gray-600 text-center mb-3 truncate">
              {badge.issuerName}
            </p>

            {/* AC 5.9: View Details button */}
            <button
              className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick(badge.id);
              }}
              aria-label={`View details for ${badge.name}`}
            >
              View Details
            </button>

            {/* Optional: Show badge count for context */}
            {badge.badgeCount > 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">
                {badge.badgeCount} earned
              </p>
            )}
          </div>
        ))}
      </div>

      {/* AC 5.8: Scroll hint for mobile */}
      {similarBadges.length > 1 && (
        <p className="text-xs text-gray-500 text-center mt-2">
          ‚Ü?Scroll to see more ‚Ü?
        </p>
      )}
    </section>
  );
};

export default SimilarBadgesSection;
