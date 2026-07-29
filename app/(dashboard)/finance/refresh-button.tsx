'use client';

import React, { useTransition } from 'react';
import { refreshProfitLoss } from '@/actions/finance';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <Button
      onClick={handleRefresh}
      loading={isPending}
      variant="secondary"
      icon={<RefreshCw className="h-4 w-4 shrink-0" />}
    >
      Recalculate P&L
    </Button>
  );
}
