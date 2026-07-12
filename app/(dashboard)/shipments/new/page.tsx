import React from 'react';
import { db } from '@/lib/db/db';
import { tblPurchaseOrders } from '@/lib/db/schema';
import { inArray, and, isNull } from 'drizzle-orm';
import PageHeader from '@/components/shared/page-header';
import ShipmentForm from './shipment-form';

export const dynamic = 'force-dynamic';

export default async function NewShipmentPage() {
  // Query all active purchase orders that have been PLACED (statusId = 2) or PARTIALLY RECEIVED (statusId = 3)
  const pos = await db
    .select({
      id: tblPurchaseOrders.id,
      purchaseOrderNumber: tblPurchaseOrders.purchaseOrderNumber,
      purchaseDate: tblPurchaseOrders.purchaseDate,
      totalAmountBdt: tblPurchaseOrders.totalAmountBdt,
    })
    .from(tblPurchaseOrders)
    .where(
      and(
        inArray(tblPurchaseOrders.statusId, [2, 3]),
        isNull(tblPurchaseOrders.deletedAt)
      )
    )
    .orderBy(tblPurchaseOrders.purchaseDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Shipment Cargo"
        description="Consolidate one or more placed Purchase Orders (POs) into a new cargo container shipment."
      />

      <ShipmentForm purchaseOrders={pos} />
    </div>
  );
}
