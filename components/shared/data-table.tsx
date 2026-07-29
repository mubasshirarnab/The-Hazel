'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  loading?: boolean;
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search records...',
  loading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Search Input Filter */}
      {searchKey && (
        <div className="flex items-center">
          <div className="relative max-w-sm w-full">
            <Search className="h-4 w-4 text-[#B08D57] absolute left-3.5 top-3 pointer-events-none" />
            <input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAFAF8] focus:bg-white border border-[#E9E7E2] rounded-[12px] text-[#1A1A1A] placeholder-[#9E9E9E] focus:outline-none focus:border-[#1F3A2E] focus:ring-2 focus:ring-[#1F3A2E]/15 transition-all shadow-soft-1 font-medium"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-[18px] border border-[#E9E7E2] bg-white overflow-hidden shadow-soft-1">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-[#E9E7E2] text-xs">
            <thead className="bg-[#F7F6F3] text-[11px] font-bold text-[#1F3A2E] uppercase tracking-wider sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left select-none"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-[#E9E7E2]/60 bg-white text-[#1A1A1A]">
              {loading ? (
                // Skeleton Loader Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4.5">
                        <div className="h-4 bg-[#F7F6F3] rounded-[8px] w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#F7F6F3]/70 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                // Empty State Row
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-32 text-center text-[#6B6B6B] font-medium px-6 py-10"
                  >
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!loading && table.getRowModel().rows?.length > 0 && (
        <div className="flex items-center justify-between text-xs text-[#6B6B6B] mt-1 px-2 font-medium">
          <div>
            Showing{' '}
            <span className="font-bold text-[#1F3A2E] font-mono">
              {pagination.pageIndex * pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-[#1F3A2E] font-mono">
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{' '}
            of{' '}
            <span className="font-bold text-[#1F3A2E] font-mono">
              {table.getFilteredRowModel().rows.length}
            </span>{' '}
            results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3.5 py-1.5 rounded-[10px] border border-[#E9E7E2] bg-white hover:bg-[#F7F6F3] text-[#1A1A1A] disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed font-semibold shadow-soft-1"
            >
              Previous
            </button>
            <span className="text-[#6B6B6B] font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3.5 py-1.5 rounded-[10px] border border-[#E9E7E2] bg-white hover:bg-[#F7F6F3] text-[#1A1A1A] disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed font-semibold shadow-soft-1"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
