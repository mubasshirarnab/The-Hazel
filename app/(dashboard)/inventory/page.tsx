import React from 'react';
import { db, poolConnection } from '@/lib/db/db';
import { tblWarehouses, tblProductVariants, tblProducts } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import Currency from '@/components/shared/currency';
import AdjustmentDialog from './adjustment-dialog';
import { columns } from './columns';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  // 1. Fetch current stocks from view
  const [stocks]: any = await poolConnection.query(
    'SELECT * FROM vw_inventory_value'
  );

  // 2. Fetch warehouses for dropdown
  const warehouses = await db
    .select({
      id: tblWarehouses.id,
      warehouseCode: tblWarehouses.warehouseCode,
      warehouseName: tblWarehouses.warehouseName,
    })
    .from(tblWarehouses)
    .where(and(eq(tblWarehouses.isActive, 1), isNull(tblWarehouses.deletedAt)));

  // 3. Fetch variants for dropdown selection
  const variants = await db
    .select({
      id: tblProductVariants.id,
      variantCode: tblProductVariants.variantCode,
      colorName: tblProductVariants.colorName,
      productName: tblProducts.productName,
    })
    .from(tblProductVariants)
    .innerJoin(tblProducts, eq(tblProductVariants.productId, tblProducts.id))
    .where(and(isNull(tblProductVariants.deletedAt), isNull(tblProducts.deletedAt)));

  // 4. Compute summaries
  const totalValue = stocks.reduce((acc: number, s: any) => acc + parseFloat(s.inventory_value || 0), 0);
  const totalUnits = stocks.reduce((acc: number, s: any) => acc + (s.current_stock || 0), 0);
  const totalReserved = stocks.reduce((acc: number, s: any) => acc + (s.reserved_stock || 0), 0);
  const totalAvailable = totalUnits - totalReserved;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Inventory"
        description="Monitor physical stock levels, pending preorder reservations, stock conditions, and valuation."
      >
        <AdjustmentDialog variants={variants} warehouses={warehouses} />
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Total Valuation</span>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 mt-2">
            <Currency amount={totalValue} />
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Total Physical Units</span>
          <span className="text-2xl font-bold tracking-tight text-zinc-100 mt-2 block">
            {totalUnits} units
          </span>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Preorder Reserved</span>
          <span className="text-2xl font-bold tracking-tight text-amber-500 mt-2 block">
            {totalReserved} units
          </span>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Available to Sell</span>
          <span className="text-2xl font-bold tracking-tight text-rose-400 mt-2 block">
            {totalAvailable} units
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/10">
        <DataTable
          columns={columns}
          data={stocks}
          searchKey="product_name"
          searchPlaceholder="Search inventory by product name..."
        />
      </div>
    </div>
  );
}
