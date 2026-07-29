'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPurchaseOrder } from '@/actions/purchase-orders';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { formatBDT } from '@/components/shared/currency';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';

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

  const [supplierId, setSupplierId] = useState('');
  const [friendId, setFriendId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [historicalRmbRate, setHistoricalRmbRate] = useState('14.50');
  const [chinaLocalDeliveryCost, setChinaLocalDeliveryCost] = useState('0');
  const [notes, setNotes] = useState('');

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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl animate-fade-in">
      {/* 1. Supplier & Exchange Rate Settings */}
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle>1. Supply Chain & Rate Configuration</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">Supplier</label>
              <Select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplierCode} — {s.supplierName}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">China Agent (Friend)</label>
              <Select
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select China Agent...</option>
                {friends.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.friendCode} — {f.friendName}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">PO Date</label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">
                Exchange Rate (RMB to BDT)
              </label>
              <Input
                type="number"
                step="0.0001"
                value={historicalRmbRate}
                onChange={(e) => setHistoricalRmbRate(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">
                China Local Delivery Cost (RMB)
              </label>
              <Input
                type="number"
                value={chinaLocalDeliveryCost}
                onChange={(e) => setChinaLocalDeliveryCost(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Items purchasing list */}
      <Card hoverEffect={false}>
        <div className="flex items-center justify-between border-b border-[#E9E7E2] pb-4 mb-4">
          <h3 className="text-xl font-bold font-serif text-[#1F3A2E]">
            2. Purchase Order Items
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
          {items.map((item, index) => {
            const priceRmb = parseFloat(item.unitPurchasePriceRmb) || 0;
            const priceBdt = priceRmb * rmbRate;

            return (
              <div
                key={index}
                className="p-4 rounded-[12px] bg-[#FAFAF8] border border-[#E9E7E2] grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative group hover:border-[#B08D57]/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest">Select variant</label>
                  <Select
                    value={item.variantId}
                    onChange={(e) => handleItemChange(index, 'variantId', e.target.value)}
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
                  <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest">Price (¥ RMB)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={item.unitPurchasePriceRmb}
                    onChange={(e) => handleItemChange(index, 'unitPurchasePriceRmb', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest">Quantity Ordered</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest block">Est. Cost (BDT)</label>
                    <span className="block text-xs font-bold text-[#1A1A1A] font-mono py-2">
                      {formatBDT(priceBdt)}
                    </span>
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
            );
          })}

          <div className="p-4 rounded-[12px] bg-[#F7F6F3] border border-[#E9E7E2] flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
            <div className="space-y-1">
              <span className="text-[10px] text-[#6B6B6B] uppercase tracking-widest block font-bold">Items Value (BDT)</span>
              <span className="text-sm font-semibold text-[#1A1A1A] font-mono">{formatBDT(subtotalBdt)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[#6B6B6B] uppercase tracking-widest block font-bold">China Delivery (BDT)</span>
              <span className="text-sm font-semibold text-[#1A1A1A] font-mono">{formatBDT(deliveryCostBdt)}</span>
            </div>
            <div className="space-y-1 bg-[#1F3A2E] text-white px-5 py-3 rounded-[12px] shadow-soft-1">
              <span className="text-[10px] text-[#B08D57] uppercase tracking-widest block font-bold">Estimated PO Total</span>
              <span className="text-base font-bold font-mono">{formatBDT(grandTotalBdt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider">PO Notes</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Textarea
            rows={3}
            placeholder="Enter payment reference, supply conditions, or custom instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Link href="/purchase-orders">
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
          Save Purchase Order
        </Button>
      </div>
    </form>
  );
}
