/**
 * AdminDashboard Component - Story 8.1 (AC4)
 *
 * Dashboard for Admin role showing:
 * - System overview (users, badges, templates)
 * - System health status
 * - Recent admin activity log
 */

import React from 'react';
import { useAdminDashboard } from '../../hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ErrorDisplay } from '../../components/common/ErrorDisplay';
import { EmptyState, NoActivityState } from '../../components/common/EmptyState';
import { PageTemplate } from '../../components/layout/PageTemplate';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  Award,
  LayoutTemplate,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useAdminDashboard();
  const navigate = useNavigate();

  if (isLoading) {
    return <PageLoader text="Loading admin dashboard..." />;
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

  const { systemOverview, recentActivity } = data;

  return (
    <PageTemplate title="Admin Dashboard" description="System overview and platform management">
      {/* System Health Banner */}
      <SystemHealthBanner health={systemOverview.systemHealth} />

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Users"
          value={systemOverview.totalUsers}
          icon={<Users className="h-6 w-6 text-brand-600" />}
          description="Platform users"
          onClick={() => navigate('/admin/users')}
        />
        <SummaryCard
          title="Active This Month"
          value={systemOverview.activeUsersThisMonth}
          icon={<TrendingUp className="h-6 w-6 text-brand-500" />}
          description={`${systemOverview.newUsersThisMonth} new`}
        />
        <SummaryCard
          title="Total Badges Issued"
          value={systemOverview.totalBadgesIssued}
          icon={<Award className="h-6 w-6 text-gold" />}
          description="All time"
        />
        <SummaryCard
          title="Active Templates"
          value={systemOverview.activeBadgeTemplates}
          icon={<LayoutTemplate className="h-6 w-6 text-brand-700" />}
          description="Badge templates"
          onClick={() => navigate('/admin/badges')}
        />
      </div>

      {/* Recent Activity */}
      <Card className="shadow-elevation-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-neutral-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No recent activity"
              description="System activity will appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-elevation-1">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              icon={<Users className="h-6 w-6 text-brand-600" />}
              label="Manage Users"
              onClick={() => navigate('/admin/users')}
            />
            <QuickActionButton
              icon={<LayoutTemplate className="h-6 w-6 text-brand-600" />}
              label="Badge Templates"
              onClick={() => navigate('/admin/badges')}
            />
            <QuickActionButton
              icon={<BarChart3 className="h-6 w-6 text-brand-600" />}
              label="Analytics"
              onClick={() => navigate('/admin/analytics')}
            />
            <QuickActionButton
              icon={<Settings className="h-6 w-6 text-neutral-400" />}
              label="Settings"
              disabled
              title="Coming in Phase 2"
              className="opacity-50 cursor-not-allowed"
            />
          </div>
        </CardContent>
      </Card>
    </PageTemplate>
  );
};

// System Health Banner
const SystemHealthBanner: React.FC<{ health: 'healthy' | 'degraded' | 'critical' }> = ({
  health,
}) => {
  const config = {
    healthy: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: '✅',
      message: 'All systems operational',
    },
    degraded: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: '⚠️',
      message: 'Some services experiencing issues',
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: '🚨',
      message: 'Critical system issues detected',
    },
  };

  const { bg, border, text, icon, message } = config[health];

  return (
    <div className={cn('p-4 rounded-lg border', bg, border)} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
        <div>
          <p className={cn('font-medium', text)}>System Health: {health.toUpperCase()}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  onClick?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, description, onClick }) => (
  <Card
    className={cn(
      'shadow-elevation-1 hover:shadow-elevation-2 transition-shadow',
      onClick && 'cursor-pointer hover:bg-accent/50 transition-colors'
    )}
    onClick={onClick}
    tabIndex={onClick ? 0 : undefined}
    role={onClick ? 'button' : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
  >
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-600">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          {description && <p className="text-xs text-neutral-500 mt-1">{description}</p>}
        </div>
        <div aria-hidden="true">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

// Activity Item Component
interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    description: string;
    actorName: string;
    timestamp: string;
  };
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const actionIcons: Record<string, string> = {
    ISSUED: '📤',
    CLAIMED: '✅',
    REVOKED: '🚫',
    CREATED: '➕',
    UPDATED: '✏️',
    DELETED: '🗑️',
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <span className="text-xl" aria-hidden="true">
        {actionIcons[activity.type] || '📋'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{activity.type}</p>
        <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{activity.actorName}</span>
          <span>•</span>
          <span>{new Date(activity.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// Quick Action Button
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onClick,
  disabled,
  title,
  className,
}) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border',
      'bg-card shadow-elevation-1 hover:shadow-elevation-2 transition-all',
      !disabled && 'hover:bg-accent/50',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      className
    )}
  >
    <div aria-hidden="true">{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default AdminDashboard;
