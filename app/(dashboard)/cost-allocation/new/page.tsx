import React from 'react';
import { db } from '@/lib/db/db';
import {
  tblExpenseCategories,
  tblCostComponents,
  tblProductVariants,
  tblProducts,
  tblInventory,
} from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import PageHeader from '@/components/shared/page-header';
import AllocationForm from './allocation-form';

export const dynamic = 'force-dynamic';

export default async function NewAllocationPage() {
  // 1. Fetch active expense categories
  const categories = await db
    .select({
      id: tblExpenseCategories.id,
      categoryName: tblExpenseCategories.categoryName,
    })
    .from(tblExpenseCategories)
    .where(eq(tblExpenseCategories.isActive, 1))
    .orderBy(tblExpenseCategories.categoryName);

  // 2. Fetch active cost components
  const components = await db
    .select({
      id: tblCostComponents.id,
      componentName: tblCostComponents.componentName,
    })
    .from(tblCostComponents)
    .where(eq(tblCostComponents.isActive, 1))
    .orderBy(tblCostComponents.componentName);

  // 3. Fetch active variants joined with products and inventory stock levels
  const rawVariants = await db
    .select({
      id: tblProductVariants.id,
      variantCode: tblProductVariants.variantCode,
      colorName: tblProductVariants.colorName,
      productName: tblProducts.productName,
      purchasePriceBdt: tblProductVariants.purchasePriceBdt,
      currentStock: tblInventory.currentStock,
    })
    .from(tblProductVariants)
    .innerJoin(tblProducts, eq(tblProductVariants.productId, tblProducts.id))
    .leftJoin(tblInventory, eq(tblProductVariants.id, tblInventory.variantId))
    .where(and(isNull(tblProductVariants.deletedAt), isNull(tblProducts.deletedAt)));

  // Aggregate stocks (in case there are multiple warehouse rows, though WH001 is default)
  const variantsMap: Record<number, typeof rawVariants[0]> = {};
  rawVariants.forEach((v) => {
    const existing = variantsMap[v.id];
    if (!existing) {
      variantsMap[v.id] = { ...v, currentStock: v.currentStock ?? 0 };
    } else {
      existing.currentStock = (existing.currentStock ?? 0) + (v.currentStock ?? 0);
    }
  });

  const variants = Object.values(variantsMap)
    .map((v) => ({ ...v, currentStock: v.currentStock ?? 0 }))
    .sort((a, b) => a.productName.localeCompare(b.productName));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distribute Post-Import Expenses"
        description="Allocate photoshoot, Facebook/Instagram ads, PR, influencer, packaging, and custom freight costs proportionally."
      />

      <AllocationForm
        categories={categories}
        components={components}
        variants={variants}
      />
    </div>
  );
}
