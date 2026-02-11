/**
 * Top Performers Table - Story 10.5
 *
 * Leaderboard ranking employees by badge count.
 */

import React from 'react';
import type { TopPerformer } from '../../types/analytics';

interface TopPerformersTableProps {
  performers: TopPerformer[];
}

function formatRelativeDate(isoStr: string): string {
  const date = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

const RANK_ICONS = ['🥇', '🥈', '🥉'];

const TopPerformersTable: React.FC<TopPerformersTableProps> = ({ performers }) => {
  if (performers.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No performers data yet. Badges need to be claimed first.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 w-16">#</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700">Badges</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Latest Badge</th>
          </tr>
        </thead>
        <tbody>
          {performers.map((p, idx) => (
            <tr
              key={p.userId}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4">
                {idx < 3 ? (
                  <span className="text-xl">{RANK_ICONS[idx]}</span>
                ) : (
                  <span className="text-gray-500 font-medium">#{idx + 1}</span>
                )}
              </td>
              <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
              <td className="py-3 px-4 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                  {p.badgeCount}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">
                {p.latestBadge ? (
                  <span>
                    {p.latestBadge.templateName}
                    <span className="text-gray-400 ml-2">
                      {formatRelativeDate(p.latestBadge.claimedAt)}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopPerformersTable;
