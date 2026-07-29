'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/actions/orders';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Save, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { formatBDT } from '@/components/shared/currency';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';

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
        <Search className="h-3.5 w-3.5 text-[#B08D57] absolute left-3.5 pointer-events-none" />
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
          className="w-full pl-9 pr-8 py-2.5 bg-[#FAFAF8] focus:bg-white border border-[#E9E7E2] rounded-[12px] text-[#1A1A1A] placeholder-[#9E9E9E] text-xs focus:outline-none focus:border-[#1F3A2E] focus:ring-2 focus:ring-[#1F3A2E]/15 transition-all disabled:opacity-50 font-medium shadow-soft-1"
        />
        <ChevronDown className="h-4 w-4 text-[#9E9E9E] absolute right-3 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-[#E9E7E2] rounded-[12px] shadow-soft-3 z-[100] max-h-56 overflow-y-auto p-1 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-[#9E9E9E] italic text-center">No customer matching "{search}"</div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onChange(c.id.toString());
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`px-3 py-2 rounded-[8px] text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  value === c.id.toString()
                    ? 'bg-[#1F3A2E] text-white font-bold'
                    : 'text-[#1A1A1A] hover:bg-[#F7F6F3]'
                }`}
              >
                <span>{c.customerName}</span>
                <span className="text-[10px] font-mono opacity-80">{c.customerCode}</span>
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
        <Search className="h-3 w-3 text-[#B08D57] absolute left-2.5 pointer-events-none" />
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
          className="w-full pl-7 pr-7 py-2 bg-[#FAFAF8] focus:bg-white border border-[#E9E7E2] rounded-[12px] text-[#1A1A1A] placeholder-[#9E9E9E] text-xs focus:outline-none focus:border-[#1F3A2E] focus:ring-2 focus:ring-[#1F3A2E]/15 transition-all disabled:opacity-50 font-medium shadow-soft-1"
        />
        <ChevronDown className="h-3.5 w-3.5 text-[#9E9E9E] absolute right-2.5 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-[#E9E7E2] rounded-[12px] shadow-soft-3 z-[100] max-h-56 overflow-y-auto p-1 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-[#9E9E9E] italic text-center">No variant matching "{search}"</div>
          ) : (
            filtered.map((v) => (
              <div
                key={v.id}
                onClick={() => {
                  onChange(v.id.toString());
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`px-3 py-2 rounded-[8px] text-xs cursor-pointer flex flex-col gap-0.5 transition-colors ${
                  value === v.id.toString()
                    ? 'bg-[#1F3A2E] text-white font-bold'
                    : 'text-[#1A1A1A] hover:bg-[#F7F6F3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate max-w-[150px]">{v.productName}</span>
                  <span className="text-[10px] font-mono opacity-80">{v.sellingPrice} BDT</span>
                </div>
                <div className="flex items-center justify-between text-[10px] opacity-75">
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

  const [customerId, setCustomerId] = useState('');
  const [orderType, setOrderType] = useState<'in_stock' | 'preorder'>('in_stock');
  const [orderDate, setOrderDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl animate-fade-in">
      {/* 1. Header Information Section */}
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle>1. Customer & Order Settings</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">Customer</label>
              <SearchableCustomerSelect
                customers={customers}
                value={customerId}
                onChange={(val) => setCustomerId(val)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">Order Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('in_stock')}
                  disabled={loading}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-[10px] border text-center transition-all cursor-pointer ${
                    orderType === 'in_stock'
                      ? 'bg-[#1F3A2E] text-white font-bold border-[#1F3A2E] shadow-soft-1'
                      : 'bg-white border-[#E9E7E2] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F6F3]'
                  }`}
                >
                  In-Stock Fulfilled
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('preorder')}
                  disabled={loading}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-[10px] border text-center transition-all cursor-pointer ${
                    orderType === 'preorder'
                      ? 'bg-[#B08D57] text-white font-bold border-[#B08D57] shadow-soft-1'
                      : 'bg-white border-[#E9E7E2] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F6F3]'
                  }`}
                >
                  Pre-Order Reserve
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">Order Date</label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Items list section */}
      <Card hoverEffect={false}>
        <div className="flex items-center justify-between border-b border-[#E9E7E2] pb-4 mb-4">
          <h3 className="text-xl font-bold font-serif text-[#1F3A2E]">
            2. Selected Variant Items
          </h3>
          <Button
            type="button"
            variant="gold"
            size="sm"
            onClick={handleAddItem}
            disabled={loading}
            icon={<Plus className="h-4 w-4 shrink-0" />}
          >
            Add Item
          </Button>
        </div>

        <CardContent className="space-y-4 pt-0">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-[12px] bg-[#FAFAF8] border border-[#E9E7E2] grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative group hover:border-[#B08D57]/40 transition-colors"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider">Select variant</label>
                <SearchableVariantSelect
                  variants={variants}
                  value={item.variantId}
                  onChange={(val) => handleItemChange(index, 'variantId', val)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider">Price (BDT)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={item.sellingPrice}
                  onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider">Unit Discount (BDT)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={item.discountAmount}
                    onChange={(e) => handleItemChange(index, 'discountAmount', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  disabled={loading}
                  className="p-2.5 rounded-[10px] bg-white border border-[#E9E7E2] text-[#9E9E9E] hover:text-[#DC2626] hover:border-[#DC2626]/30 disabled:opacity-50 transition-colors cursor-pointer self-end mb-0.5 shadow-soft-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Computations Card */}
          <div className="p-4 rounded-[12px] bg-[#F7F6F3] border border-[#E9E7E2] flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
            <div className="space-y-1">
              <span className="text-[10px] text-[#6B6B6B] uppercase tracking-widest block font-bold">Subtotal</span>
              <span className="text-sm font-semibold text-[#1A1A1A] font-mono">{formatBDT(subtotal)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[#6B6B6B] uppercase tracking-widest block font-bold">Total Discount</span>
              <span className="text-sm font-semibold text-[#DC2626] font-mono">-{formatBDT(discountTotal)}</span>
            </div>
            <div className="space-y-1 bg-[#1F3A2E] text-white px-5 py-3 rounded-[12px] shadow-soft-1">
              <span className="text-[10px] text-[#B08D57] uppercase tracking-widest block font-bold">Grand Total</span>
              <span className="text-base font-bold font-mono">{formatBDT(grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes text area */}
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-widest">Order Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Textarea
            rows={3}
            placeholder="e.g. advance ৳1,000 paid via bKash (trx: BK128372)... COD collection for remainder..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link href="/orders">
          <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4 shrink-0" />}>
            Cancel
          </Button>
        </Link>

        <Button
          type="submit"
          loading={loading}
          variant="primary"
          icon={<Save className="h-4 w-4 shrink-0" />}
        >
          Save Order
        </Button>
      </div>
    </form>
  );
}
