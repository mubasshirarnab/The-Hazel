'use client';

import React, { useTransition } from 'react';
import { refreshProfitLoss } from '@/actions/finance';
import { toast } from 'sonner';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function RefreshButton() {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const res = await refreshProfitLoss();
        if (res.success) {
          toast.success('Profit & Loss summary snapshot refreshed!');
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to refresh P&L.');
      }
    });
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-semibold cursor-pointer disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      <span>Recalculate P&L</span>
    </button>
  );
}
