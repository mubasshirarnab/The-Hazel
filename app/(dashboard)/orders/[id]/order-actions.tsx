'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeOrder, cancelOrder, processOrderReturn } from '@/actions/orders';
import { toast } from 'sonner';
import { Check, X, Undo2, Loader2 } from 'lucide-react';

interface OrderActionsProps {
  orderId: number;
  orderStatus: string; // e.g. 'pending', 'delivered', 'cancelled'
  returnStatus: string; // e.g. 'none', 'completed'
}

export default function OrderActions({ orderId, orderStatus, returnStatus }: OrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Return modal states
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const showComplete = orderStatus !== 'delivered' && orderStatus !== 'cancelled';
  const showCancel = orderStatus !== 'delivered' && orderStatus !== 'cancelled';
  const showReturn = orderStatus === 'delivered' && returnStatus !== 'completed';

  const handleComplete = () => {
    if (confirm('Are you sure you want to mark this order as COMPLETED? This will decrease physical inventory stock.')) {
      startTransition(async () => {
        try {
          const res = await completeOrder(orderId);
          if (res.success) {
            toast.success('Order completed successfully!');
            router.refresh();
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to complete order.');
        }
      });
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to CANCEL this order? This will release reserved units back to available stock.')) {
      startTransition(async () => {
        try {
          const res = await cancelOrder(orderId);
          if (res.success) {
            toast.success('Order cancelled and stock released.');
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
      toast.error('Please enter a valid return reason (min 3 characters).');
      return;
    }

    startTransition(async () => {
      try {
        const res = await processOrderReturn(orderId, returnReason);
        if (res.success) {
          toast.success('Order return processed successfully. Items restocked.');
          setIsReturnOpen(false);
          setReturnReason('');
          router.refresh();
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to process return.');
      }
    });
  };

  if (!showComplete && !showCancel && !showReturn) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Complete Order */}
      {showComplete && (
        <button
          onClick={handleComplete}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span>Complete Order</span>
        </button>
      )}

      {/* Cancel Order */}
      {showCancel && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          <span>Cancel Order</span>
        </button>
      )}

      {/* Return Order */}
      {showReturn && (
        <button
          onClick={() => setIsReturnOpen(true)}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Undo2 className="h-4 w-4" />
          <span>Process Return</span>
        </button>
      )}

      {/* Return Reason Modal */}
      {isReturnOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative">
            <button
              onClick={() => setIsReturnOpen(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-zinc-100">Process Order Return</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Enter the customer reason for return. Restocked items will increase inventory levels.
              </p>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Reason for Return</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Color mismatch or package damaged in delivery transit..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-xs focus:outline-none focus:border-rose-500 transition-colors resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80 mt-4">
                <button
                  type="button"
                  onClick={() => setIsReturnOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Confirm Return</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
