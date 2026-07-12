import React from 'react';
import { db, poolConnection } from '@/lib/db/db';
import { tblMarketingPlatforms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import PageHeader from '@/components/shared/page-header';
import CampaignDialog from './campaign-dialog';
import MarketingTable from './marketing-table';
import Currency from '@/components/shared/currency';

export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  // Fetch campaigns via vw_marketing_roas joined with raw campaign table for mutable fields
  const [campaigns]: any = await poolConnection.query(`
    SELECT
      c.id,
      c.campaign_code,
      c.campaign_name,
      c.platform_id,
      mp.platform_name,
      c.start_date AS startDate,
      c.end_date AS endDate,
      c.budget_amount,
      c.spend_amount,
      c.revenue_amount,
      c.orders_generated,
      CASE WHEN c.spend_amount > 0 THEN ROUND(c.revenue_amount / c.spend_amount, 2) ELSE 0 END AS roas
    FROM tbl_marketing_campaigns c
    INNER JOIN tbl_marketing_platforms mp ON mp.id = c.platform_id
    WHERE c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  `);

  // Fetch platforms for dropdowns
  const platforms = await db
    .select({ id: tblMarketingPlatforms.id, platformName: tblMarketingPlatforms.platformName })
    .from(tblMarketingPlatforms)
    .where(eq(tblMarketingPlatforms.isActive, 1));

  // Aggregate metrics
  const totalBudget = campaigns.reduce((s: number, c: any) => s + parseFloat(c.budget_amount || 0), 0);
  const totalSpend  = campaigns.reduce((s: number, c: any) => s + parseFloat(c.spend_amount  || 0), 0);
  const totalRevenue = campaigns.reduce((s: number, c: any) => s + parseFloat(c.revenue_amount || 0), 0);
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const totalOrders = campaigns.reduce((s: number, c: any) => s + (c.orders_generated || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ad Campaigns & ROAS"
        description="Track Facebook/Instagram ad budgets, attribute sales revenues, and optimize Return on Ad Spend."
      >
        <CampaignDialog platforms={platforms} />
      </PageHeader>

      {/* KPI widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Total Ad Spend</span>
          <div className="text-2xl font-bold tracking-tight text-rose-400 mt-2">
            <Currency amount={totalSpend} />
          </div>
        </div>
        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Tracked Revenue</span>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 mt-2">
            <Currency amount={totalRevenue} />
          </div>
        </div>
        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Blended ROAS</span>
          <span className="text-2xl font-bold tracking-tight text-zinc-100 mt-2 block font-mono">
            {blendedRoas.toFixed(2)}x
          </span>
        </div>
        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Attributed Orders</span>
          <span className="text-2xl font-bold tracking-tight text-zinc-300 mt-2 block">
            {totalOrders} conversions
          </span>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/10">
        <MarketingTable campaigns={campaigns} platforms={platforms} />
      </div>
    </div>
  );
}
