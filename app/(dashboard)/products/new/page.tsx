import React from 'react';
import { db } from '@/lib/db/db';
import { tblCategories } from '@/lib/db/schema';
import { isNull, and, eq } from 'drizzle-orm';
import PageHeader from '@/components/shared/page-header';
import ProductForm from './product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  // Query active product categories
  const categories = await db
    .select({
      id: tblCategories.id,
      categoryName: tblCategories.categoryName,
    })
    .from(tblCategories)
    .where(and(eq(tblCategories.isActive, 1), isNull(tblCategories.deletedAt)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Product"
        description="Configure product name, SKU, categories, and one or more color variants."
      />

      <ProductForm categories={categories} />
    </div>
  );
}
