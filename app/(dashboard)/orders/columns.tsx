'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import Currency from '@/components/shared/currency';
import StatusBadge from '@/components/shared/status-badge';
import { Eye } from 'lucide-react';

export interface OrderRow {
  id: number;
  orderNumber: string;
  customerName: string;
  orderDate: Date | string;
  orderType: string;
  grandTotal: number | string;
  orderStatus: string;
  paymentStatus: string;
  deliveryStatus: string;
}

export const columns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Order Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-rose-400">
        {row.original.orderNumber}
      </span>
    ),
  },
  {
    accessorKey: 'customerName',
    header: 'Customer',
    cell: ({ row }) => (
      <div className="font-medium text-zinc-100 max-w-[150px] truncate">
        {row.original.customerName}
      </div>
    ),
  },
  {
    accessorKey: 'orderDate',
    header: 'Date',
    cell: ({ row }) => {
      const d = row.original.orderDate;
      const formatted = new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return <span className="text-zinc-400 text-xs">{formatted}</span>;
    },
  },
  {
    accessorKey: 'orderType',
    header: 'Type',
    cell: ({ row }) => {
      const isPre = row.original.orderType === 'preorder';
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
            isPre
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}
        >
          {isPre ? 'Pre-Order' : 'In-Stock'}
        </span>
      );
    },
  },
  {
    accessorKey: 'grandTotal',
    header: 'Grand Total',
    cell: ({ row }) => <Currency amount={row.original.grandTotal} className="text-zinc-100 font-bold" />,
  },
  {
    accessorKey: 'orderStatus',
    header: 'Order Status',
    cell: ({ row }) => <StatusBadge status={row.original.orderStatus} type="order" />,
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Payment',
    cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} type="payment" />,
  },
  {
    accessorKey: 'deliveryStatus',
    header: 'Delivery',
    cell: ({ row }) => <StatusBadge status={row.original.deliveryStatus} type="delivery" />,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Link
        href={`/orders/${row.original.id}`}
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors inline-block"
        title="View Order Details"
      >
        <Eye className="h-4 w-4" />
      </Link>
    ),
  },
];
