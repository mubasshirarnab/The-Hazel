'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPurchaseOrder } from '@/actions/purchase-orders';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { formatBDT } from '@/components/shared/currency';

interface SupplierOption {
  id: number;
  supplierCode: string;
  supplierName: string;
}

interface FriendOption {
  id: number;
  friendCode: string;
  friendName: string;
}

interface VariantOption {
  id: number;
  variantCode: string;
  colorName: string;
  productName: string;
}

interface POFormProps {
  suppliers: SupplierOption[];
  friends: FriendOption[];
  variants: VariantOption[];
}

interface SelectedItem {
  variantId: string;
  quantity: string;
  unitPurchasePriceRmb: string;
  notes: string;
}

export default function POForm({ suppliers, friends, variants }: POFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form states
  const [supplierId, setSupplierId] = useState('');
  const [friendId, setFriendId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [historicalRmbRate, setHistoricalRmbRate] = useState('14.50');
  const [chinaLocalDeliveryCost, setChinaLocalDeliveryCost] = useState('0');
  const [notes, setNotes] = useState('');

  // Selected items state
  const [items, setItems] = useState<SelectedItem[]>([
    { variantId: '', quantity: '10', unitPurchasePriceRmb: '0', notes: '' },
  ]);

  const handleAddItem = () => {
    setItems([...items, { variantId: '', quantity: '10', unitPurchasePriceRmb: '0', notes: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error('At least one item is required in the PO.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof SelectedItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Computations
  const rmbRate = parseFloat(historicalRmbRate) || 0;
  const deliveryCostBdt = (parseFloat(chinaLocalDeliveryCost) || 0) * rmbRate;

  const subtotalBdt = items.reduce((acc, item) => {
    const qty = parseInt(item.quantity) || 0;
    const priceRmb = parseFloat(item.unitPurchasePriceRmb) || 0;
    return acc + qty * priceRmb * rmbRate;
  }, 0);

  const grandTotalBdt = subtotalBdt + deliveryCostBdt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !friendId) {
      toast.error('Please select both a Supplier and a China Agent.');
      return;
    }

    if (!purchaseDate) {
      toast.error('Purchase date is required.');
      return;
    }

    if (rmbRate <= 0) {
      toast.error('Please enter a valid exchange rate.');
      return;
    }

    // Validate items
    for (const [i, item] of items.entries()) {
      if (!item.variantId) {
        toast.error(`Please select a variant for item ${i + 1}.`);
        return;
      }
      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        toast.error(`Quantity for item ${i + 1} must be greater than 0.`);
        return;
      }
      const price = parseFloat(item.unitPurchasePriceRmb);
      if (isNaN(price) || price < 0) {
        toast.error(`Unit price for item ${i + 1} must be non-negative.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        supplierId: Number(supplierId),
        friendId: Number(friendId),
        purchaseDate,
        historicalRmbRate: rmbRate,
        chinaLocalDeliveryCost: parseFloat(chinaLocalDeliveryCost) || 0,
        notes: notes || null,
        items: items.map((i) => ({
          variantId: Number(i.variantId),
          quantity: parseInt(i.quantity),
          unitPurchasePriceRmb: parseFloat(i.unitPurchasePriceRmb),
          notes: i.notes || null,
        })),
      };

      const res = await createPurchaseOrder(payload);

      if (res.success) {
        toast.success('Purchase Order created successfully!');
        router.push('/purchase-orders');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create purchase order.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* 1. Supplier & Exchange Rate Settings */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-6">
        <h3 className="text-base font-bold text-zinc-100 border-b border-zinc-800 pb-3">
          1. Supply Chain & Rate Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Supplier select */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors"
              required
            >
              <option value="">Select Supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.supplierCode} — {s.supplierName}
                </option>
              ))}
            </select>
          </div>

          {/* China Agent friend select */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">China Agent (Friend)</label>
            <select
              value={friendId}
              onChange={(e) => setFriendId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors"
              required
            >
              <option value="">Select China Agent...</option>
              {friends.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.friendCode} — {f.friendName}
                </option>
              ))}
            </select>
          </div>

          {/* PO Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">PO Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors"
              required
            />
          </div>

          {/* Historical exchange rate */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Exchange Rate (RMB to BDT)
            </label>
            <input
              type="number"
              step="0.0001"
              value={historicalRmbRate}
              onChange={(e) => setHistoricalRmbRate(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors"
              required
            />
          </div>

          {/* China local delivery cost */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              China Local Delivery Cost (RMB)
            </label>
            <input
              type="number"
              value={chinaLocalDeliveryCost}
              onChange={(e) => setChinaLocalDeliveryCost(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 2. Items purchasing list */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-base font-bold text-zinc-100">
            2. Purchase Order Items
          </h3>
          <button
            type="button"
            onClick={handleAddItem}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const priceRmb = parseFloat(item.unitPurchasePriceRmb) || 0;
            const priceBdt = priceRmb * rmbRate;

            return (
              <div
                key={index}
                className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800/80 grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative group"
              >
                {/* Select Variant */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select variant</label>
                  <select
                    value={item.variantId}
                    onChange={(e) => handleItemChange(index, 'variantId', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
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

                {/* Unit Price (RMB) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Price (¥ RMB)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={item.unitPurchasePriceRmb}
                    onChange={(e) => handleItemChange(index, 'unitPurchasePriceRmb', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                {/* Qty */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quantity Ordered</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* calculated BDT equivalent */}
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Est. Cost (BDT)</label>
                    <span className="block text-xs font-semibold text-zinc-400 font-mono py-2">
                      {formatBDT(priceBdt)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={loading}
                    className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-500/20 disabled:opacity-50 transition-colors cursor-pointer self-end mb-0.5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals Summary */}
        <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Items Value (BDT)</span>
            <span className="text-sm font-semibold text-zinc-300">{formatBDT(subtotalBdt)}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">China Delivery (BDT)</span>
            <span className="text-sm font-semibold text-zinc-300">{formatBDT(deliveryCostBdt)}</span>
          </div>
          <div className="space-y-1 bg-zinc-900 px-4 py-2 rounded border border-zinc-800">
            <span className="text-[10px] text-rose-400 uppercase tracking-widest block font-bold">Estimated PO Total</span>
            <span className="text-base font-bold text-zinc-50">{formatBDT(grandTotalBdt)}</span>
          </div>
        </div>
      </div>

      {/* Notes text area */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">PO Notes</label>
        <textarea
          rows={3}
          placeholder="Enter payment reference, supply conditions, or custom instructions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors disabled:opacity-50 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href="/purchase-orders"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel</span>
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-all font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving PO...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Purchase Order</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
