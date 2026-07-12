import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/db';
import {
  tblShipments,
  tblShipmentStatuses,
  tblShipmentPurchaseOrders,
  tblPurchaseOrders,
  tblPurchaseOrderStatuses,
  tblShipmentItems,
  tblProductVariants,
  tblProducts,
} from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, Truck, FileText, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import Currency, { formatBDT } from '@/components/shared/currency';
import StatusBadge from '@/components/shared/status-badge';
import ReceiveForm from './receive-form';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ShipmentDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const shipmentId = Number(resolvedParams.id);
  if (isNaN(shipmentId)) {
    return notFound();
  }

  // 1. Fetch Shipment details
  const shipments = await db
    .select({
      id: tblShipments.id,
      shipmentNumber: tblShipments.shipmentNumber,
      departureDate: tblShipments.departureDate,
      warehouseArrivalDate: tblShipments.warehouseArrivalDate,
      bangladeshArrivalDate: tblShipments.bangladeshArrivalDate,
      weightKg: tblShipments.weightKg,
      shippingRatePerKg: tblShipments.shippingRatePerKg,
      shippingCost: tblShipments.shippingCost,
      notes: tblShipments.notes,
      createdAt: tblShipments.createdAt,
      statusCode: tblShipmentStatuses.statusCode,
    })
    .from(tblShipments)
    .innerJoin(tblShipmentStatuses, eq(tblShipments.statusId, tblShipmentStatuses.id))
    .where(and(eq(tblShipments.id, shipmentId), isNull(tblShipments.deletedAt)))
    .limit(1);

  const shipment = shipments[0];
  if (!shipment) {
    return notFound();
  }

  // 2. Fetch associated POs joined with their status
  const associatedPos = await db
    .select({
      id: tblPurchaseOrders.id,
      purchaseOrderNumber: tblPurchaseOrders.purchaseOrderNumber,
      purchaseDate: tblPurchaseOrders.purchaseDate,
      totalAmountBdt: tblPurchaseOrders.totalAmountBdt,
      statusCode: tblPurchaseOrderStatuses.statusCode,
    })
    .from(tblShipmentPurchaseOrders)
    .innerJoin(tblPurchaseOrders, eq(tblShipmentPurchaseOrders.purchaseOrderId, tblPurchaseOrders.id))
    .innerJoin(tblPurchaseOrderStatuses, eq(tblPurchaseOrders.statusId, tblPurchaseOrderStatuses.id))
    .where(eq(tblShipmentPurchaseOrders.shipmentId, shipmentId));

  // 3. Fetch Shipment Items
  const shipmentItems = await db
    .select({
      id: tblShipmentItems.id,
      quantityShipped: tblShipmentItems.quantityShipped,
      quantityReceived: tblShipmentItems.quantityReceived,
      variantCode: tblProductVariants.variantCode,
      colorName: tblProductVariants.colorName,
      productName: tblProducts.productName,
    })
    .from(tblShipmentItems)
    .innerJoin(tblProductVariants, eq(tblShipmentItems.variantId, tblProductVariants.id))
    .innerJoin(tblProducts, eq(tblProductVariants.productId, tblProducts.id))
    .where(eq(tblShipmentItems.shipmentId, shipmentId));

  const totalShippedUnits = shipmentItems.reduce((acc, item) => acc + item.quantityShipped, 0);
  const totalReceivedUnits = shipmentItems.reduce((acc, item) => acc + item.quantityReceived, 0);

  // Filter out POs that have already been RECEIVED or CANCELLED
  const pendingPos = associatedPos.filter(
    (p) => p.statusCode !== 'received' && p.statusCode !== 'cancelled'
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title={`Shipment: ${shipment.shipmentNumber}`}
        description="Air cargo freight transport manifest details"
      >
        <Link
          href="/shipments"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>All Shipments</span>
        </Link>
      </PageHeader>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shipment Specs & POs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Shipment Parameters */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Truck className="h-4 w-4 text-rose-500" />
              <span>Shipment Parameters</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-xs">Shipment Status:</span>
                <StatusBadge status={shipment.statusCode} type="shipment" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Departure Date</span>
                <span className="text-zinc-200 font-medium">
                  {shipment.departureDate ? new Date(shipment.departureDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Arrival Receipt Date</span>
                <span className="text-zinc-200 font-medium">
                  {shipment.warehouseArrivalDate ? new Date(shipment.warehouseArrivalDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Consignment Weight</span>
                <span className="text-zinc-200 font-semibold">{parseFloat(shipment.weightKg).toFixed(1)} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Shipping Rate per KG</span>
                <span className="text-zinc-200 font-semibold">{parseFloat(shipment.shippingRatePerKg).toFixed(0)} BDT/kg</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-zinc-100">
                <span>Shipping Cost BDT:</span>
                <span className="font-mono">{formatBDT(shipment.shippingCost)}</span>
              </div>
            </div>
          </div>

          {/* Associated POs card */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <FileText className="h-4 w-4 text-rose-500" />
              <span>Associated POs</span>
            </h3>

            {associatedPos.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No purchase orders linked.</p>
            ) : (
              <div className="space-y-3">
                {associatedPos.map((po) => (
                  <Link
                    key={po.id}
                    href={`/purchase-orders/${po.id}`}
                    className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-855 flex items-center justify-between text-xs hover:border-rose-500/20 transition-all block group"
                  >
                    <div>
                      <span className="font-mono font-semibold text-rose-400 group-hover:text-rose-350 flex items-center gap-2">
                        {po.purchaseOrderNumber}
                        <StatusBadge status={po.statusCode} type="purchase" className="text-[9px] px-1 py-0" />
                      </span>
                      <span className="text-[9px] text-zinc-500 block mt-1">
                        PO Date: {new Date(po.purchaseDate).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-mono text-zinc-300 font-semibold">
                      {formatBDT(po.totalAmountBdt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {shipment.notes && (
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Cargo Notes</h3>
              <p className="text-zinc-300 leading-relaxed text-xs bg-zinc-900/50 p-3 rounded border border-zinc-850">
                {shipment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Shipment Items list and Receiving panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipment Items list */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-6">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <ClipboardList className="h-5 w-5 text-rose-500" />
              <span>Manifest Cargo Items ({shipmentItems.length})</span>
            </h3>

            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/20">
              <table className="min-w-full divide-y divide-zinc-800 text-sm">
                <thead className="bg-zinc-900/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Variant Code</th>
                    <th className="px-6 py-3.5 text-left">Product / Color</th>
                    <th className="px-6 py-3.5 text-right">Shipped Qty</th>
                    <th className="px-6 py-3.5 text-right">Received Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {shipmentItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-rose-400">
                        {item.variantCode}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-200">{item.productName}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{item.colorName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-zinc-200">
                        {item.quantityShipped} units
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">
                        <span className={item.quantityReceived >= item.quantityShipped && item.quantityShipped > 0 ? 'text-emerald-400' : 'text-zinc-500'}>
                          {item.quantityReceived} units
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-8 text-xs text-zinc-400 pr-2">
              <span>Total Shipped: <strong className="text-zinc-200">{totalShippedUnits} units</strong></span>
              <span>Total Received: <strong className="text-zinc-200">{totalReceivedUnits} units</strong></span>
            </div>
          </div>

          {/* Receipt Panel Form (Only if there are pending associated POs to receive) */}
          {pendingPos.length > 0 && (
            <ReceiveForm
              shipmentId={shipment.id}
              pos={pendingPos.map((p) => ({
                id: p.id,
                purchaseOrderNumber: p.purchaseOrderNumber,
                totalAmountBdt: p.totalAmountBdt,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
