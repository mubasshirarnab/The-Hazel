'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { placePurchaseOrder, deletePurchaseOrder } from '@/actions/purchase-orders';
import { toast } from 'sonner';
import { Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <Button
        onClick={handlePlace}
        loading={isPending}
        variant="primary"
        size="sm"
        icon={<Send className="h-4 w-4 shrink-0" />}
      >
        Place Order
      </Button>

      <Button
        onClick={handleDelete}
        loading={isPending}
        variant="danger"
        size="sm"
        icon={<Trash2 className="h-4 w-4 shrink-0" />}
      >
        Delete Draft
      </Button>
    </div>
  );
}
