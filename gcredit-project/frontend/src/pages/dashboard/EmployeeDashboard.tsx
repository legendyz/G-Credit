/**
 * EmployeeDashboard Component - Story 8.1 (AC1)
 * 
 * Dashboard for Employee role showing:
 * - Badge summary with total, claimed this month, pending
 * - Current milestone progress
 * - Recent badges earned
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEmployeeDashboard } from '../../hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ErrorDisplay } from '../../components/common/ErrorDisplay';
import { EmptyState, NoBadgesState } from '../../components/common/EmptyState';
import { BadgeEarnedCelebration } from '../../components/common/CelebrationModal';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Wallet, Search, CheckCircle } from 'lucide-react';

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
  const { data, isLoading, error, refetch, isFetching } = useEmployeeDashboard();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingBadgeId, setCelebratingBadgeId] = useState<string | null>(null);
  const [highlightedBadgeId, setHighlightedBadgeId] = useState<string | null>(null);
  const navigate = useNavigate();
  const latestBadgeRef = useRef<HTMLDivElement>(null);

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
      setHighlightedBadgeId(latestBadge.id);
      setShowCelebration(true);
      
      // AC6: Auto-scroll to latest badge section after celebration starts
      setTimeout(() => {
        latestBadgeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
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
    // Keep highlight for a few seconds after modal closes
    setTimeout(() => setHighlightedBadgeId(null), 5000);
  }, [celebratingBadgeId]);

  // AC1: Manual refresh handler
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
    return <NoBadgesState onExplore={() => navigate('/wallet')} />;
  }

  const { badgeSummary, currentMilestone, recentBadges, recentAchievements } = data;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Page Header with Refresh Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            My Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your badges and achievements
          </p>
        </div>
        {/* AC1: Manual refresh button (desktop) */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          className="hidden sm:flex items-center gap-2"
          aria-label="Refresh dashboard"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* AC1: Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/wallet')}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <Wallet className="h-4 w-4" />
              View All My Badges
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/wallet')}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <Search className="h-4 w-4" />
              Browse Badge Catalog
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* AC1: Latest Badge Preview with Claim Button and Highlight */}
      {badgeSummary.latestBadge && (
        <div ref={latestBadgeRef}>
          <Card className={cn(
            'transition-all duration-500',
            highlightedBadgeId === badgeSummary.latestBadge.id && 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950'
          )}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {highlightedBadgeId === badgeSummary.latestBadge.id && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                Latest Badge
                {highlightedBadgeId === badgeSummary.latestBadge.id && (
                  <span className="text-sm font-normal text-green-600 dark:text-green-400">
                    Congratulations!
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {badgeSummary.latestBadge.imageUrl ? (
                  <img
                    src={badgeSummary.latestBadge.imageUrl}
                    alt={badgeSummary.latestBadge.templateName}
                    className={cn(
                      'w-16 h-16 rounded-lg object-cover',
                      highlightedBadgeId === badgeSummary.latestBadge.id && 'ring-2 ring-green-400'
                    )}
                  />
                ) : (
                  <div className={cn(
                    'w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center',
                    highlightedBadgeId === badgeSummary.latestBadge.id && 'ring-2 ring-green-400'
                  )}>
                    <span className="text-3xl">🏆</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-lg">{badgeSummary.latestBadge.templateName}</p>
                  <p className="text-sm text-muted-foreground">
                    Issued {new Date(badgeSummary.latestBadge.issuedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2">
                    {badgeSummary.latestBadge.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/wallet?claim=${badgeSummary.latestBadge!.id}`)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Claim Badge
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Claimed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AC1: Recent Achievements Unlocked */}
      {recentAchievements && recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              🎯 Recent Achievements Unlocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border border-amber-200 dark:border-amber-800"
                >
                  <span className="text-2xl">{achievement.icon || '🏆'}</span>
                  <div className="flex-1">
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
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
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isHighlighted={highlightedBadgeId === badge.id}
                  onClaim={() => navigate(`/wallet?claim=${badge.id}`)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Refresh Button (AC1) */}
      <div className="sm:hidden flex justify-center pb-4">
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-2 min-h-[44px]"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          {isFetching ? 'Refreshing...' : 'Refresh Dashboard'}
        </Button>
      </div>

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
  isHighlighted?: boolean;
  onClaim?: () => void;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge, isHighlighted, onClaim }) => {
  const statusColors = {
    CLAIMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all',
      isHighlighted && 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950'
    )}>
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
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{badge.templateName}</p>
          {isHighlighted && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
        </div>
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
        {/* AC1: Claim button for pending badges */}
        {badge.status === 'PENDING' && onClaim && (
          <Button
            size="sm"
            variant="outline"
            onClick={onClaim}
            className="mt-2 h-8 text-xs"
          >
            Claim
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
