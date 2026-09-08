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
  stock_out: number;
  unit_cost: number | string;
  inventory_value: number | string;
}

export const columns: ColumnDef<InventoryRow>[] = [
  {
    accessorKey: 'product_name',
    header: 'Product Name',
    cell: ({ row }) => (
      <div className="font-semibold text-[#1A1A1A] max-w-[200px] truncate">
        {row.original.product_name}
      </div>
    ),
  },
  {
    accessorKey: 'color_name',
    header: 'Color Variant',
    cell: ({ row }) => (
      <span className="text-[#6B6B6B] font-medium">
        {row.original.color_name}
      </span>
    ),
  },
  {
    accessorKey: 'current_stock',
    header: 'Current Stock',
    cell: ({ row }) => (
      <span className="font-bold font-mono text-[#1A1A1A]">
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
          className={`font-bold font-mono ${
            reserved > 0 ? 'text-[#D97706]' : 'text-[#9E9E9E]'
          }`}
        >
          {reserved}
        </span>
      );
    },
  },
  {
    accessorKey: 'stock_out',
    header: 'Stock Out',
    cell: ({ row }) => (
      <span className="font-bold font-mono text-[#1F3A2E]">
        {row.original.stock_out || 0}
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
    cell: ({ row }) => <Currency amount={row.original.inventory_value} className="text-[#15803D] font-bold" />,
  },
];