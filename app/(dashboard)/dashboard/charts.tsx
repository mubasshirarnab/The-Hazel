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
  backgroundColor: '#FFFFFF',
  border: '1px solid #E9E7E2',
  borderRadius: '12px',
  padding: '10px 14px',
  color: '#1A1A1A',
  fontSize: '12px',
  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.06)',
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
          <linearGradient id="revForestGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1F3A2E" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#1F3A2E" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E9E7E2" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#6B6B6B', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatShortBDT}
          tick={{ fill: '#6B6B6B', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value) => [`৳${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
          contentStyle={CustomTooltipStyle}
          labelStyle={{ color: '#1F3A2E', fontSize: 11, fontWeight: 700 }}
          cursor={{ stroke: 'rgba(31, 58, 46, 0.15)' }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#1F3A2E"
          strokeWidth={2.5}
          fill="url(#revForestGradient)"
          dot={false}
          activeDot={{ r: 5, fill: '#B08D57', strokeWidth: 2, stroke: '#FFFFFF' }}
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
        <CartesianGrid strokeDasharray="3 3" stroke="#E9E7E2" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#6B6B6B', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatShortBDT}
          tick={{ fill: '#6B6B6B', fontSize: 10 }}
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
          cursor={{ fill: 'rgba(31, 58, 46, 0.04)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#6B6B6B', paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="revenue" fill="#1F3A2E" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="#6A4E3B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="profit" fill="#B08D57" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
