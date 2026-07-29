import React from 'react';
import { notFound } from 'next/navigation';
import { poolConnection } from '@/lib/db/db';
import PageHeader from '@/components/shared/page-header';
import { formatBDT } from '@/components/shared/currency';
import StatusBadge from '@/components/shared/status-badge';
import Link from 'next/link';
import { ArrowLeft, Clock, User, ClipboardList, MapPin } from 'lucide-react';
import OrderActions from './order-actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader title={`Order: ${order.orderNumber}`} description={`Created on ${new Date(order.createdAt).toLocaleDateString()}`}>
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4 shrink-0" />}>
              All Orders
            </Button>
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
          <span className="text-[#6B6B6B] font-bold uppercase tracking-wider text-[10px]">Order</span>
          <StatusBadge status={order.orderStatus} />
        </div>
        <div className="w-px h-4 bg-[#E9E7E2]" />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#6B6B6B] font-bold uppercase tracking-wider text-[10px]">Payment</span>
          <StatusBadge status={order.paymentStatus} />
        </div>
        <div className="w-px h-4 bg-[#E9E7E2]" />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#6B6B6B] font-bold uppercase tracking-wider text-[10px]">Delivery</span>
          <StatusBadge status={order.deliveryStatus} />
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Profile & Statuses summary */}
        <div className="lg:col-span-1 space-y-5">
          {/* Customer Summary Card */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                <User className="h-4 w-4 text-[#B08D57]" />
                <span>Customer Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs pt-4">
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block mb-0.5">Customer Name</span>
                <span className="text-[#1A1A1A] font-semibold">{order.customerName}</span>
                <span className="text-[#6B6B6B] font-mono text-xs ml-1.5">({order.customerCode})</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block mb-0.5">Phone</span>
                <span className="font-mono text-[#1F3A2E] font-semibold">{order.phone || '—'}</span>
              </div>
              {order.facebookName && (
                <div>
                  <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block mb-0.5">Facebook Username</span>
                  <span className="text-[#B08D57] font-semibold">{order.facebookName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address Card */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                <MapPin className="h-4 w-4 text-[#B08D57]" />
                <span>Shipping Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs pt-4">
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block mb-0.5">District</span>
                <span className="text-[#1A1A1A] font-semibold">{order.district || 'Not Specified'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block mb-0.5">Full Address</span>
                <p className="text-[#1A1A1A] mt-1 leading-relaxed text-xs">{order.address || 'No Address Listed'}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block mb-0.5">Payment Preference</span>
                <span className="text-[#1F3A2E] font-semibold text-xs bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 px-2.5 py-0.5 rounded-full inline-block mt-0.5 shadow-soft-1">
                  {order.paymentPreference || 'Cash on Delivery'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order notes block */}
          {order.notes && (
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#1F3A2E]">Order Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-[#1A1A1A] leading-relaxed text-xs bg-[#FAFAF8] p-3 rounded-[12px] border border-[#E9E7E2]">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Order Items, Financials, and Status History logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items card */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                <ClipboardList className="h-4.5 w-4.5 text-[#B08D57]" />
                <span>Order Items</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* Items Table */}
              <div className="overflow-x-auto rounded-[12px] border border-[#E9E7E2] bg-white shadow-soft-1">
                <table className="min-w-full divide-y divide-[#E9E7E2] text-xs">
                  <thead className="bg-[#F7F6F3] text-[11px] font-bold text-[#1F3A2E] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 text-left">Variant Code</th>
                      <th className="px-5 py-3.5 text-left">Product / Color</th>
                      <th className="px-5 py-3.5 text-right">Price</th>
                      <th className="px-5 py-3.5 text-right">Qty</th>
                      <th className="px-5 py-3.5 text-right">Discount</th>
                      <th className="px-5 py-3.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E7E2]/60 text-[#1A1A1A]">
                    {orderItems.map((item: any) => {
                      const price = Number(item.sellingPrice);
                      const qty = item.quantity;
                      const discount = Number(item.discountAmount);
                      const total = (price - discount) * qty;

                      return (
                        <tr key={item.id} className="hover:bg-[#F7F6F3]/70 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-[#1F3A2E] font-bold">
                            {item.variantCode}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[#1A1A1A]">{item.productName}</div>
                            <div className="text-xs text-[#6B6B6B] mt-0.5">{item.colorName}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-[#6B6B6B]">
                            {formatBDT(price)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right font-bold font-mono text-[#1A1A1A]">
                            {qty}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-[#DC2626]">
                            {discount > 0 ? `-${formatBDT(discount)}` : '—'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-[#1F3A2E] font-mono">
                            {formatBDT(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="flex flex-col items-end gap-2 text-xs text-[#6B6B6B] pr-2">
                <div className="flex gap-12 justify-between w-64 border-b border-[#E9E7E2] pb-2">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#1A1A1A] font-mono">{formatBDT(order.subtotal)}</span>
                </div>
                <div className="flex gap-12 justify-between w-64 border-b border-[#E9E7E2] pb-2">
                  <span>Total Discount:</span>
                  <span className="font-semibold text-[#DC2626] font-mono">-{formatBDT(order.discountTotal)}</span>
                </div>
                <div className="flex gap-12 justify-between w-64 border-b border-[#E9E7E2] pb-2">
                  <span>Shipping:</span>
                  <span className="font-semibold text-[#1A1A1A] font-mono">+{formatBDT(order.shippingAmount)}</span>
                </div>
                <div className="flex gap-12 justify-between w-64 text-sm font-bold bg-[#1F3A2E] text-white px-4 py-3 rounded-[12px] shadow-soft-1">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatBDT(order.grandTotal)}</span>
                </div>
                {Number(order.outstandingAmount) > 0 && (
                  <div className="flex gap-12 justify-between w-64 text-xs bg-[#DC2626]/10 border border-[#DC2626]/20 px-4 py-2 rounded-[12px]">
                    <span className="text-[#DC2626] font-semibold">Outstanding:</span>
                    <span className="font-mono text-[#DC2626] font-bold">{formatBDT(order.outstandingAmount)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status logs audit history */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                <Clock className="h-4.5 w-4.5 text-[#B08D57]" />
                <span>Status History Log</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {statusHistory.length === 0 ? (
                <p className="text-xs text-[#9E9E9E] italic">No status updates logged.</p>
              ) : (
                <div className="space-y-3">
                  {statusHistory.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-[12px] bg-[#FAFAF8] border border-[#E9E7E2] flex items-start justify-between gap-4 text-xs hover:border-[#B08D57]/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-[#1F3A2E] capitalize">
                          {log.statusName}
                        </span>
                        <p className="text-[#6B6B6B] leading-relaxed">{log.notes || 'No description provided.'}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-[#B08D57] block font-semibold">
                          by {log.changedBy}
                        </span>
                        <span className="text-[9px] text-[#9E9E9E] font-mono block mt-1">
                          {new Date(log.changedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
