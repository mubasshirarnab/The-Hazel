import React from 'react';
import { poolConnection } from '@/lib/db/db';
import PageHeader from '@/components/shared/page-header';
import OrderForm from './order-form';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  // 1. Fetch active customers
  const [customers]: any = await poolConnection.query(`
    SELECT
      id,
      customer_code AS customerCode,
      customer_name AS customerName
    FROM tbl_customers
    WHERE deleted_at IS NULL
    ORDER BY customer_name ASC
  `);

  // 2. Fetch active variants with product names
  const [variants]: any = await poolConnection.query(`
    SELECT
      v.id,
      v.variant_code AS variantCode,
      v.color_name AS colorName,
      p.product_name AS productName,
      v.selling_price AS sellingPrice
    FROM tbl_product_variants v
    INNER JOIN tbl_products p ON p.id = v.product_id
    WHERE v.deleted_at IS NULL AND p.deleted_at IS NULL
    ORDER BY p.product_name ASC, v.color_name ASC
  `);

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
