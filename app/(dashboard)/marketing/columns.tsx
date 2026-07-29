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
      <span className="font-mono text-xs font-bold text-[#1F3A2E]">
        {row.original.campaign_code}
      </span>
    ),
  },
  {
    accessorKey: 'campaign_name',
    header: 'Campaign Name',
    cell: ({ row }) => (
      <span className="font-semibold text-[#1A1A1A] truncate max-w-[150px] block">
        {row.original.campaign_name}
      </span>
    ),
  },
  {
    accessorKey: 'platform_name',
    header: 'Platform',
    cell: ({ row }) => (
      <span className="text-[#6B6B6B] font-semibold text-xs">
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
    cell: ({ row }) => <Currency amount={row.original.spend_amount} className="text-[#DC2626]" />,
  },
  {
    accessorKey: 'revenue_amount',
    header: 'Tracked Revenue',
    cell: ({ row }) => <Currency amount={row.original.revenue_amount} className="text-[#15803D] font-bold" />,
  },
  {
    accessorKey: 'orders_generated',
    header: 'Orders',
    cell: ({ row }) => (
      <span className="font-bold text-[#1A1A1A] font-mono">
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
          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
            roasVal >= 4
              ? 'bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20'
              : roasVal >= 2
              ? 'bg-[#1F3A2E]/10 text-[#1F3A2E] border border-[#1F3A2E]/20'
              : 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
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
          <button className="p-1.5 rounded-[8px] hover:bg-[#F7F6F3] text-[#6B6B6B] hover:text-[#1F3A2E] transition-colors cursor-pointer border border-transparent hover:border-[#E9E7E2]">
            <Edit2 className="h-4 w-4" />
          </button>
        }
      />
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-1.5 rounded-[8px] hover:bg-[#F7F6F3] text-[#6B6B6B] hover:text-[#DC2626] transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-[#E9E7E2]"
        title="Delete Campaign"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#9E9E9E]" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
