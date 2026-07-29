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
      <span className="font-mono text-xs font-bold text-[#1F3A2E]">
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
      return <span className="text-[#6B6B6B] text-xs font-medium">{formatted}</span>;
    },
  },
  {
    accessorKey: 'entry_type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.entry_type;
      const isIn = type.toLowerCase() === 'inflow';
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
            isIn
              ? 'bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20'
              : 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
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
          className={isIn ? 'text-[#15803D] font-bold' : 'text-[#DC2626] font-bold'}
        />
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-[#1A1A1A] font-medium max-w-[320px] truncate block">
        {row.original.description}
      </span>
    ),
  },
];
