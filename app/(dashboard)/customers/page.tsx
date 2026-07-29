import React from 'react';
import { poolConnection } from '@/lib/db/db';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import CustomerDialog from './customer-dialog';
import { columns } from './columns';
import Currency from '@/components/shared/currency';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
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

  const totalCount = customers.length;
  const repeatCount = customers.filter((c: any) => c.repeatCustomer === 'Repeat').length;
  const repeatRate = totalCount > 0 ? (repeatCount / totalCount) * 100 : 0;

  const totalSpend = customers.reduce((acc: number, c: any) => acc + parseFloat(c.lifetimeSpend || 0), 0);
  const avgLifetimeSpend = totalCount > 0 ? totalSpend / totalCount : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Customer Profiles & Analytics"
        description="Monitor repeat rates, lifetime purchases, and default delivery preferences."
      >
        <CustomerDialog />
      </PageHeader>

      {/* Analytics Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Registered Profiles</span>
          <span className="text-2xl font-bold tracking-tight text-[#1A1A1A] mt-2 block font-mono">
            {totalCount} customers
          </span>
        </Card>

        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Repeat Buyer Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold tracking-tight text-[#B08D57] font-mono">
              {repeatRate.toFixed(1)}%
            </span>
            <span className="text-xs text-[#6B6B6B] font-semibold">({repeatCount} repeat buyers)</span>
          </div>
        </Card>

        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Avg. Lifetime Value</span>
          <div className="text-2xl font-bold tracking-tight text-[#15803D] mt-2 font-mono">
            <Currency amount={avgLifetimeSpend} />
          </div>
        </Card>
      </div>

      {/* Customer Data Table */}
      <Card hoverEffect={false} className="p-6">
        <DataTable
          columns={columns}
          data={customers}
          searchKey="customerName"
          searchPlaceholder="Search customers by name..."
        />
      </Card>
    </div>
  );
}
