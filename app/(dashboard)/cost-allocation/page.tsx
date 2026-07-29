import React from 'react';
import { poolConnection } from '@/lib/db/db';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';
import Currency from '@/components/shared/currency';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function CostAllocationPage() {
  const [allocations]: any = await poolConnection.query(
    `SELECT s.*, pv.variant_code, p.product_name, pv.color_name
     FROM vw_cost_allocation_summary s
     INNER JOIN tbl_product_variants pv ON pv.id = s.target_id
     INNER JOIN tbl_products p ON p.id = pv.product_id
     WHERE pv.deleted_at IS NULL AND p.deleted_at IS NULL
     ORDER BY s.created_at DESC`
  );

  const totalAllocated = allocations.reduce(
    (sum: number, a: any) => sum + parseFloat(a.allocation_amount || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Expense Allocation (Margin Optimization)"
        description="Verify photoshoot, advertising, PR campaign, and packaging expenses allocated to handbag inventory."
      >
        <Link href="/cost-allocation/new">
          <Button variant="primary" icon={<Plus className="h-4 w-4 shrink-0" />}>
            Allocate Expense
          </Button>
        </Link>
      </PageHeader>

      {/* Summary KPI Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Total Allocated Expense</span>
          <div className="text-2xl font-bold tracking-tight text-[#DC2626] mt-2 font-mono">
            <Currency amount={totalAllocated} />
          </div>
        </Card>

        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Allocated Records</span>
          <span className="text-2xl font-bold tracking-tight text-[#1A1A1A] mt-2 block font-mono">
            {allocations.length} items
          </span>
        </Card>

        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Targeting Mode</span>
          <span className="text-2xl font-bold tracking-tight text-[#15803D] mt-2 block capitalize font-mono">
            Variant Ledger
          </span>
        </Card>
      </div>

      {/* Allocation Ledger Data Table */}
      <Card hoverEffect={false} className="p-6">
        <DataTable
          columns={columns}
          data={allocations}
          searchKey="expense_name"
          searchPlaceholder="Search allocations by expense name..."
        />
      </Card>
    </div>
  );
}
