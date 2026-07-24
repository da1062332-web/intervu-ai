import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// --- Base Skeletons ---

export function TableSkeleton({ columns = 5, rows = 5, className }: { columns?: number, rows?: number, className?: string }) {
  return (
    <div className={cn("border border-border/40 rounded-xl bg-card shadow-sm overflow-hidden", className)}>
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i} className="h-11 border-b border-border/40">
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent border-b border-border/40">
              {Array.from({ length: columns }).map((_, j) => (
                <TableCell key={j} className="py-3.5">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-1/2 mb-1" />
        <Skeleton className="h-3 w-1/4" />
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm", className)}>
      <CardHeader>
        <Skeleton className="h-5 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

export function FormSkeleton({ rows = 4, className }: { rows?: number, className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-4 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function TimelineSkeleton({ items = 4, className }: { items?: number, className?: string }) {
  return (
    <Card className={cn("overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm", className)}>
      <CardHeader>
        <Skeleton className="h-5 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2 flex-1 pt-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm", className)}>
      <CardHeader>
        <Skeleton className="h-5 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  );
}

// --- Layout Skeletons ---

export function PageSkeleton({ children, className }: { children?: React.ReactNode, className?: string }) {
  return (
    <div className={cn("container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up pb-8", className)}>
      <div className="space-y-3 mb-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      {children}
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <PageSkeleton>
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-32" />
      </div>
      <TableSkeleton />
    </PageSkeleton>
  );
}

export function DashboardSkeleton() {
  return (
    <PageSkeleton>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <ChartSkeleton />
        </div>
        <div className="col-span-3">
          <TimelineSkeleton />
        </div>
      </div>
    </PageSkeleton>
  );
}

export function ProfileSkeleton() {
  return (
    <PageSkeleton>
      <Card className="border border-border/40 bg-card/40 backdrop-blur-sm mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 mt-8">
            <FormSkeleton rows={2} />
            <FormSkeleton rows={2} />
          </div>
        </CardContent>
      </Card>
    </PageSkeleton>
  );
}

export function ConfigurationSkeleton() {
  return (
    <PageSkeleton>
      <div className="grid gap-6 md:grid-cols-2">
        <CardSkeleton className="h-64" />
        <CardSkeleton className="h-64" />
      </div>
      <div className="mt-6">
        <TableSkeleton />
      </div>
    </PageSkeleton>
  );
}

export function DetailPageSkeleton() {
  return (
    <PageSkeleton>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2 space-y-6">
          <CardSkeleton className="h-96" />
          <TableSkeleton />
        </div>
        <div className="col-span-1 space-y-6">
          <WidgetSkeleton />
          <WidgetSkeleton />
        </div>
      </div>
    </PageSkeleton>
  );
}

export function AnalyticsSkeleton() {
  return (
    <PageSkeleton>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton />
    </PageSkeleton>
  );
}

export function ReportSkeleton() {
  return (
    <PageSkeleton>
      <Card className="mb-8 border border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-6 flex justify-between items-center">
          <div className="space-y-3 w-1/2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-12 w-32" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton />
    </PageSkeleton>
  );
}
