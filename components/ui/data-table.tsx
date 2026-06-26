'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  searchPlaceholder?: string;
  searchKey?: string;
  pageSize?: number;
  emptyState?: ReactNode;
  loading?: boolean;
}

export function DataTable<TData>({
  data,
  columns,
  searchPlaceholder = 'Search…',
  searchKey,
  pageSize = 10,
  emptyState,
  loading,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!searchKey) return true;
      const value = (row.original as Record<string, unknown>)[searchKey];
      if (value == null) return false;
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    },
  });

  const rowCount = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div className="w-full">
      {/* Search */}
      {searchKey && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 px-3 text-[13px] bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-input)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--action-blue)]/30 focus:border-[var(--action-blue)] w-full max-w-sm transition-all"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-subtle)]">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          className={`inline-flex items-center gap-1 ${canSort ? 'cursor-pointer hover:text-[var(--text-primary)]' : 'cursor-default'} transition-colors`}
                          disabled={!canSort}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-[var(--text-tertiary)]">
                              {sorted === 'asc' ? (
                                <ChevronUp size={12} strokeWidth={2} />
                              ) : sorted === 'desc' ? (
                                <ChevronDown size={12} strokeWidth={2} />
                              ) : (
                                <ChevronsUpDown size={12} strokeWidth={1.5} />
                              )}
                            </span>
                          )}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[13px] text-[var(--text-secondary)]">
                  Loading…
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-0">
                  {emptyState ?? (
                    <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">
                      No records found
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[var(--bg-hover)] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {rowCount > 0 && (
        <div className="flex items-center justify-between mt-4 text-[12px] text-[var(--text-tertiary)]">
          <span>
            Showing {pageIndex * pageSize + 1}–
            {Math.min((pageIndex + 1) * pageSize, rowCount)} of {rowCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 inline-flex items-center justify-center rounded-[var(--radius-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
            <span className="px-2">
              Page {pageIndex + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 inline-flex items-center justify-center rounded-[var(--radius-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}