'use client';

import React, { useState } from 'react';
import { createCampaign, updateCampaign } from '@/actions/marketing';
import { toast } from 'sonner';
import { Plus, Edit2, X, Loader2, Save } from 'lucide-react';

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
  campaign?: CampaignData; // Edit mode if provided
  platforms: PlatformOption[];
  trigger?: React.ReactNode;
}

export default function CampaignDialog({ campaign, platforms, trigger }: CampaignDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!campaign;

  // Form states
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
          // Reset
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
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer shadow-lg shadow-rose-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Campaign</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-zinc-100">
                {isEdit ? 'Edit Campaign performance' : 'Launch Marketing Campaign'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Enter budgets, platform spend, conversion orders, and revenue to compute ROAS.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Campaign Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Eid Handbags Premium Ads"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Platform Channel</label>
                  <select
                    value={platformId}
                    onChange={(e) => setPlatformId(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                    required
                  >
                    <option value="">Select Platform...</option>
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.platformName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Allocated Budget (BDT)</label>
                  <input
                    type="number"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Actual Spend (BDT)</label>
                  <input
                    type="number"
                    value={spendAmount}
                    onChange={(e) => setSpendAmount(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Tracked Revenue (BDT)</label>
                  <input
                    type="number"
                    value={revenueAmount}
                    onChange={(e) => setRevenueAmount(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Attributed Orders Count</label>
                  <input
                    type="number"
                    value={ordersGenerated}
                    onChange={(e) => setOrdersGenerated(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80 mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{isEdit ? 'Save Changes' : 'Create Campaign'}</span>
                    </>
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
