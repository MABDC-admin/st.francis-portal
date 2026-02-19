import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton placeholder for the sidebar navigation while data loads.
 * Shows animated pulse bars mimicking nav items and groups.
 */
export const SidebarSkeleton = () => (
    <div className="px-3 space-y-3 mt-4" role="status" aria-label="Loading navigation">
        {/* School header skeleton */}
        <div className="flex items-center gap-3 px-1 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg bg-white/20" />
            <Skeleton className="h-4 w-28 bg-white/20" />
        </div>

        {/* Nav item skeletons */}
        {[...Array(3)].map((_, i) => (
            <div key={`item-${i}`} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-5 w-5 rounded bg-white/15" />
                <Skeleton className="h-3.5 w-24 bg-white/15" />
            </div>
        ))}

        {/* Group skeleton with sub-items */}
        <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded bg-white/15" />
                    <Skeleton className="h-3.5 w-32 bg-white/15" />
                </div>
                <Skeleton className="h-4 w-4 rounded bg-white/10" />
            </div>
            <div className="ml-6 pl-2 border-l border-white/10 space-y-1">
                {[...Array(3)].map((_, i) => (
                    <div key={`sub-${i}`} className="flex items-center gap-3 px-3 py-2">
                        <Skeleton className="h-4 w-4 rounded bg-white/10" />
                        <Skeleton className="h-3 w-20 bg-white/10" />
                    </div>
                ))}
            </div>
        </div>

        {/* More nav items */}
        {[...Array(2)].map((_, i) => (
            <div key={`bottom-${i}`} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-5 w-5 rounded bg-white/15" />
                <Skeleton className="h-3.5 w-20 bg-white/15" />
            </div>
        ))}

        <span className="sr-only">Loading navigation menu</span>
    </div>
);
