'use server';

import { db, poolConnection } from '@/lib/db/db';
import { tblPurchaseOrders, tblPurchaseOrderItems } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const poItemSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive('Quantity must be positive.'),
  unitPurchasePriceRmb: z.number().min(0, 'RMB price must be non-negative.'),
  notes: z.string().optional().nullable(),
});

const poSchema = z.object({
  supplierId: z.number().int().positive('Please select a supplier.'),
  friendId: z.number().int().positive('Please select a China agent (friend).'),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD).'),
  historicalRmbRate: z.number().positive('RMB exchange rate must be positive.'),
  chinaLocalDeliveryCost: z.number().min(0, 'China delivery cost must be non-negative.').default(0),
  items: z.array(poItemSchema).min(1, 'At least one item is required.'),
  notes: z.string().optional().nullable(),
});

async function authorizeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    throw new Error('Unauthorized. Staff or Admin role required.');
  }
  return session.user;
}

export async function createPurchaseOrder(formData: z.infer<typeof poSchema>) {
  const user = await authorizeUser();
  const data = poSchema.parse(formData);

  return await db.transaction(async (tx) => {
    // 1. Calculate items cost details
    let totalBdt = 0;
    const itemsToInsert = data.items.map((item) => {
      const unitBdt = item.unitPurchasePriceRmb * data.historicalRmbRate;
      const lineBdt = item.quantity * unitBdt;
      totalBdt += lineBdt;

      return {
        variantId: item.variantId,
        quantity: item.quantity,
        unitPurchasePriceRmb: item.unitPurchasePriceRmb.toFixed(2),
        unitPurchasePriceBdt: unitBdt.toFixed(2),
        receivedQuantity: 0,
        lineTotalBdt: lineBdt.toFixed(2),
        notes: item.notes || null,
      };
    });

    // 2. Insert PO main row — convert purchaseDate string to Date for Drizzle date column
    const [result] = await tx.insert(tblPurchaseOrders).values({
      purchaseOrderNumber: '',
      supplierId: data.supplierId,
      friendId: data.friendId,
      warehouseId: 1,
      purchaseDate: new Date(data.purchaseDate),
      historicalRmbRate: data.historicalRmbRate.toFixed(4),
      chinaLocalDeliveryCost: data.chinaLocalDeliveryCost.toFixed(2),
      statusId: 1,
      totalAmountBdt: totalBdt.toFixed(2),
      notes: data.notes || null,
      createdBy: user.userCode,
    });

    const poId = result.insertId;

    // 3. Insert PO items using raw SQL (bigint auto-increment PK)
    for (const item of itemsToInsert) {
      await poolConnection.query(
        `INSERT INTO tbl_purchase_order_items
          (purchase_order_id, variant_id, quantity, unit_purchase_price_rmb,
           unit_purchase_price_bdt, received_quantity, line_total_bdt, notes)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [
          poId,
          item.variantId,
          item.quantity,
          item.unitPurchasePriceRmb,
          item.unitPurchasePriceBdt,
          item.lineTotalBdt,
          item.notes,
        ]
      );
    }

    revalidatePath('/purchase-orders');
    return { success: true, poId };
  });
}

export async function placePurchaseOrder(id: number) {
  const user = await authorizeUser();

  try {
    await db
      .update(tblPurchaseOrders)
      .set({
        statusId: 2, // 'placed'
        updatedBy: user.userCode,
      })
      .where(eq(tblPurchaseOrders.id, id));

    revalidatePath('/purchase-orders');
    return { success: true };
  } catch (error: any) {
    console.error('Error placing purchase order:', error);
    throw new Error(error.message || 'Failed to place purchase order.');
  }
}

export async function deletePurchaseOrder(id: number) {
  const user = await authorizeUser();
  const timestamp = new Date();

  try {
    // Soft delete PO
    await db
      .update(tblPurchaseOrders)
      .set({
        deletedAt: timestamp,
        updatedBy: user.userCode,
      })
      .where(eq(tblPurchaseOrders.id, id));

    revalidatePath('/purchase-orders');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting purchase order:', error);
    throw new Error(error.message || 'Failed to delete purchase order.');
  }
}
