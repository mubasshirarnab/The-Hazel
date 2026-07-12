'use client';

import React, { useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Currency from '@/components/shared/currency';
import { deleteCustomer } from '@/actions/customers';
import { toast } from 'sonner';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import CustomerDialog from './customer-dialog';

export interface CustomerRow {
  id: number;
  customerCode: string;
  customerName: string;
  phone: string | null;
  facebookName: string | null;
  totalOrders: number;
  lifetimeSpend: number | string;
  averageOrderValue: number | string;
  lastPurchase: Date | string | null;
  repeatCustomer: string;
  address: string | null;
  district: string | null;
  paymentPreference: string | null;
}

export const columns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: 'customerCode',
    header: 'Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-rose-400">
        {row.original.customerCode}
      </span>
    ),
  },
  {
    accessorKey: 'customerName',
    header: 'Name',
    cell: ({ row }) => (
      <div className="font-medium text-zinc-100 truncate max-w-[150px]">
        {row.original.customerName}
      </div>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => (
      <span className="text-zinc-300 font-mono text-xs">
        {row.original.phone || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'facebookName',
    header: 'Facebook Name',
    cell: ({ row }) => (
      <span className="text-zinc-400 max-w-[120px] truncate block">
        {row.original.facebookName || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'totalOrders',
    header: 'Orders',
    cell: ({ row }) => (
      <span className="font-bold text-zinc-200">
        {row.original.totalOrders}
      </span>
    ),
  },
  {
    accessorKey: 'lifetimeSpend',
    header: 'Lifetime Spend',
    cell: ({ row }) => <Currency amount={row.original.lifetimeSpend} className="text-zinc-100" />,
  },
  {
    accessorKey: 'averageOrderValue',
    header: 'AOV',
    cell: ({ row }) => <Currency amount={row.original.averageOrderValue} className="text-zinc-400 font-medium" />,
  },
  {
    accessorKey: 'repeatCustomer',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.repeatCustomer; // 'Repeat' or 'New'
      const isRepeat = type === 'Repeat';
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border leading-none ${
            isRepeat
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
        >
          {type}
        </span>
      );
    },
  },
  {
    accessorKey: 'lastPurchase',
    header: 'Last Purchase',
    cell: ({ row }) => {
      const d = row.original.lastPurchase;
      if (!d) return <span className="text-zinc-500">—</span>;
      const formatted = new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return <span className="text-zinc-400 text-xs">{formatted}</span>;
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const customer = row.original;
      return <ActionCell customer={customer} />;
    },
  },
];

function ActionCell({ customer }: { customer: CustomerRow }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete customer "${customer.customerName}"?`)) {
      startTransition(async () => {
        try {
          const res = await deleteCustomer(customer.id);
          if (res.success) {
            toast.success('Customer profile deleted successfully.');
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete customer.');
        }
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <CustomerDialog
        customer={customer}
        trigger={
          <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">
            <Edit2 className="h-4 w-4" />
          </button>
        }
      />
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
        title="Delete Customer"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
