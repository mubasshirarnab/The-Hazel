'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Currency from '@/components/shared/currency';

export interface CashFlowRow {
  id: number;
  cash_flow_code: string;
  entry_date: Date | string;
  entry_type: string;
  amount: number | string;
  currency: string;
  description: string;
}

export const columns: ColumnDef<CashFlowRow>[] = [
  {
    accessorKey: 'cash_flow_code',
    header: 'Entry Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-rose-400">
        {row.original.cash_flow_code}
      </span>
    ),
  },
  {
    accessorKey: 'entry_date',
    header: 'Date',
    cell: ({ row }) => {
      const d = row.original.entry_date;
      const formatted = new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return <span className="text-zinc-400 text-xs">{formatted}</span>;
    },
  },
  {
    accessorKey: 'entry_type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.entry_type; // 'inflow' or 'outflow'
      const isIn = type.toLowerCase() === 'inflow';
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
            isIn
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {isIn ? 'Inflow' : 'Outflow'}
        </span>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const type = row.original.entry_type;
      const isIn = type.toLowerCase() === 'inflow';
      return (
        <Currency
          amount={row.original.amount}
          className={isIn ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}
        />
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-zinc-300 font-medium max-w-[320px] truncate block">
        {row.original.description}
      </span>
    ),
  },
];
