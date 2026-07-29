'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import StatusBadge from '@/components/shared/status-badge';
import CurrencyFormatter from '@/components/shared/currency';
import { Eye } from 'lucide-react';

export interface PurchaseOrderRow {
  id: number;
  purchaseOrderNumber: string;
  purchaseDate: Date | string;
  historicalRmbRate: string;
  totalAmountBdt: string;
  supplierName: string;
  friendName: string;
  statusCode: string;
}

export const columns: ColumnDef<PurchaseOrderRow>[] = [
  {
    accessorKey: 'purchaseOrderNumber',
    header: 'PO Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-bold text-[#1F3A2E]">
        {row.original.purchaseOrderNumber}
      </span>
    ),
  },
  {
    accessorKey: 'supplierName',
    header: 'Supplier',
    cell: ({ row }) => (
      <span className="text-[#1A1A1A] font-semibold">
        {row.original.supplierName}
      </span>
    ),
  },
  {
    accessorKey: 'friendName',
    header: 'China Agent',
    cell: ({ row }) => (
      <span className="text-[#6B6B6B] font-medium">
        {row.original.friendName}
      </span>
    ),
  },
  {
    accessorKey: 'purchaseDate',
    header: 'PO Date',
    cell: ({ row }) => {
      const d = row.original.purchaseDate;
      const formatted = new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return <span className="text-[#6B6B6B] text-xs">{formatted}</span>;
    },
  },
  {
    accessorKey: 'historicalRmbRate',
    header: 'RMB Rate',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-[#6B6B6B]">
        {parseFloat(row.original.historicalRmbRate).toFixed(2)} BDT/¥
      </span>
    ),
  },
  {
    accessorKey: 'totalAmountBdt',
    header: 'Total Value (BDT)',
    cell: ({ row }) => (
      <CurrencyFormatter amount={row.original.totalAmountBdt} className="text-[#1A1A1A] font-bold" />
    ),
  },
  {
    accessorKey: 'statusCode',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.statusCode} type="purchase" />,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Link
        href={`/purchase-orders/${row.original.id}`}
        className="p-1.5 rounded-[8px] hover:bg-[#F7F6F3] text-[#6B6B6B] hover:text-[#1F3A2E] transition-colors inline-block border border-transparent hover:border-[#E9E7E2]"
        title="View PO Details"
      >
        <Eye className="h-4 w-4" />
      </Link>
    ),
  },
];
