'use server';

import { db, poolConnection } from '@/lib/db/db';
import { tblExpenses, tblProducts, tblProductVariants, tblInventory } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const expenseSchema = z.object({
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD).'),
  expenseType: z.string().min(1, 'Expense type is required.'),
  description: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be greater than zero.'),
  productRelated: z.boolean(),
  productId: z.number().int().positive().optional().nullable(),
  platform: z.string().optional().nullable(),
});

async function authorizeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized.');
  }
  return session.user;
}

export async function createExpense(formData: z.infer<typeof expenseSchema>) {
  const user = await authorizeUser();
  const data = expenseSchema.parse(formData);

  if (data.productRelated && !data.productId) {
    throw new Error('Please select a product for product-related expenses.');
  }

  return await db.transaction(async (tx) => {
    // 1. Insert into tbl_expenses
    const [result] = await tx.insert(tblExpenses).values({
      expenseDate: data.expenseDate,
      expenseType: data.expenseType,
      description: data.description || null,
      amount: data.amount.toFixed(2),
      productRelated: data.productRelated ? 1 : 0,
      productId: data.productRelated ? data.productId : null,
      platform: data.platform || null,
    });

    const expenseId = result.insertId;

    // 2. If Product Related is Yes, distribute expense equally across that product
    if (data.productRelated && data.productId) {
      const [product] = await tx
        .select()
        .from(tblProducts)
        .where(eq(tblProducts.id, data.productId));

      if (product) {
        const currentOtherImport = parseFloat(product.otherImportCost || '0');
        const newOtherImport = currentOtherImport + data.amount;
        const qty = product.quantity || 1;
        const shippingCost = parseFloat(product.shippingCost || '0');

        // Get variant buying price
        const [variant] = await tx
          .select()
          .from(tblProductVariants)
          .where(eq(tblProductVariants.productId, data.productId))
          .limit(1);

        const buyingPrice = variant ? parseFloat(variant.purchasePriceBdt || '0') : 0;
        const newTotalCost = qty * buyingPrice + shippingCost + newOtherImport;
        const newUnitCost = qty > 0 ? Number((newTotalCost / qty).toFixed(2)) : newTotalCost;

        // Update product record
        await tx
          .update(tblProducts)
          .set({
            otherImportCost: newOtherImport.toFixed(2),
            totalCost: newTotalCost.toFixed(2),
            unitCost: newUnitCost.toFixed(2),
          })
          .where(eq(tblProducts.id, data.productId));

        // Update product variants currentCost
        await tx
          .update(tblProductVariants)
          .set({
            currentCost: newUnitCost.toFixed(2),
          })
          .where(eq(tblProductVariants.productId, data.productId));

        // Update inventory unitCost and value
        const variants = await tx
          .select({ id: tblProductVariants.id })
          .from(tblProductVariants)
          .where(eq(tblProductVariants.productId, data.productId));

        for (const v of variants) {
          await tx
            .update(tblInventory)
            .set({
              unitCost: newUnitCost.toFixed(2),
              inventoryValue: sql`current_stock * ${newUnitCost}`,
            })
            .where(eq(tblInventory.variantId, v.id));
        }
      }
    }

    revalidatePath('/business-expenses');
    revalidatePath('/products');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true, expenseId };
  });
}

export async function deleteExpense(id: number) {
  const user = await authorizeUser();

  await db
    .delete(tblExpenses)
    .where(eq(tblExpenses.id, id));

  revalidatePath('/business-expenses');
  revalidatePath('/products');
  revalidatePath('/inventory');
  revalidatePath('/dashboard');
  return { success: true };
}