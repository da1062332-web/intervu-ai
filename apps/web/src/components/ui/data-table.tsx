import * as React from 'react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyStateCard } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeletons';
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
  disablePagination?: boolean;
  hideSrNo?: boolean;
  pageSize?: number;
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
  disablePagination,
  hideSrNo = false,
  pageSize = 20,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(pageSize);

  // Synchronize initial pageSize prop changes
  React.useEffect(() => {
    setItemsPerPage(pageSize);
  }, [pageSize]);

  const totalPages = itemsPerPage >= data.length ? 1 : Math.max(1, Math.ceil(data.length / itemsPerPage));

  // Ensure current page is within bounds when data changes
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [data.length, totalPages, currentPage]);

  if (isLoading) {
    return <TableSkeleton columns={columns.length + (hideSrNo ? 0 : 1)} rows={5} className={containerClassName} />;
  }

  const paginatedData = disablePagination 
    ? data 
    : data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4 w-full flex flex-col h-full">
      {search && <div className="flex items-center justify-between">{search}</div>}
      
      <div className={cn("overflow-auto relative border rounded-xl bg-card shadow-sm", containerClassName)}>
        <Table>
          <TableHeader className="sticky top-0 bg-muted/40 z-10 backdrop-blur-md">
            <TableRow className="hover:bg-transparent border-b border-border/40">
              {!hideSrNo && (
                <TableHead className="w-[50px] text-xs font-semibold tracking-wider text-muted-foreground uppercase h-11 border-b border-border/40 text-center">Sr. No.</TableHead>
              )}
              {columns.map((col, index) => (
                <TableHead key={col.id || index} className={cn("text-xs font-semibold tracking-wider text-muted-foreground uppercase h-11 border-b border-border/40", col.className)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (hideSrNo ? 0 : 1)} className="h-48 text-center p-0">
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
              paginatedData.map((row, i) => (
                <TableRow key={rowKey ? rowKey(row) : i} className="group transition-colors hover:bg-muted/40 border-b border-border/40">
                  {!hideSrNo && (
                    <TableCell className="w-[50px] py-3.5 text-sm text-center text-muted-foreground font-medium">
                      {(currentPage - 1) * itemsPerPage + i + 1}
                    </TableCell>
                  )}
                  {columns.map((col, j) => (
                    <TableCell key={col.id || j} className={cn("py-3.5 text-sm", col.className)}>
                      {col.cell(row, (currentPage - 1) * itemsPerPage + i)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Internal Pagination if no custom pagination provided and total pages > 1 */}
      {!disablePagination && !pagination && data.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-4 border-t border-border/40 text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-xs bg-background border rounded-md font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={9999}>All ({data.length})</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium text-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {pagination && <div className="flex items-center justify-end">{pagination}</div>}
    </div>
  );
}
