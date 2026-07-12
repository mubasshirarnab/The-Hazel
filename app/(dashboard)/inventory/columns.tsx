'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Currency from '@/components/shared/currency';

export interface InventoryRow {
  variant_id: number;
  product_id: number;
  product_name: string;
  color_name: string;
  warehouse_id: number;
  warehouse_name: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  returned_stock: number;
  damaged_stock: number;
  unit_cost: number | string;
  inventory_value: number | string;
}

export const columns: ColumnDef<InventoryRow>[] = [
  {
    accessorKey: 'product_name',
    header: 'Product Name',
    cell: ({ row }) => (
      <div className="font-medium text-zinc-100 max-w-[200px] truncate">
        {row.original.product_name}
      </div>
    ),
  },
  {
    accessorKey: 'color_name',
    header: 'Color Variant',
    cell: ({ row }) => (
      <span className="text-zinc-300">
        {row.original.color_name}
      </span>
    ),
  },
  {
    accessorKey: 'warehouse_name',
    header: 'Warehouse',
    cell: ({ row }) => (
      <span className="text-zinc-400 font-medium text-xs">
        {row.original.warehouse_name}
      </span>
    ),
  },
  {
    accessorKey: 'current_stock',
    header: 'Current Stock',
    cell: ({ row }) => (
      <span className="font-bold text-zinc-200">
        {row.original.current_stock}
      </span>
    ),
  },
  {
    accessorKey: 'reserved_stock',
    header: 'Reserved',
    cell: ({ row }) => {
      const reserved = row.original.reserved_stock;
      return (
        <span
          className={`font-semibold ${
            reserved > 0 ? 'text-amber-500' : 'text-zinc-500'
          }`}
        >
          {reserved}
        </span>
      );
    },
  },
  {
    accessorKey: 'available_stock',
    header: 'Available',
    cell: ({ row }) => {
      const available = row.original.available_stock;
      return (
        <span
          className={`font-bold ${
            available > 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {available}
        </span>
      );
    },
  },
  {
    accessorKey: 'returned_stock',
    header: 'Returned / Damaged',
    cell: ({ row }) => (
      <span className="text-xs text-zinc-400">
        R: {row.original.returned_stock} / D: {row.original.damaged_stock}
      </span>
    ),
  },
  {
    accessorKey: 'unit_cost',
    header: 'Unit Cost',
    cell: ({ row }) => <Currency amount={row.original.unit_cost} />,
  },
  {
    accessorKey: 'inventory_value',
    header: 'Total Value',
    cell: ({ row }) => <Currency amount={row.original.inventory_value} className="text-emerald-400 font-bold" />,
  },
];
