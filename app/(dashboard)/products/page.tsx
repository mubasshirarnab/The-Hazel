import React from 'react';
import { db } from '@/lib/db/db';
import { tblProducts, tblCategories } from '@/lib/db/schema';
import { isNull, eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  // Query all active (not soft deleted) products joined with their category
  const products = await db
    .select({
      id: tblProducts.id,
      productCode: tblProducts.productCode,
      sku: tblProducts.sku,
      productName: tblProducts.productName,
      productStatus: tblProducts.productStatus,
      categoryName: tblCategories.categoryName,
      createdAt: tblProducts.createdAt,
    })
    .from(tblProducts)
    .leftJoin(tblCategories, eq(tblProducts.categoryId, tblCategories.id))
    .where(isNull(tblProducts.deletedAt))
    .orderBy(desc(tblProducts.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Variants"
        description="View and manage women's handbag catalog items and their specific color variants."
      >
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer shadow-lg shadow-rose-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Product</span>
        </Link>
      </PageHeader>

      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/10">
        <DataTable
          columns={columns}
          data={products}
          searchKey="productName"
          searchPlaceholder="Search products by name..."
        />
      </div>
    </div>
  );
}
