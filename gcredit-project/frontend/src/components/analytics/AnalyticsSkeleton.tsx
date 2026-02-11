/**
 * Analytics Skeleton Components - Story 10.5
 *
 * Pulse-animated loading placeholders for each analytics section.
 * Uses Tailwind animate-pulse + bg-muted pattern (no spinners).
 */

import React from 'react';

/** Single KPI card skeleton */
export const KpiCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-200 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-32" />
  </div>
);

/** 4 KPI cards skeleton row */
export const KpiRowSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <KpiCardSkeleton />
    <KpiCardSkeleton />
    <KpiCardSkeleton />
    <KpiCardSkeleton />
  </div>
);

/** Chart area skeleton */
export const ChartSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-40 mb-6" />
    <div className="h-72 bg-gray-100 rounded" />
  </div>
);

/** Table skeleton */
export const TableSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-36 mb-6" />
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 bg-gray-200 rounded w-8" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      ))}
    </div>
  </div>
);

/** Activity feed skeleton */
export const ActivitySkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-36 mb-6" />
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="h-6 w-6 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
