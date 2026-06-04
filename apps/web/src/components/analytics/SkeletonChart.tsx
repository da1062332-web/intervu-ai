import { cn } from '@/lib/utils';

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col h-full min-h-[250px]", className)}>
      <div className="flex items-end gap-2 flex-1 pt-4 pb-2">
        {[40, 70, 45, 90, 65, 30, 80].map((height, i) => (
          <div key={i} className="flex flex-col items-center flex-1 gap-2">
            <div className="w-full bg-muted animate-pulse rounded-t-sm relative flex-1">
              <div 
                className="absolute bottom-0 w-full bg-muted-foreground/20 rounded-t-sm"
                style={{ height: `${height}%` }}
              />
            </div>
            <div className="w-6 h-3 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
