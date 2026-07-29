import React from 'react';
import { poolConnection } from '@/lib/db/db';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  // Query all active orders joined with their statuses and customer info
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
    <div className="space-y-6">
      <PageHeader
        title="Sales Orders"
        description="Fulfill in-stock shipments, track preorder collections, manage cancellations and product returns."
      >
        <Link
          href="/orders/new"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer shadow-lg shadow-rose-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Order</span>
        </Link>
      </PageHeader>

      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/10">
        <DataTable
          columns={columns}
          data={orders}
          searchKey="orderNumber"
          searchPlaceholder="Search orders by Order Code..."
        />
      </div>
    </div>
  );
}
