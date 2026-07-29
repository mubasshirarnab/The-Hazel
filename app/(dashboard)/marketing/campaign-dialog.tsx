'use client';

import React, { useState } from 'react';
import { createCampaign, updateCampaign } from '@/actions/marketing';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Select } from '@/components/ui/input';

interface PlatformOption {
  id: number;
  platformName: string;
}

interface CampaignData {
  id: number;
  campaignName: string;
  platformId: number;
  startDate?: string | null;
  endDate?: string | null;
  budgetAmount: number | string;
  spendAmount: number | string;
  revenueAmount: number | string;
  ordersGenerated: number;
}

interface CampaignDialogProps {
  campaign?: CampaignData;
  platforms: PlatformOption[];
  trigger?: React.ReactNode;
}

export default function CampaignDialog({ campaign, platforms, trigger }: CampaignDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!campaign;

  const [campaignName, setCampaignName] = useState(campaign?.campaignName || '');
  const [platformId, setPlatformId] = useState(campaign?.platformId?.toString() || '');
  const [startDate, setStartDate] = useState(() => {
    if (campaign?.startDate) {
      return new Date(campaign.startDate).toISOString().split('T')[0];
    }
    return '';
  });
  const [endDate, setEndDate] = useState(() => {
    if (campaign?.endDate) {
      return new Date(campaign.endDate).toISOString().split('T')[0];
    }
    return '';
  });
  const [budgetAmount, setBudgetAmount] = useState(campaign?.budgetAmount?.toString() || '0');
  const [spendAmount, setSpendAmount] = useState(campaign?.spendAmount?.toString() || '0');
  const [revenueAmount, setRevenueAmount] = useState(campaign?.revenueAmount?.toString() || '0');
  const [ordersGenerated, setOrdersGenerated] = useState(campaign?.ordersGenerated?.toString() || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignName || !platformId) {
      toast.error('Campaign Name and Platform are required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        campaignName,
        platformId: Number(platformId),
        startDate: startDate || null,
        endDate: endDate || null,
        budgetAmount: parseFloat(budgetAmount) || 0,
        spendAmount: parseFloat(spendAmount) || 0,
        revenueAmount: parseFloat(revenueAmount) || 0,
        ordersGenerated: parseInt(ordersGenerated) || 0,
      };

      if (isEdit && campaign) {
        const res = await updateCampaign(campaign.id, payload);
        if (res.success) {
          toast.success('Campaign metrics updated successfully!');
          setIsOpen(false);
        }
      } else {
        const res = await createCampaign(payload);
        if (res.success) {
          toast.success('New marketing campaign created!');
          setIsOpen(false);
          setCampaignName('');
          setPlatformId('');
          setStartDate('');
          setEndDate('');
          setBudgetAmount('0');
          setSpendAmount('0');
          setRevenueAmount('0');
          setOrdersGenerated('0');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save campaign.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          variant="gold"
          icon={<Plus className="h-4 w-4 shrink-0" />}
        >
          New Campaign
        </Button>
      )}

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isEdit ? 'Edit Campaign Performance' : 'Launch Marketing Campaign'}
        description="Enter budgets, platform spend, conversion orders, and revenue to compute ROAS."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Campaign Name</label>
              <Input
                type="text"
                placeholder="e.g. Eid Handbags Premium Ads"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Platform Channel</label>
              <Select
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select Platform...</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.platformName}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Allocated Budget (BDT)</label>
              <Input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Actual Spend (BDT)</label>
              <Input type="number" value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Tracked Revenue (BDT)</label>
              <Input type="number" value={revenueAmount} onChange={(e) => setRevenueAmount(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Attributed Orders Count</label>
              <Input type="number" value={ordersGenerated} onChange={(e) => setOrdersGenerated(e.target.value)} disabled={loading} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9E7E2] mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              variant="gold"
              size="sm"
            >
              {isEdit ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
