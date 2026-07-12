'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface RevenuePoint {
  revenue_month: string;
  revenue: number | string;
}

interface MonthlyPLPoint {
  profit_month: string;
  revenue: number | string;
  expenses: number | string;
  profit: number | string;
}

interface RevenueChartProps {
  data: RevenuePoint[];
}

interface PLChartProps {
  data: MonthlyPLPoint[];
}

function formatShortBDT(value: number) {
  if (value >= 1_000_000) return `৳${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `৳${(value / 1_000).toFixed(0)}K`;
  return `৳${value}`;
}

const CustomTooltipStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#f4f4f5',
  fontSize: '12px',
};

export function RevenueAreaChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    month: d.revenue_month,
    revenue: parseFloat(d.revenue as string) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#71717a', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatShortBDT}
          tick={{ fill: '#71717a', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value) => [`৳${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
          contentStyle={CustomTooltipStyle}
          labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
          cursor={{ stroke: '#3f3f46' }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#f43f5e"
          strokeWidth={2}
          fill="url(#revGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MonthlyPLChart({ data }: PLChartProps) {
  const chartData = data.map((d) => ({
    month: d.profit_month,
    revenue: parseFloat(d.revenue as string) || 0,
    expenses: parseFloat(d.expenses as string) || 0,
    profit: parseFloat(d.profit as string) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#71717a', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatShortBDT}
          tick={{ fill: '#71717a', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value, name) => {
            const label = String(name ?? '');
            const formatted = `৳${Number(value ?? 0).toLocaleString()}`;
            return [formatted, label.charAt(0).toUpperCase() + label.slice(1)];
          }}
          contentStyle={CustomTooltipStyle}
          cursor={{ fill: '#27272a' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#a1a1aa', paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="revenue" fill="#f43f5e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" fill="#3f3f46" radius={[3, 3, 0, 0]} />
        <Bar dataKey="profit" fill="#10b981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
