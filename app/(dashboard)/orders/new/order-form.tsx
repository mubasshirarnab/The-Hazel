'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/actions/orders';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { formatBDT } from '@/components/shared/currency';

interface CustomerOption {
  id: number;
  customerCode: string;
  customerName: string;
}

interface VariantOption {
  id: number;
  variantCode: string;
  colorName: string;
  productName: string;
  sellingPrice: string;
}

interface OrderFormProps {
  customers: CustomerOption[];
  variants: VariantOption[];
}

interface SelectedItem {
  variantId: string;
  quantity: string;
  sellingPrice: string;
  discountAmount: string;
}

export default function OrderForm({ customers, variants }: OrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [orderType, setOrderType] = useState<'in_stock' | 'preorder'>('in_stock');
  const [orderDate, setOrderDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  // Selected items state
  const [items, setItems] = useState<SelectedItem[]>([
    { variantId: '', quantity: '1', sellingPrice: '0', discountAmount: '0' },
  ]);

  const handleAddItem = () => {
    setItems([...items, { variantId: '', quantity: '1', sellingPrice: '0', discountAmount: '0' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error('At least one item is required in the order.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof SelectedItem, value: string) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // Prefill selling price when variant changes
    if (field === 'variantId') {
      const selectedVariant = variants.find((v) => v.id.toString() === value);
      if (selectedVariant) {
        item.sellingPrice = parseFloat(selectedVariant.sellingPrice).toString();
      } else {
        item.sellingPrice = '0';
      }
    }

    updated[index] = item;
    setItems(updated);
  };

  // Compute summary totals
  const subtotal = items.reduce((acc, item) => {
    const qty = parseInt(item.quantity) || 0;
    const price = parseFloat(item.sellingPrice) || 0;
    return acc + qty * price;
  }, 0);

  const discountTotal = items.reduce((acc, item) => {
    const qty = parseInt(item.quantity) || 0;
    const disc = parseFloat(item.discountAmount) || 0;
    return acc + qty * disc;
  }, 0);

  const grandTotal = Math.max(subtotal - discountTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error('Please select a customer.');
      return;
    }

    if (!orderDate) {
      toast.error('Order date is required.');
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
      const price = parseFloat(item.sellingPrice);
      if (isNaN(price) || price < 0) {
        toast.error(`Price for item ${i + 1} must be non-negative.`);
        return;
      }
      const disc = parseFloat(item.discountAmount);
      if (isNaN(disc) || disc < 0) {
        toast.error(`Discount for item ${i + 1} must be non-negative.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        customerId: Number(customerId),
        orderType,
        orderDate,
        notes: notes || null,
        items: items.map((item) => ({
          variantId: Number(item.variantId),
          quantity: parseInt(item.quantity),
          sellingPrice: parseFloat(item.sellingPrice),
          discountAmount: parseFloat(item.discountAmount),
        })),
      };

      const res = await createOrder(payload);

      if (res.success) {
        toast.success(`Order created successfully! (${res.orderNumber})`);
        router.push('/orders');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create order.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* 1. Header Information Section */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-6">
        <h3 className="text-base font-bold text-zinc-100 border-b border-zinc-800 pb-3">
          1. Customer & Order Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors"
              required
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerCode} — {c.customerName}
                </option>
              ))}
            </select>
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Order Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderType('in_stock')}
                disabled={loading}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                  orderType === 'in_stock'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                In-Stock Fulfilled
              </button>
              <button
                type="button"
                onClick={() => setOrderType('preorder')}
                disabled={loading}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                  orderType === 'preorder'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Pre-Order Reserve
              </button>
            </div>
          </div>

          {/* Order Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Order Date</label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors"
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Items list section */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-base font-bold text-zinc-100">
            2. Selected Variant Items
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
          {items.map((item, index) => (
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

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Price (BDT)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={item.sellingPrice}
                  onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              {/* Qty */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quantity</label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Discount */}
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Unit Discount (BDT)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={item.discountAmount}
                    onChange={(e) => handleItemChange(index, 'discountAmount', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
                  />
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
          ))}
        </div>

        {/* Computations Card */}
        <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Subtotal</span>
            <span className="text-sm font-semibold text-zinc-300">{formatBDT(subtotal)}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Total Discount</span>
            <span className="text-sm font-semibold text-rose-400">-{formatBDT(discountTotal)}</span>
          </div>
          <div className="space-y-1 bg-zinc-900 px-4 py-2 rounded border border-zinc-800">
            <span className="text-[10px] text-rose-400 uppercase tracking-widest block font-bold">Grand Total</span>
            <span className="text-base font-bold text-zinc-50">{formatBDT(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Notes text area */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Order Notes</label>
        <textarea
          rows={3}
          placeholder="e.g. advance ৳1,000 paid via bKash (trx: BK128372)... COD collection for remainder..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors disabled:opacity-50 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href="/orders"
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
              <span>Saving Order...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Order</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
