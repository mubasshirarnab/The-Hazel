import React from 'react';
import { poolConnection } from '@/lib/db/db';
import Currency, { formatBDT } from '@/components/shared/currency';
import { RevenueAreaChart, MonthlyPLChart } from './charts';
import {
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  DollarSign,
  AlertCircle,
  BarChart2,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. KPI Summary Stats
  const [[orderStats]]: any = await poolConnection.query(`
    SELECT
      COUNT(*) AS total_orders,
      SUM(CASE WHEN os.status_code = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
      SUM(CASE WHEN os.status_code = 'processing' THEN 1 ELSE 0 END) AS processing_orders,
      SUM(CASE WHEN os.status_code = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
      COALESCE(SUM(CASE WHEN os.status_code = 'completed' THEN o.grand_total ELSE 0 END), 0) AS total_revenue,
      COALESCE(SUM(o.outstanding_amount), 0) AS total_outstanding
    FROM tbl_orders o
    INNER JOIN tbl_order_statuses os ON os.id = o.order_status_id
    WHERE o.deleted_at IS NULL
  `);

  const [[customerStats]]: any = await poolConnection.query(`
    SELECT COUNT(*) AS total_customers FROM tbl_customers WHERE deleted_at IS NULL
  `);

  const [[inventoryStats]]: any = await poolConnection.query(`
    SELECT
      COALESCE(SUM(current_stock), 0) AS total_units,
      COALESCE(SUM(inventory_value), 0) AS total_inventory_value
    FROM vw_inventory_value
  `);

  const [[plSummary]]: any = await poolConnection.query(`
    SELECT * FROM vw_profit_loss_summary LIMIT 1
  `);

  // 2. Monthly Revenue chart data (last 12 months)
  const [monthlyRevenue]: any = await poolConnection.query(`
    SELECT revenue_month, revenue FROM vw_monthly_revenue ORDER BY revenue_month ASC LIMIT 12
  `);

  // 3. Monthly P&L chart data (last 12 months)
  const [monthlyPL]: any = await poolConnection.query(`
    SELECT profit_month, revenue, expenses, profit FROM vw_monthly_profit ORDER BY profit_month ASC LIMIT 12
  `);

  // 4. Best selling products
  const [bestSellers]: any = await poolConnection.query(`
    SELECT product_name, total_quantity_sold, revenue FROM vw_best_selling_products LIMIT 5
  `);

  // 5. Best selling colors (variants)
  const [bestColors]: any = await poolConnection.query(`
    SELECT product_name, color_name, total_quantity_sold, revenue FROM vw_best_selling_colors LIMIT 5
  `);

  // 6. Low stock variants (available_stock <= 5)
  const [lowStock]: any = await poolConnection.query(`
    SELECT product_name, color_name, available_stock, current_stock
    FROM vw_inventory_value
    WHERE available_stock <= 5 AND available_stock IS NOT NULL
    ORDER BY available_stock ASC
    LIMIT 8
  `);

  const totalRevenue = parseFloat(orderStats?.total_revenue || 0);
  const netProfit = parseFloat(plSummary?.net_profit || 0);
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight text-[var(--hz-ink)]">Dashboard</h1>
        <p className="text-xs text-[var(--hz-ink-soft)] mt-1">
          Real-time overview of orders, inventory, finances and marketing performance.
        </p>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: formatBDT(totalRevenue),
            icon: DollarSign,
            color: 'text-[var(--hz-success-fg)]',
            bgColor: 'bg-[var(--hz-success-bg)] border-[var(--hz-success-fg)]/20',
          },
          {
            label: 'Net Profit',
            value: formatBDT(netProfit),
            icon: TrendingUp,
            color: netProfit >= 0 ? 'text-[var(--hz-success-fg)]' : 'text-[var(--hz-danger-fg)]',
            bgColor: netProfit >= 0 ? 'bg-[var(--hz-success-bg)] border-[var(--hz-success-fg)]/20' : 'bg-[var(--hz-danger-bg)] border-[var(--hz-danger-fg)]/20',
          },
          {
            label: 'Total Orders',
            value: String(orderStats?.total_orders || 0),
            icon: ShoppingBag,
            color: 'text-[var(--hz-forest)]',
            bgColor: 'bg-[var(--hz-alabaster)] border-[var(--hz-line)]',
          },
          {
            label: 'Total Customers',
            value: String(customerStats?.total_customers || 0),
            icon: Users,
            color: 'text-[var(--hz-walnut)]',
            bgColor: 'bg-[var(--hz-alabaster)] border-[var(--hz-line)]',
          },
          {
            label: 'Inventory Value',
            value: formatBDT(inventoryStats?.total_inventory_value || 0),
            icon: Package,
            color: 'text-[var(--hz-gold)]',
            bgColor: 'bg-[var(--hz-alabaster)] border-[var(--hz-line)]',
          },
          {
            label: 'Stock Units',
            value: String(inventoryStats?.total_units || 0),
            icon: Layers,
            color: 'text-[var(--hz-ink)]',
            bgColor: 'bg-[var(--hz-alabaster)] border-[var(--hz-line)]',
          },
          {
            label: 'Pending Orders',
            value: String(orderStats?.pending_orders || 0),
            icon: AlertCircle,
            color: 'text-[var(--hz-warning-fg)]',
            bgColor: 'bg-[var(--hz-warning-bg)] border-[var(--hz-warning-fg)]/20',
          },
          {
            label: 'Profit Margin',
            value: `${profitMargin.toFixed(1)}%`,
            icon: BarChart2,
            color: profitMargin >= 20 ? 'text-[var(--hz-success-fg)]' : 'text-[var(--hz-danger-fg)]',
            bgColor: profitMargin >= 20 ? 'bg-[var(--hz-success-bg)] border-[var(--hz-success-fg)]/20' : 'bg-[var(--hz-danger-bg)] border-[var(--hz-danger-fg)]/20',
          },
        ].map(({ label, value, icon: Icon, color, bgColor }) => (
          <div
            key={label}
            className={`hz-card flex flex-col gap-3 ${bgColor}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-eyebrow">{label}</span>
              <Icon className={`h-4 w-4 ${color} opacity-70`} />
            </div>
            <span className={`text-lg font-mono font-semibold tracking-tight ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hz-card">
          <h3 className="text-eyebrow mb-4">
            Monthly Revenue Trend
          </h3>
          <RevenueAreaChart data={monthlyRevenue} />
        </div>

        <div className="hz-card">
          <h3 className="text-eyebrow mb-4">
            Revenue vs Expenses vs Profit
          </h3>
          <MonthlyPLChart data={monthlyPL} />
        </div>
      </div>

      {/* ─── Bottom Row: Best sellers + Low Stock ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Selling Products */}
        <div className="hz-card space-y-4">
          <h3 className="text-eyebrow border-b border-[var(--hz-line-soft)] pb-3">
            Best Selling Products
          </h3>
          {bestSellers.length === 0 ? (
            <p className="text-xs text-[var(--hz-ink-muted)] italic">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--hz-ink-muted)] w-4">{i + 1}.</span>
                    <span className="text-[var(--hz-ink)] font-medium truncate max-w-[140px]">
                      {p.product_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[var(--hz-forest)] font-bold">{p.total_quantity_sold} sold</span>
                    <span className="text-[var(--hz-ink-muted)] ml-2">{formatBDT(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Selling Colors */}
        <div className="hz-card space-y-4">
          <h3 className="text-eyebrow border-b border-[var(--hz-line-soft)] pb-3">
            Top Color Variants
          </h3>
          {bestColors.length === 0 ? (
            <p className="text-xs text-[var(--hz-ink-muted)] italic">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {bestColors.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--hz-ink-muted)] w-4">{i + 1}.</span>
                    <div>
                      <span className="text-[var(--hz-ink)] font-medium block truncate max-w-[130px]">
                        {c.product_name}
                      </span>
                      <span className="text-[var(--hz-ink-muted)] text-[10px]">{c.color_name}</span>
                    </div>
                  </div>
                  <span className="text-[var(--hz-forest)] font-bold">{c.total_quantity_sold} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="hz-card space-y-4">
          <h3 className="text-eyebrow border-b border-[var(--hz-line-soft)] pb-3 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-[var(--hz-warning-fg)]" />
            <span>Low Stock Alerts</span>
          </h3>
          {lowStock.length === 0 ? (
            <p className="text-xs text-[var(--hz-ink-muted)] italic">All stock levels healthy ✓</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[var(--hz-ink)] font-medium block truncate max-w-[140px]">
                      {s.product_name}
                    </span>
                    <span className="text-[var(--hz-ink-muted)] text-[10px]">{s.color_name}</span>
                  </div>
                  <span
                    className={`font-mono font-semibold px-2 py-0.5 rounded-sm text-[10px] ${
                      s.available_stock === 0
                        ? 'bg-[var(--hz-danger-bg)] text-[var(--hz-danger-fg)] border border-[var(--hz-danger-fg)]/20'
                        : 'bg-[var(--hz-warning-bg)] text-[var(--hz-warning-fg)] border border-[var(--hz-warning-fg)]/20'
                    }`}
                  >
                    {s.available_stock ?? 0} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
