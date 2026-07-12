import React from 'react';
import { db, poolConnection } from '@/lib/db/db';
import PageHeader from '@/components/shared/page-header';
import DataTable from '@/components/shared/data-table';
import Currency, { formatBDT } from '@/components/shared/currency';
import CashFlowDialog from './cash-flow-dialog';
import RefreshButton from './refresh-button';
import { columns } from './columns';
import { Landmark, TrendingUp, DollarSign, Percent } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  // 1. Fetch individual cash flow entries from the raw table
  const [cashFlows]: any = await poolConnection.query(
    'SELECT * FROM tbl_cash_flow ORDER BY entry_date DESC, id DESC'
  );

  // 2. Fetch P&L summary from view
  const [plOverview]: any = await poolConnection.query(
    'SELECT * FROM vw_profit_loss_summary LIMIT 1'
  );
  const plSummary = plOverview[0] || {
    period_month: null,
    revenue: 0,
    expenses: 0,
    net_profit: 0,
  };

  // 3. Fetch monthly P&L snapshots from tbl_profit_loss
  const [plLogs]: any = await poolConnection.query(
    'SELECT * FROM tbl_profit_loss ORDER BY period_start DESC LIMIT 12'
  );

  // Compute cash balances from raw entries
  const totalInflow = cashFlows
    .filter((c: any) => c.entry_type?.toLowerCase() === 'inflow')
    .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);

  const totalOutflow = cashFlows
    .filter((c: any) => c.entry_type?.toLowerCase() === 'outflow')
    .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);

  const cashBalance = totalInflow - totalOutflow;

  const grossProfit = parseFloat(plSummary.revenue || 0) - parseFloat(plSummary.expenses || 0);
  const profitMargin =
    parseFloat(plSummary.revenue || 0) > 0
      ? (parseFloat(plSummary.net_profit || grossProfit) / parseFloat(plSummary.revenue)) * 100
      : 0;

  return (
    <div className="space-y-8">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Net Profit</span>
          <div className={`text-2xl font-bold tracking-tight mt-2 ${parseFloat(plSummary.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <Currency amount={plSummary.net_profit || 0} />
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Operating Revenue</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-100 mt-2">
            <Currency amount={plSummary.revenue || 0} />
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Total Expenses</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-300 mt-2">
            <Currency amount={plSummary.expenses || 0} />
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Net Profit Margin</span>
          <span className={`text-2xl font-bold tracking-tight mt-2 block font-mono ${profitMargin >= 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
            {profitMargin.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cash reserves & P&L snapshot */}
        <div className="lg:col-span-1 space-y-6">
          {/* Cash Reserves balance card */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Landmark className="h-4 w-4 text-rose-500" />
              <span>Cash Reserves Summary</span>
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Total Inflows:</span>
                <span className="font-semibold text-emerald-400">{formatBDT(totalInflow)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Total Outflows:</span>
                <span className="font-semibold text-rose-400">{formatBDT(totalOutflow)}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-zinc-100">
                <span>Net Cash Balance:</span>
                <span className={`font-mono ${cashBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatBDT(cashBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly P&L snapshots list */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <TrendingUp className="h-4 w-4 text-rose-500" />
              <span>P&L Monthly Snapshots</span>
            </h3>

            {plLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No snapshots yet. Click &ldquo;Recalculate P&L&rdquo; above.</p>
            ) : (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {plLogs.map((log: any) => {
                  const rev = parseFloat(log.revenue || 0);
                  const profit = parseFloat(log.net_profit || 0);
                  const margin = rev > 0 ? (profit / rev) * 100 : 0;
                  return (
                    <div key={log.id} className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800 space-y-2 text-xs">
                      <div className="flex justify-between font-semibold border-b border-zinc-800 pb-1.5 text-zinc-300">
                        <span>
                          {new Date(log.period_start).toLocaleDateString(undefined, {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className={margin >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {margin.toFixed(1)}% margin
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Revenue:</span>
                        <span className="text-zinc-200 font-mono">{formatBDT(rev)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Net Profit:</span>
                        <span className={`font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatBDT(profit)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cash flow ledger table */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <DollarSign className="h-4.5 w-4.5 text-rose-500" />
              <span>Cash Flow Ledger ({cashFlows.length} entries)</span>
            </h3>

            <DataTable
              columns={columns}
              data={cashFlows}
              searchKey="description"
              searchPlaceholder="Search cash flow transactions..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
