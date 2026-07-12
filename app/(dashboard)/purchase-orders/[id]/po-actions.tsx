'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { placePurchaseOrder, deletePurchaseOrder } from '@/actions/purchase-orders';
import { toast } from 'sonner';
import { Send, Trash2, Loader2 } from 'lucide-react';

interface POActionsProps {
  poId: number;
  statusCode: string; // 'draft', 'placed', 'received' etc
}

export default function POActions({ poId, statusCode }: POActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isDraft = statusCode === 'draft';

  const handlePlace = () => {
    if (confirm('Are you sure you want to mark this Purchase Order as PLACED? This indicates the order is sent to the China supplier.')) {
      startTransition(async () => {
        try {
          const res = await placePurchaseOrder(poId);
          if (res.success) {
            toast.success('Purchase Order marked as placed!');
            router.refresh();
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to place PO.');
        }
      });
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this Purchase Order? This is a soft-delete.')) {
      startTransition(async () => {
        try {
          const res = await deletePurchaseOrder(poId);
          if (res.success) {
            toast.success('Purchase Order deleted.');
            router.push('/purchase-orders');
            router.refresh();
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete PO.');
        }
      });
    }
  };

  if (!isDraft) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Place Order */}
      <button
        onClick={handlePlace}
        disabled={isPending}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        <span>Place Order</span>
      </button>

      {/* Delete PO */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        <span>Delete Draft</span>
      </button>
    </div>
  );
}
