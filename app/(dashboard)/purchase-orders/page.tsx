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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function PurchaseOrdersPage() {
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Purchase Orders (POs)"
        description="Establish RMB supplier orders, track China warehouse handovers, and coordinate imports."
      >
        <Link href="/purchase-orders/new">
          <Button variant="primary" icon={<Plus className="h-4 w-4 shrink-0" />}>
            New PO
          </Button>
        </Link>
      </PageHeader>

      <Card hoverEffect={false} className="p-6">
        <DataTable
          columns={columns}
          data={purchaseOrders}
          searchKey="purchaseOrderNumber"
          searchPlaceholder="Search POs by PO Code..."
        />
      </Card>
    </div>
  );
}
