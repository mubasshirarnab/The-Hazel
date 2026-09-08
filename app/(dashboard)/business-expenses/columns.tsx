'use client';

import React, { useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Currency from '@/components/shared/currency';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteExpense } from '@/actions/business-expenses';
import { toast } from 'sonner';

export interface ExpenseRow {
  id: number;
  expenseDate: string | Date;
  expenseType: string;
  description: string | null;
  amount: string | number;
  productRelated: number | boolean;
  productName: string | null;
  platform: string | null;
}

export const columns: ColumnDef<ExpenseRow>[] = [
  {
    accessorKey: 'expenseDate',
    header: 'Date',
    cell: ({ row }) => {
      const d = row.original.expenseDate;
      const formatted = new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return <span className="text-xs font-mono font-medium text-[#6B6B6B]">{formatted}</span>;
    },
  },
  {
    accessorKey: 'expenseType',
    header: 'Expense Type',
    cell: ({ row }) => (
      <span className="font-semibold text-xs text-[#1F3A2E] bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 px-2.5 py-1 rounded-[8px]">
        {row.original.expenseType}
      </span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <div className="text-xs text-[#1A1A1A] max-w-[220px] truncate">
        {row.original.description || '—'}
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="font-mono font-bold text-[#DC2626]">
        <Currency amount={row.original.amount} />
      </span>
    ),
  },
  {
    accessorKey: 'productRelated',
    header: 'Product Related',
    cell: ({ row }) => {
      const isRelated = Boolean(row.original.productRelated);
      return (
        <Badge variant={isRelated ? 'gold' : 'outline'}>
          {isRelated ? 'Yes' : 'No'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'productName',
    header: 'Product Name',
    cell: ({ row }) => (
      <span className="text-xs font-medium text-[#1A1A1A]">
        {row.original.productName || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'platform',
    header: 'Platform',
    cell: ({ row }) => (
      <span className="text-xs text-[#6B6B6B] font-medium">
        {row.original.platform || '—'}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return <ActionCell id={row.original.id} />;
    },
  },
];

function ActionCell({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      startTransition(async () => {
        try {
          const res = await deleteExpense(id);
          if (res.success) {
            toast.success('Expense deleted successfully.');
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete expense.');
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 rounded-[8px] hover:bg-[#DC2626]/10 text-[#6B6B6B] hover:text-[#DC2626] transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-[#DC2626]/20"
      title="Delete Expense"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-[#6B6B6B]" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}