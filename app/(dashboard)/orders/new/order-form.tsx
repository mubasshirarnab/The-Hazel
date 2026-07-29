'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/actions/orders';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Loader2, Save, Search, ChevronDown } from 'lucide-react';
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

function SearchableCustomerSelect({
  customers,
  value,
  onChange,
  disabled,
}: {
  customers: CustomerOption[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = customers.find((c) => c.id.toString() === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          disabled={disabled}
          placeholder="Search customer by name or code..."
          value={isOpen ? search : selected ? `${selected.customerCode} — ${selected.customerName}` : ''}
          onFocus={() => {
            setSearch('');
            setIsOpen(true);
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          className="w-full pl-9 pr-8 py-2.5 bg-[#0D0E14] border border-amber-500/20 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all disabled:opacity-50 font-medium"
        />
        <ChevronDown className="h-4 w-4 text-zinc-500 absolute right-3 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-[#0F1117] border border-amber-500/25 rounded-xl shadow-2xl z-[100] max-h-56 overflow-y-auto p-1 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-zinc-500 italic text-center">No customer matching "{search}"</div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onChange(c.id.toString());
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  value === c.id.toString()
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-zinc-300 hover:bg-amber-500/5 hover:text-amber-200'
                }`}
              >
                <span>{c.customerName}</span>
                <span className="text-[10px] font-mono text-zinc-500">{c.customerCode}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SearchableVariantSelect({
  variants,
  value,
  onChange,
  disabled,
}: {
  variants: VariantOption[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = variants.find((v) => v.id.toString() === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = variants.filter(
    (v) =>
      v.productName.toLowerCase().includes(search.toLowerCase()) ||
      v.colorName.toLowerCase().includes(search.toLowerCase()) ||
      v.variantCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="h-3 w-3 text-zinc-500 absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          disabled={disabled}
          placeholder="Search variant..."
          value={isOpen ? search : selected ? `${selected.productName} (${selected.colorName})` : ''}
          onFocus={() => {
            setSearch('');
            setIsOpen(true);
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          className="w-full pl-7 pr-7 py-2 bg-[#0D0E14] border border-amber-500/20 rounded-lg text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all disabled:opacity-50 font-medium"
        />
        <ChevronDown className="h-3.5 w-3.5 text-zinc-500 absolute right-2.5 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-[#0F1117] border border-amber-500/25 rounded-xl shadow-2xl z-[100] max-h-56 overflow-y-auto p-1 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-zinc-500 italic text-center">No variant matching "{search}"</div>
          ) : (
            filtered.map((v) => (
              <div
                key={v.id}
                onClick={() => {
                  onChange(v.id.toString());
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`px-3 py-2 rounded-lg text-xs cursor-pointer flex flex-col gap-0.5 transition-colors ${
                  value === v.id.toString()
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-zinc-300 hover:bg-amber-500/5 hover:text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate max-w-[150px]">{v.productName}</span>
                  <span className="text-[10px] font-mono text-zinc-400">{v.sellingPrice} BDT</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{v.colorName}</span>
                  <span className="font-mono">{v.variantCode}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
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
      <div className="p-6 rounded-2xl luxury-card space-y-6">
        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest border-b border-amber-500/15 pb-3">
          1. Customer & Order Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Search Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider block">Customer</label>
            <SearchableCustomerSelect
              customers={customers}
              value={customerId}
              onChange={(val) => setCustomerId(val)}
              disabled={loading}
            />
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider block">Order Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderType('in_stock')}
                disabled={loading}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  orderType === 'in_stock'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#0D0E14] border-amber-500/15 text-zinc-400 hover:text-amber-200 hover:border-amber-500/30'
                }`}
              >
                In-Stock Fulfilled
              </button>
              <button
                type="button"
                onClick={() => setOrderType('preorder')}
                disabled={loading}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  orderType === 'preorder'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#0D0E14] border-amber-500/15 text-zinc-400 hover:text-amber-200 hover:border-amber-500/30'
                }`}
              >
                Pre-Order Reserve
              </button>
            </div>
          </div>

          {/* Order Date */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider block">Order Date</label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-[#0D0E14] border border-amber-500/20 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all font-medium"
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Items list section */}
      <div className="p-6 rounded-2xl luxury-card space-y-6">
        <div className="flex items-center justify-between border-b border-amber-500/15 pb-3">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
            2. Selected Variant Items
          </h3>
          <button
            type="button"
            onClick={handleAddItem}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-[#0A0C10] border border-amber-500/15 grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative group"
            >
              {/* Select Variant */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider">Select variant</label>
                <SearchableVariantSelect
                  variants={variants}
                  value={item.variantId}
                  onChange={(val) => handleItemChange(index, 'variantId', val)}
                  disabled={loading}
                />
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider">Price (BDT)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={item.sellingPrice}
                  onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-[#0D0E14] border border-amber-500/20 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all font-medium"
                  required
                />
              </div>

              {/* Qty */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider">Quantity</label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-[#0D0E14] border border-amber-500/20 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all font-medium"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Discount */}
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider">Unit Discount (BDT)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={item.discountAmount}
                    onChange={(e) => handleItemChange(index, 'discountAmount', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-[#0D0E14] border border-amber-500/20 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  disabled={loading}
                  className="p-2 rounded-lg bg-[#0D0E14] border border-zinc-800/60 text-zinc-500 hover:text-rose-400 hover:border-rose-500/30 disabled:opacity-50 transition-colors cursor-pointer self-end mb-0.5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Computations Card */}
        <div className="p-4 rounded-xl bg-[#0A0C10] border border-amber-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Subtotal</span>
            <span className="text-sm font-semibold text-zinc-300 font-mono">{formatBDT(subtotal)}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Total Discount</span>
            <span className="text-sm font-semibold text-rose-400 font-mono">-{formatBDT(discountTotal)}</span>
          </div>
          <div className="space-y-1 bg-gradient-to-r from-amber-500/15 to-rose-500/10 px-5 py-3 rounded-xl border border-amber-500/30">
            <span className="text-[10px] text-amber-300 uppercase tracking-widest block font-bold">Grand Total</span>
            <span className="text-base font-extrabold text-amber-200 font-mono">{formatBDT(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Notes text area */}
      <div className="p-6 rounded-2xl luxury-card space-y-2">
        <label className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider block">Order Notes (Optional)</label>
        <textarea
          rows={3}
          placeholder="e.g. advance ৳1,000 paid via bKash (trx: BK128372)... COD collection for remainder..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-[#0D0E14] border border-amber-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all disabled:opacity-50 resize-none font-medium"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href="/orders"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-500/20 bg-[#0F1117] hover:bg-amber-500/5 text-zinc-400 hover:text-amber-200 transition-all text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel</span>
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-zinc-950 transition-all font-extrabold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 hover:scale-[1.01]"
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
