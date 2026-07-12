'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import Currency from '@/components/shared/status-badge';
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
      <span className="font-mono text-xs font-semibold text-rose-400">
        {row.original.purchaseOrderNumber}
      </span>
    ),
  },
  {
    accessorKey: 'supplierName',
    header: 'Supplier',
    cell: ({ row }) => (
      <span className="text-zinc-200 font-medium">
        {row.original.supplierName}
      </span>
    ),
  },
  {
    accessorKey: 'friendName',
    header: 'China Agent',
    cell: ({ row }) => (
      <span className="text-zinc-300">
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
      return <span className="text-zinc-400 text-xs">{formatted}</span>;
    },
  },
  {
    accessorKey: 'historicalRmbRate',
    header: 'RMB Rate',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-zinc-400">
        {parseFloat(row.original.historicalRmbRate).toFixed(2)} BDT/¥
      </span>
    ),
  },
  {
    accessorKey: 'totalAmountBdt',
    header: 'Total Value (BDT)',
    cell: ({ row }) => (
      <CurrencyFormatter amount={row.original.totalAmountBdt} className="text-zinc-100 font-bold" />
    ),
  },
  {
    accessorKey: 'statusCode',
    header: 'Status',
    cell: ({ row }) => <Currency status={row.original.statusCode} type="purchase" />,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Link
        href={`/purchase-orders/${row.original.id}`}
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors inline-block"
        title="View PO Details"
      >
        <Eye className="h-4 w-4" />
      </Link>
    ),
  },
];
