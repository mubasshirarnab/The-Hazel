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
      <span className="font-mono text-xs font-bold text-[#1F3A2E]">
        {row.original.expense_code}
      </span>
    ),
  },
  {
    accessorKey: 'expense_name',
    header: 'Expense Details',
    cell: ({ row }) => (
      <div>
        <div className="font-semibold text-[#1A1A1A]">{row.original.expense_name}</div>
        <div className="text-[10px] text-[#6B6B6B] uppercase font-bold mt-0.5">
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
        <span className="font-mono text-xs text-[#1F3A2E] font-semibold">
          {row.original.variant_code}
        </span>
        <div className="text-xs text-[#6B6B6B] truncate max-w-[200px] mt-0.5 font-medium">
          {row.original.product_name} ({row.original.color_name})
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'allocation_amount',
    header: 'Allocated Amount',
    cell: ({ row }) => (
      <Currency amount={row.original.allocation_amount} className="text-[#1A1A1A] font-bold" />
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
      return <span className="text-[#6B6B6B] text-xs font-medium">{formatted}</span>;
    },
  },
];
