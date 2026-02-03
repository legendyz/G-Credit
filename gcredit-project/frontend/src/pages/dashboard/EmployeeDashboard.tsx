/**
 * EmployeeDashboard Component - Story 8.1 (AC1)
 * 
 * Dashboard for Employee role showing:
 * - Badge summary with total, claimed this month, pending
 * - Current milestone progress
 * - Recent badges earned
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useEmployeeDashboard } from '../../hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ErrorDisplay } from '../../components/common/ErrorDisplay';
import { EmptyState, NoBadgesState } from '../../components/common/EmptyState';
import { BadgeEarnedCelebration } from '../../components/common/CelebrationModal';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

// Celebration tracking localStorage key (AC1 requirement)
const CELEBRATED_BADGES_KEY = 'celebratedBadges';

/**
 * Get list of badge IDs that have already been celebrated
 */
function getCelebratedBadges(): string[] {
  try {
    const stored = localStorage.getItem(CELEBRATED_BADGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Mark a badge as celebrated in localStorage
 */
function markBadgeAsCelebrated(badgeId: string): void {
  const celebrated = getCelebratedBadges();
  if (!celebrated.includes(badgeId)) {
    localStorage.setItem(CELEBRATED_BADGES_KEY, JSON.stringify([...celebrated, badgeId]));
  }
}

/**
 * Check if a badge was issued within the last N minutes
 */
function wasIssuedRecently(issuedAt: string, minutesAgo: number = 5): boolean {
  const issuedDate = new Date(issuedAt);
  const now = new Date();
  const diffMs = now.getTime() - issuedDate.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes <= minutesAgo;
}

/**
 * Get progress bar color based on percentage (AC1 requirement)
 * 0-25%: red, 25-75%: yellow, 75-100%: green
 */
function getProgressBarColor(percentage: number): string {
  if (percentage < 25) {
    return 'bg-red-500';
  } else if (percentage < 75) {
    return 'bg-yellow-500';
  } else {
    return 'bg-green-500';
  }
}

export const EmployeeDashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useEmployeeDashboard();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingBadgeId, setCelebratingBadgeId] = useState<string | null>(null);
  const navigate = useNavigate();

  // AC1: Celebration feedback - trigger for recently issued uncelebrated badges
  const checkAndTriggerCelebration = useCallback(() => {
    if (!data?.badgeSummary?.latestBadge) return;
    
    const latestBadge = data.badgeSummary.latestBadge;
    const celebratedBadges = getCelebratedBadges();
    
    // Check if badge was issued within last 5 minutes and not yet celebrated
    if (
      latestBadge.id &&
      !celebratedBadges.includes(latestBadge.id) &&
      wasIssuedRecently(latestBadge.issuedAt, 5)
    ) {
      setCelebratingBadgeId(latestBadge.id);
      setShowCelebration(true);
    }
  }, [data]);

  // Trigger celebration check when data loads
  useEffect(() => {
    checkAndTriggerCelebration();
  }, [checkAndTriggerCelebration]);

  // Mark badge as celebrated when modal closes
  const handleCelebrationClose = useCallback(() => {
    if (celebratingBadgeId) {
      markBadgeAsCelebrated(celebratingBadgeId);
    }
    setShowCelebration(false);
    setCelebratingBadgeId(null);
  }, [celebratingBadgeId]);

  if (isLoading) {
    return <PageLoader text="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load dashboard"
        message={error instanceof Error ? error.message : 'An unexpected error occurred'}
        onRetry={() => refetch()}
        variant="page"
      />
    );
  }

  if (!data) {
    return <NoBadgesState onExplore={() => navigate('/badges')} />;
  }

  const { badgeSummary, currentMilestone, recentBadges } = data;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
          My Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your badges and achievements
        </p>
      </div>

      {/* Badge Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Badges"
          value={badgeSummary.total}
          icon="🏆"
          description="All time"
        />
        <SummaryCard
          title="Claimed This Month"
          value={badgeSummary.claimedThisMonth}
          icon="📈"
          description="Keep earning!"
        />
        <SummaryCard
          title="Pending Claims"
          value={badgeSummary.pendingCount}
          icon="⏳"
          description={badgeSummary.pendingCount > 0 ? 'Claim now!' : 'All caught up'}
          highlight={badgeSummary.pendingCount > 0}
        />
        <SummaryCard
          title="Latest Badge"
          value={badgeSummary.latestBadge?.templateName || 'None yet'}
          icon="🎖️"
          description={badgeSummary.latestBadge ? 'Just earned' : 'Start earning'}
          isText
        />
      </div>

      {/* Milestone Progress */}
      {currentMilestone && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{currentMilestone.icon || '🏅'}</span>
              {currentMilestone.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {currentMilestone.progress} / {currentMilestone.target}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    getProgressBarColor(currentMilestone.percentage)
                  )}
                  style={{ width: `${currentMilestone.percentage}%` }}
                  role="progressbar"
                  aria-valuenow={currentMilestone.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${currentMilestone.percentage}% complete`}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {currentMilestone.percentage === 100
                  ? '🎉 Milestone completed!'
                  : `${currentMilestone.target - currentMilestone.progress} more to reach this milestone`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Badges</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBadges.length === 0 ? (
            <EmptyState
              icon="🏅"
              title="No badges yet"
              description="Start earning badges by completing skills and achievements."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Celebration Modal */}
      <BadgeEarnedCelebration
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        badgeName={badgeSummary.latestBadge?.templateName || ''}
        badgeImageUrl={badgeSummary.latestBadge?.imageUrl}
        onViewBadge={() => {
          handleCelebrationClose();
          navigate('/wallet');
        }}
      />
    </div>
  );
};

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: string;
  description?: string;
  highlight?: boolean;
  isText?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  description,
  highlight,
  isText,
}) => (
  <Card className={cn(highlight && 'border-primary bg-primary/5')}>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p
            className={cn(
              'font-bold mt-1',
              isText ? 'text-lg' : 'text-3xl'
            )}
          >
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      </div>
    </CardContent>
  </Card>
);

// Badge Card Component
interface BadgeCardProps {
  badge: {
    id: string;
    templateName: string;
    imageUrl?: string;
    status: string;
    issuedAt: string;
    claimedAt?: string;
  };
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const statusColors = {
    CLAIMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {badge.imageUrl ? (
        <img
          src={badge.imageUrl}
          alt={badge.templateName}
          className="w-12 h-12 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-2xl">🏆</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{badge.templateName}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              statusColors[badge.status as keyof typeof statusColors] || statusColors.PENDING
            )}
          >
            {badge.status}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(badge.issuedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
