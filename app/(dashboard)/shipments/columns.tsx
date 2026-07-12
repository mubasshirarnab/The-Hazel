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
      <span className="font-mono text-xs font-semibold text-rose-400">
        {row.original.shipmentNumber}
      </span>
    ),
  },
  {
    accessorKey: 'departureDate',
    header: 'Departure',
    cell: ({ row }) => {
      const d = row.original.departureDate;
      if (!d) return <span className="text-zinc-500">—</span>;
      return (
        <span className="text-zinc-300 text-xs">
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
      if (!d) return <span className="text-zinc-500">—</span>;
      return (
        <span className="text-zinc-350 text-xs font-semibold">
          {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      );
    },
  },
  {
    accessorKey: 'weightKg',
    header: 'Weight (KG)',
    cell: ({ row }) => (
      <span className="font-bold text-zinc-200">
        {parseFloat(row.original.weightKg).toFixed(1)} kg
      </span>
    ),
  },
  {
    accessorKey: 'shippingRatePerKg',
    header: 'Rate/KG',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-zinc-400">
        {parseFloat(row.original.shippingRatePerKg).toFixed(0)} BDT
      </span>
    ),
  },
  {
    accessorKey: 'shippingCost',
    header: 'Total Shipping Cost',
    cell: ({ row }) => (
      <CurrencyFormatter amount={row.original.shippingCost} className="text-zinc-100 font-bold" />
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
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors inline-block"
        title="View Shipment Details"
      >
        <Eye className="h-4 w-4" />
      </Link>
    ),
  },
];
