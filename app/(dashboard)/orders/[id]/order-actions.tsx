'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeOrder, cancelOrder, processOrderReturn } from '@/actions/orders';
import { toast } from 'sonner';
import { Check, X, Undo2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';

interface OrderActionsProps {
  orderId: number;
  orderStatus: string;
  returnStatus: string;
}

export default function OrderActions({ orderId, orderStatus, returnStatus }: OrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const isDelivered    = orderStatus === 'delivered';
  const isCancelled    = orderStatus === 'cancelled';
  const isReturned     = orderStatus === 'returned';
  const alreadyReturned = returnStatus === 'completed';

  const showComplete = !isDelivered && !isCancelled && !isReturned;
  const showCancel   = !isDelivered && !isCancelled && !isReturned;
  const showReturn   = isDelivered && !alreadyReturned && !isReturned;

  const handleComplete = () => {
    if (confirm('Confirm this order as DELIVERED? This will deduct the ordered quantities from physical inventory stock.')) {
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
    if (confirm('Cancel this order? Reserved stock will be released back to available inventory.')) {
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

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReason || returnReason.length < 3) {
      toast.error('Please provide a valid return reason (minimum 3 characters).');
      return;
    }

    startTransition(async () => {
      try {
        const res = await processOrderReturn(orderId, returnReason);
        if (res.success) {
          toast.success('Customer return processed. Goods restocked to inventory.');
          setIsReturnOpen(false);
          setReturnReason('');
          router.refresh();
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to process customer return.');
      }
    });
  };

  if (!showComplete && !showCancel && !showReturn) return null;

  return (
    <>
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

        {showReturn && (
          <Button
            onClick={() => setIsReturnOpen(true)}
            loading={isPending}
            variant="gold"
            size="sm"
            icon={<Undo2 className="h-4 w-4 shrink-0" />}
          >
            Accept Customer Return
          </Button>
        )}
      </div>

      <Dialog
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title="Accept Customer Return"
        description="Restock all items back into inventory and mark order as returned with an automated refund log."
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-[12px] bg-[#B08D57]/10 border border-[#B08D57]/20 text-[#6A4E3B] text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#B08D57] mt-0.5" />
            <p className="leading-relaxed">
              Restocks items into inventory, decreases sales totals, and generates a refund record (<strong className="font-mono">RTN-XXXXXXXX</strong>).
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">
              Customer Return Reason <span className="text-[#DC2626]">*</span>
            </label>
            <Textarea
              rows={4}
              placeholder="e.g. Item received damaged in transit. Customer requested full refund..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9E7E2]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => { setIsReturnOpen(false); setReturnReason(''); }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              variant="gold"
              size="sm"
              icon={<Undo2 className="h-4 w-4 shrink-0" />}
            >
              Confirm Return & Restock
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
