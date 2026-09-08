import React from 'react';
import { notFound } from 'next/navigation';
import { db, poolConnection } from '@/lib/db/db';
import { tblProducts, tblCategories, tblProductVariants } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Tag, Truck } from 'lucide-react';
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
      productDescription: tblProducts.productDescription,
      totalWeight: tblProducts.totalWeight,
      quantity: tblProducts.quantity,
      shippingRoute: tblProducts.shippingRoute,
      shippingRate: tblProducts.shippingRate,
      shippingCost: tblProducts.shippingCost,
      otherImportCost: tblProducts.otherImportCost,
      totalCost: tblProducts.totalCost,
      unitCost: tblProducts.unitCost,
      unitWeight: tblProducts.unitWeight,
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

  // 3. Fetch variant stock levels from view
  const [stockLevels]: any = await poolConnection.query(
    'SELECT * FROM vw_inventory_value WHERE product_id = ?',
    [productId]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={product.productName}
        description={`SKU: ${product.sku} | Code: ${product.productCode}`}
      >
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4 shrink-0" />}>
              Back to Catalog
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Total Batch Units</span>
          <span className="text-2xl font-bold tracking-tight text-[#1F3A2E] mt-2 block font-mono">
            {product.quantity || 0} units
          </span>
        </Card>

        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Total Batch Cost</span>
          <span className="text-2xl font-bold tracking-tight text-[#15803D] mt-2 block font-mono">
            {formatBDT(product.totalCost || 0)}
          </span>
        </Card>

        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Calculated Unit Cost</span>
          <span className="text-2xl font-bold tracking-tight text-[#1F3A2E] mt-2 block font-mono">
            {formatBDT(product.unitCost || 0)}
          </span>
        </Card>

        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Total Batch Weight</span>
          <span className="text-2xl font-bold tracking-tight text-[#B08D57] mt-2 block font-mono">
            {product.totalWeight ? `${product.totalWeight} kg` : '—'}
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Info & Shipping Details */}
        <div className="space-y-6 lg:col-span-1">
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#1F3A2E]">
                Product Specification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block mb-0.5">Category</span>
                <span className="text-[#1A1A1A] font-semibold">{product.categoryName || 'Uncategorized'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block mb-0.5">Product Status</span>
                <Badge variant={product.productStatus === 'active' ? 'forest' : 'outline'}>
                  {product.productStatus}
                </Badge>
              </div>
              {product.purchaseLink && (
                <div>
                  <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block mb-0.5">Supplier Purchase Link</span>
                  <a
                    href={product.purchaseLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#B08D57] hover:underline flex items-center gap-1 font-medium break-all"
                  >
                    <span>View Supplier Link</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              )}
              {product.productDescription && (
                <div>
                  <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block mb-0.5">Product Description</span>
                  <p className="text-[#1A1A1A] leading-relaxed bg-[#FAFAF8] p-3 rounded-[10px] border border-[#E9E7E2]">
                    {product.productDescription}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping & Import Costs */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#1F3A2E] flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#B08D57]" />
                <span>Shipping & Cost Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-[#E9E7E2] pb-2">
                <span className="text-[#6B6B6B]">Shipping Route:</span>
                <span className="font-semibold text-[#1A1A1A]">{product.shippingRoute || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#E9E7E2] pb-2">
                <span className="text-[#6B6B6B]">Total Weight:</span>
                <span className="font-mono text-[#1A1A1A]">{product.totalWeight ? `${product.totalWeight} kg` : '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#E9E7E2] pb-2">
                <span className="text-[#6B6B6B]">Unit Weight:</span>
                <span className="font-mono text-[#1A1A1A]">{product.unitWeight ? `${product.unitWeight} kg / unit` : '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#E9E7E2] pb-2">
                <span className="text-[#6B6B6B]">Shipping Rate:</span>
                <span className="font-mono text-[#1A1A1A]">{product.shippingRate ? `${product.shippingRate} BDT/kg` : '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#E9E7E2] pb-2">
                <span className="text-[#6B6B6B]">Shipping Cost:</span>
                <span className="font-mono font-semibold text-[#1A1A1A]">{formatBDT(product.shippingCost || 0)}</span>
              </div>
              <div className="flex justify-between border-b border-[#E9E7E2] pb-2">
                <span className="text-[#6B6B6B]">Other Import Cost:</span>
                <span className="font-mono text-[#1A1A1A]">{formatBDT(product.otherImportCost || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm bg-[#1F3A2E] text-white p-3 rounded-[10px]">
                <span>Unit Cost:</span>
                <span className="font-mono">{formatBDT(product.unitCost || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Color Variants and Inventory */}
        <div className="space-y-6 lg:col-span-2">
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#1F3A2E] flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#B08D57]" />
                <span>Color Variants & Pricing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="overflow-x-auto rounded-[12px] border border-[#E9E7E2]">
                <table className="min-w-full divide-y divide-[#E9E7E2] text-xs">
                  <thead className="bg-[#F7F6F3] text-[11px] font-bold text-[#1F3A2E] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Color</th>
                      <th className="px-4 py-3 text-right">RMB Price</th>
                      <th className="px-4 py-3 text-right">RMB Rate</th>
                      <th className="px-4 py-3 text-right">Buying Price</th>
                      <th className="px-4 py-3 text-right">Selling Price</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E7E2] text-[#1A1A1A]">
                    {variants.map((v) => {
                      const stock = stockLevels?.find((s: any) => s.variant_id === v.id);
                      return (
                        <tr key={v.id} className="hover:bg-[#F7F6F3]/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[#1F3A2E]">{v.variantCode}</td>
                          <td className="px-4 py-3 font-semibold">{v.colorName}</td>
                          <td className="px-4 py-3 text-right font-mono text-[#6B6B6B]">
                            {v.rmbPrice ? `¥${v.rmbPrice}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#6B6B6B]">
                            {v.rmbRate || '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#6A4E3B]">
                            {formatBDT(v.purchasePriceBdt)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#15803D]">
                            {formatBDT(v.sellingPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold">
                            {stock?.current_stock ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}