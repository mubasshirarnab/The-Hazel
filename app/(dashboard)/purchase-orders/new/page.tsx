import React from 'react';
import { db } from '@/lib/db/db';
import { tblSuppliers, tblFriends, tblProductVariants, tblProducts } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import PageHeader from '@/components/shared/page-header';
import POForm from './po-form';

export const dynamic = 'force-dynamic';

export default async function NewPOPage() {
  // 1. Fetch active suppliers
  const suppliers = await db
    .select({
      id: tblSuppliers.id,
      supplierCode: tblSuppliers.supplierCode,
      supplierName: tblSuppliers.supplierName,
    })
    .from(tblSuppliers)
    .where(isNull(tblSuppliers.deletedAt))
    .orderBy(tblSuppliers.supplierName);

  // 2. Fetch active China agents (friends)
  const friends = await db
    .select({
      id: tblFriends.id,
      friendCode: tblFriends.friendCode,
      friendName: tblFriends.friendName,
    })
    .from(tblFriends)
    .where(isNull(tblFriends.deletedAt))
    .orderBy(tblFriends.friendName);

  // 3. Fetch active product variants
  const variants = await db
    .select({
      id: tblProductVariants.id,
      variantCode: tblProductVariants.variantCode,
      colorName: tblProductVariants.colorName,
      productName: tblProducts.productName,
    })
    .from(tblProductVariants)
    .innerJoin(tblProducts, eq(tblProductVariants.productId, tblProducts.id))
    .where(and(isNull(tblProductVariants.deletedAt), isNull(tblProducts.deletedAt)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Purchase Order"
        description="Establish a new supply purchase, declare historical RMB rate, and select handbag color quantities."
      />

      <POForm suppliers={suppliers} friends={friends} variants={variants} />
    </div>
  );
}
