'use server';

import { db, poolConnection } from '@/lib/db/db';
import { tblOrders, tblOrderItems, tblStockReservations, tblOrderStatusHistory } from '@/lib/db/schema';
import { dbCreateOrder, dbCompleteOrder, dbCancelOrder, dbGenerateBusinessCode } from '@/lib/db/procedures';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const orderItemSchema = z.object({
  variantId: z.number().int().positive('Please select a variant.'),
  quantity: z.number().int().positive('Quantity must be a positive integer.'),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative.'),
  discountAmount: z.number().min(0, 'Discount must be non-negative.').default(0),
});

const orderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required.'),
  contact: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  paymentMethod: z.string().min(1, 'Please select a payment method.').default('Cash on Delivery'),
  deliveryCharge: z.number().min(0, 'Delivery charge must be non-negative.').default(0),
  advancePayment: z.number().min(0, 'Advance payment must be non-negative.').default(0),
  orderType: z.enum(['in_stock', 'preorder']),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD).'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required.'),
  notes: z.string().optional().nullable(),
});

async function authorizeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized.');
  }
  return session.user;
}

export async function createOrder(formData: z.infer<typeof orderSchema>) {
  const user = await authorizeUser();
  const data = orderSchema.parse(formData);

  return await db.transaction(async (tx) => {
    // 1. Call stored procedure to create order in DB
    const res = await dbCreateOrder(
      data.customerName,
      data.contact || '',
      data.address || '',
      data.paymentMethod || 'Cash on Delivery',
      data.deliveryCharge || 0,
      data.advancePayment || 0,
      data.orderType,
      data.orderDate,
      data.items.map((i) => ({
        variant_id: i.variantId,
        quantity: i.quantity,
        selling_price: i.sellingPrice,
        discount_amount: i.discountAmount,
      })),
      data.notes || ''
    );

    const orderId = res.orderId;

    // 2. Log initial status history (Pending)
    const [pendingStatus]: any = await poolConnection.query(
      "SELECT id FROM tbl_order_statuses WHERE status_code = 'pending' LIMIT 1"
    );
    const pendingStatusId = pendingStatus[0]?.id || 1;

    await tx.insert(tblOrderStatusHistory).values({
      orderId,
      statusId: pendingStatusId,
      changedBy: user.userCode,
      notes: 'Order created via ERP console.',
    });

    // 3. If preorder, register stock reservations
    if (data.orderType === 'preorder') {
      const itemsCreated = await tx
        .select()
        .from(tblOrderItems)
        .where(eq(tblOrderItems.orderId, orderId));

      for (const item of itemsCreated) {
        const reservationCode = await dbGenerateBusinessCode('stock_reservations', 'RES');
        await tx.insert(tblStockReservations).values({
          reservationCode,
          orderId,
          orderItemId: item.id,
          variantId: item.variantId,
          warehouseId: 1, // WH001 Dhaka Central
          reservedQuantity: item.quantity,
          reservationStatus: 'reserved',
          createdBy: user.userCode,
          reservationReason: 'Preorder reservation.',
        });
      }
    }

    revalidatePath('/orders');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true, orderId, orderNumber: res.orderNumber };
  });
}

export async function completeOrder(orderId: number) {
  const user = await authorizeUser();

  try {
    await dbCompleteOrder(orderId);

    const [deliveredStatus]: any = await poolConnection.query(
      "SELECT id FROM tbl_order_statuses WHERE status_code = 'delivered' LIMIT 1"
    );
    const deliveredStatusId = deliveredStatus[0]?.id || 5;

    await db.insert(tblOrderStatusHistory).values({
      orderId,
      statusId: deliveredStatusId,
      changedBy: user.userCode,
      notes: 'Order completed and delivered. Inventory updated.',
    });

    revalidatePath('/orders');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error completing order:', error);
    throw new Error(error.message || 'Failed to complete order.');
  }
}

export async function cancelOrder(orderId: number) {
  const user = await authorizeUser();

  try {
    await dbCancelOrder(orderId);

    const [cancelledStatus]: any = await poolConnection.query(
      "SELECT id FROM tbl_order_statuses WHERE status_code = 'cancelled' LIMIT 1"
    );
    const cancelledStatusId = cancelledStatus[0]?.id || 6;

    await db.insert(tblOrderStatusHistory).values({
      orderId,
      statusId: cancelledStatusId,
      changedBy: user.userCode,
      notes: 'Order cancelled. Reserved/current stock restored.',
    });

    revalidatePath('/orders');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    throw new Error(error.message || 'Failed to cancel order.');
  }
}