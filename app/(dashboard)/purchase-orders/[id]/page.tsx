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
import { formatBDT, formatRMB } from '@/components/shared/currency';
import StatusBadge from '@/components/shared/status-badge';
import POActions from './po-actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title={`Purchase Order: ${po.purchaseOrderNumber}`}
        description={`Created on ${new Date(po.createdAt).toLocaleDateString()}`}
      >
        <div className="flex items-center gap-3">
          <Link href="/purchase-orders">
            <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4 shrink-0" />}>
              All POs
            </Button>
          </Link>

          <POActions poId={po.id} statusCode={po.statusCode} />
        </div>
      </PageHeader>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Supplier & Agent profiles */}
        <div className="lg:col-span-1 space-y-6">
          {/* Supplier details card */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                <User className="h-4 w-4 text-[#B08D57]" />
                <span>China Supplier Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs pt-4">
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Supplier Name</span>
                <span className="text-[#1A1A1A] font-semibold">{po.supplierName} ({po.supplierCode})</span>
              </div>
              {po.supplierContact && (
                <div>
                  <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Contact Name</span>
                  <span className="text-[#6B6B6B] font-medium">{po.supplierContact}</span>
                </div>
              )}
              {po.supplierPhone && (
                <div>
                  <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Supplier Phone</span>
                  <span className="font-mono text-[#1F3A2E] font-semibold">{po.supplierPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* China Agent friend details */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                <Truck className="h-4 w-4 text-[#B08D57]" />
                <span>China Warehouse / Agent</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs pt-4">
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Agent Name</span>
                <span className="text-[#1A1A1A] font-semibold">{po.friendName} ({po.friendCode})</span>
              </div>
              {po.friendPhone && (
                <div>
                  <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Agent Phone</span>
                  <span className="font-mono text-[#1F3A2E] font-semibold">{po.friendPhone}</span>
                </div>
              )}
              {po.friendPaymentDate && (
                <div>
                  <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Agent Remittance Date</span>
                  <span className="text-[#6B6B6B] font-medium">{new Date(po.friendPaymentDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exchange Rates summary card */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                <Coins className="h-4 w-4 text-[#B08D57]" />
                <span>Exchange Rate Audit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Locked RMB exchange rate</span>
                <span className="font-mono text-[#1F3A2E] font-bold text-sm">
                  {rmbRate.toFixed(4)} BDT/¥
                </span>
                <span className="text-[10px] text-[#6B6B6B] block mt-0.5 italic">
                  (Rate locked during PO creation to preserve historical accuracy)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* PO notes block */}
          {po.notes && (
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#1F3A2E]">PO notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-[#1A1A1A] leading-relaxed text-xs bg-[#FAFAF8] p-3 rounded-[12px] border border-[#E9E7E2]">
                  {po.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: PO Items and Financials */}
        <div className="lg:col-span-2 space-y-6">
          {/* PO Items card */}
          <Card hoverEffect={false}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                  <ClipboardList className="h-4.5 w-4.5 text-[#B08D57]" />
                  <span>PO Items list</span>
                </CardTitle>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6B6B6B] font-medium">PO Status:</span>
                  <StatusBadge status={po.statusCode} type="purchase" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              {/* Items Table */}
              <div className="overflow-x-auto rounded-[12px] border border-[#E9E7E2] bg-white shadow-soft-1">
                <table className="min-w-full divide-y divide-[#E9E7E2] text-xs">
                  <thead className="bg-[#F7F6F3] text-[11px] font-bold text-[#1F3A2E] uppercase tracking-wider">
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
                  <tbody className="divide-y divide-[#E9E7E2]/60 text-[#1A1A1A]">
                    {poItems.map((item) => {
                      const priceRmb = Number(item.unitPurchasePriceRmb);
                      const priceBdt = Number(item.unitPurchasePriceBdt);
                      const qty = item.quantity;
                      const lineBdt = Number(item.lineTotalBdt);

                      return (
                        <tr key={item.id} className="hover:bg-[#F7F6F3]/70 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-[#1F3A2E] font-bold">
                            {item.variantCode}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-[#1A1A1A]">{item.productName}</div>
                            <div className="text-xs text-[#6B6B6B] mt-0.5">{item.colorName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-[#6B6B6B]">
                            {formatRMB(priceRmb)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                            {formatBDT(priceBdt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-[#1A1A1A] font-mono">
                            {qty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-bold font-mono">
                            <span className={item.receivedQuantity >= qty ? 'text-[#15803D]' : 'text-[#6B6B6B]'}>
                              {item.receivedQuantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-[#1F3A2E] font-mono">
                            {formatBDT(lineBdt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="flex flex-col items-end gap-2 text-xs text-[#6B6B6B] pr-2">
                <div className="flex gap-12 justify-between w-64 border-b border-[#E9E7E2] pb-1">
                  <span>Total RMB Value:</span>
                  <span className="font-semibold text-[#1A1A1A] font-mono">{formatRMB(totalRmb)}</span>
                </div>
                <div className="flex gap-12 justify-between w-64 border-b border-[#E9E7E2] pb-1">
                  <span>Items BDT Subtotal:</span>
                  <span className="font-semibold text-[#1A1A1A] font-mono">{formatBDT(po.totalAmountBdt)}</span>
                </div>
                <div className="flex gap-12 justify-between w-64 border-b border-[#E9E7E2] pb-1">
                  <span>China Delivery Cost:</span>
                  <span className="font-semibold text-[#1A1A1A] font-mono">
                    {formatBDT(deliveryBdt)} ({formatRMB(deliveryRmb)})
                  </span>
                </div>
                <div className="flex gap-12 justify-between w-64 text-sm font-bold text-white bg-[#1F3A2E] px-4 py-2.5 rounded-[12px] shadow-soft-1">
                  <span>PO Grand Total:</span>
                  <span className="font-mono">{formatBDT(poGrandTotalBdt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
