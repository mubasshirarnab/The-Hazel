import React from 'react';
import { notFound } from 'next/navigation';
import { db, poolConnection } from '@/lib/db/db';
import { tblProducts, tblCategories, tblProductVariants } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Box, Tag, DollarSign, Percent, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import Currency, { formatBDT } from '@/components/shared/currency';

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
    // Find cost breakdown
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

    // Find stock levels
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
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader title={product.productName} description={`Business Code: ${product.productCode}`}>
        <Link
          href="/products"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to List</span>
        </Link>
      </PageHeader>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Meta Details */}
        <div className="lg:col-span-1 p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-5 h-fit">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest border-b border-zinc-800 pb-3">
            Product Profile
          </h3>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">SKU Reference</span>
              <span className="font-mono text-zinc-200 mt-1 block">{product.sku}</span>
            </div>

            <div>
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Category</span>
              <span className="text-zinc-200 mt-1 block">{product.categoryName || 'Uncategorized'}</span>
            </div>

            {product.purchaseLink && (
              <div>
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Purchase Source</span>
                <a
                  href={product.purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium mt-1 transition-colors"
                >
                  <span>1688 / Supplier Link</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {product.notes && (
              <div>
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Internal Notes</span>
                <p className="text-zinc-300 mt-1 leading-relaxed text-xs bg-zinc-900/50 p-3 rounded border border-zinc-850">
                  {product.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Variants Cost Breakdowns & Stocks */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Tag className="h-5 w-5 text-rose-500" />
            <span>Variants ({variantData.length})</span>
          </h3>

          {variantData.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-zinc-850 bg-zinc-900/10 text-zinc-500">
              No variants defined for this product.
            </div>
          ) : (
            <div className="space-y-6">
              {variantData.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden"
                >
                  {/* Variant Header Summary */}
                  <div className="px-6 py-4 bg-zinc-900/60 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/15">
                        {v.variantCode}
                      </span>
                      <h4 className="text-base font-bold text-zinc-100 mt-1.5">{v.colorName}</h4>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Selling Price</span>
                        <span className="text-sm font-bold text-zinc-200">{formatBDT(v.sellPrice)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">True Cost</span>
                        <span className="text-sm font-bold text-zinc-300">{formatBDT(v.trueCost)}</span>
                      </div>
                      <div className="bg-zinc-850 px-3 py-1.5 rounded-lg border border-zinc-800">
                        <span className="text-[10px] text-rose-400 uppercase tracking-widest block font-bold">Est. Margin</span>
                        <span className={v.profit >= 0 ? 'text-sm font-bold text-emerald-400' : 'text-sm font-bold text-rose-400'}>
                          {v.margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cost Ledger Breakdown */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span>True Cost Breakdown</span>
                      </h5>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Purchase Cost:</span>
                          <span className="text-zinc-300">{formatBDT(v.cost.purchase_cost || v.purchasePriceBdt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">China Local Delivery:</span>
                          <span className="text-zinc-300">{formatBDT(v.cost.import_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">International Shipping:</span>
                          <span className="text-zinc-300">{formatBDT(v.cost.shipping_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Packaging:</span>
                          <span className="text-zinc-300">{formatBDT(v.cost.packaging_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Photoshoot:</span>
                          <span className="text-zinc-300">{formatBDT(v.cost.photoshoot_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Advertising:</span>
                          <span className="text-zinc-300">{formatBDT(v.cost.advertising_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">PR / Influencers:</span>
                          <span className="text-zinc-300">{formatBDT(v.cost.pr_cost || v.cost.influencer_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Miscellaneous:</span>
                          <span className="text-zinc-300">{formatBDT(v.cost.miscellaneous_cost)}</span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-800/80 pt-2 font-semibold">
                          <span className="text-zinc-300">True Product Cost:</span>
                          <span className="text-zinc-50">{formatBDT(v.trueCost)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Inventory summary */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                        <Box className="h-4 w-4 text-rose-500" />
                        <span>Inventory & Stock</span>
                      </h5>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Current Stock</span>
                          <span className="text-lg font-bold text-zinc-100 mt-1 block">{v.totalCurrentStock} units</span>
                        </div>
                        <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Reserved Stock</span>
                          <span className="text-lg font-bold text-amber-500 mt-1 block">{v.totalReservedStock} units</span>
                        </div>
                        <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Available Stock</span>
                          <span className="text-lg font-bold text-emerald-400 mt-1 block">{v.totalAvailableStock} units</span>
                        </div>
                        <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Returned / Damaged</span>
                          <span className="text-xs font-semibold text-zinc-300 mt-1 block">
                            Returned: {v.totalReturnedStock} / Damaged: {v.totalDamagedStock}
                          </span>
                        </div>
                      </div>

                      {v.notes && (
                        <div className="mt-2 text-xs text-zinc-400 italic bg-zinc-900/20 p-2.5 rounded border border-zinc-800/40">
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
