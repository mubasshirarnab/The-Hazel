'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createExpense } from '@/actions/business-expenses';
import { toast } from 'sonner';
import { ArrowLeft, Save, Receipt, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';

interface ProductOption {
  id: number;
  productName: string;
  sku: string;
}

interface ExpenseFormProps {
  products: ProductOption[];
}

export default function ExpenseForm({ products }: ExpenseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [expenseDate, setExpenseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [expenseType, setExpenseType] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [productRelated, setProductRelated] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);
  const [platform, setPlatform] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseDate) {
      toast.error('Date is required.');
      return;
    }

    if (!expenseType.trim()) {
      toast.error('Expense Type is required.');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid expense amount.');
      return;
    }

    if (productRelated && !productId) {
      toast.error('Please select the related product.');
      return;
    }

    setLoading(true);

    try {
      const res = await createExpense({
        expenseDate,
        expenseType: expenseType.trim(),
        description: description.trim() || null,
        amount: amt,
        productRelated,
        productId: productRelated ? productId : null,
        platform: platform.trim() || null,
      });

      if (res.success) {
        toast.success(
          productRelated
            ? 'Expense recorded and distributed equally across product inventory cost!'
            : 'Expense recorded successfully!'
        );
        router.push('/business-expenses');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record expense.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl animate-fade-in">
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#B08D57]" />
            <span>Record Business Expense</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Date *</label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Expense Type *</label>
              <Input
                placeholder="e.g. Facebook Ads, Packaging, Courier, Photography"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Amount (BDT) *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Platform</label>
              <Input
                placeholder="e.g. Meta Ads, Pathao, RedX, Local Vendor"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Description / Notes</label>
            <Textarea
              rows={3}
              placeholder="e.g. Boost post for Hazel Handbag summer campaign..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Product Related Toggle */}
          <div className="p-4 rounded-[12px] bg-[#FAFAF8] border border-[#E9E7E2] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Product Related Expense?</span>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  If Yes, this expense amount will be distributed equally across all units of the chosen product.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProductRelated(false)}
                  disabled={loading}
                  className={`py-2 px-4 text-xs font-semibold rounded-[10px] border transition-all cursor-pointer ${
                    !productRelated
                      ? 'bg-[#1F3A2E] text-white font-bold border-[#1F3A2E]'
                      : 'bg-white border-[#E9E7E2] text-[#6B6B6B] hover:bg-[#F7F6F3]'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setProductRelated(true)}
                  disabled={loading}
                  className={`py-2 px-4 text-xs font-semibold rounded-[10px] border transition-all cursor-pointer ${
                    productRelated
                      ? 'bg-[#B08D57] text-white font-bold border-[#B08D57]'
                      : 'bg-white border-[#E9E7E2] text-[#6B6B6B] hover:bg-[#F7F6F3]'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {productRelated && (
              <div className="space-y-1.5 pt-2 border-t border-[#E9E7E2] animate-fade-in">
                <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Select Product *</label>
                <Select
                  value={productId || ''}
                  onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : null)}
                  disabled={loading}
                  required
                >
                  <option value="">Select Target Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} ({p.sku})
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
        <Link href="/business-expenses">
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
          Save Expense
        </Button>
      </div>
    </form>
  );
}