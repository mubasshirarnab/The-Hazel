import React from 'react';
import { db } from '@/lib/db/db';
import {
  tblOrders,
  tblCustomers,
  tblOrderStatuses,
  tblPaymentStatuses,
  tblDeliveryStatuses,
} from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  // Query all active orders joined with their statuses and customer info
  const orders = await db
    .select({
      id: tblOrders.id,
      orderNumber: tblOrders.orderNumber,
      customerName: tblCustomers.customerName,
      orderDate: tblOrders.orderDate,
      orderType: tblOrders.orderType,
      grandTotal: tblOrders.grandTotal,
      orderStatus: tblOrderStatuses.statusCode,
      paymentStatus: tblPaymentStatuses.statusCode,
      deliveryStatus: tblDeliveryStatuses.statusCode,
    })
    .from(tblOrders)
    .innerJoin(tblCustomers, eq(tblOrders.customerId, tblCustomers.id))
    .innerJoin(tblOrderStatuses, eq(tblOrders.orderStatusId, tblOrderStatuses.id))
    .innerJoin(tblPaymentStatuses, eq(tblOrders.paymentStatusId, tblPaymentStatuses.id))
    .innerJoin(tblDeliveryStatuses, eq(tblOrders.deliveryStatusId, tblDeliveryStatuses.id))
    .where(isNull(tblOrders.deletedAt))
    .orderBy(desc(tblOrders.orderDate), desc(tblOrders.id));

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
