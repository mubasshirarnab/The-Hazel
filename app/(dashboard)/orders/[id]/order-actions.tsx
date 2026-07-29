'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeOrder, cancelOrder, processOrderReturn } from '@/actions/orders';
import { toast } from 'sonner';
import { Check, X, Undo2, Loader2, AlertTriangle } from 'lucide-react';

interface OrderActionsProps {
  orderId: number;
  orderStatus: string; // e.g. 'pending', 'delivered', 'cancelled', 'returned'
  returnStatus: string; // e.g. 'none', 'requested', 'approved', 'completed'
}

export default function OrderActions({ orderId, orderStatus, returnStatus }: OrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Return modal states
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  // Business logic for which actions are available
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
        {/* Mark as Delivered */}
        {showComplete && (
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span>Mark as Delivered</span>
          </button>
        )}

        {/* Cancel Order */}
        {showCancel && (
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            <span>Cancel Order</span>
          </button>
        )}

        {/* Accept Customer Return */}
        {showReturn && (
          <button
            onClick={() => setIsReturnOpen(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Undo2 className="h-4 w-4" />
            <span>Accept Customer Return</span>
          </button>
        )}
      </div>

      {/* Customer Return Modal */}
      {isReturnOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl border border-amber-500/20 bg-zinc-900 shadow-2xl shadow-black/40 relative">
            <button
              onClick={() => setIsReturnOpen(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Accept Customer Return</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Accepting a return will restock all items from this order back into inventory and mark the order as <strong className="text-amber-400">Returned</strong>. A refund record will be created automatically.
                </p>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                  Customer Return Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Item received damaged in transit. Customer requested full refund and return of goods..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-colors resize-none"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs text-amber-300 leading-relaxed">
                <strong>What happens:</strong> All ordered items will be restocked into inventory, sales count decreases, and a <span className="font-mono text-amber-200">RTN-XXXXXXXX</span> refund record will be created.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => { setIsReturnOpen(false); setReturnReason(''); }}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-zinc-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Processing...</span></>
                  ) : (
                    <><Undo2 className="h-3.5 w-3.5" /><span>Confirm Return & Restock</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
