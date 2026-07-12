import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/db';
import {
  tblOrders,
  tblCustomers,
  tblOrderStatuses,
  tblPaymentStatuses,
  tblDeliveryStatuses,
  tblRefundStatuses,
  tblReturnStatuses,
  tblOrderItems,
  tblProductVariants,
  tblProducts,
  tblOrderStatusHistory,
} from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, User, MapPin, ClipboardList, Clock } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import Currency, { formatBDT } from '@/components/shared/currency';
import StatusBadge from '@/components/shared/status-badge';
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
  const orders = await db
    .select({
      id: tblOrders.id,
      orderNumber: tblOrders.orderNumber,
      orderDate: tblOrders.orderDate,
      orderType: tblOrders.orderType,
      subtotal: tblOrders.subtotal,
      discountTotal: tblOrders.discountTotal,
      shippingAmount: tblOrders.shippingAmount,
      grandTotal: tblOrders.grandTotal,
      paidAmount: tblOrders.paidAmount,
      outstandingAmount: tblOrders.outstandingAmount,
      currency: tblOrders.currency,
      notes: tblOrders.notes,
      createdAt: tblOrders.createdAt,
      customerName: tblCustomers.customerName,
      customerCode: tblCustomers.customerCode,
      phone: tblCustomers.phone,
      facebookName: tblCustomers.facebookName,
      address: tblCustomers.address,
      district: tblCustomers.district,
      paymentPreference: tblCustomers.paymentPreference,
      orderStatus: tblOrderStatuses.statusCode,
      paymentStatus: tblPaymentStatuses.statusCode,
      deliveryStatus: tblDeliveryStatuses.statusCode,
      refundStatus: tblRefundStatuses.statusCode,
      returnStatus: tblReturnStatuses.statusCode,
    })
    .from(tblOrders)
    .innerJoin(tblCustomers, eq(tblOrders.customerId, tblCustomers.id))
    .innerJoin(tblOrderStatuses, eq(tblOrders.orderStatusId, tblOrderStatuses.id))
    .innerJoin(tblPaymentStatuses, eq(tblOrders.paymentStatusId, tblPaymentStatuses.id))
    .innerJoin(tblDeliveryStatuses, eq(tblOrders.deliveryStatusId, tblDeliveryStatuses.id))
    .innerJoin(tblRefundStatuses, eq(tblOrders.refundStatusId, tblRefundStatuses.id))
    .innerJoin(tblReturnStatuses, eq(tblOrders.returnStatusId, tblReturnStatuses.id))
    .where(and(eq(tblOrders.id, orderId), isNull(tblOrders.deletedAt)))
    .limit(1);

  const order = orders[0];
  if (!order) {
    return notFound();
  }

  // 2. Fetch Order items
  const orderItems = await db
    .select({
      id: tblOrderItems.id,
      quantity: tblOrderItems.quantity,
      sellingPrice: tblOrderItems.sellingPrice,
      discountAmount: tblOrderItems.discountAmount,
      variantCode: tblProductVariants.variantCode,
      colorName: tblProductVariants.colorName,
      productName: tblProducts.productName,
    })
    .from(tblOrderItems)
    .innerJoin(tblProductVariants, eq(tblOrderItems.variantId, tblProductVariants.id))
    .innerJoin(tblProducts, eq(tblProductVariants.productId, tblProducts.id))
    .where(eq(tblOrderItems.orderId, orderId));

  // 3. Fetch status history
  const statusHistory = await db
    .select({
      id: tblOrderStatusHistory.id,
      changedAt: tblOrderStatusHistory.changedAt,
      changedBy: tblOrderStatusHistory.changedBy,
      notes: tblOrderStatusHistory.notes,
      statusName: tblOrderStatuses.statusName,
    })
    .from(tblOrderStatusHistory)
    .innerJoin(tblOrderStatuses, eq(tblOrderStatusHistory.statusId, tblOrderStatuses.id))
    .where(eq(tblOrderStatusHistory.orderId, orderId))
    .orderBy(desc(tblOrderStatusHistory.changedAt));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader title={`Order details: ${order.orderNumber}`} description={`Created on ${new Date(order.createdAt).toLocaleDateString()}`}>
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-semibold cursor-pointer"
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

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Profile & Statuses summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Summary Card */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <User className="h-4 w-4 text-rose-500" />
              <span>Customer Profile</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Customer Name</span>
                <span className="text-zinc-200 font-medium">{order.customerName} ({order.customerCode})</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Phone</span>
                <span className="font-mono text-zinc-200">{order.phone || '—'}</span>
              </div>
              {order.facebookName && (
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Facebook Username</span>
                  <span className="text-rose-400">{order.facebookName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <MapPin className="h-4 w-4 text-rose-500" />
              <span>Shipping details</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">District</span>
                <span className="text-zinc-200 font-medium">{order.district || 'Not Specified'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Full Shipping Address</span>
                <p className="text-zinc-300 mt-1 leading-relaxed text-xs">{order.address || 'No Address Listed'}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Payment Channel Preference</span>
                <span className="text-zinc-200 font-medium text-xs bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                  {order.paymentPreference || 'Cash on Delivery'}
                </span>
              </div>
            </div>
          </div>

          {/* Order notes block */}
          {order.notes && (
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Order notes</h3>
              <p className="text-zinc-300 leading-relaxed text-xs bg-zinc-900/50 p-3 rounded border border-zinc-850">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Order Items, Financials, and Status History logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items card */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-6">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <ClipboardList className="h-5 w-5 text-rose-500" />
              <span>Order Items</span>
            </h3>

            {/* Items Table */}
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/20">
              <table className="min-w-full divide-y divide-zinc-800 text-sm">
                <thead className="bg-zinc-900/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Variant Code</th>
                    <th className="px-6 py-3.5 text-left">Product / Color</th>
                    <th className="px-6 py-3.5 text-right">Price</th>
                    <th className="px-6 py-3.5 text-right">Qty</th>
                    <th className="px-6 py-3.5 text-right">Discount</th>
                    <th className="px-6 py-3.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {orderItems.map((item) => {
                    const price = Number(item.sellingPrice);
                    const qty = item.quantity;
                    const discount = Number(item.discountAmount);
                    const total = (price - discount) * qty;

                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-rose-400">
                          {item.variantCode}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-200">{item.productName}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{item.colorName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                          {formatBDT(price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-zinc-200">
                          {qty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-rose-400">
                          {discount > 0 ? `-${formatBDT(discount)}` : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-zinc-100 font-mono">
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
              <div className="flex gap-12 justify-between w-64 border-b border-zinc-805 pb-1">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-300 font-mono">{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex gap-12 justify-between w-64 border-b border-zinc-805 pb-1">
                <span>Total Discount:</span>
                <span className="font-semibold text-rose-400 font-mono">-{formatBDT(order.discountTotal)}</span>
              </div>
              <div className="flex gap-12 justify-between w-64 border-b border-zinc-805 pb-1">
                <span>Shipping Amount:</span>
                <span className="font-semibold text-zinc-300 font-mono">+{formatBDT(order.shippingAmount)}</span>
              </div>
              <div className="flex gap-12 justify-between w-64 text-base font-bold text-zinc-100 bg-zinc-950 px-4 py-2.5 rounded border border-zinc-800">
                <span className="text-rose-400">Grand Total:</span>
                <span className="font-mono">{formatBDT(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Status logs audit history */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-6">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Clock className="h-5 w-5 text-rose-500" />
              <span>Status History Log</span>
            </h3>

            {statusHistory.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No status updates logged.</p>
            ) : (
              <div className="space-y-4">
                {statusHistory.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-850 flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <span className="font-semibold text-zinc-300 capitalize">
                        {log.statusName}
                      </span>
                      <p className="text-zinc-500 leading-relaxed">{log.notes || 'No description provided.'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-zinc-500 block">
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
