import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyStateCard } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  id?: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  pagination?: React.ReactNode;
  search?: React.ReactNode;
  rowKey?: (row: T) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyState,
  pagination,
  search,
  rowKey,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4 w-full">
      {search && <div className="flex items-center justify-between">{search}</div>}
      
      <div className="rounded-md border bg-white dark:bg-gray-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={col.id || index} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`loading-${i}`}>
                  {columns.map((col, j) => (
                    <TableCell key={col.id || j} className={col.className}>
                      <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center p-0">
                  {emptyState || (
                    <EmptyStateCard
                      title="No data available"
                      description="There is no data to display in this table."
                      cardClassName="border-0 rounded-none bg-transparent"
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={rowKey ? rowKey(row) : i}>
                  {columns.map((col, j) => (
                    <TableCell key={col.id || j} className={col.className}>
                      {col.cell(row, i)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && <div className="flex items-center justify-end">{pagination}</div>}
    </div>
  );
}
