import React from 'react';
import { poolConnection } from '@/lib/db/db';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';
import Currency from '@/components/shared/currency';

export const dynamic = 'force-dynamic';

export default async function CostAllocationPage() {
  // Query allocation ledger with target product variant information
  const [allocations]: any = await poolConnection.query(
    `SELECT s.*, pv.variant_code, p.product_name, pv.color_name
     FROM vw_cost_allocation_summary s
     INNER JOIN tbl_product_variants pv ON pv.id = s.target_id
     INNER JOIN tbl_products p ON p.id = pv.product_id
     WHERE pv.deleted_at IS NULL AND p.deleted_at IS NULL
     ORDER BY s.created_at DESC`
  );

  // Compute total distributed expense
  const totalAllocated = allocations.reduce(
    (sum: number, a: any) => sum + parseFloat(a.allocation_amount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Allocation (Margin Optimization)"
        description="Verify photoshoot, advertising, PR campaign, and packaging expenses allocated to handbag inventory."
      >
        <Link
          href="/cost-allocation/new"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer shadow-lg shadow-rose-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Allocate Expense</span>
        </Link>
      </PageHeader>

      {/* Summary KPI Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Total Allocated Expense</span>
          <div className="text-2xl font-bold tracking-tight text-rose-400 mt-2">
            <Currency amount={totalAllocated} />
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Allocated Records</span>
          <span className="text-2xl font-bold tracking-tight text-zinc-100 mt-2 block">
            {allocations.length} items
          </span>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Targeting Mode</span>
          <span className="text-2xl font-bold tracking-tight text-emerald-400 mt-2 block capitalize">
            Variant Ledger
          </span>
        </div>
      </div>

      {/* Allocation Ledger Data Table */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/10">
        <DataTable
          columns={columns}
          data={allocations}
          searchKey="expense_name"
          searchPlaceholder="Search allocations by expense name..."
        />
      </div>
    </div>
  );
}
