/**
 * Skills Distribution Chart - Story 10.5
 *
 * Horizontal bar chart for top skills by badge count,
 * plus a category breakdown section.
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SkillDistributionItem } from '../../types/analytics';

interface SkillsDistributionChartProps {
  topSkills: SkillDistributionItem[];
  skillsByCategory: Record<string, number>;
}

const CATEGORY_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-yellow-500',
  'bg-indigo-500',
];

const SkillsDistributionChart: React.FC<SkillsDistributionChartProps> = ({
  topSkills,
  skillsByCategory,
}) => {
  if (topSkills.length === 0 && Object.keys(skillsByCategory).length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No skills data available yet. Skills appear as badges are issued.
      </div>
    );
  }

  const chartData = topSkills.slice(0, 10).map((s) => ({
    name: s.skillName.length > 18 ? s.skillName.slice(0, 16) + '...' : s.skillName,
    badges: s.badgeCount,
    employees: s.employeeCount,
  }));

  const categoryEntries = Object.entries(skillsByCategory).sort(([, a], [, b]) => b - a);
  const categoryTotal = categoryEntries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="space-y-6">
      {/* Top Skills Bar Chart */}
      {chartData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">Top Skills by Badge Count</h4>
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12, fill: '#374151' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="badges" name="Badges" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      {categoryEntries.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">By Category</h4>
          <div className="space-y-2">
            {categoryEntries.map(([category, count], idx) => {
              const pct = categoryTotal > 0 ? (count / categoryTotal) * 100 : 0;
              return (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-28 truncate" title={category}>
                    {category}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-5 rounded-full ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-16 text-right">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsDistributionChart;
