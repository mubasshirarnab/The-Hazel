'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/actions/products';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Save, Truck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';
import { formatBDT } from '@/components/shared/currency';

interface Category {
  id: number;
  categoryName: string;
}

interface ProductFormProps {
  categories: Category[];
}

interface VariantState {
  colorName: string;
  quantity: string;
  sellingPrice: string;
  rmbPrice: string;
  rmbRate: string;
  purchasePriceBdt: string;
  notes: string;
}

export default function ProductForm({ categories }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 1. Product Core State
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [purchaseLink, setPurchaseLink] = useState('');
  const [productDescription, setProductDescription] = useState('');

  // 2. Shipping & Cost State
  const [totalWeight, setTotalWeight] = useState('');
  const [customQuantity, setCustomQuantity] = useState('');
  const [shippingRoute, setShippingRoute] = useState('');
  const [shippingRate, setShippingRate] = useState('');
  const [otherImportCost, setOtherImportCost] = useState('');

  // 3. Variants State
  const [variants, setVariants] = useState<VariantState[]>([
    { colorName: '', quantity: '10', sellingPrice: '', rmbPrice: '', rmbRate: '', purchasePriceBdt: '', notes: '' }
  ]);

  const addVariant = () => {
    setVariants([
      ...variants,
      { colorName: '', quantity: '10', sellingPrice: '', rmbPrice: '', rmbRate: '', purchasePriceBdt: '', notes: '' }
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) {
      toast.error('At least one color variant is required.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantState, value: string) => {
    const updated = [...variants];
    const current = { ...updated[index], [field]: value };

    // If RMB Price or RMB Rate changes, auto compute purchasePriceBdt
    if (field === 'rmbPrice' || field === 'rmbRate') {
      const rmbP = parseFloat(field === 'rmbPrice' ? value : current.rmbPrice);
      const rmbR = parseFloat(field === 'rmbRate' ? value : current.rmbRate);
      if (!isNaN(rmbP) && !isNaN(rmbR) && rmbP >= 0 && rmbR >= 0) {
        current.purchasePriceBdt = (rmbP * rmbR).toFixed(2);
      }
    }

    updated[index] = current;
    setVariants(updated);
  };

  // Calculations
  const sumVariantQty = variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);
  const calcQty = sumVariantQty > 0 ? sumVariantQty : (parseFloat(customQuantity) || 0);

  const calcWeight = parseFloat(totalWeight) || 0;
  const calcShippingRate = parseFloat(shippingRate) || 0;
  const calcOtherImportCost = parseFloat(otherImportCost) || 0;

  const unitWeight = calcQty > 0 && calcWeight > 0 ? (calcWeight / calcQty).toFixed(3) : '0.000';
  const shippingCost = (calcWeight * calcShippingRate).toFixed(2);

  // Weighted or first variant buying price for batch cost estimate
  const firstVariantBuyingPrice = parseFloat(variants[0]?.purchasePriceBdt) || 0;
  const totalCost = (calcQty * firstVariantBuyingPrice + parseFloat(shippingCost) + calcOtherImportCost).toFixed(2);
  const unitCost = calcQty > 0 ? (parseFloat(totalCost) / calcQty).toFixed(2) : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim() || !sku.trim()) {
      toast.error('Product Name and SKU are required.');
      return;
    }

    for (const [i, v] of variants.entries()) {
      if (!v.colorName.trim()) {
        toast.error(`Variant ${i + 1} is missing a color name.`);
        return;
      }
      const qtyVal = parseInt(v.quantity);
      if (isNaN(qtyVal) || qtyVal < 0) {
        toast.error(`Variant ${i + 1} (${v.colorName}) must have a valid non-negative quantity.`);
        return;
      }
      const sellVal = parseFloat(v.sellingPrice);
      if (isNaN(sellVal) || sellVal < 0) {
        toast.error(`Variant ${i + 1} (${v.colorName}) must have a valid selling price.`);
        return;
      }
      const buyVal = parseFloat(v.purchasePriceBdt);
      if (isNaN(buyVal) || buyVal < 0) {
        toast.error(`Variant ${i + 1} (${v.colorName}) must have a valid buying price (RMB Price × RMB Rate).`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        product: {
          productName: productName.trim(),
          sku: sku.trim(),
          categoryId: categoryId || null,
          purchaseLink: purchaseLink.trim() || null,
          productDescription: productDescription.trim() || null,
          totalWeight: calcWeight || null,
          quantity: calcQty > 0 ? Math.round(calcQty) : null,
          shippingRoute: shippingRoute.trim() || null,
          shippingRate: calcShippingRate || null,
          shippingCost: parseFloat(shippingCost) || null,
          otherImportCost: calcOtherImportCost || null,
          totalCost: parseFloat(totalCost) || null,
          unitCost: parseFloat(unitCost) || null,
          unitWeight: parseFloat(unitWeight) || null,
        },
        variants: variants.map((v) => ({
          colorName: v.colorName.trim(),
          quantity: parseInt(v.quantity) || 0,
          sellingPrice: parseFloat(v.sellingPrice),
          rmbPrice: v.rmbPrice ? parseFloat(v.rmbPrice) : null,
          rmbRate: v.rmbRate ? parseFloat(v.rmbRate) : null,
          purchasePriceBdt: parseFloat(v.purchasePriceBdt) || 0,
          notes: v.notes.trim() || null,
        })),
      };

      const res = await createProduct(payload);

      if (res.success) {
        toast.success('Product and color inventory created successfully!');
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl animate-fade-in">
      {/* 1. Product Information Section */}
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle>1. Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Product Name *</label>
              <Input
                placeholder="e.g. Hazel Classic Leather Handbag"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">SKU *</label>
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
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Supplier Link</label>
              <Input
                placeholder="e.g. https://detail.1688.com/..."
                value={purchaseLink}
                onChange={(e) => setPurchaseLink(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Product Description</label>
            <Textarea
              rows={3}
              placeholder="Add product specifications, materials, dimensions, or general description..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Shipping & Cost Calculation Section */}
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#B08D57]" />
            <span>2. Shipping & Import Cost Calculation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Total Weight (KG)</label>
              <Input
                type="number"
                step="0.001"
                placeholder="e.g. 50"
                value={totalWeight}
                onChange={(e) => setTotalWeight(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Total Quantity (Units)</label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={calcQty}
                onChange={(e) => setCustomQuantity(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Unit Weight (KG)</label>
              <div className="py-2.5 px-3 bg-[#F7F6F3] border border-[#E9E7E2] rounded-[12px] text-xs font-mono font-bold text-[#1F3A2E]">
                {unitWeight} kg / unit
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Shipping Route</label>
              <Input
                placeholder="e.g. Guangzhou -> Dhaka Air Cargo"
                value={shippingRoute}
                onChange={(e) => setShippingRoute(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Shipping Rate (BDT/KG)</label>
              <Input
                type="number"
                placeholder="e.g. 750"
                value={shippingRate}
                onChange={(e) => setShippingRate(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Other Import Cost (BDT)</label>
              <Input
                type="number"
                placeholder="e.g. 2000 (Optional)"
                value={otherImportCost}
                onChange={(e) => setOtherImportCost(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Calculated Cost Breakdown Panel */}
          <div className="p-4 rounded-[12px] bg-[#F7F6F3] border border-[#E9E7E2] grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase tracking-widest block font-bold">Shipping Cost</span>
              <span className="text-sm font-semibold text-[#1A1A1A] font-mono">{formatBDT(shippingCost)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase tracking-widest block font-bold">Other Import Cost</span>
              <span className="text-sm font-semibold text-[#1A1A1A] font-mono">{formatBDT(calcOtherImportCost)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase tracking-widest block font-bold">Total Batch Cost</span>
              <span className="text-sm font-bold text-[#1F3A2E] font-mono">{formatBDT(totalCost)}</span>
            </div>
            <div className="bg-[#1F3A2E] text-white p-3 rounded-[10px]">
              <span className="text-[10px] text-[#B08D57] uppercase tracking-widest block font-bold">Calculated Unit Cost</span>
              <span className="text-base font-bold font-mono">{formatBDT(unitCost)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Color Variants Section */}
      <Card hoverEffect={false}>
        <div className="flex items-center justify-between border-b border-[#E9E7E2] pb-4 mb-4">
          <div>
            <h3 className="text-xl font-bold font-serif text-[#1F3A2E]">
              3. Color Variants, Quantity & Pricing
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Set individual stock quantities for each color variant. These quantities will appear directly on the Inventory page.
            </p>
          </div>
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
              className="p-4 rounded-[12px] bg-[#FAFAF8] border border-[#E9E7E2] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end relative group hover:border-[#B08D57]/40 transition-colors"
            >
              {/* Color Name */}
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Color *</label>
                <Input
                  placeholder="e.g. Classic Black"
                  value={v.colorName}
                  onChange={(e) => handleVariantChange(index, 'colorName', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Quantity for this specific color */}
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">
                  Quantity *
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 50"
                  value={v.quantity}
                  onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Selling Price */}
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Selling (BDT) *</label>
                <Input
                  type="number"
                  placeholder="e.g. 3500"
                  value={v.sellingPrice}
                  onChange={(e) => handleVariantChange(index, 'sellingPrice', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* RMB Price */}
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">RMB (¥)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 85"
                  value={v.rmbPrice}
                  onChange={(e) => handleVariantChange(index, 'rmbPrice', e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* RMB Rate */}
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">RMB Rate</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 17.5"
                  value={v.rmbRate}
                  onChange={(e) => handleVariantChange(index, 'rmbRate', e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Buying Price */}
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Buying (BDT) *</label>
                <Input
                  type="number"
                  placeholder="e.g. 1487.50"
                  value={v.purchasePriceBdt}
                  onChange={(e) => handleVariantChange(index, 'purchasePriceBdt', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Notes and Delete */}
              <div className="flex items-center gap-2 lg:col-span-1">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Notes</label>
                  <Input
                    placeholder="e.g. Matte"
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
                  title="Remove Color Variant"
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