import React from 'react';
import { poolConnection } from '@/lib/db/db';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import Currency, { formatBDT } from '@/components/shared/currency';
import CashFlowDialog from './cash-flow-dialog';
import RefreshButton from './refresh-button';
import { columns } from './columns';
import { Landmark, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const [cashFlows]: any = await poolConnection.query(
    'SELECT * FROM tbl_cash_flow ORDER BY entry_date DESC, id DESC'
  );

  const [plOverview]: any = await poolConnection.query(
    'SELECT * FROM vw_profit_loss_summary LIMIT 1'
  );
  const plSummary = plOverview[0] || {
    period_month: null,
    revenue: 0,
    cogs: 0,
    gross_profit: 0,
    expenses: 0,
    net_profit: 0,
  };

  const [plLogs]: any = await poolConnection.query(
    'SELECT * FROM tbl_profit_loss ORDER BY period_start DESC LIMIT 12'
  );

  const totalInflow = cashFlows
    .filter((c: any) => c.entry_type?.toLowerCase() === 'inflow')
    .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);

  const totalOutflow = cashFlows
    .filter((c: any) => c.entry_type?.toLowerCase() === 'outflow')
    .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);

  const cashBalance = totalInflow - totalOutflow;

  const revenueVal = parseFloat(plSummary.revenue || 0);
  const cogsVal = parseFloat(plSummary.cogs || 0);
  const grossProfitVal = parseFloat(plSummary.gross_profit || 0);
  const expensesVal = parseFloat(plSummary.expenses || 0);
  const netProfitVal = parseFloat(plSummary.net_profit || 0);

  const profitMargin = revenueVal > 0 ? (netProfitVal / revenueVal) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Financial Ledger & P&L"
        description="Monitor cash flow balances, review landed margins, and trigger profit/loss reconciliations."
      >
        <div className="flex items-center gap-3">
          <RefreshButton />
          <CashFlowDialog />
        </div>
      </PageHeader>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card hoverEffect={true} className="p-5">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Total Sales</span>
          <div className="text-xl font-bold tracking-tight text-[#1A1A1A] mt-2 font-mono">
            <Currency amount={revenueVal} />
          </div>
        </Card>

        <Card hoverEffect={true} className="p-5">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">COGS (Product Cost)</span>
          <div className="text-xl font-bold tracking-tight text-[#6A4E3B] mt-2 font-mono">
            <Currency amount={cogsVal} />
          </div>
        </Card>

        <Card hoverEffect={true} className="p-5">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Gross Profit</span>
          <div className={`text-xl font-bold tracking-tight mt-2 font-mono ${grossProfitVal >= 0 ? 'text-[#1F3A2E]' : 'text-[#DC2626]'}`}>
            <Currency amount={grossProfitVal} />
          </div>
        </Card>

        <Card hoverEffect={true} className="p-5">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Operating Expenses</span>
          <div className="text-xl font-bold tracking-tight text-[#6B6B6B] mt-2 font-mono">
            <Currency amount={expensesVal} />
          </div>
        </Card>

        <Card hoverEffect={true} className="p-5">
          <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Net Profit ({profitMargin.toFixed(1)}%)</span>
          <div className={`text-xl font-bold tracking-tight mt-2 font-mono ${netProfitVal >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
            <Currency amount={netProfitVal} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cash reserves & P&L snapshot */}
        <div className="lg:col-span-1 space-y-6">
          {/* Cash Reserves balance card */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest flex items-center gap-2">
                <Landmark className="h-4 w-4 text-[#B08D57]" />
                <span>Cash Reserves Summary</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-xs pt-4">
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Total Inflows:</span>
                <span className="font-semibold text-[#15803D] font-mono">{formatBDT(totalInflow)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Total Outflows:</span>
                <span className="font-semibold text-[#DC2626] font-mono">{formatBDT(totalOutflow)}</span>
              </div>
              <div className="pt-2 border-t border-[#E9E7E2] flex justify-between font-bold text-[#1A1A1A]">
                <span>Net Cash Balance:</span>
                <span className={`font-mono ${cashBalance >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                  {formatBDT(cashBalance)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly P&L snapshots list */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#B08D57]" />
                <span>P&L Monthly Snapshots</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4">
              {plLogs.length === 0 ? (
                <p className="text-xs text-[#9E9E9E] italic">No snapshots yet. Click &ldquo;Recalculate P&L&rdquo; above.</p>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {plLogs.map((log: any) => {
                    const rev = parseFloat(log.revenue || 0);
                    const profit = parseFloat(log.net_profit || 0);
                    const margin = rev > 0 ? (profit / rev) * 100 : 0;
                    return (
                      <div key={log.id} className="p-3 rounded-[12px] bg-[#FAFAF8] border border-[#E9E7E2] space-y-2 text-xs hover:border-[#B08D57]/40 transition-colors">
                        <div className="flex justify-between font-semibold border-b border-[#E9E7E2] pb-1.5 text-[#1A1A1A]">
                          <span>
                            {new Date(log.period_start).toLocaleDateString(undefined, {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className={margin >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]'}>
                            {margin.toFixed(1)}% margin
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Revenue:</span>
                          <span className="text-[#1A1A1A] font-mono">{formatBDT(rev)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Net Profit:</span>
                          <span className={`font-mono ${profit >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                            {formatBDT(profit)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Cash flow ledger table */}
        <div className="lg:col-span-2">
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="h-4.5 w-4.5 text-[#B08D57]" />
                <span>Cash Flow Ledger ({cashFlows.length} entries)</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4">
              <DataTable
                columns={columns}
                data={cashFlows}
                searchKey="description"
                searchPlaceholder="Search cash flow transactions..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
