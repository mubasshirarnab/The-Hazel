'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeOrder, cancelOrder, processOrderReturn } from '@/actions/orders';
import { toast } from 'sonner';
import { Check, X, Undo2, Loader2, AlertTriangle } from 'lucide-react';

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
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span>Mark as Delivered</span>
          </button>
        )}

        {showCancel && (
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            <span>Cancel Order</span>
          </button>
        )}

        {showReturn && (
          <button
            onClick={() => setIsReturnOpen(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-[var(--accent-gold)] hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Undo2 className="h-4 w-4" />
            <span>Accept Customer Return</span>
          </button>
        )}
      </div>

      {/* Customer Return Modal */}
      {isReturnOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-7 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-2xl relative transition-colors duration-300">
            <button
              onClick={() => setIsReturnOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-main)]">Accept Customer Return</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  This will restock all items from this order back into inventory and mark the order as{' '}
                  <strong className="text-[var(--accent-gold)]">Returned</strong>. A refund record will be generated automatically.
                </p>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--accent-gold)] uppercase tracking-widest block">
                  Customer Return Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Item received damaged in transit. Customer requested full refund and return of goods..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] text-xs focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-amber-500/20 transition-all resize-none font-medium shadow-2xs"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--accent-gold)] leading-relaxed">
                <strong>What happens:</strong> All ordered items will be restocked into inventory, sales count decreases, and a{' '}
                <span className="font-mono">RTN-XXXXXXXX</span> refund record will be created.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => { setIsReturnOpen(false); setReturnReason(''); }}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/20"
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
