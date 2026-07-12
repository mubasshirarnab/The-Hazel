import React from 'react';
import { poolConnection } from '@/lib/db/db';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import CustomerDialog from './customer-dialog';
import { columns } from './columns';
import Currency from '@/components/shared/currency';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  // Query customer analytics from view, filtering out soft-deleted customers
  const [customers]: any = await poolConnection.query(
    `SELECT 
       v.id,
       v.customer_code as customerCode,
       v.customer_name as customerName,
       v.phone,
       v.facebook_name as facebookName,
       v.total_orders as totalOrders,
       v.lifetime_spend as lifetimeSpend,
       v.average_order_value as averageOrderValue,
       v.last_purchase as lastPurchase,
       v.repeat_customer as repeatCustomer,
       c.address,
       c.district,
       c.payment_preference as paymentPreference
     FROM vw_customer_analytics v
     INNER JOIN tbl_customers c ON c.id = v.id
     WHERE c.deleted_at IS NULL
     ORDER BY v.lifetime_spend DESC`
  );

  // Compute CRM KPIs
  const totalCount = customers.length;
  const repeatCount = customers.filter((c: any) => c.repeatCustomer === 'Repeat').length;
  const repeatRate = totalCount > 0 ? (repeatCount / totalCount) * 100 : 0;

  const totalSpend = customers.reduce((acc: number, c: any) => acc + parseFloat(c.lifetimeSpend || 0), 0);
  const avgLifetimeSpend = totalCount > 0 ? totalSpend / totalCount : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Profiles & Analytics"
        description="Monitor repeat rates, lifetime purchases, and default delivery preferences."
      >
        <CustomerDialog />
      </PageHeader>

      {/* Analytics Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Registered Profiles</span>
          <span className="text-2xl font-bold tracking-tight text-zinc-100 mt-2 block">
            {totalCount} customers
          </span>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Repeat Buyer Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold tracking-tight text-rose-400">
              {repeatRate.toFixed(1)}%
            </span>
            <span className="text-xs text-zinc-500 font-semibold">({repeatCount} repeat buyers)</span>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Avg. Lifetime Value</span>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 mt-2">
            <Currency amount={avgLifetimeSpend} />
          </div>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/10">
        <DataTable
          columns={columns}
          data={customers}
          searchKey="customerName"
          searchPlaceholder="Search customers by name..."
        />
      </div>
    </div>
  );
}
