import React from 'react';
import { poolConnection } from '@/lib/db/db';
import { formatBDT } from '@/components/shared/currency';
import { RevenueAreaChart, MonthlyPLChart } from './charts';
import {
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  AlertCircle,
  BarChart2,
  Layers,
  Crown,
  Sparkles,
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

  const totalRevenue = parseFloat(plSummary?.revenue || 0);
  const cogs = parseFloat(plSummary?.cogs || 0);
  const grossProfit = parseFloat(plSummary?.gross_profit || 0);
  const totalExpenses = parseFloat(plSummary?.expenses || 0);
  const netProfit = parseFloat(plSummary?.net_profit || 0);
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E9E7E2]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-[#1F3A2E] font-serif">Executive Command Center</h1>
            <span className="px-3 py-0.5 rounded-full bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 text-[#1F3A2E] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-soft-1">
              <Crown className="h-3 w-3 text-[#B08D57]" />
              <span>Haute Couture Analytics</span>
            </span>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-1 font-medium leading-relaxed">
            Real-time financial performance, inventory valuation, cogs breakdown, and sales analytics.
          </p>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Sales',
            value: formatBDT(totalRevenue),
            icon: DollarSign,
            color: 'text-[#1F3A2E]',
            iconBg: 'bg-[#1F3A2E]/10 border-[#1F3A2E]/20 text-[#1F3A2E]',
          },
          {
            label: 'COGS (Product Cost)',
            value: formatBDT(cogs),
            icon: Package,
            color: 'text-[#1A1A1A]',
            iconBg: 'bg-[#F7F6F3] border-[#E9E7E2] text-[#6A4E3B]',
          },
          {
            label: 'Gross Profit',
            value: formatBDT(grossProfit),
            icon: TrendingUp,
            color: grossProfit >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]',
            iconBg: 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#15803D]',
          },
          {
            label: 'Operating Expenses',
            value: formatBDT(totalExpenses),
            icon: DollarSign,
            color: 'text-[#6A4E3B]',
            iconBg: 'bg-[#6A4E3B]/10 border-[#6A4E3B]/20 text-[#6A4E3B]',
          },
          {
            label: 'Net Profit',
            value: formatBDT(netProfit),
            icon: TrendingUp,
            color: netProfit >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]',
            iconBg: 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#15803D]',
          },
          {
            label: 'Profit Margin',
            value: `${profitMargin.toFixed(1)}%`,
            icon: BarChart2,
            color: profitMargin >= 20 ? 'text-[#15803D]' : 'text-[#DC2626]',
            iconBg: 'bg-[#B08D57]/10 border-[#B08D57]/20 text-[#B08D57]',
          },
          {
            label: 'Total Orders',
            value: String(orderStats?.total_orders || 0),
            icon: ShoppingBag,
            color: 'text-[#1F3A2E]',
            iconBg: 'bg-[#1F3A2E]/10 border-[#1F3A2E]/20 text-[#1F3A2E]',
          },
          {
            label: 'Pending Orders',
            value: String(orderStats?.pending_orders || 0),
            icon: AlertCircle,
            color: 'text-[#D97706]',
            iconBg: 'bg-[#D97706]/10 border-[#D97706]/20 text-[#D97706]',
          },
          {
            label: 'Inventory Value',
            value: formatBDT(inventoryStats?.total_inventory_value || 0),
            icon: Package,
            color: 'text-[#1F3A2E]',
            iconBg: 'bg-[#1F3A2E]/10 border-[#1F3A2E]/20 text-[#1F3A2E]',
          },
          {
            label: 'Stock Units',
            value: String(inventoryStats?.total_units || 0),
            icon: Layers,
            color: 'text-[#1A1A1A]',
            iconBg: 'bg-[#F7F6F3] border-[#E9E7E2] text-[#6B6B6B]',
          },
        ].map(({ label, value, icon: Icon, color, iconBg }) => (
          <div
            key={label}
            className="p-5 rounded-[18px] luxury-card luxury-card-hover flex flex-col justify-between gap-3 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">{label}</span>
              <div className={`p-2 rounded-[10px] border ${iconBg} group-hover:scale-105 transition-transform duration-200 shadow-soft-1`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <span className={`text-xl font-bold font-mono tracking-tight relative z-10 ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-[18px] luxury-card space-y-5">
          <h3 className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest flex items-center gap-2 border-b border-[#E9E7E2] pb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#B08D57]" />
            <span>Monthly Revenue Trend</span>
          </h3>
          <RevenueAreaChart data={monthlyRevenue} />
        </div>

        <div className="p-6 rounded-[18px] luxury-card space-y-5">
          <h3 className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest flex items-center gap-2 border-b border-[#E9E7E2] pb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#B08D57]" />
            <span>Revenue vs Expenses vs Net Profit</span>
          </h3>
          <MonthlyPLChart data={monthlyPL} />
        </div>
      </div>

      {/* ─── Bottom Row: Best sellers + Low Stock ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Selling Products */}
        <div className="p-6 rounded-[18px] luxury-card space-y-4">
          <h3 className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest border-b border-[#E9E7E2] pb-3">
            Best Selling Products
          </h3>
          {bestSellers.length === 0 ? (
            <p className="text-xs text-[#9E9E9E] italic">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[#E9E7E2]/50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-[#B08D57] w-4 font-mono">{i + 1}.</span>
                    <span className="text-[#1A1A1A] font-semibold truncate max-w-[140px]">
                      {p.product_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#1F3A2E] font-bold">{p.total_quantity_sold} sold</span>
                    <span className="text-[#6B6B6B] text-[10px] block font-mono">{formatBDT(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Selling Colors */}
        <div className="p-6 rounded-[18px] luxury-card space-y-4">
          <h3 className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest border-b border-[#E9E7E2] pb-3">
            Top Color Variants
          </h3>
          {bestColors.length === 0 ? (
            <p className="text-xs text-[#9E9E9E] italic">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {bestColors.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[#E9E7E2]/50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-[#B08D57] w-4 font-mono">{i + 1}.</span>
                    <div>
                      <span className="text-[#1A1A1A] font-semibold block truncate max-w-[130px]">
                        {c.product_name}
                      </span>
                      <span className="text-[#6B6B6B] text-[10px] font-medium">{c.color_name}</span>
                    </div>
                  </div>
                  <span className="text-[#1F3A2E] font-bold">{c.total_quantity_sold} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="p-6 rounded-[18px] luxury-card space-y-4">
          <h3 className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest border-b border-[#E9E7E2] pb-3 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-[#DC2626]" />
            <span>Low Stock Alerts</span>
          </h3>
          {lowStock.length === 0 ? (
            <p className="text-xs text-[#9E9E9E] italic">All stock levels healthy ✓</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[#E9E7E2]/50 last:border-0">
                  <div>
                    <span className="text-[#1A1A1A] font-semibold block truncate max-w-[140px]">
                      {s.product_name}
                    </span>
                    <span className="text-[#6B6B6B] text-[10px] font-medium">{s.color_name}</span>
                  </div>
                  <span
                    className={`font-bold font-mono px-2.5 py-0.5 rounded-full text-[10px] border ${
                      s.available_stock === 0
                        ? 'bg-[#DC2626]/10 text-[#B91C1C] border-[#DC2626]/30'
                        : 'bg-[#B08D57]/10 text-[#6A4E3B] border-[#B08D57]/30'
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
