'use client';

import React, { useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Currency from '@/components/shared/currency';
import { deleteCustomer } from '@/actions/customers';
import { toast } from 'sonner';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import CustomerDialog from './customer-dialog';
import { Badge } from '@/components/ui/badge';

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
      <span className="font-mono text-xs font-bold text-[#1F3A2E]">
        {row.original.customerCode}
      </span>
    ),
  },
  {
    accessorKey: 'customerName',
    header: 'Name',
    cell: ({ row }) => (
      <div className="font-semibold text-[#1A1A1A] truncate max-w-[150px]">
        {row.original.customerName}
      </div>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => (
      <span className="text-[#6B6B6B] font-mono text-xs">
        {row.original.phone || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'facebookName',
    header: 'Facebook Name',
    cell: ({ row }) => (
      <span className="text-[#6B6B6B] max-w-[120px] truncate block font-medium">
        {row.original.facebookName || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'totalOrders',
    header: 'Orders',
    cell: ({ row }) => (
      <span className="font-bold font-mono text-[#1A1A1A]">
        {row.original.totalOrders}
      </span>
    ),
  },
  {
    accessorKey: 'lifetimeSpend',
    header: 'Lifetime Spend',
    cell: ({ row }) => <Currency amount={row.original.lifetimeSpend} className="text-[#1A1A1A] font-bold" />,
  },
  {
    accessorKey: 'averageOrderValue',
    header: 'AOV',
    cell: ({ row }) => <Currency amount={row.original.averageOrderValue} className="text-[#6B6B6B] font-medium" />,
  },
  {
    accessorKey: 'repeatCustomer',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.repeatCustomer;
      const isRepeat = type === 'Repeat';
      return (
        <Badge variant={isRepeat ? 'gold' : 'outline'}>
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'lastPurchase',
    header: 'Last Purchase',
    cell: ({ row }) => {
      const d = row.original.lastPurchase;
      if (!d) return <span className="text-[#9E9E9E]">—</span>;
      const formatted = new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return <span className="text-[#6B6B6B] text-xs">{formatted}</span>;
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
          <button className="p-1.5 rounded-[8px] hover:bg-[#F7F6F3] text-[#6B6B6B] hover:text-[#1F3A2E] transition-colors cursor-pointer border border-transparent hover:border-[#E9E7E2]">
            <Edit2 className="h-4 w-4" />
          </button>
        }
      />
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-1.5 rounded-[8px] hover:bg-[#DC2626]/10 text-[#6B6B6B] hover:text-[#DC2626] transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-[#DC2626]/20"
        title="Delete Customer"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#6B6B6B]" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
