import React from 'react';
import { db } from '@/lib/db/db';
import { tblProducts } from '@/lib/db/schema';
import { isNull, desc } from 'drizzle-orm';
import PageHeader from '@/components/shared/page-header';
import ExpenseForm from './expense-form';

export const dynamic = 'force-dynamic';

export default async function NewExpensePage() {
  const products = await db
    .select({
      id: tblProducts.id,
      productName: tblProducts.productName,
      sku: tblProducts.sku,
    })
    .from(tblProducts)
    .where(isNull(tblProducts.deletedAt))
    .orderBy(desc(tblProducts.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Expense"
        description="Record a general business expense or allocate a marketing/shipping expense across a product."
      />

      <ExpenseForm products={products} />
    </div>
  );
}