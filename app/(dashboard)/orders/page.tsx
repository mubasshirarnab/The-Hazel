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

export default async function OrdersPage() {
  const [orders]: any = await poolConnection.query(`
    SELECT
      o.id,
      o.order_number AS orderNumber,
      c.customer_name AS customerName,
      o.order_date AS orderDate,
      o.order_type AS orderType,
      o.grand_total AS grandTotal,
      os.status_code AS orderStatus,
      ps.status_code AS paymentStatus,
      ds.status_code AS deliveryStatus
    FROM tbl_orders o
    INNER JOIN tbl_customers c ON o.customer_id = c.id
    INNER JOIN tbl_order_statuses os ON o.order_status_id = os.id
    INNER JOIN tbl_payment_statuses ps ON o.payment_status_id = ps.id
    INNER JOIN tbl_delivery_statuses ds ON o.delivery_status_id = ds.id
    WHERE o.deleted_at IS NULL
    ORDER BY o.order_date DESC, o.id DESC
  `);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sales Orders"
        description="Fulfill in-stock shipments, track preorder collections, manage cancellations and product returns."
      >
        <Link href="/orders/new">
          <Button variant="primary" icon={<Plus className="h-4 w-4 shrink-0" />}>
            New Order
          </Button>
        </Link>
      </PageHeader>

      <Card hoverEffect={false} className="p-6">
        <DataTable
          columns={columns}
          data={orders}
          searchKey="orderNumber"
          searchPlaceholder="Search orders by Order Code..."
        />
      </Card>
    </div>
  );
}
