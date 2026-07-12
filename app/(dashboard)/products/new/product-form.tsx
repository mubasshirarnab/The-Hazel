'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/actions/products';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

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

    // Validate variants
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* 1. Product Information Section */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-6">
        <h3 className="text-base font-bold text-zinc-100 border-b border-zinc-800 pb-3">
          1. Product Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Product Name</label>
            <input
              type="text"
              placeholder="e.g. Hazel Classic Leather Handbag"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors disabled:opacity-50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">SKU</label>
            <input
              type="text"
              placeholder="e.g. HZL-CL-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors disabled:opacity-50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Category</label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors disabled:opacity-50"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Supplier Purchase Link</label>
            <input
              type="text"
              placeholder="e.g. https://detail.1688.com/..."
              value={purchaseLink}
              onChange={(e) => setPurchaseLink(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">General Notes</label>
          <textarea
            rows={3}
            placeholder="Add any general details, description, or supply rules for this product..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors disabled:opacity-50 resize-none"
          />
        </div>
      </div>

      {/* 2. Color Variants Section */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-base font-bold text-zinc-100">
            2. Color Variants & Pricing
          </h3>
          <button
            type="button"
            onClick={addVariant}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Color</span>
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((v, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800/80 grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative group"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Color Name</label>
                <input
                  type="text"
                  placeholder="e.g. Classic Black"
                  value={v.colorName}
                  onChange={(e) => handleVariantChange(index, 'colorName', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Selling Price (BDT)</label>
                <input
                  type="number"
                  placeholder="e.g. 3500"
                  value={v.sellingPrice}
                  onChange={(e) => handleVariantChange(index, 'sellingPrice', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Purchase Price (BDT)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={v.purchasePriceBdt}
                  onChange={(e) => handleVariantChange(index, 'purchasePriceBdt', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Premium leather variant"
                    value={v.notes}
                    onChange={(e) => handleVariantChange(index, 'notes', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  disabled={loading}
                  className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-500/20 disabled:opacity-50 transition-colors cursor-pointer self-end mb-0.5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href="/products"
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
              <span>Saving Product...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Product & Variants</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
