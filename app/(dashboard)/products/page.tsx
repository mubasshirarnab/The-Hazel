import React from 'react';
import { db } from '@/lib/db/db';
import { tblProducts, tblCategories } from '@/lib/db/schema';
import { isNull, eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Products & Variants"
        description="View and manage women's handbag catalog items and their specific color variants."
      >
        <Link href="/products/new">
          <Button variant="primary" icon={<Plus className="h-4 w-4 shrink-0" />}>
            New Product
          </Button>
        </Link>
      </PageHeader>

      <div className="luxury-card p-6">
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
