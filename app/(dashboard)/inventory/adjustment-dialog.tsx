'use client';

import React, { useState } from 'react';
import { adjustInventory } from '@/actions/inventory';
import { toast } from 'sonner';
import { Plus, X, Loader2, RefreshCw } from 'lucide-react';

interface VariantOption {
  id: number;
  variantCode: string;
  colorName: string;
  productName: string;
}

interface WarehouseOption {
  id: number;
  warehouseCode: string;
  warehouseName: string;
}

interface AdjustmentDialogProps {
  variants: VariantOption[];
  warehouses: WarehouseOption[];
}

export default function AdjustmentDialog({ variants, warehouses }: AdjustmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [variantId, setVariantId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  // Default warehouse selection to WH001 (id = 1)
  React.useEffect(() => {
    if (warehouses.length > 0) {
      const wh001 = warehouses.find(w => w.warehouseCode === 'WH001');
      if (wh001) {
        setWarehouseId(wh001.id.toString());
      } else {
        setWarehouseId(warehouses[0].id.toString());
      }
    }
  }, [warehouses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!variantId || !warehouseId || !quantity || !reason) {
      toast.error('All fields are required.');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantity must be a positive integer.');
      return;
    }

    setLoading(true);

    try {
      const res = await adjustInventory({
        variantId: Number(variantId),
        warehouseId: Number(warehouseId),
        adjustmentType,
        quantity: qty,
        reason,
      });

      if (res.success) {
        toast.success('Inventory adjustment recorded successfully!');
        setIsOpen(false);
        // Reset form
        setVariantId('');
        setQuantity('');
        setReason('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust inventory.');
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
        <RefreshCw className="h-4 w-4" />
        <span>Manual Adjustment</span>
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
              <h3 className="text-lg font-bold text-zinc-100">Manual Stock Adjustment</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Record manual stock additions or subtractions directly into warehouse inventory.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Variant selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Select Variant</label>
                <select
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500 transition-colors disabled:opacity-50"
                  required
                >
                  <option value="">Select Variant...</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.variantCode} — {v.productName} ({v.colorName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Warehouse</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500 transition-colors disabled:opacity-50"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouseCode} — {w.warehouseName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Adjustment Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustmentType('increase')}
                      disabled={loading}
                      className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                        adjustmentType === 'increase'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Increase (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentType('decrease')}
                      disabled={loading}
                      className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                        adjustmentType === 'decrease'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Decrease (-)
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-sm focus:outline-none focus:border-rose-500 transition-colors disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Reason for Adjustment</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Received extra sample stock or inventory audit discrepancy..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-xs focus:outline-none focus:border-rose-500 transition-colors disabled:opacity-50 resize-none"
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
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Adjusting...</span>
                    </>
                  ) : (
                    <span>Confirm Adjustment</span>
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
