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
  containerClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyState,
  pagination,
  search,
  rowKey,
  containerClassName,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4 w-full flex flex-col h-full">
      {search && <div className="flex items-center justify-between">{search}</div>}
      
      <div className={cn("overflow-auto relative", containerClassName)}>
        <Table>
          <TableHeader className="sticky top-0 bg-muted/40 z-10 backdrop-blur-md">
            <TableRow className="hover:bg-transparent border-b border-border/60">
              {columns.map((col, index) => (
                <TableHead key={col.id || index} className={cn("text-xs font-semibold tracking-wider text-muted-foreground uppercase h-11", col.className)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`loading-${i}`} className="border-b border-border/40">
                  {columns.map((col, j) => (
                    <TableCell key={col.id || j} className={col.className}>
                      <div className="h-5 w-full animate-pulse rounded-md bg-muted" />
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
                <TableRow key={rowKey ? rowKey(row) : i} className="group transition-colors hover:bg-muted/40 border-b border-border/40">
                  {columns.map((col, j) => (
                    <TableCell key={col.id || j} className={cn("py-3.5 text-sm", col.className)}>
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
