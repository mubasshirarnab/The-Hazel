'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createExpenseAllocation } from '@/actions/allocations';
import { toast } from 'sonner';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { formatBDT } from '@/components/shared/currency';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';

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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Expense Settings */}
        <Card hoverEffect={false} className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-widest text-[#1F3A2E]">
              Expense Config
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Expense Name</label>
              <Input
                placeholder="e.g. Summer Photoshoot"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Category</label>
              <Select
                value={expenseCategoryId}
                onChange={(e) => setExpenseCategoryId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Cost Component</label>
              <Select
                value={costComponentId}
                onChange={(e) => setCostComponentId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select Component...</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.componentName}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Expense Date</label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Total Expense Amount (BDT)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Allocation Method</label>
              <Select
                value={methodCode}
                onChange={(e) => setMethodCode(e.target.value as any)}
                disabled={loading}
                required
              >
                <option value="equal_distribution">Equal Distribution</option>
                <option value="quantity_based">Quantity (Stock Ratio)</option>
                <option value="purchase_value_based">Value (Purchase Ratio)</option>
                <option value="manual_allocation">Manual Allocation</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Notes</label>
              <Textarea
                rows={2}
                placeholder="Allocation details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Variant Selector & Realtime Ratio Allocation displays */}
        <div className="lg:col-span-2 space-y-6">
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-widest text-[#1F3A2E]">
                2. Target Handbag Color Variants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                {variants.map((v) => {
                  const isSelected = selectedVariantIds.includes(v.id);
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleToggleVariant(v.id)}
                      className={`p-3 rounded-[12px] border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1F3A2E]/10 border-[#1F3A2E]/30 text-[#1F3A2E]'
                          : 'bg-[#FAFAF8] border-[#E9E7E2] hover:border-[#B08D57]/40 text-[#1A1A1A]'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-[10px] font-bold text-[#1F3A2E] block">
                          {v.variantCode}
                        </span>
                        <span className="text-xs font-semibold text-[#1A1A1A] block mt-0.5">
                          {v.productName} ({v.colorName})
                        </span>
                        <span className="text-[9px] text-[#6B6B6B] block mt-0.5 font-medium">
                          Stock: {v.currentStock} units | Purchase: {formatBDT(v.purchasePriceBdt)}
                        </span>
                      </div>

                      <div className={`h-4.5 w-4.5 rounded-[6px] border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#1F3A2E] bg-[#1F3A2E] text-white' : 'border-[#E9E7E2]'
                      }`}>
                        {isSelected && <span className="text-[9px] font-bold">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Allocation Math Results ledger */}
          {selectedVariantIds.length > 0 && (
            <Card hoverEffect={false}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs uppercase tracking-widest text-[#1F3A2E]">
                    3. Allocation Breakdown Ledger
                  </CardTitle>
                  <span className="text-xs font-bold text-[#B08D57] flex items-center gap-1 font-mono">
                    <Sparkles className="h-3.5 w-3.5 text-[#B08D57]" />
                    <span>Sum: {formatBDT(sumAllocations)}</span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-2 space-y-3">
                {calculatedAllocations.map((item) => (
                  <div
                    key={item.variantId}
                    className="p-3.5 rounded-[12px] bg-[#FAFAF8] border border-[#E9E7E2] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="font-mono text-[10px] font-bold text-[#1F3A2E]">
                        {item.variantCode}
                      </span>
                      <span className="text-[#1A1A1A] font-semibold block mt-0.5">
                        {item.productName} ({item.colorName})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-[9px] text-[#6B6B6B] uppercase tracking-widest block font-bold">Stock Cost Impact</span>
                        <span className="text-xs font-bold text-[#15803D] font-mono">
                          +{formatBDT(item.unitImpact)} / unit
                        </span>
                      </div>

                      {methodCode === 'manual_allocation' ? (
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-[#1F3A2E] font-bold uppercase tracking-widest">BDT Amount:</label>
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
                            className="w-24 px-2.5 py-1 bg-white border border-[#E9E7E2] rounded-[8px] text-center text-xs font-bold text-[#1A1A1A] focus:outline-none focus:border-[#1F3A2E]"
                            required
                          />
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-[9px] text-[#B08D57] uppercase tracking-widest block font-bold">Allocated Amount</span>
                          <span className="text-xs font-bold text-[#1A1A1A] font-mono">
                            {formatBDT(item.allocatedAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Link href="/cost-allocation">
          <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4 shrink-0" />}>
            Cancel
          </Button>
        </Link>

        <Button
          type="submit"
          loading={loading}
          disabled={selectedVariantIds.length === 0}
          variant="primary"
          icon={<Save className="h-4 w-4 shrink-0" />}
        >
          Apply Allocation
        </Button>
      </div>
    </form>
  );
}
