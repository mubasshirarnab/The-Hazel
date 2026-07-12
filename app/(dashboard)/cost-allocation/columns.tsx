'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Currency from '@/components/shared/currency';

export interface CostAllocationRow {
  expense_code: string;
  expense_name: string;
  expense_type: string;
  target_type: string;
  variant_code: string;
  product_name: string;
  color_name: string;
  allocation_amount: number | string;
  created_at: Date | string;
}

export const columns: ColumnDef<CostAllocationRow>[] = [
  {
    accessorKey: 'expense_code',
    header: 'Expense Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-rose-400">
        {row.original.expense_code}
      </span>
    ),
  },
  {
    accessorKey: 'expense_name',
    header: 'Expense Details',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-zinc-100">{row.original.expense_name}</div>
        <div className="text-[10px] text-zinc-500 uppercase font-semibold mt-0.5">
          Type: {row.original.expense_type}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'variant_code',
    header: 'Target Variant',
    cell: ({ row }) => (
      <div>
        <span className="font-mono text-xs text-zinc-200">
          {row.original.variant_code}
        </span>
        <div className="text-xs text-zinc-400 truncate max-w-[200px] mt-0.5">
          {row.original.product_name} ({row.original.color_name})
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'allocation_amount',
    header: 'Allocated Amount',
    cell: ({ row }) => (
      <Currency amount={row.original.allocation_amount} className="text-zinc-100 font-bold" />
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Allocated Date',
    cell: ({ row }) => {
      const d = row.original.created_at;
      const formatted = new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return <span className="text-zinc-400 text-xs">{formatted}</span>;
    },
  },
];
