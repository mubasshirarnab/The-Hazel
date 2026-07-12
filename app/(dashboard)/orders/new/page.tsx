import React from 'react';
import { db } from '@/lib/db/db';
import { tblCustomers, tblProductVariants, tblProducts } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import PageHeader from '@/components/shared/page-header';
import OrderForm from './order-form';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  // 1. Fetch active customers
  const customers = await db
    .select({
      id: tblCustomers.id,
      customerCode: tblCustomers.customerCode,
      customerName: tblCustomers.customerName,
    })
    .from(tblCustomers)
    .where(isNull(tblCustomers.deletedAt))
    .orderBy(tblCustomers.customerName);

  // 2. Fetch active variants with product names
  const variants = await db
    .select({
      id: tblProductVariants.id,
      variantCode: tblProductVariants.variantCode,
      colorName: tblProductVariants.colorName,
      productName: tblProducts.productName,
      sellingPrice: tblProductVariants.sellingPrice,
    })
    .from(tblProductVariants)
    .innerJoin(tblProducts, eq(tblProductVariants.productId, tblProducts.id))
    .where(and(isNull(tblProductVariants.deletedAt), isNull(tblProducts.deletedAt)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Order"
        description="Register a sale, choose in-stock or preorder fulfillment, select variants, and apply discounts."
      />

      <OrderForm customers={customers} variants={variants} />
    </div>
  );
}
