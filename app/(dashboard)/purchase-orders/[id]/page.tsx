import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/db';
import {
  tblPurchaseOrders,
  tblSuppliers,
  tblFriends,
  tblPurchaseOrderStatuses,
  tblPurchaseOrderItems,
  tblProductVariants,
  tblProducts,
} from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, User, Truck, ClipboardList, Coins } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import Currency, { formatBDT, formatRMB } from '@/components/shared/currency';
import StatusBadge from '@/components/shared/status-badge';
import POActions from './po-actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const poId = Number(resolvedParams.id);
  if (isNaN(poId)) {
    return notFound();
  }

  // 1. Fetch PO details joined with lookup states
  const purchaseOrders = await db
    .select({
      id: tblPurchaseOrders.id,
      purchaseOrderNumber: tblPurchaseOrders.purchaseOrderNumber,
      purchaseDate: tblPurchaseOrders.purchaseDate,
      friendPaymentDate: tblPurchaseOrders.friendPaymentDate,
      historicalRmbRate: tblPurchaseOrders.historicalRmbRate,
      chinaLocalDeliveryCost: tblPurchaseOrders.chinaLocalDeliveryCost,
      totalAmountBdt: tblPurchaseOrders.totalAmountBdt,
      notes: tblPurchaseOrders.notes,
      createdAt: tblPurchaseOrders.createdAt,
      supplierName: tblSuppliers.supplierName,
      supplierCode: tblSuppliers.supplierCode,
      supplierContact: tblSuppliers.contactName,
      supplierPhone: tblSuppliers.phone,
      friendName: tblFriends.friendName,
      friendCode: tblFriends.friendCode,
      friendPhone: tblFriends.phone,
      statusCode: tblPurchaseOrderStatuses.statusCode,
    })
    .from(tblPurchaseOrders)
    .innerJoin(tblSuppliers, eq(tblPurchaseOrders.supplierId, tblSuppliers.id))
    .innerJoin(tblFriends, eq(tblPurchaseOrders.friendId, tblFriends.id))
    .innerJoin(tblPurchaseOrderStatuses, eq(tblPurchaseOrders.statusId, tblPurchaseOrderStatuses.id))
    .where(and(eq(tblPurchaseOrders.id, poId), isNull(tblPurchaseOrders.deletedAt)))
    .limit(1);

  const po = purchaseOrders[0];
  if (!po) {
    return notFound();
  }

  // 2. Fetch PO items
  const poItems = await db
    .select({
      id: tblPurchaseOrderItems.id,
      quantity: tblPurchaseOrderItems.quantity,
      unitPurchasePriceRmb: tblPurchaseOrderItems.unitPurchasePriceRmb,
      unitPurchasePriceBdt: tblPurchaseOrderItems.unitPurchasePriceBdt,
      receivedQuantity: tblPurchaseOrderItems.receivedQuantity,
      unitLandedCostBdt: tblPurchaseOrderItems.unitLandedCostBdt,
      lineTotalBdt: tblPurchaseOrderItems.lineTotalBdt,
      notes: tblPurchaseOrderItems.notes,
      variantCode: tblProductVariants.variantCode,
      colorName: tblProductVariants.colorName,
      productName: tblProducts.productName,
    })
    .from(tblPurchaseOrderItems)
    .innerJoin(tblProductVariants, eq(tblPurchaseOrderItems.variantId, tblProductVariants.id))
    .innerJoin(tblProducts, eq(tblProductVariants.productId, tblProducts.id))
    .where(eq(tblPurchaseOrderItems.purchaseOrderId, poId));

  const totalRmb = poItems.reduce((acc, item) => acc + item.quantity * parseFloat(item.unitPurchasePriceRmb), 0);
  const rmbRate = parseFloat(po.historicalRmbRate);
  const deliveryRmb = parseFloat(po.chinaLocalDeliveryCost);
  const deliveryBdt = deliveryRmb * rmbRate;
  const poGrandTotalBdt = parseFloat(po.totalAmountBdt) + deliveryBdt;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title={`Purchase Order: ${po.purchaseOrderNumber}`}
        description={`Created on ${new Date(po.createdAt).toLocaleDateString()}`}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/purchase-orders"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All POs</span>
          </Link>

          <POActions poId={po.id} statusCode={po.statusCode} />
        </div>
      </PageHeader>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Supplier & Agent profiles */}
        <div className="lg:col-span-1 space-y-6">
          {/* Supplier details card */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <User className="h-4 w-4 text-rose-500" />
              <span>China Supplier Profile</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Supplier Name</span>
                <span className="text-zinc-200 font-medium">{po.supplierName} ({po.supplierCode})</span>
              </div>
              {po.supplierContact && (
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Contact Name</span>
                  <span className="text-zinc-300">{po.supplierContact}</span>
                </div>
              )}
              {po.supplierPhone && (
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Supplier Phone</span>
                  <span className="font-mono text-zinc-300">{po.supplierPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* China Agent friend details */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Truck className="h-4 w-4 text-rose-500" />
              <span>China Warehouse / Agent</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Agent Name</span>
                <span className="text-zinc-200 font-medium">{po.friendName} ({po.friendCode})</span>
              </div>
              {po.friendPhone && (
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Agent Phone</span>
                  <span className="font-mono text-zinc-300">{po.friendPhone}</span>
                </div>
              )}
              {po.friendPaymentDate && (
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Agent Remittance Date</span>
                  <span className="text-zinc-300">{new Date(po.friendPaymentDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Exchange Rates summary card */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Coins className="h-4 w-4 text-rose-500" />
              <span>Exchange Rate Audit</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Locked RMB exchange rate</span>
                <span className="font-mono text-zinc-100 font-semibold text-sm">
                  {rmbRate.toFixed(4)} BDT/¥
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5 italic">
                  (Rate locked during PO creation to preserve historical accuracy)
                </span>
              </div>
            </div>
          </div>

          {/* PO notes block */}
          {po.notes && (
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">PO notes</h3>
              <p className="text-zinc-300 leading-relaxed text-xs bg-zinc-900/50 p-3 rounded border border-zinc-850">
                {po.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: PO Items and Financials */}
        <div className="lg:col-span-2 space-y-6">
          {/* PO Items card */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-rose-500" />
                <span>PO Items list</span>
              </h3>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400">PO Status:</span>
                <StatusBadge status={po.statusCode} type="purchase" />
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/20">
              <table className="min-w-full divide-y divide-zinc-800 text-sm">
                <thead className="bg-zinc-900/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Variant Code</th>
                    <th className="px-6 py-3.5 text-left">Product / Color</th>
                    <th className="px-6 py-3.5 text-right">RMB Price</th>
                    <th className="px-6 py-3.5 text-right">BDT Price</th>
                    <th className="px-6 py-3.5 text-right">Qty Ordered</th>
                    <th className="px-6 py-3.5 text-right">Qty Received</th>
                    <th className="px-6 py-3.5 text-right">Line Total (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {poItems.map((item) => {
                    const priceRmb = Number(item.unitPurchasePriceRmb);
                    const priceBdt = Number(item.unitPurchasePriceBdt);
                    const qty = item.quantity;
                    const lineBdt = Number(item.lineTotalBdt);

                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-rose-400">
                          {item.variantCode}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-200">{item.productName}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{item.colorName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-zinc-400">
                          {formatRMB(priceRmb)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                          {formatBDT(priceBdt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-zinc-200">
                          {qty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">
                          <span className={item.receivedQuantity >= qty ? 'text-emerald-400' : 'text-zinc-500'}>
                            {item.receivedQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-zinc-100 font-mono">
                          {formatBDT(lineBdt)}
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
                <span>Total RMB Value:</span>
                <span className="font-semibold text-zinc-300 font-mono">{formatRMB(totalRmb)}</span>
              </div>
              <div className="flex gap-12 justify-between w-64 border-b border-zinc-805 pb-1">
                <span>Items BDT Subtotal:</span>
                <span className="font-semibold text-zinc-300 font-mono">{formatBDT(po.totalAmountBdt)}</span>
              </div>
              <div className="flex gap-12 justify-between w-64 border-b border-zinc-805 pb-1">
                <span>China Delivery Cost:</span>
                <span className="font-semibold text-zinc-350 font-mono">
                  {formatBDT(deliveryBdt)} ({formatRMB(deliveryRmb)})
                </span>
              </div>
              <div className="flex gap-12 justify-between w-64 text-base font-bold text-zinc-100 bg-zinc-950 px-4 py-2.5 rounded border border-zinc-800">
                <span className="text-rose-400">PO Grand Total:</span>
                <span className="font-mono">{formatBDT(poGrandTotalBdt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
