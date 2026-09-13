import React from 'react';
import { poolConnection } from '@/lib/db/db';
import { formatBDT } from '@/components/shared/currency';
import {
  DollarSign,
  TrendingUp,
  Package,
  Receipt,
  Layers,
  ShoppingBag,
  AlertCircle,
  Crown,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. Total Investment (Sum of total_cost from active products)
  const [[investmentData]]: any = await poolConnection.query(`
    SELECT COALESCE(SUM(total_cost), 0) AS total_investment
    FROM tbl_products
    WHERE deleted_at IS NULL
  `);
  const totalInvestment = parseFloat(investmentData?.total_investment || 0);

  // 2. Total Sales (Product revenue only: subtotal - discount_total for delivered sales, EXCLUDING delivery charge)
  const [[salesData]]: any = await poolConnection.query(`
    SELECT
      COALESCE(SUM(o.subtotal - o.discount_total), 0) AS total_sales
    FROM tbl_orders o
    INNER JOIN tbl_order_statuses os ON os.id = o.order_status_id
    WHERE o.deleted_at IS NULL AND os.status_code = 'delivered'
  `);
  const totalSales = parseFloat(salesData?.total_sales || 0);

  // Total orders count across all active statuses
  const [[allOrdersData]]: any = await poolConnection.query(`
    SELECT
      COUNT(*) AS total_orders,
      SUM(CASE WHEN os.status_code = 'pending' THEN 1 ELSE 0 END) AS pending_orders
    FROM tbl_orders o
    INNER JOIN tbl_order_statuses os ON os.id = o.order_status_id
    WHERE o.deleted_at IS NULL
  `);
  const totalOrders = parseInt(allOrdersData?.total_orders || 0);
  const pendingOrders = parseInt(allOrdersData?.pending_orders || 0);

  // 3. Total Expenses (Sum of all business expenses)
  const [[expenseData]]: any = await poolConnection.query(`
    SELECT COALESCE(SUM(amount), 0) AS total_expenses
    FROM tbl_expenses
  `);
  const totalExpenses = parseFloat(expenseData?.total_expenses || 0);

  // 4. COGS — Sold products summation of Unit Cost
  const [[cogsData]]: any = await poolConnection.query(`
    SELECT COALESCE(SUM(oi.quantity * COALESCE(p.unit_cost, v.purchase_price_bdt, 0)), 0) AS cogs
    FROM tbl_order_items oi
    INNER JOIN tbl_product_variants v ON v.id = oi.variant_id
    INNER JOIN tbl_products p ON p.id = v.product_id
    INNER JOIN tbl_orders o ON o.id = oi.order_id
    INNER JOIN tbl_order_statuses os ON os.id = o.order_status_id
    WHERE o.deleted_at IS NULL AND os.status_code = 'delivered'
  `);
  const cogs = parseFloat(cogsData?.cogs || 0);

  // 5. Gross Profit = Total Sales - COGS
  const grossProfit = totalSales - cogs;

  // 6. Net Profit = Gross Profit - Total Expenses
  const netProfit = grossProfit - totalExpenses;

  // Additional Inventory Metrics
  const [[inventoryStats]]: any = await poolConnection.query(`
    SELECT
      COALESCE(SUM(current_stock), 0) AS total_units,
      COALESCE(SUM(reserved_stock), 0) AS total_reserved,
      COALESCE(SUM(inventory_value), 0) AS total_inventory_value
    FROM vw_inventory_value
  `);
  const totalUnits = parseInt(inventoryStats?.total_units || 0);
  const totalInventoryValue = parseFloat(inventoryStats?.total_inventory_value || 0);

  // Profit Margin percentage
  const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
  const netMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  // Recent Orders for Read-Only Overview
  const [recentOrders]: any = await poolConnection.query(`
    SELECT
      o.id,
      o.order_number,
      o.customer_name,
      o.order_date,
      o.grand_total,
      os.status_code AS order_status
    FROM tbl_orders o
    INNER JOIN tbl_order_statuses os ON os.id = o.order_status_id
    WHERE o.deleted_at IS NULL
    ORDER BY o.order_date DESC, o.id DESC
    LIMIT 5
  `);

  // Low Stock Items (current_stock <= 5)
  const [lowStockItems]: any = await poolConnection.query(`
    SELECT product_name, color_name, current_stock, unit_cost
    FROM vw_inventory_value
    WHERE current_stock <= 5
    ORDER BY current_stock ASC
    LIMIT 5
  `);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E9E7E2]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F3A2E] font-serif">Executive Dashboard</h1>
            <span className="px-3 py-0.5 rounded-full bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 text-[#1F3A2E] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-soft-1">
              <Crown className="h-3 w-3 text-[#B08D57]" />
              <span>Business KPI Summary</span>
            </span>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-1 font-medium leading-relaxed">
            Real-time top-level business KPIs pulled automatically from products, orders, inventory, and expenses.
          </p>
        </div>
      </div>

      {/* ─── 6 REQUIRED TOP-LEVEL BUSINESS KPIS ─── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#B08D57]" />
          <span>Top-Level Business Financials</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Total Investment */}
          <Card hoverEffect={true} className="p-6 relative overflow-hidden border-[#E9E7E2]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Total Investment</span>
              <div className="p-2 rounded-[10px] bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 text-[#1F3A2E]">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#1F3A2E] mt-3 tracking-tight">
              {formatBDT(totalInvestment)}
            </div>
            <p className="text-[10px] text-[#6B6B6B] mt-1">Sum of total cost across all product batches</p>
          </Card>

          {/* 2. Total Sales */}
          <Card hoverEffect={true} className="p-6 relative overflow-hidden border-[#E9E7E2]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Total Sales</span>
              <div className="p-2 rounded-[10px] bg-[#15803D]/10 border border-[#15803D]/20 text-[#15803D]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#15803D] mt-3 tracking-tight">
              {formatBDT(totalSales)}
            </div>
            <p className="text-[10px] text-[#6B6B6B] mt-1">Product revenue from delivered sales (excluding delivery)</p>
          </Card>

          {/* 3. Total Expenses */}
          <Card hoverEffect={true} className="p-6 relative overflow-hidden border-[#E9E7E2]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Total Expenses</span>
              <div className="p-2 rounded-[10px] bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626]">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#DC2626] mt-3 tracking-tight">
              {formatBDT(totalExpenses)}
            </div>
            <p className="text-[10px] text-[#6B6B6B] mt-1">Total operating and business expenses recorded</p>
          </Card>

          {/* 4. COGS */}
          <Card hoverEffect={true} className="p-6 relative overflow-hidden border-[#E9E7E2]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">COGS (Cost of Goods Sold)</span>
              <div className="p-2 rounded-[10px] bg-[#6A4E3B]/10 border border-[#6A4E3B]/20 text-[#6A4E3B]">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#6A4E3B] mt-3 tracking-tight">
              {formatBDT(cogs)}
            </div>
            <p className="text-[10px] text-[#6B6B6B] mt-1">Sold products summation of unit cost</p>
          </Card>

          {/* 5. Gross Profit */}
          <Card hoverEffect={true} className="p-6 relative overflow-hidden border-[#E9E7E2]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Gross Profit</span>
              <div className={`p-2 rounded-[10px] border ${grossProfit >= 0 ? 'bg-[#15803D]/10 border-[#15803D]/20 text-[#15803D]' : 'bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]'}`}>
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className={`text-2xl font-bold font-mono mt-3 tracking-tight ${grossProfit >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
              {formatBDT(grossProfit)}
            </div>
            <p className="text-[10px] text-[#6B6B6B] mt-1">Sales ({formatBDT(totalSales)}) - COGS ({formatBDT(cogs)})</p>
          </Card>

          {/* 6. Net Profit */}
          <Card hoverEffect={true} className="p-6 relative overflow-hidden bg-[#1F3A2E] text-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#B08D57] uppercase tracking-widest">Net Profit</span>
              <div className="p-2 rounded-[10px] bg-white/10 border border-white/20 text-[#B08D57]">
                <Crown className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-3 tracking-tight">
              {formatBDT(netProfit)}
            </div>
            <p className="text-[10px] text-[#B08D57] mt-1">Gross Profit ({formatBDT(grossProfit)}) - Expenses ({formatBDT(totalExpenses)})</p>
          </Card>
        </div>
      </div>

      {/* ─── Operational Metrics Summary Row ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-[16px] bg-white border border-[#E9E7E2] shadow-soft-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-[#1F3A2E]" />
          </div>
          <span className="text-xl font-bold font-mono text-[#1A1A1A] mt-2 block">{totalOrders}</span>
        </div>

        <div className="p-5 rounded-[16px] bg-white border border-[#E9E7E2] shadow-soft-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Pending Orders</span>
            <AlertCircle className="h-4 w-4 text-[#D97706]" />
          </div>
          <span className="text-xl font-bold font-mono text-[#D97706] mt-2 block">{pendingOrders}</span>
        </div>

        <div className="p-5 rounded-[16px] bg-white border border-[#E9E7E2] shadow-soft-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Physical Stock Units</span>
            <Package className="h-4 w-4 text-[#1F3A2E]" />
          </div>
          <span className="text-xl font-bold font-mono text-[#1A1A1A] mt-2 block">{totalUnits}</span>
        </div>

        <div className="p-5 rounded-[16px] bg-white border border-[#E9E7E2] shadow-soft-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Inventory Valuation</span>
            <DollarSign className="h-4 w-4 text-[#15803D]" />
          </div>
          <span className="text-xl font-bold font-mono text-[#15803D] mt-2 block">{formatBDT(totalInventoryValue)}</span>
        </div>
      </div>

      {/* ─── Bottom Summary Row: Recent Orders & Stock Alerts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Overview */}
        <Card hoverEffect={false} className="p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest border-b border-[#E9E7E2] pb-3 flex items-center justify-between">
            <span>Recent Sales Orders</span>
            <span className="text-[10px] text-[#6B6B6B] font-mono font-normal">Latest 5</span>
          </h3>
          {recentOrders.length === 0 ? (
            <p className="text-xs text-[#9E9E9E] italic">No sales orders recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between text-xs py-2 border-b border-[#E9E7E2]/50 last:border-0">
                  <div>
                    <span className="font-mono font-bold text-[#1F3A2E] block">{o.order_number}</span>
                    <span className="text-[#6B6B6B] text-[11px]">{o.customer_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#1A1A1A] block">{formatBDT(o.grand_total)}</span>
                    <span className="text-[10px] font-semibold capitalize text-[#B08D57]">{o.order_status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Low Stock Alerts */}
        <Card hoverEffect={false} className="p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest border-b border-[#E9E7E2] pb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-[#DC2626]" />
              <span>Low Stock Alerts (≤ 5 Units)</span>
            </span>
          </h3>
          {lowStockItems.length === 0 ? (
            <p className="text-xs text-[#15803D] font-medium py-2">✓ All catalog items have healthy stock levels.</p>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-[#E9E7E2]/50 last:border-0">
                  <div>
                    <span className="font-semibold text-[#1A1A1A] block">{s.product_name}</span>
                    <span className="text-[#6B6B6B] text-[10px]">{s.color_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-full text-[10px] bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">
                      {s.current_stock} left
                    </span>
                    <span className="text-[10px] text-[#6B6B6B] block font-mono mt-0.5">{formatBDT(s.unit_cost)} unit cost</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}