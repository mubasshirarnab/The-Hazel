'use server';

import { db, poolConnection } from '@/lib/db/db';
import { tblShipments, tblShipmentItems, tblShipmentPurchaseOrders, tblPurchaseOrderItems } from '@/lib/db/schema';
import { dbReceiveShipment } from '@/lib/db/procedures';
import { eq, inArray, and, isNull } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const shipmentSchema = z.object({
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD).').optional().nullable(),
  weightKg: z.number().min(0, 'Weight must be non-negative.').default(0),
  shippingRatePerKg: z.number().min(0, 'Shipping rate must be non-negative.').default(0),
  notes: z.string().optional().nullable(),
  poIds: z.array(z.number()).min(1, 'Please select at least one purchase order for this shipment.'),
});

const receiveItemSchema = z.object({
  shipmentItemId: z.number().int().positive(),
  quantityReceived: z.number().int().nonnegative('Received quantity cannot be negative.'),
});

async function authorizeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    throw new Error('Unauthorized. Staff or Admin role required.');
  }
  return session.user;
}

export async function createShipment(formData: z.infer<typeof shipmentSchema>) {
  const user = await authorizeUser();
  const data = shipmentSchema.parse(formData);

  return await db.transaction(async (tx) => {
    // 1. Calculate shipping cost
    const shippingCost = data.weightKg * data.shippingRatePerKg;
    const shipmentNumber = `SHP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 2. Insert main shipment row (status_id = 2, i.e. 'in_transit')
    const [shipmentResult] = await tx.insert(tblShipments).values({
      shipmentNumber,
      departureDate: data.departureDate ? new Date(data.departureDate) : undefined,
      weightKg: data.weightKg.toFixed(2),
      shippingRatePerKg: data.shippingRatePerKg.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      statusId: 2, // 'in_transit'
      notes: data.notes || null,
      createdBy: user.userCode,
    });

    const shipmentId = shipmentResult.insertId;

    // 3. Link POs to Shipment
    for (const poId of data.poIds) {
      await tx.insert(tblShipmentPurchaseOrders).values({
        shipmentId,
        purchaseOrderId: poId,
      });
    }

    // 4. Query all items of selected POs to add them to shipment items
    const poItems = await tx
      .select()
      .from(tblPurchaseOrderItems)
      .where(inArray(tblPurchaseOrderItems.purchaseOrderId, data.poIds));

    for (const item of poItems) {
      const remainingQty = Math.max(item.quantity - item.receivedQuantity, 0);
      if (remainingQty > 0) {
        await tx.insert(tblShipmentItems).values({
          shipmentId,
          purchaseOrderItemId: item.id,
          variantId: item.variantId,
          quantityShipped: remainingQty,
          quantityReceived: 0,
          cartonNumber: null,
        });
      }
    }

    revalidatePath('/shipments');
    revalidatePath('/purchase-orders');
    return { success: true, shipmentId };
  });
}

export async function receiveShipmentAction(
  shipmentId: number,
  purchaseOrderId: number,
  receiveDate: string
) {
  const user = await authorizeUser();

  try {
    // Call stored procedure sp_receive_shipment to process receiving, inventory valuation, and batch costs
    await dbReceiveShipment(shipmentId, purchaseOrderId);

    // Update shipment arrival date in database
    await db
      .update(tblShipments)
      .set({
        warehouseArrivalDate: new Date(receiveDate),
        updatedBy: user.userCode,
      })
      .where(eq(tblShipments.id, shipmentId));

    revalidatePath('/shipments');
    revalidatePath('/purchase-orders');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error receiving shipment:', error);
    throw new Error(error.message || 'Failed to receive shipment.');
  }
}
