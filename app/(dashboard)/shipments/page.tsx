import React from 'react';
import { db } from '@/lib/db/db';
import { tblShipments, tblShipmentStatuses } from '@/lib/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';

export const dynamic = 'force-dynamic';

export default async function ShipmentsPage() {
  // Query all active shipments joined with status info
  const shipments = await db
    .select({
      id: tblShipments.id,
      shipmentNumber: tblShipments.shipmentNumber,
      departureDate: tblShipments.departureDate,
      warehouseArrivalDate: tblShipments.warehouseArrivalDate,
      bangladeshArrivalDate: tblShipments.bangladeshArrivalDate,
      weightKg: tblShipments.weightKg,
      shippingRatePerKg: tblShipments.shippingRatePerKg,
      shippingCost: tblShipments.shippingCost,
      statusCode: tblShipmentStatuses.statusCode,
    })
    .from(tblShipments)
    .innerJoin(tblShipmentStatuses, eq(tblShipments.statusId, tblShipmentStatuses.id))
    .where(isNull(tblShipments.deletedAt))
    .orderBy(desc(tblShipments.departureDate), desc(tblShipments.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cargo Shipments"
        description="Monitor international cargo flights, track shipping weight metrics, and process custom clearance receipts."
      >
        <Link
          href="/shipments/new"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer shadow-lg shadow-rose-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Cargo</span>
        </Link>
      </PageHeader>

      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/10">
        <DataTable
          columns={columns}
          data={shipments}
          searchKey="shipmentNumber"
          searchPlaceholder="Search shipments by Shipment Code..."
        />
      </div>
    </div>
  );
}
