/**
 * EmptyState Component - Story 8.1 (UX-P1-003)
 *
 * Consistent empty state display with optional action button.
 * Used when lists/dashboards have no data to display.
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Inbox, Medal, BarChart3, Users } from 'lucide-react';

export interface EmptyStateProps {
  /** Icon to display (emoji or component) */
  icon?: React.ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Action button text */
  actionText?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox size={48} aria-hidden="true" />,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}
      role="status"
      aria-label={title}
    >
      <div className="mb-4" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && <p className="text-muted-foreground max-w-sm mb-6">{description}</p>}
      {actionText && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionText}
        </Button>
      )}
    </div>
  );
};

/**
 * No Badges empty state preset
 */
export const NoBadgesState: React.FC<{ onExplore?: () => void }> = ({ onExplore }) => (
  <EmptyState
    icon={<Medal size={48} aria-hidden="true" />}
    title="No badges yet"
    description="Start earning badges by completing skills and achievements."
    actionText={onExplore ? 'Explore Badges' : undefined}
    onAction={onExplore}
  />
);

/**
 * No Activity empty state preset
 */
export const NoActivityState: React.FC = () => (
  <EmptyState
    icon={<BarChart3 size={48} aria-hidden="true" />}
    title="No recent activity"
    description="Activity will appear here once you start using the platform."
  />
);

/**
 * No Team Members empty state preset
 */
export const NoTeamMembersState: React.FC = () => (
  <EmptyState
    icon={<Users size={48} aria-hidden="true" />}
    title="No team members"
    description="Team members will appear here once they join your department."
  />
);

export default EmptyState;
