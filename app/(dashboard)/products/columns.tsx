'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { deleteProduct } from '@/actions/products';
import { toast } from 'sonner';
import { Edit2, Eye, Trash2, Loader2 } from 'lucide-react';

export interface ProductRow {
  id: number;
  productCode: string;
  sku: string;
  productName: string;
  productStatus: string;
  categoryName: string | null;
  createdAt: Date;
}

export const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: 'productCode',
    header: 'Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-rose-400">
        {row.original.productCode}
      </span>
    ),
  },
  {
    accessorKey: 'productName',
    header: 'Product Name',
    cell: ({ row }) => (
      <div className="font-medium text-zinc-100 max-w-[240px] truncate">
        {row.original.productName}
      </div>
    ),
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-zinc-300">
        {row.original.sku}
      </span>
    ),
  },
  {
    accessorKey: 'categoryName',
    header: 'Category',
    cell: ({ row }) => (
      <span className="text-zinc-400">
        {row.original.categoryName || 'Uncategorized'}
      </span>
    ),
  },
  {
    accessorKey: 'productStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.productStatus;
      const isArchived = status === 'archived';
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border leading-none ${
            isArchived
              ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}
        >
          {isArchived ? 'Archived' : 'Active'}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const product = row.original;
      return <ActionCell id={product.id} productName={product.productName} />;
    },
  },
];

// Split action cell into a component to use useTransition hook
function ActionCell({ id, productName }: { id: number; productName: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${productName}"? This will soft-delete all variants and inventory records associated with it.`)) {
      startTransition(async () => {
        try {
          const res = await deleteProduct(id);
          if (res.success) {
            toast.success('Product successfully deleted.');
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete product.');
        }
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/products/${id}`}
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        title="View Details"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
        title="Delete Product"
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
