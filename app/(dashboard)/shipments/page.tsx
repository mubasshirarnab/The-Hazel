import React from 'react';
import { poolConnection } from '@/lib/db/db';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';

export const dynamic = 'force-dynamic';

export default async function ShipmentsPage() {
  // Query all active shipments joined with status info
  const [shipments]: any = await poolConnection.query(`
    SELECT
      s.id,
      s.shipment_number AS shipmentNumber,
      s.departure_date AS departureDate,
      s.warehouse_arrival_date AS warehouseArrivalDate,
      s.bangladesh_arrival_date AS bangladeshArrivalDate,
      s.weight_kg AS weightKg,
      s.shipping_rate_per_kg AS shippingRatePerKg,
      s.shipping_cost AS shippingCost,
      st.status_code AS statusCode
    FROM tbl_shipments s
    INNER JOIN tbl_shipment_statuses st ON s.status_id = st.id
    WHERE s.deleted_at IS NULL
    ORDER BY s.departure_date DESC, s.id DESC
  `);

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
