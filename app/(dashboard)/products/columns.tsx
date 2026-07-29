'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { deleteProduct } from '@/actions/products';
import { toast } from 'sonner';
import { Eye, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
      <span className="font-mono text-xs font-bold text-[#1F3A2E]">
        {row.original.productCode}
      </span>
    ),
  },
  {
    accessorKey: 'productName',
    header: 'Product Name',
    cell: ({ row }) => (
      <div className="font-semibold text-[#1A1A1A] max-w-[240px] truncate">
        {row.original.productName}
      </div>
    ),
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-[#6B6B6B]">
        {row.original.sku}
      </span>
    ),
  },
  {
    accessorKey: 'categoryName',
    header: 'Category',
    cell: ({ row }) => (
      <span className="text-[#6B6B6B] font-medium">
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
        <Badge variant={isArchived ? 'outline' : 'forest'}>
          {isArchived ? 'Archived' : 'Active'}
        </Badge>
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
        className="p-1.5 rounded-[8px] hover:bg-[#F7F6F3] text-[#6B6B6B] hover:text-[#1F3A2E] transition-colors border border-transparent hover:border-[#E9E7E2]"
        title="View Details"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-1.5 rounded-[8px] hover:bg-[#DC2626]/10 text-[#6B6B6B] hover:text-[#DC2626] transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-[#DC2626]/20"
        title="Delete Product"
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
