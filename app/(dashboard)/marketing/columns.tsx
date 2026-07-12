'use client';

import React, { useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Currency from '@/components/shared/currency';
import { deleteCampaign } from '@/actions/marketing';
import { toast } from 'sonner';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import CampaignDialog from './campaign-dialog';

export interface CampaignRow {
  id: number;
  campaign_code: string;
  campaign_name: string;
  platform_name: string;
  platform_id: number;
  startDate?: string | null;
  endDate?: string | null;
  budget_amount: number | string;
  spend_amount: number | string;
  revenue_amount: number | string;
  orders_generated: number;
  roas: number | string;
}

export const columns = (platforms: any[]): ColumnDef<CampaignRow>[] => [
  {
    accessorKey: 'campaign_code',
    header: 'Campaign Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-rose-400">
        {row.original.campaign_code}
      </span>
    ),
  },
  {
    accessorKey: 'campaign_name',
    header: 'Campaign Name',
    cell: ({ row }) => (
      <span className="font-medium text-zinc-100 truncate max-w-[150px] block">
        {row.original.campaign_name}
      </span>
    ),
  },
  {
    accessorKey: 'platform_name',
    header: 'Platform',
    cell: ({ row }) => (
      <span className="text-zinc-300 font-semibold text-xs">
        {row.original.platform_name}
      </span>
    ),
  },
  {
    accessorKey: 'budget_amount',
    header: 'Budget',
    cell: ({ row }) => <Currency amount={row.original.budget_amount} />,
  },
  {
    accessorKey: 'spend_amount',
    header: 'Actual Spend',
    cell: ({ row }) => <Currency amount={row.original.spend_amount} className="text-rose-400" />,
  },
  {
    accessorKey: 'revenue_amount',
    header: 'Tracked Revenue',
    cell: ({ row }) => <Currency amount={row.original.revenue_amount} className="text-emerald-400 font-bold" />,
  },
  {
    accessorKey: 'orders_generated',
    header: 'Orders',
    cell: ({ row }) => (
      <span className="font-bold text-zinc-200">
        {row.original.orders_generated}
      </span>
    ),
  },
  {
    accessorKey: 'roas',
    header: 'ROAS',
    cell: ({ row }) => {
      const roasVal = parseFloat(row.original.roas as string) || 0;
      return (
        <span
          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
            roasVal >= 4
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : roasVal >= 2
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {roasVal.toFixed(2)}x
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const campaign = row.original;
      return <ActionCell campaign={campaign} platforms={platforms} />;
    },
  },
];

function ActionCell({ campaign, platforms }: { campaign: CampaignRow; platforms: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete campaign "${campaign.campaign_name}"?`)) {
      startTransition(async () => {
        try {
          const res = await deleteCampaign(campaign.id);
          if (res.success) {
            toast.success('Campaign profile deleted.');
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete campaign.');
        }
      });
    }
  };

  // Reshape parameters for dialog validation
  const mappedCampaign = {
    id: campaign.id,
    campaignName: campaign.campaign_name,
    platformId: campaign.platform_id,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    budgetAmount: campaign.budget_amount,
    spendAmount: campaign.spend_amount,
    revenueAmount: campaign.revenue_amount,
    ordersGenerated: campaign.orders_generated,
  };

  return (
    <div className="flex items-center gap-2">
      <CampaignDialog
        campaign={mappedCampaign}
        platforms={platforms}
        trigger={
          <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">
            <Edit2 className="h-4 w-4" />
          </button>
        }
      />
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
        title="Delete Campaign"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
