import React from 'react';
import { notFound } from 'next/navigation';
import { poolConnection } from '@/lib/db/db';
import PageHeader from '@/components/shared/page-header';
import Currency, { formatBDT } from '@/components/shared/currency';
import StatusBadge from '@/components/shared/status-badge';
import Link from 'next/link';
import { ArrowLeft, Clock, User, ClipboardList, MapPin } from 'lucide-react';
import OrderActions from './order-actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const orderId = Number(resolvedParams.id);
  if (isNaN(orderId)) {
    return notFound();
  }

  // 1. Fetch Order details
  const [orders]: any = await poolConnection.query(`
    SELECT
      o.id,
      o.order_number AS orderNumber,
      o.order_date AS orderDate,
      o.order_type AS orderType,
      o.subtotal,
      o.discount_total AS discountTotal,
      o.shipping_amount AS shippingAmount,
      o.grand_total AS grandTotal,
      o.paid_amount AS paidAmount,
      o.outstanding_amount AS outstandingAmount,
      o.currency,
      o.notes,
      o.created_at AS createdAt,
      c.customer_name AS customerName,
      c.customer_code AS customerCode,
      c.phone,
      c.facebook_name AS facebookName,
      c.address,
      c.district,
      c.payment_preference AS paymentPreference,
      os.status_code AS orderStatus,
      ps.status_code AS paymentStatus,
      ds.status_code AS deliveryStatus,
      rs.status_code AS returnStatus
    FROM tbl_orders o
    INNER JOIN tbl_customers c ON o.customer_id = c.id
    INNER JOIN tbl_order_statuses os ON o.order_status_id = os.id
    INNER JOIN tbl_payment_statuses ps ON o.payment_status_id = ps.id
    INNER JOIN tbl_delivery_statuses ds ON o.delivery_status_id = ds.id
    LEFT JOIN tbl_return_statuses rs ON o.return_status_id = rs.id
    WHERE o.id = ? AND o.deleted_at IS NULL
  `, [orderId]);

  const order = orders[0];
  if (!order) {
    return notFound();
  }

  // 2. Fetch Order items
  const [orderItems]: any = await poolConnection.query(`
    SELECT
      oi.id,
      oi.quantity,
      oi.selling_price AS sellingPrice,
      oi.discount_amount AS discountAmount,
      v.variant_code AS variantCode,
      v.color_name AS colorName,
      p.product_name AS productName
    FROM tbl_order_items oi
    INNER JOIN tbl_product_variants v ON oi.variant_id = v.id
    INNER JOIN tbl_products p ON v.product_id = p.id
    WHERE oi.order_id = ?
  `, [orderId]);

  // 3. Fetch status history
  const [statusHistory]: any = await poolConnection.query(`
    SELECT
      h.id,
      h.changed_at AS changedAt,
      h.changed_by AS changedBy,
      h.notes,
      os.status_name AS statusName
    FROM tbl_order_status_history h
    INNER JOIN tbl_order_statuses os ON h.status_id = os.id
    WHERE h.order_id = ?
    ORDER BY h.changed_at DESC
  `, [orderId]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader title={`Order: ${order.orderNumber}`} description={`Created on ${new Date(order.createdAt).toLocaleDateString()}`}>
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-500/20 bg-[#0F1117] hover:bg-amber-500/5 text-zinc-400 hover:text-amber-200 transition-all text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Orders</span>
          </Link>
          
          <OrderActions
            orderId={order.id}
            orderStatus={order.orderStatus}
            returnStatus={order.returnStatus}
          />
        </div>
      </PageHeader>

      {/* Status Row */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Order</span>
          <StatusBadge status={order.orderStatus} />
        </div>
        <div className="w-px h-4 bg-amber-500/20" />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Payment</span>
          <StatusBadge status={order.paymentStatus} />
        </div>
        <div className="w-px h-4 bg-amber-500/20" />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Delivery</span>
          <StatusBadge status={order.deliveryStatus} />
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Profile & Statuses summary */}
        <div className="lg:col-span-1 space-y-5">
          {/* Customer Summary Card */}
          <div className="p-6 rounded-2xl luxury-card space-y-5">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2 border-b border-amber-500/15 pb-3">
              <User className="h-4 w-4 text-amber-400" />
              <span>Customer Profile</span>
            </h3>

            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">Customer Name</span>
                <span className="text-zinc-100 font-semibold">{order.customerName}</span>
                <span className="text-zinc-500 font-mono text-xs ml-1.5">({order.customerCode})</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">Phone</span>
                <span className="font-mono text-amber-300">{order.phone || '—'}</span>
              </div>
              {order.facebookName && (
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">Facebook Username</span>
                  <span className="text-rose-400 font-semibold">{order.facebookName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="p-6 rounded-2xl luxury-card space-y-5">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2 border-b border-amber-500/15 pb-3">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>Shipping Details</span>
            </h3>

            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">District</span>
                <span className="text-zinc-100 font-semibold">{order.district || 'Not Specified'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">Full Address</span>
                <p className="text-zinc-300 mt-1 leading-relaxed text-xs">{order.address || 'No Address Listed'}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">Payment Preference</span>
                <span className="text-amber-300 font-semibold text-xs bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                  {order.paymentPreference || 'Cash on Delivery'}
                </span>
              </div>
            </div>
          </div>

          {/* Order notes block */}
          {order.notes && (
            <div className="p-6 rounded-2xl luxury-card space-y-3">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest block">Order Notes</h3>
              <p className="text-zinc-300 leading-relaxed text-xs bg-[#0A0C10] p-3 rounded-xl border border-amber-500/10">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Order Items, Financials, and Status History logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items card */}
          <div className="p-6 rounded-2xl luxury-card space-y-5">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2 border-b border-amber-500/15 pb-3">
              <ClipboardList className="h-4.5 w-4.5 text-amber-400" />
              <span>Order Items</span>
            </h3>

            {/* Items Table */}
            <div className="overflow-x-auto rounded-xl border border-amber-500/15 bg-[#0A0C10]/80">
              <table className="min-w-full divide-y divide-amber-500/10 text-sm">
                <thead className="bg-[#141720] text-[11px] font-bold text-amber-300/80 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 text-left">Variant Code</th>
                    <th className="px-5 py-3.5 text-left">Product / Color</th>
                    <th className="px-5 py-3.5 text-right">Price</th>
                    <th className="px-5 py-3.5 text-right">Qty</th>
                    <th className="px-5 py-3.5 text-right">Discount</th>
                    <th className="px-5 py-3.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {orderItems.map((item: any) => {
                    const price = Number(item.sellingPrice);
                    const qty = item.quantity;
                    const discount = Number(item.discountAmount);
                    const total = (price - discount) * qty;

                    return (
                      <tr key={item.id} className="hover:bg-amber-500/5 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-amber-400 font-bold">
                          {item.variantCode}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-zinc-100">{item.productName}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{item.colorName}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-zinc-300">
                          {formatBDT(price)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-zinc-100">
                          {qty}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-rose-400">
                          {discount > 0 ? `-${formatBDT(discount)}` : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-amber-300 font-mono">
                          {formatBDT(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col items-end gap-2 text-sm text-zinc-400 pr-2">
              <div className="flex gap-12 justify-between w-64 border-b border-zinc-800/50 pb-2">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-300 font-mono">{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex gap-12 justify-between w-64 border-b border-zinc-800/50 pb-2">
                <span>Total Discount:</span>
                <span className="font-semibold text-rose-400 font-mono">-{formatBDT(order.discountTotal)}</span>
              </div>
              <div className="flex gap-12 justify-between w-64 border-b border-zinc-800/50 pb-2">
                <span>Shipping:</span>
                <span className="font-semibold text-zinc-300 font-mono">+{formatBDT(order.shippingAmount)}</span>
              </div>
              <div className="flex gap-12 justify-between w-64 text-base font-extrabold bg-gradient-to-r from-amber-500/10 to-rose-500/10 px-4 py-3 rounded-xl border border-amber-500/25">
                <span className="text-amber-300">Grand Total:</span>
                <span className="font-mono text-amber-200">{formatBDT(order.grandTotal)}</span>
              </div>
              {Number(order.outstandingAmount) > 0 && (
                <div className="flex gap-12 justify-between w-64 text-xs bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/25">
                  <span className="text-rose-400 font-semibold">Outstanding:</span>
                  <span className="font-mono text-rose-400 font-bold">{formatBDT(order.outstandingAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status logs audit history */}
          <div className="p-6 rounded-2xl luxury-card space-y-5">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2 border-b border-amber-500/15 pb-3">
              <Clock className="h-4.5 w-4.5 text-amber-400" />
              <span>Status History Log</span>
            </h3>

            {statusHistory.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No status updates logged.</p>
            ) : (
              <div className="space-y-3">
                {statusHistory.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl bg-[#0A0C10] border border-amber-500/10 flex items-start justify-between gap-4 text-xs hover:border-amber-500/20 transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-amber-300 capitalize">
                        {log.statusName}
                      </span>
                      <p className="text-zinc-500 leading-relaxed">{log.notes || 'No description provided.'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-amber-400/80 block font-semibold">
                        by {log.changedBy}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono block mt-1">
                        {new Date(log.changedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
