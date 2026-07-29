'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import StatusBadge from '@/components/shared/status-badge';
import CurrencyFormatter from '@/components/shared/currency';
import { Eye } from 'lucide-react';

export interface ShipmentRow {
  id: number;
  shipmentNumber: string;
  departureDate: Date | string | null;
  warehouseArrivalDate: Date | string | null;
  bangladeshArrivalDate: Date | string | null;
  weightKg: string;
  shippingRatePerKg: string;
  shippingCost: string;
  statusCode: string;
}

export const columns: ColumnDef<ShipmentRow>[] = [
  {
    accessorKey: 'shipmentNumber',
    header: 'Shipment Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-bold text-[#1F3A2E]">
        {row.original.shipmentNumber}
      </span>
    ),
  },
  {
    accessorKey: 'departureDate',
    header: 'Departure',
    cell: ({ row }) => {
      const d = row.original.departureDate;
      if (!d) return <span className="text-[#9E9E9E]">—</span>;
      return (
        <span className="text-[#6B6B6B] text-xs font-medium">
          {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      );
    },
  },
  {
    accessorKey: 'warehouseArrivalDate',
    header: 'Warehouse Arrival',
    cell: ({ row }) => {
      const d = row.original.warehouseArrivalDate;
      if (!d) return <span className="text-[#9E9E9E]">—</span>;
      return (
        <span className="text-[#1A1A1A] text-xs font-bold">
          {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      );
    },
  },
  {
    accessorKey: 'weightKg',
    header: 'Weight (KG)',
    cell: ({ row }) => (
      <span className="font-bold font-mono text-[#1A1A1A]">
        {parseFloat(row.original.weightKg).toFixed(1)} kg
      </span>
    ),
  },
  {
    accessorKey: 'shippingRatePerKg',
    header: 'Rate/KG',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-[#6B6B6B]">
        {parseFloat(row.original.shippingRatePerKg).toFixed(0)} BDT
      </span>
    ),
  },
  {
    accessorKey: 'shippingCost',
    header: 'Total Shipping Cost',
    cell: ({ row }) => (
      <CurrencyFormatter amount={row.original.shippingCost} className="text-[#1A1A1A] font-bold" />
    ),
  },
  {
    accessorKey: 'statusCode',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.statusCode} type="shipment" />,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Link
        href={`/shipments/${row.original.id}`}
        className="p-1.5 rounded-[8px] hover:bg-[#F7F6F3] text-[#6B6B6B] hover:text-[#1F3A2E] transition-colors inline-block border border-transparent hover:border-[#E9E7E2]"
        title="View Shipment Details"
      >
        <Eye className="h-4 w-4" />
      </Link>
    ),
  },
];
