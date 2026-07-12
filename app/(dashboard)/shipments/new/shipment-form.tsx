'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShipment } from '@/actions/shipments';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { formatBDT } from '@/components/shared/currency';

interface POOption {
  id: number;
  purchaseOrderNumber: string;
  purchaseDate: Date | string;
  totalAmountBdt: string;
}

interface ShipmentFormProps {
  purchaseOrders: POOption[];
}

export default function ShipmentForm({ purchaseOrders }: ShipmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form states
  const [departureDate, setDepartureDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [weightKg, setWeightKg] = useState('0');
  const [shippingRatePerKg, setShippingRatePerKg] = useState('750'); // standard BDT per kg charge
  const [notes, setNotes] = useState('');

  // Selected POs
  const [selectedPoIds, setSelectedPoIds] = useState<number[]>([]);

  const handleTogglePo = (id: number) => {
    if (selectedPoIds.includes(id)) {
      setSelectedPoIds(selectedPoIds.filter((poId) => poId !== id));
    } else {
      setSelectedPoIds([...selectedPoIds, id]);
    }
  };

  const estShippingCost = (parseFloat(weightKg) || 0) * (parseFloat(shippingRatePerKg) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPoIds.length === 0) {
      toast.error('Please select at least one purchase order included in this cargo shipment.');
      return;
    }

    const wt = parseFloat(weightKg);
    const rate = parseFloat(shippingRatePerKg);

    if (isNaN(wt) || wt < 0) {
      toast.error('Please enter a valid weight.');
      return;
    }

    if (isNaN(rate) || rate < 0) {
      toast.error('Please enter a valid shipping rate.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        departureDate: departureDate || null,
        weightKg: wt,
        shippingRatePerKg: rate,
        notes: notes || null,
        poIds: selectedPoIds,
      };

      const res = await createShipment(payload);

      if (res.success) {
        toast.success('Shipment flight cargo successfully created!');
        router.push('/shipments');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create shipment.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* 1. Shipment cargo parameters */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-6">
        <h3 className="text-base font-bold text-zinc-100 border-b border-zinc-800 pb-3">
          1. Air Cargo Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Departure Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Departure Date</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors"
            />
          </div>

          {/* Cargo Weight */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Weight (KG)</label>
            <input
              type="number"
              step="0.01"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors"
              required
            />
          </div>

          {/* Shipping rate per kg */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Shipping Rate (BDT/KG)</label>
            <input
              type="number"
              value={shippingRatePerKg}
              onChange={(e) => setShippingRatePerKg(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors"
              required
            />
          </div>
        </div>

        {/* Cost estimate notice */}
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between text-xs text-zinc-400">
          <span>Calculated Air Freight Bill:</span>
          <span className="font-bold text-zinc-200 font-mono">{formatBDT(estShippingCost)}</span>
        </div>
      </div>

      {/* 2. PO Checkboxes */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-4">
        <h3 className="text-base font-bold text-zinc-100 border-b border-zinc-800 pb-3">
          2. Associate Purchase Orders (POs)
        </h3>

        {purchaseOrders.length === 0 ? (
          <div className="p-6 rounded-lg border border-dashed border-zinc-800 text-center text-zinc-500 text-sm">
            No active placed/partially received Purchase Orders available. Make sure you place a PO first before packing it in a cargo shipment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchaseOrders.map((po) => {
              const isChecked = selectedPoIds.includes(po.id);
              const formattedDate = new Date(po.purchaseDate).toLocaleDateString();

              return (
                <div
                  key={po.id}
                  onClick={() => handleTogglePo(po.id)}
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'bg-rose-500/5 border-rose-500/30 text-zinc-100'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-semibold text-rose-400 block">
                      {po.purchaseOrderNumber}
                    </span>
                    <span className="text-[10px] text-zinc-500 block font-medium">
                      Date: {formattedDate} — Value: {formatBDT(po.totalAmountBdt)}
                    </span>
                  </div>
                  
                  <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 ${
                    isChecked ? 'border-rose-500 bg-rose-600' : 'border-zinc-700'
                  }`}>
                    {isChecked && <span className="text-[9px] font-bold text-zinc-50">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Shipment Notes</label>
        <textarea
          rows={3}
          placeholder="e.g. flight number cargo manifest references..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors disabled:opacity-50 resize-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href="/shipments"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel</span>
        </Link>

        <button
          type="submit"
          disabled={loading || selectedPoIds.length === 0}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-all font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Cargo...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Shipment Cargo</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
