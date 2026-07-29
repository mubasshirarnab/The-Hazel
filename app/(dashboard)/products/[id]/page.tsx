import React from 'react';
import { notFound } from 'next/navigation';
import { db, poolConnection } from '@/lib/db/db';
import { tblProducts, tblCategories, tblProductVariants } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Box, Tag, DollarSign } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import { formatBDT } from '@/components/shared/currency';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const productId = Number(resolvedParams.id);
  if (isNaN(productId)) {
    return notFound();
  }

  // 1. Fetch Product
  const products = await db
    .select({
      id: tblProducts.id,
      productCode: tblProducts.productCode,
      sku: tblProducts.sku,
      productName: tblProducts.productName,
      productStatus: tblProducts.productStatus,
      purchaseLink: tblProducts.purchaseLink,
      notes: tblProducts.notes,
      categoryName: tblCategories.categoryName,
    })
    .from(tblProducts)
    .leftJoin(tblCategories, eq(tblProducts.categoryId, tblCategories.id))
    .where(and(eq(tblProducts.id, productId), isNull(tblProducts.deletedAt)))
    .limit(1);

  const product = products[0];
  if (!product) {
    return notFound();
  }

  // 2. Fetch variants
  const variants = await db
    .select()
    .from(tblProductVariants)
    .where(and(eq(tblProductVariants.productId, productId), isNull(tblProductVariants.deletedAt)));

  // 3. Fetch true product cost breakdown from view
  const [costBreakdowns]: any = await poolConnection.query(
    'SELECT * FROM vw_true_product_cost WHERE product_id = ?',
    [productId]
  );

  // 4. Fetch variant stock levels from view
  const [stockLevels]: any = await poolConnection.query(
    'SELECT * FROM vw_inventory_value WHERE product_id = ?',
    [productId]
  );

  // Map variant statistics
  const variantData = variants.map((v) => {
    const cost = costBreakdowns.find((cb: any) => cb.variant_id === v.id) || {
      purchase_cost: Number(v.purchasePriceBdt),
      import_cost: 0,
      shipping_cost: 0,
      packaging_cost: 0,
      advertising_cost: 0,
      photoshoot_cost: 0,
      pr_cost: 0,
      influencer_cost: 0,
      miscellaneous_cost: 0,
      true_product_cost: Number(v.purchasePriceBdt),
    };

    const stocks = stockLevels.filter((s: any) => s.variant_id === v.id);
    const totalCurrentStock = stocks.reduce((acc: number, s: any) => acc + (s.current_stock || 0), 0);
    const totalReservedStock = stocks.reduce((acc: number, s: any) => acc + (s.reserved_stock || 0), 0);
    const totalAvailableStock = totalCurrentStock - totalReservedStock;
    const totalReturnedStock = stocks.reduce((acc: number, s: any) => acc + (s.returned_stock || 0), 0);
    const totalDamagedStock = stocks.reduce((acc: number, s: any) => acc + (s.damaged_stock || 0), 0);

    const sellPrice = Number(v.sellingPrice);
    const trueCost = Number(cost.true_product_cost || cost.purchase_cost || v.purchasePriceBdt);
    const profit = sellPrice - trueCost;
    const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;

    return {
      ...v,
      cost,
      stocks,
      totalCurrentStock,
      totalReservedStock,
      totalAvailableStock,
      totalReturnedStock,
      totalDamagedStock,
      sellPrice,
      trueCost,
      profit,
      margin,
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader title={product.productName} description={`Business Code: ${product.productCode}`}>
        <Link href="/products">
          <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4 shrink-0" />}>
            Back to List
          </Button>
        </Link>
      </PageHeader>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Meta Details */}
        <Card hoverEffect={false} className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#1F3A2E]">
              Product Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div>
              <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">SKU Reference</span>
              <span className="font-mono text-[#1A1A1A] font-semibold mt-1 block">{product.sku}</span>
            </div>

            <div>
              <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Category</span>
              <span className="text-[#1A1A1A] font-medium mt-1 block">{product.categoryName || 'Uncategorized'}</span>
            </div>

            {product.purchaseLink && (
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Purchase Source</span>
                <a
                  href={product.purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#B08D57] hover:underline font-semibold mt-1 transition-colors"
                >
                  <span>1688 / Supplier Link</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {product.notes && (
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Internal Notes</span>
                <p className="text-[#1A1A1A] mt-1 leading-relaxed text-xs bg-[#FAFAF8] p-3 rounded-[12px] border border-[#E9E7E2]">
                  {product.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variants Cost Breakdowns & Stocks */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold font-serif text-[#1F3A2E] flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#B08D57]" />
            <span>Variants ({variantData.length})</span>
          </h3>

          {variantData.length === 0 ? (
            <Card hoverEffect={false} className="p-8 text-center text-[#6B6B6B]">
              No variants defined for this product.
            </Card>
          ) : (
            <div className="space-y-6">
              {variantData.map((v) => (
                <div
                  key={v.id}
                  className="rounded-[18px] border border-[#E9E7E2] bg-white overflow-hidden shadow-soft-1"
                >
                  {/* Variant Header Summary */}
                  <div className="px-6 py-4 bg-[#F7F6F3] border-b border-[#E9E7E2] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <Badge variant="forest">{v.variantCode}</Badge>
                      <h4 className="text-base font-bold text-[#1F3A2E] mt-1">{v.colorName}</h4>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] uppercase tracking-widest block font-bold">Selling Price</span>
                        <span className="text-sm font-bold font-mono text-[#1A1A1A]">{formatBDT(v.sellPrice)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] uppercase tracking-widest block font-bold">True Cost</span>
                        <span className="text-sm font-bold font-mono text-[#6A4E3B]">{formatBDT(v.trueCost)}</span>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-[10px] border border-[#E9E7E2] shadow-soft-1">
                        <span className="text-[10px] text-[#B08D57] uppercase tracking-widest block font-bold">Est. Margin</span>
                        <span className={v.profit >= 0 ? 'text-sm font-bold font-mono text-[#15803D]' : 'text-sm font-bold font-mono text-[#DC2626]'}>
                          {v.margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cost Ledger Breakdown */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest flex items-center gap-1.5 border-b border-[#E9E7E2] pb-2">
                        <DollarSign className="h-4 w-4 text-[#15803D]" />
                        <span>True Cost Breakdown</span>
                      </h5>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Purchase Cost:</span>
                          <span className="font-mono text-[#1A1A1A] font-semibold">{formatBDT(v.cost.purchase_cost || v.purchasePriceBdt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">China Local Delivery:</span>
                          <span className="font-mono text-[#1A1A1A]">{formatBDT(v.cost.import_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">International Shipping:</span>
                          <span className="font-mono text-[#1A1A1A]">{formatBDT(v.cost.shipping_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Packaging:</span>
                          <span className="font-mono text-[#1A1A1A]">{formatBDT(v.cost.packaging_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Photoshoot:</span>
                          <span className="font-mono text-[#1A1A1A]">{formatBDT(v.cost.photoshoot_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Advertising:</span>
                          <span className="font-mono text-[#1A1A1A]">{formatBDT(v.cost.advertising_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">PR / Influencers:</span>
                          <span className="font-mono text-[#1A1A1A]">{formatBDT(v.cost.pr_cost || v.cost.influencer_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Miscellaneous:</span>
                          <span className="font-mono text-[#1A1A1A]">{formatBDT(v.cost.miscellaneous_cost)}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#E9E7E2] pt-2 font-bold text-[#1F3A2E]">
                          <span>True Product Cost:</span>
                          <span className="font-mono">{formatBDT(v.trueCost)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Inventory summary */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest flex items-center gap-1.5 border-b border-[#E9E7E2] pb-2">
                        <Box className="h-4 w-4 text-[#B08D57]" />
                        <span>Inventory & Stock</span>
                      </h5>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#FAFAF8] p-3 rounded-[12px] border border-[#E9E7E2]">
                          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Current Stock</span>
                          <span className="text-lg font-bold font-mono text-[#1A1A1A] mt-0.5 block">{v.totalCurrentStock} units</span>
                        </div>
                        <div className="bg-[#FAFAF8] p-3 rounded-[12px] border border-[#E9E7E2]">
                          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Reserved Stock</span>
                          <span className="text-lg font-bold font-mono text-[#D97706] mt-0.5 block">{v.totalReservedStock} units</span>
                        </div>
                        <div className="bg-[#FAFAF8] p-3 rounded-[12px] border border-[#E9E7E2]">
                          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Available Stock</span>
                          <span className="text-lg font-bold font-mono text-[#15803D] mt-0.5 block">{v.totalAvailableStock} units</span>
                        </div>
                        <div className="bg-[#FAFAF8] p-3 rounded-[12px] border border-[#E9E7E2]">
                          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Returned / Damaged</span>
                          <span className="text-xs font-semibold text-[#6B6B6B] mt-1 block">
                            Returned: {v.totalReturnedStock} / Damaged: {v.totalDamagedStock}
                          </span>
                        </div>
                      </div>

                      {v.notes && (
                        <div className="mt-2 text-xs text-[#6B6B6B] italic bg-[#FAFAF8] p-2.5 rounded-[10px] border border-[#E9E7E2]">
                          Note: {v.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
