'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeOrder, cancelOrder } from '@/actions/orders';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderActionsProps {
  orderId: number;
  orderStatus: string;
}

export default function OrderActions({ orderId, orderStatus }: OrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isDelivered = orderStatus === 'delivered';
  const isCancelled = orderStatus === 'cancelled';

  const showComplete = !isDelivered && !isCancelled;
  const showCancel   = !isDelivered && !isCancelled;

  const handleComplete = () => {
    if (confirm('Confirm this order as DELIVERED? This will deduct the ordered quantities from inventory stock.')) {
      startTransition(async () => {
        try {
          const res = await completeOrder(orderId);
          if (res.success) {
            toast.success('Order marked as Delivered. Inventory updated.');
            router.refresh();
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to complete order.');
        }
      });
    }
  };

  const handleCancel = () => {
    if (confirm('Cancel this order? Reserved stock will be released back to inventory.')) {
      startTransition(async () => {
        try {
          const res = await cancelOrder(orderId);
          if (res.success) {
            toast.success('Order cancelled. Reserved units released.');
            router.refresh();
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to cancel order.');
        }
      });
    }
  };

  if (!showComplete && !showCancel) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {showComplete && (
        <Button
          onClick={handleComplete}
          loading={isPending}
          variant="primary"
          size="sm"
          icon={<Check className="h-4 w-4 shrink-0" />}
        >
          Mark as Delivered
        </Button>
      )}

      {showCancel && (
        <Button
          onClick={handleCancel}
          loading={isPending}
          variant="danger"
          size="sm"
          icon={<X className="h-4 w-4 shrink-0" />}
        >
          Cancel Order
        </Button>
      )}
    </div>
  );
}