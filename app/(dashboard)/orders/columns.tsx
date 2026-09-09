'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import Currency from '@/components/shared/currency';
import StatusBadge from '@/components/shared/status-badge';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface OrderRow {
  id: number;
  orderNumber: string;
  customerName: string;
  orderDate: Date | string;
  orderType: string;
  shippingAmount: number | string;
  advancePayment: number | string;
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
      <span className="font-mono text-xs font-bold text-[#1F3A2E]">
        {row.original.orderNumber}
      </span>
    ),
  },
  {
    accessorKey: 'customerName',
    header: 'Customer',
    cell: ({ row }) => (
      <div className="font-semibold text-[#1A1A1A] max-w-[150px] truncate">
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
      return <span className="text-[#6B6B6B] text-xs font-medium">{formatted}</span>;
    },
  },
  {
    accessorKey: 'orderType',
    header: 'Type',
    cell: ({ row }) => {
      const isPre = row.original.orderType === 'preorder';
      return (
        <Badge variant={isPre ? 'gold' : 'forest'}>
          {isPre ? 'Pre-Order' : 'In-Stock'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'shippingAmount',
    header: 'Delivery Charge',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium text-[#6B6B6B]">
        <Currency amount={row.original.shippingAmount || 0} />
      </span>
    ),
  },
  {
    accessorKey: 'advancePayment',
    header: 'Advance Paid',
    cell: ({ row }) => {
      const advance = Number(row.original.advancePayment) || 0;
      const isPre = row.original.orderType === 'preorder';
      if (!isPre && advance === 0) {
        return <span className="text-xs text-[#9E9E9E]">—</span>;
      }
      return (
        <span className="font-mono text-xs font-semibold text-[#B08D57]">
          <Currency amount={advance} />
        </span>
      );
    },
  },
  {
    accessorKey: 'grandTotal',
    header: 'Grand Total',
    cell: ({ row }) => <Currency amount={row.original.grandTotal} className="text-[#1A1A1A] font-bold" />,
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
        className="p-1.5 rounded-[8px] hover:bg-[#F7F6F3] text-[#6B6B6B] hover:text-[#1F3A2E] transition-colors inline-block border border-transparent hover:border-[#E9E7E2]"
        title="View Order Details"
      >
        <Eye className="h-4 w-4" />
      </Link>
    ),
  },
];