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
import { formatBDT } from '@/components/shared/currency';
import StatusBadge from '@/components/shared/status-badge';
import ReceiveForm from './receive-form';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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

  const pendingPos = associatedPos.filter(
    (p) => p.statusCode !== 'received' && p.statusCode !== 'cancelled'
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title={`Shipment: ${shipment.shipmentNumber}`}
        description="Air cargo freight transport manifest details"
      >
        <Link href="/shipments">
          <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4 shrink-0" />}>
            All Shipments
          </Button>
        </Link>
      </PageHeader>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shipment Specs & POs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Shipment Parameters */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                <Truck className="h-4 w-4 text-[#B08D57]" />
                <span>Shipment Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs pt-4">
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Shipment Status:</span>
                <StatusBadge status={shipment.statusCode} type="shipment" />
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Departure Date</span>
                <span className="text-[#1A1A1A] font-medium">
                  {shipment.departureDate ? new Date(shipment.departureDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Arrival Receipt Date</span>
                <span className="text-[#1A1A1A] font-medium">
                  {shipment.warehouseArrivalDate ? new Date(shipment.warehouseArrivalDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Consignment Weight</span>
                <span className="text-[#1A1A1A] font-bold font-mono">{parseFloat(shipment.weightKg).toFixed(1)} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Shipping Rate per KG</span>
                <span className="text-[#1A1A1A] font-bold font-mono">{parseFloat(shipment.shippingRatePerKg).toFixed(0)} BDT/kg</span>
              </div>
              <div className="pt-3 border-t border-[#E9E7E2] flex justify-between font-bold text-[#1F3A2E] text-sm">
                <span>Shipping Cost BDT:</span>
                <span className="font-mono">{formatBDT(shipment.shippingCost)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Associated POs card */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                <FileText className="h-4 w-4 text-[#B08D57]" />
                <span>Associated POs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {associatedPos.length === 0 ? (
                <p className="text-xs text-[#9E9E9E] italic">No purchase orders linked.</p>
              ) : (
                <div className="space-y-3">
                  {associatedPos.map((po) => (
                    <Link
                      key={po.id}
                      href={`/purchase-orders/${po.id}`}
                      className="p-3 rounded-[12px] bg-[#FAFAF8] border border-[#E9E7E2] flex items-center justify-between text-xs hover:border-[#B08D57]/40 transition-all block group"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#1F3A2E] group-hover:text-[#B08D57] flex items-center gap-2">
                          {po.purchaseOrderNumber}
                          <StatusBadge status={po.statusCode} type="purchase" className="text-[9px] px-1 py-0" />
                        </span>
                        <span className="text-[9px] text-[#6B6B6B] block mt-1 font-medium">
                          PO Date: {new Date(po.purchaseDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-mono text-[#1A1A1A] font-bold">
                        {formatBDT(po.totalAmountBdt)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {shipment.notes && (
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#1F3A2E]">Cargo Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-[#1A1A1A] leading-relaxed text-xs bg-[#FAFAF8] p-3 rounded-[12px] border border-[#E9E7E2]">
                  {shipment.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Shipment Items list and Receiving panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipment Items list */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1F3A2E]">
                <ClipboardList className="h-4.5 w-4.5 text-[#B08D57]" />
                <span>Manifest Cargo Items ({shipmentItems.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="overflow-x-auto rounded-[12px] border border-[#E9E7E2] bg-white shadow-soft-1">
                <table className="min-w-full divide-y divide-[#E9E7E2] text-xs">
                  <thead className="bg-[#F7F6F3] text-[11px] font-bold text-[#1F3A2E] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5 text-left">Variant Code</th>
                      <th className="px-6 py-3.5 text-left">Product / Color</th>
                      <th className="px-6 py-3.5 text-right">Shipped Qty</th>
                      <th className="px-6 py-3.5 text-right">Received Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E7E2]/60 text-[#1A1A1A]">
                    {shipmentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F7F6F3]/70 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-[#1F3A2E] font-bold">
                          {item.variantCode}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#1A1A1A]">{item.productName}</div>
                          <div className="text-xs text-[#6B6B6B] mt-0.5">{item.colorName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold font-mono text-[#1A1A1A]">
                          {item.quantityShipped} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold font-mono">
                          <span className={item.quantityReceived >= item.quantityShipped && item.quantityShipped > 0 ? 'text-[#15803D]' : 'text-[#6B6B6B]'}>
                            {item.quantityReceived} units
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-8 text-xs text-[#6B6B6B] pr-2">
                <span>Total Shipped: <strong className="text-[#1A1A1A] font-mono">{totalShippedUnits} units</strong></span>
                <span>Total Received: <strong className="text-[#1A1A1A] font-mono">{totalReceivedUnits} units</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Panel Form */}
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
