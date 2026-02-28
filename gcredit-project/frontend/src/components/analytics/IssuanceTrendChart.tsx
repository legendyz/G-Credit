/**
 * Issuance Trend Chart - Story 10.5
 *
 * Area chart showing issued/claimed/revoked trends over time.
 * Uses Recharts with responsive container.
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { IssuanceTrendDataPoint } from '../../types/analytics';

interface IssuanceTrendChartProps {
  dataPoints: IssuanceTrendDataPoint[];
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const IssuanceTrendChart: React.FC<IssuanceTrendChartProps> = ({ dataPoints }) => {
  if (dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No trend data available yet
      </div>
    );
  }

  const chartData = dataPoints.map((dp) => ({
    ...dp,
    label: formatDateLabel(dp.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }} allowDecimals={false} />
        <Tooltip
          // inline style retained: Recharts library API prop
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid var(--color-neutral-200)',
            background: 'var(--color-background)',
            fontSize: '13px',
          }}
        />
        {/* inline style retained: Recharts library API prop */}
        <Legend wrapperStyle={{ fontSize: '13px' }} />
        <Area
          type="monotone"
          dataKey="issued"
          name="Issued"
          stroke="var(--color-chart-1)"
          fill="var(--color-chart-1)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="claimed"
          name="Claimed"
          stroke="var(--color-chart-2)"
          fill="var(--color-chart-2)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="revoked"
          name="Revoked"
          stroke="var(--color-chart-3)"
          fill="var(--color-chart-3)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default IssuanceTrendChart;
