'use client';

import React, { useState } from 'react';
import { adjustInventory } from '@/actions/inventory';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Select, Textarea } from '@/components/ui/input';

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

    if (reason.trim().length < 3) {
      toast.error('Reason must be at least 3 characters.');
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
      <Button
        onClick={() => setIsOpen(true)}
        variant="gold"
        icon={<RefreshCw className="h-4 w-4 shrink-0" />}
      >
        Manual Adjustment
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Manual Stock Adjustment"
        description="Record manual stock additions or subtractions directly into warehouse inventory."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Select Variant</label>
            <Select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">Select Variant...</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.variantCode} — {v.productName} ({v.colorName})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Warehouse</label>
            <Select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              disabled={loading}
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.warehouseCode} — {w.warehouseName}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('increase')}
                  disabled={loading}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-[10px] border text-center transition-all cursor-pointer ${
                    adjustmentType === 'increase'
                      ? 'bg-[#22C55E]/10 text-[#15803D] border-[#22C55E]/30 font-bold'
                      : 'bg-white border-[#E9E7E2] text-[#6B6B6B] hover:bg-[#F7F6F3]'
                  }`}
                >
                  Increase (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('decrease')}
                  disabled={loading}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-[10px] border text-center transition-all cursor-pointer ${
                    adjustmentType === 'decrease'
                      ? 'bg-[#DC2626]/10 text-[#B91C1C] border-[#DC2626]/30 font-bold'
                      : 'bg-white border-[#E9E7E2] text-[#6B6B6B] hover:bg-[#F7F6F3]'
                  }`}
                >
                  Decrease (-)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Quantity</label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Reason for Adjustment</label>
            <Textarea
              rows={2}
              placeholder="e.g. Received extra sample stock or inventory audit discrepancy..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              required
            />
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
              variant="primary"
              size="sm"
            >
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
