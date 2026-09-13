import React from 'react';
import { poolConnection } from '@/lib/db/db';
import Link from 'next/link';
import { Plus, Receipt } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';
import Currency from '@/components/shared/currency';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function BusinessExpensesPage() {
  const [expenses]: any = await poolConnection.query(`
    SELECT
      e.id,
      e.expense_date AS expenseDate,
      e.expense_type AS expenseType,
      e.description,
      e.amount,
      e.product_related AS productRelated,
      e.platform,
      p.product_name AS productName
    FROM tbl_expenses e
    LEFT JOIN tbl_products p ON p.id = e.product_id
    ORDER BY e.expense_date DESC, e.id DESC
  `);

  const totalExpenses = expenses.reduce(
    (sum: number, e: any) => sum + parseFloat(e.amount || 0),
    0
  );

  const productExpenses = expenses
    .filter((e: any) => Boolean(e.productRelated))
    .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);

  const generalExpenses = totalExpenses - productExpenses;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Business Expenses"
        description="Track operational expenses, marketing fees, and product-allocated import costs."
      >
        <Link href="/business-expenses/new">
          <Button variant="primary" icon={<Plus className="h-4 w-4 shrink-0" />}>
            New Expense
          </Button>
        </Link>
      </PageHeader>

      {/* Summary KPI Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Total Expenses</span>
          <div className="text-2xl font-bold tracking-tight text-[#DC2626] mt-2 font-mono">
            <Currency amount={totalExpenses} />
          </div>
        </Card>

        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Product Allocated Expenses</span>
          <div className="text-2xl font-bold tracking-tight text-[#B08D57] mt-2 font-mono">
            <Currency amount={productExpenses} />
          </div>
        </Card>

        <Card hoverEffect={true} className="p-6">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">General Operating Expenses</span>
          <div className="text-2xl font-bold tracking-tight text-[#1F3A2E] mt-2 font-mono">
            <Currency amount={generalExpenses} />
          </div>
        </Card>
      </div>

      {/* Data Table */}
      <Card hoverEffect={false} className="p-6">
        <DataTable
          columns={columns}
          data={expenses}
          searchKey="expenseType"
          searchPlaceholder="Search expenses by type or keyword..."
        />
      </Card>
    </div>
  );
}