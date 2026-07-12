'use client';

import React, { useState } from 'react';
import { createCashFlowEntry } from '@/actions/finance';
import { toast } from 'sonner';
import { Plus, X, Loader2, DollarSign } from 'lucide-react';

export default function CashFlowDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [entryType, setEntryType] = useState<'inflow' | 'outflow'>('inflow');
  const [entryDate, setEntryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !description || !entryDate) {
      toast.error('All fields are required.');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Amount must be a positive number.');
      return;
    }

    setLoading(true);

    try {
      const res = await createCashFlowEntry({
        entryDate,
        entryType,
        amount: amt,
        description,
      });

      if (res.success) {
        toast.success('Cash flow transaction recorded successfully!');
        setIsOpen(false);
        // Reset form
        setAmount('');
        setDescription('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record cash flow.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer shadow-lg shadow-rose-600/10"
      >
        <Plus className="h-4.5 w-4.5" />
        <span>Log Transaction</span>
      </button>

      {/* Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-zinc-100">Log Cash Transaction</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Record manual financial changes in cash reserves (inflow/outflow).
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Entry Type Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Transaction Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryType('inflow')}
                    disabled={loading}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                      entryType === 'inflow'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Cash Inflow (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryType('outflow')}
                    disabled={loading}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                      entryType === 'outflow'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Cash Outflow (-)
                  </button>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Entry Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  required
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Amount (BDT)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Description / Reference</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Received bKash merchant payout, or Paid office utility bill..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-xs focus:outline-none focus:border-rose-500 transition-colors resize-none"
                  required
                />
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
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Record Entry</span>
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
