/**
 * IssuerDashboard Component - Story 8.1 (AC2)
 *
 * Dashboard for Issuer role showing:
 * - Issuance summary (issued this month, pending, total recipients)
 * - Claim rate percentage
 * - Recent issuance activity
 */

import React, { useCallback } from 'react';
import { useIssuerDashboard } from '../../hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ErrorDisplay } from '../../components/common/ErrorDisplay';
import { EmptyState, NoActivityState } from '../../components/common/EmptyState';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, PlusCircle, List } from 'lucide-react';
import { PageTemplate } from '../../components/layout/PageTemplate';

export const IssuerDashboard: React.FC = () => {
  const { data, isLoading, error, refetch, isFetching } = useIssuerDashboard();
  const navigate = useNavigate();

  // AC2: Manual refresh handler
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <PageLoader text="Loading issuer dashboard..." />;
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
    return <NoActivityState />;
  }

  const { issuanceSummary, recentActivity } = data;

  return (
    <PageTemplate
      title="Issuer Dashboard"
      description="Track your badge issuance activity"
      actions={
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
      }
    >

      {/* AC2: Quick Actions */}
      <Card className="shadow-elevation-1">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/admin/badges')}
              className="flex items-center gap-2 min-h-[44px] bg-brand-600 hover:bg-brand-700 text-white"
            >
              <PlusCircle className="h-4 w-4" />
              Issue New Badge
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/badges')}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <List className="h-4 w-4" />
              View Issued Badges
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Issuance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Issued This Month"
          value={issuanceSummary.issuedThisMonth}
          icon="📤"
          description="Badges issued"
        />
        <SummaryCard
          title="Pending Claims"
          value={issuanceSummary.pendingClaims}
          icon="⏳"
          description="Awaiting claim"
          highlight={issuanceSummary.pendingClaims > 0}
        />
        <SummaryCard
          title="Total Recipients"
          value={issuanceSummary.totalRecipients}
          icon="👥"
          description="Unique recipients"
        />
        <ClaimRateCard claimRate={issuanceSummary.claimRate} />
      </div>

      {/* Recent Issuance Activity */}
      <Card className="shadow-elevation-1">
        <CardHeader>
          <CardTitle className="text-lg">Recent Issuance Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No recent activity"
              description="Your badge issuance activity will appear here."
            />
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Recipient
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Badge
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Issued
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity) => (
                      <tr key={activity.badgeId} className="border-b last:border-0">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{activity.recipientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.recipientEmail}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{activity.templateName}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={activity.status} />
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(activity.issuedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.badgeId} className="p-4 rounded-lg border bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{activity.recipientName}</p>
                        <p className="text-sm text-muted-foreground">{activity.recipientEmail}</p>
                      </div>
                      <StatusBadge status={activity.status} />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{activity.templateName}</span>
                      <span>{new Date(activity.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTemplate>
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
  <Card className={cn(highlight && 'border-primary bg-primary/5')}>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      </div>
    </CardContent>
  </Card>
);

// Claim Rate Card Component
const ClaimRateCard: React.FC<{ claimRate: number }> = ({ claimRate }) => {
  const percentage = Math.round(claimRate * 100);
  const color =
    percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Claim Rate</p>
            <p className={cn('text-3xl font-bold mt-1', color)}>{percentage}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {percentage >= 80 ? 'Excellent!' : percentage >= 50 ? 'Good' : 'Needs attention'}
            </p>
          </div>
          <span className="text-2xl" aria-hidden="true">
            📊
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 mt-3 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percentage}% claim rate`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusColors: Record<string, string> = {
    CLAIMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <span
      className={cn(
        'text-xs px-2 py-1 rounded-full font-medium',
        statusColors[status] || statusColors.PENDING
      )}
    >
      {status}
    </span>
  );
};

export default IssuerDashboard;
