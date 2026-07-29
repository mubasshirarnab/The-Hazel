'use client';

import React, { useState } from 'react';
import { createCashFlowEntry } from '@/actions/finance';
import { toast } from 'sonner';
import { Plus, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';

export default function CashFlowDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
      <Button
        onClick={() => setIsOpen(true)}
        variant="gold"
        icon={<Plus className="h-4 w-4 shrink-0" />}
      >
        Log Transaction
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Log Cash Transaction"
        description="Record manual financial changes in cash reserves (inflow/outflow)."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Transaction Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEntryType('inflow')}
                disabled={loading}
                className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-[12px] border text-center transition-all cursor-pointer ${
                  entryType === 'inflow'
                    ? 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30 shadow-soft-1'
                    : 'bg-white border-[#E9E7E2] text-[#6B6B6B] hover:bg-[#FAFAF8]'
                }`}
              >
                Cash Inflow (+)
              </button>
              <button
                type="button"
                onClick={() => setEntryType('outflow')}
                disabled={loading}
                className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-[12px] border text-center transition-all cursor-pointer ${
                  entryType === 'outflow'
                    ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30 shadow-soft-1'
                    : 'bg-white border-[#E9E7E2] text-[#6B6B6B] hover:bg-[#FAFAF8]'
                }`}
              >
                Cash Outflow (-)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Entry Date</label>
            <Input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Amount (BDT)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-[#9E9E9E]" />
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Description / Reference</label>
            <Textarea
              rows={2}
              placeholder="e.g. Received bKash merchant payout, or Paid office utility bill..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9E7E2]">
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
              Record Entry
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
