'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/actions/products';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';

interface Category {
  id: number;
  categoryName: string;
}

interface ProductFormProps {
  categories: Category[];
}

export default function ProductForm({ categories }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Product Core State
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [purchaseLink, setPurchaseLink] = useState('');
  const [notes, setNotes] = useState('');

  // Variants State
  const [variants, setVariants] = useState<
    { colorName: string; sellingPrice: string; purchasePriceBdt: string; notes: string }[]
  >([{ colorName: '', sellingPrice: '', purchasePriceBdt: '', notes: '' }]);

  const addVariant = () => {
    setVariants([...variants, { colorName: '', sellingPrice: '', purchasePriceBdt: '', notes: '' }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) {
      toast.error('At least one color variant is required.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !sku) {
      toast.error('Product Name and SKU are required.');
      return;
    }

    for (const [i, v] of variants.entries()) {
      if (!v.colorName) {
        toast.error(`Variant ${i + 1} is missing a color name.`);
        return;
      }
      const sellVal = parseFloat(v.sellingPrice);
      const buyVal = parseFloat(v.purchasePriceBdt);
      if (isNaN(sellVal) || sellVal < 0) {
        toast.error(`Variant ${i + 1} must have a non-negative selling price.`);
        return;
      }
      if (isNaN(buyVal) || buyVal < 0) {
        toast.error(`Variant ${i + 1} must have a non-negative purchase price.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        product: {
          productName,
          sku,
          categoryId: categoryId || null,
          purchaseLink: purchaseLink || null,
          notes: notes || null,
        },
        variants: variants.map((v) => ({
          colorName: v.colorName,
          sellingPrice: parseFloat(v.sellingPrice),
          purchasePriceBdt: parseFloat(v.purchasePriceBdt),
          notes: v.notes || null,
        })),
      };

      const res = await createProduct(payload);

      if (res.success) {
        toast.success('Product and variants created successfully!');
        router.push('/products');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl animate-fade-in">
      {/* 1. Product Information Section */}
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle>1. Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Product Name</label>
              <Input
                placeholder="e.g. Hazel Classic Leather Handbag"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">SKU</label>
              <Input
                placeholder="e.g. HZL-CL-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Category</label>
              <Select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                disabled={loading}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Supplier Purchase Link</label>
              <Input
                placeholder="e.g. https://detail.1688.com/..."
                value={purchaseLink}
                onChange={(e) => setPurchaseLink(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">General Notes</label>
            <Textarea
              rows={3}
              placeholder="Add any general details, description, or supply rules for this product..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Color Variants Section */}
      <Card hoverEffect={false}>
        <div className="flex items-center justify-between border-b border-[#E9E7E2] pb-4 mb-4">
          <h3 className="text-xl font-bold font-serif text-[#1F3A2E]">
            2. Color Variants & Pricing
          </h3>
          <Button
            type="button"
            variant="gold"
            size="sm"
            onClick={addVariant}
            disabled={loading}
            icon={<Plus className="h-4 w-4 shrink-0" />}
          >
            Add Color
          </Button>
        </div>

        <CardContent className="space-y-4 pt-0">
          {variants.map((v, index) => (
            <div
              key={index}
              className="p-4 rounded-[12px] bg-[#FAFAF8] border border-[#E9E7E2] grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative group hover:border-[#B08D57]/40 transition-colors"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Color Name</label>
                <Input
                  placeholder="e.g. Classic Black"
                  value={v.colorName}
                  onChange={(e) => handleVariantChange(index, 'colorName', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Selling Price (BDT)</label>
                <Input
                  type="number"
                  placeholder="e.g. 3500"
                  value={v.sellingPrice}
                  onChange={(e) => handleVariantChange(index, 'sellingPrice', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Purchase Price (BDT)</label>
                <Input
                  type="number"
                  placeholder="e.g. 1500"
                  value={v.purchasePriceBdt}
                  onChange={(e) => handleVariantChange(index, 'purchasePriceBdt', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Notes</label>
                  <Input
                    placeholder="e.g. Premium variant"
                    value={v.notes}
                    onChange={(e) => handleVariantChange(index, 'notes', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  disabled={loading}
                  className="p-2.5 rounded-[10px] bg-white border border-[#E9E7E2] text-[#9E9E9E] hover:text-[#DC2626] hover:border-[#DC2626]/30 disabled:opacity-50 transition-all cursor-pointer self-end mb-0.5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link href="/products">
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
          Save Product & Variants
        </Button>
      </div>
    </form>
  );
}
