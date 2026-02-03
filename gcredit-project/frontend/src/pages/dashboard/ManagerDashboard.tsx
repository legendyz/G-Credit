/**
 * ManagerDashboard Component - Story 8.1 (AC3)
 * 
 * Dashboard for Manager role showing:
 * - Team insights (member count, badges this month)
 * - Top performers list
 * - Revocation alerts
 */

import React, { useCallback } from 'react';
import { useManagerDashboard } from '../../hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ErrorDisplay } from '../../components/common/ErrorDisplay';
import { EmptyState, NoTeamMembersState } from '../../components/common/EmptyState';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Award, Users } from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { data, isLoading, error, refetch, isFetching } = useManagerDashboard();
  const navigate = useNavigate();

  // AC3: Manual refresh handler
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <PageLoader text="Loading team dashboard..." />;
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
    return <NoTeamMembersState />;
  }

  const { teamInsights, revocationAlerts } = data;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Page Header with Refresh Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            Team Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your team's badge performance
          </p>
        </div>
        {/* Manual refresh button (desktop) */}
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

      {/* AC3: Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/team/nominate')}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <Award className="h-4 w-4" />
              Nominate Team Member
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/team/skills')}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <Users className="h-4 w-4" />
              View Team Skills
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          title="Team Members"
          value={teamInsights.teamMembersCount}
          icon="👥"
          description="In your department"
        />
        <SummaryCard
          title="Team Badges This Month"
          value={teamInsights.teamBadgesThisMonth}
          icon="🏆"
          description="Earned by team"
        />
        <SummaryCard
          title="Revocation Alerts"
          value={revocationAlerts.length}
          icon="⚠️"
          description={revocationAlerts.length > 0 ? 'Requires attention' : 'All clear'}
          highlight={revocationAlerts.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>🌟</span>
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamInsights.topPerformers.length === 0 ? (
              <EmptyState
                icon="🏅"
                title="No data yet"
                description="Top performers will appear once team members earn badges."
              />
            ) : (
              <div className="space-y-3">
                {teamInsights.topPerformers.map((performer, index) => (
                  <div
                    key={performer.userId}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                        index === 0
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : index === 1
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            : index === 2
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                              : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{performer.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {performer.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{performer.badgeCount}</p>
                      <p className="text-xs text-muted-foreground">badges</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revocation Alerts */}
        <Card className={cn(revocationAlerts.length > 0 && 'border-destructive/50')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>⚠️</span>
              Revocation Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revocationAlerts.length === 0 ? (
              <EmptyState
                icon="✅"
                title="No alerts"
                description="All team badges are in good standing."
              />
            ) : (
              <div className="space-y-3">
                {revocationAlerts.map((alert) => (
                  <div
                    key={alert.badgeId}
                    className="p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{alert.recipientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.templateName}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(alert.revokedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-destructive mt-2">
                      Reason: {alert.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  description,
  highlight,
}) => (
  <Card className={cn(highlight && 'border-destructive bg-destructive/5')}>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
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

export default ManagerDashboard;
