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
import { useTheme } from '@/components/shared/theme-provider';

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

export function RevenueAreaChart({ data }: RevenueChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = data.map((d) => ({
    month: d.revenue_month,
    revenue: parseFloat(d.revenue as string) || 0,
  }));

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#0F1117' : '#FFFFFF',
    border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(226, 232, 240, 0.9)',
    borderRadius: '12px',
    padding: '10px 14px',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '12px',
    boxShadow: isDark
      ? '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(245, 158, 11, 0.15)'
      : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGoldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isDark ? '#f59e0b' : '#d97706'} stopOpacity={0.35} />
            <stop offset="95%" stopColor={isDark ? '#e11d48' : '#f43f5e'} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2430' : '#e2e8f0'} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatShortBDT}
          tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value) => [`৳${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
          contentStyle={tooltipStyle}
          labelStyle={{ color: isDark ? '#f59e0b' : '#d97706', fontSize: 11, fontWeight: 700 }}
          cursor={{ stroke: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(217, 119, 6, 0.2)' }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={isDark ? '#f59e0b' : '#d97706'}
          strokeWidth={2.5}
          fill="url(#revGoldGradient)"
          dot={false}
          activeDot={{ r: 5, fill: isDark ? '#f59e0b' : '#d97706', strokeWidth: 2, stroke: isDark ? '#07080c' : '#ffffff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MonthlyPLChart({ data }: PLChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = data.map((d) => ({
    month: d.profit_month,
    revenue: parseFloat(d.revenue as string) || 0,
    expenses: parseFloat(d.expenses as string) || 0,
    profit: parseFloat(d.profit as string) || 0,
  }));

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#0F1117' : '#FFFFFF',
    border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(226, 232, 240, 0.9)',
    borderRadius: '12px',
    padding: '10px 14px',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '12px',
    boxShadow: isDark
      ? '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(245, 158, 11, 0.15)'
      : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2430' : '#e2e8f0'} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatShortBDT}
          tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
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
          contentStyle={tooltipStyle}
          cursor={{ fill: isDark ? 'rgba(245, 158, 11, 0.05)' : 'rgba(217, 119, 6, 0.05)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="revenue" fill={isDark ? '#f59e0b' : '#d97706'} radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill={isDark ? '#e11d48' : '#dc2626'} radius={[4, 4, 0, 0]} />
        <Bar dataKey="profit" fill={isDark ? '#10b981' : '#059669'} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
