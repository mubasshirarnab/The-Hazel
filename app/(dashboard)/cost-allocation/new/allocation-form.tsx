'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createExpenseAllocation } from '@/actions/allocations';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { formatBDT } from '@/components/shared/currency';

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface ComponentOption {
  id: number;
  componentName: string;
}

interface VariantOption {
  id: number;
  variantCode: string;
  colorName: string;
  productName: string;
  purchasePriceBdt: string;
  currentStock: number;
}

interface AllocationFormProps {
  categories: CategoryOption[];
  components: ComponentOption[];
  variants: VariantOption[];
}

export default function AllocationForm({ categories, components, variants }: AllocationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form states
  const [expenseName, setExpenseName] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [costComponentId, setCostComponentId] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [amount, setAmount] = useState('');
  const [methodCode, setMethodCode] = useState<
    'equal_distribution' | 'quantity_based' | 'purchase_value_based' | 'manual_allocation'
  >('equal_distribution');
  const [notes, setNotes] = useState('');

  // Selected variants
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
  const [manualAmounts, setManualAmounts] = useState<Record<number, string>>({});

  const handleToggleVariant = (id: number) => {
    if (selectedVariantIds.includes(id)) {
      setSelectedVariantIds(selectedVariantIds.filter((vId) => vId !== id));
      const updated = { ...manualAmounts };
      delete updated[id];
      setManualAmounts(updated);
    } else {
      setSelectedVariantIds([...selectedVariantIds, id]);
      setManualAmounts({ ...manualAmounts, [id]: '0' });
    }
  };

  const totalAmountVal = parseFloat(amount) || 0;

  // Perform dynamic allocations based on method
  const calculatedAllocations = selectedVariantIds.map((vId) => {
    const variant = variants.find((v) => v.id === vId)!;
    const qty = variant.currentStock || 0;
    const price = parseFloat(variant.purchasePriceBdt) || 0;

    let allocatedAmount = 0;
    let qtyBasis = qty;
    let valBasis = price;

    if (methodCode === 'equal_distribution') {
      allocatedAmount = selectedVariantIds.length > 0 ? totalAmountVal / selectedVariantIds.length : 0;
      qtyBasis = 0;
      valBasis = 0;
    } else if (methodCode === 'quantity_based') {
      const totalStockSum = selectedVariantIds.reduce((sum, id) => {
        const v = variants.find((x) => x.id === id)!;
        return sum + (v.currentStock || 0);
      }, 0);
      allocatedAmount = totalStockSum > 0 ? (totalAmountVal * qty) / totalStockSum : 0;
      valBasis = 0;
    } else if (methodCode === 'purchase_value_based') {
      const totalValueSum = selectedVariantIds.reduce((sum, id) => {
        const v = variants.find((x) => x.id === id)!;
        return sum + (parseFloat(v.purchasePriceBdt) || 0);
      }, 0);
      allocatedAmount = totalValueSum > 0 ? (totalAmountVal * price) / totalValueSum : 0;
      qtyBasis = 0;
    } else {
      // Manual Allocation
      allocatedAmount = parseFloat(manualAmounts[vId]) || 0;
      qtyBasis = 0;
      valBasis = 0;
    }

    const unitImpact = qty > 0 ? allocatedAmount / qty : 0;

    return {
      variantId: vId,
      variantCode: variant.variantCode,
      productName: variant.productName,
      colorName: variant.colorName,
      quantityBasis: qtyBasis,
      valueBasis: valBasis,
      allocatedAmount,
      unitImpact,
    };
  });

  const sumAllocations = calculatedAllocations.reduce((sum, item) => sum + item.allocatedAmount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseName || !expenseCategoryId || !costComponentId || !amount) {
      toast.error('All fields are required.');
      return;
    }

    if (selectedVariantIds.length === 0) {
      toast.error('Please select at least one variant to allocate costs to.');
      return;
    }

    if (Math.abs(sumAllocations - totalAmountVal) > 0.05) {
      toast.error(`Total allocations must equal the total expense amount. Currently: ৳${sumAllocations.toFixed(2)} vs ৳${totalAmountVal.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        expenseName,
        expenseCategoryId: Number(expenseCategoryId),
        costComponentId: Number(costComponentId),
        expenseDate,
        amount: totalAmountVal,
        methodCode,
        notes: notes || null,
        allocations: calculatedAllocations.map((c) => ({
          variantId: c.variantId,
          quantityBasis: c.quantityBasis,
          valueBasis: c.valueBasis,
          allocationAmount: c.allocatedAmount,
        })),
      };

      const res = await createExpenseAllocation(payload);

      if (res.success) {
        toast.success('Cost allocation completed and saved successfully!');
        router.push('/cost-allocation');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process cost allocation.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Expense Settings */}
        <div className="lg:col-span-1 p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-5 h-fit">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest border-b border-zinc-800 pb-3">
            Expense Config
          </h3>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Expense Name</label>
            <input
              type="text"
              placeholder="e.g. Summer Photoshoot"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Category</label>
            <select
              value={expenseCategoryId}
              onChange={(e) => setExpenseCategoryId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
              required
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Component */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cost Component</label>
            <select
              value={costComponentId}
              onChange={(e) => setCostComponentId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
              required
            >
              <option value="">Select Component...</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.componentName}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Expense Date</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Expense Amount (BDT)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          {/* Method */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Allocation Method</label>
            <select
              value={methodCode}
              onChange={(e) => setMethodCode(e.target.value as any)}
              disabled={loading}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
              required
            >
              <option value="equal_distribution">Equal Distribution</option>
              <option value="quantity_based">Quantity (Stock Ratio)</option>
              <option value="purchase_value_based">Value (Purchase Ratio)</option>
              <option value="manual_allocation">Manual Allocation</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Notes</label>
            <textarea
              rows={2}
              placeholder="Allocation details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>
        </div>

        {/* Right Column: Variant Selector & Realtime Ratio Allocation displays */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Variant Selection Grid */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest border-b border-zinc-800 pb-3">
              2. Target Handbag Color Variants
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
              {variants.map((v) => {
                const isSelected = selectedVariantIds.includes(v.id);
                return (
                  <div
                    key={v.id}
                    onClick={() => handleToggleVariant(v.id)}
                    className={`p-3 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-500/5 border-rose-500/30 text-zinc-100'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-750 text-zinc-400'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-[10px] font-semibold text-rose-400 block">
                        {v.variantCode}
                      </span>
                      <span className="text-xs font-semibold text-zinc-200 block mt-0.5">
                        {v.productName} ({v.colorName})
                      </span>
                      <span className="text-[9px] text-zinc-500 block mt-0.5">
                        Stock: {v.currentStock} units | Purchase: {formatBDT(v.purchasePriceBdt)}
                      </span>
                    </div>

                    <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-rose-500 bg-rose-600' : 'border-zinc-700'
                    }`}>
                      {isSelected && <span className="text-[9px] font-bold text-zinc-50">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Allocation Math Results ledger */}
          {selectedVariantIds.length > 0 && (
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-4">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest border-b border-zinc-800 pb-3 flex items-center justify-between">
                <span>3. Allocation Breakdown Ledger</span>
                <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Sum: {formatBDT(sumAllocations)}</span>
                </span>
              </h3>

              <div className="space-y-3">
                {calculatedAllocations.map((item) => (
                  <div
                    key={item.variantId}
                    className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-850 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="font-mono text-[10px] font-semibold text-rose-400">
                        {item.variantCode}
                      </span>
                      <span className="text-zinc-200 font-semibold block mt-0.5">
                        {item.productName} ({item.colorName})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-medium">Stock Cost Impact</span>
                        <span className="text-xs font-semibold text-zinc-400">
                          +{formatBDT(item.unitImpact)} / unit
                        </span>
                      </div>

                      {methodCode === 'manual_allocation' ? (
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">BDT Amount:</label>
                          <input
                            type="number"
                            value={manualAmounts[item.variantId] || ''}
                            onChange={(e) =>
                              setManualAmounts({
                                ...manualAmounts,
                                [item.variantId]: e.target.value,
                              })
                            }
                            disabled={loading}
                            className="w-24 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-center text-xs font-semibold text-zinc-100 focus:outline-none focus:border-rose-500"
                            required
                          />
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-[9px] text-rose-400 uppercase tracking-widest block font-bold">Allocated Amount</span>
                          <span className="text-xs font-bold text-zinc-100 font-mono">
                            {formatBDT(item.allocatedAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button bar */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href="/cost-allocation"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel</span>
        </Link>

        <button
          type="submit"
          disabled={loading || selectedVariantIds.length === 0}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-all font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Allocating Costs...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Apply Allocation</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
