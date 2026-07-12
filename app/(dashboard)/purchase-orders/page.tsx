import React from 'react';
import { db } from '@/lib/db/db';
import {
  tblPurchaseOrders,
  tblSuppliers,
  tblFriends,
  tblPurchaseOrderStatuses,
} from '@/lib/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';

export const dynamic = 'force-dynamic';

export default async function PurchaseOrdersPage() {
  // Query all active POs joined with lookup details
  const purchaseOrders = await db
    .select({
      id: tblPurchaseOrders.id,
      purchaseOrderNumber: tblPurchaseOrders.purchaseOrderNumber,
      purchaseDate: tblPurchaseOrders.purchaseDate,
      historicalRmbRate: tblPurchaseOrders.historicalRmbRate,
      totalAmountBdt: tblPurchaseOrders.totalAmountBdt,
      supplierName: tblSuppliers.supplierName,
      friendName: tblFriends.friendName,
      statusCode: tblPurchaseOrderStatuses.statusCode,
    })
    .from(tblPurchaseOrders)
    .innerJoin(tblSuppliers, eq(tblPurchaseOrders.supplierId, tblSuppliers.id))
    .innerJoin(tblFriends, eq(tblPurchaseOrders.friendId, tblFriends.id))
    .innerJoin(tblPurchaseOrderStatuses, eq(tblPurchaseOrders.statusId, tblPurchaseOrderStatuses.id))
    .where(isNull(tblPurchaseOrders.deletedAt))
    .orderBy(desc(tblPurchaseOrders.purchaseDate), desc(tblPurchaseOrders.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders (POs)"
        description="Establish RMB supplier orders, track China warehouse handovers, and coordinate imports."
      >
        <Link
          href="/purchase-orders/new"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer shadow-lg shadow-rose-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New PO</span>
        </Link>
      </PageHeader>

      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/10">
        <DataTable
          columns={columns}
          data={purchaseOrders}
          searchKey="purchaseOrderNumber"
          searchPlaceholder="Search POs by PO Code..."
        />
      </div>
    </div>
  );
}
