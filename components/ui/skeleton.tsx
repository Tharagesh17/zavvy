"use client";

import { cn } from "@/lib/utils";

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-shimmer rounded-lg bg-muted",
                className
            )}
            {...props}
        />
    );
}

function CardSkeleton() {
    return (
        <div className="p-6 surface-elevated rounded-xl space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
        </div>
    );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="surface-elevated rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="divide-y divide-border">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32 flex-1" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function BentoSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
            </div>
        </div>
    );
}

export { Skeleton, CardSkeleton, TableSkeleton, BentoSkeleton };
