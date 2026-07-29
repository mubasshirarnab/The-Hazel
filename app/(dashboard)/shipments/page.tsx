import React from 'react';
import { poolConnection } from '@/lib/db/db';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ShipmentsPage() {
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Cargo Shipments"
        description="Monitor international cargo flights, track shipping weight metrics, and process custom clearance receipts."
      >
        <Link href="/shipments/new">
          <Button variant="primary" icon={<Plus className="h-4 w-4 shrink-0" />}>
            New Cargo
          </Button>
        </Link>
      </PageHeader>

      <Card hoverEffect={false} className="p-6">
        <DataTable
          columns={columns}
          data={shipments}
          searchKey="shipmentNumber"
          searchPlaceholder="Search shipments by Shipment Code..."
        />
      </Card>
    </div>
  );
}
