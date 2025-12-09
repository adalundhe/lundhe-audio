import { Card, CardContent } from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"

export function StudioCalculatorSkeleton() {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        {/* Breadcrumbs skeleton */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-20 h-4" />
              {i < 4 && <Skeleton className="w-8 h-0.5" />}
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-6 min-h-[400px]">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Pricing overview card skeleton */}
          <div className="border rounded-lg p-4 space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>

          {/* Song item skeleton */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </div>

          <Skeleton className="h-10 w-full" />
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Skeleton className="h-10 w-24" />
          <div className="flex items-center gap-4">
            <div className="text-right space-y-1">
              <Skeleton className="h-3 w-24 ml-auto" />
              <Skeleton className="h-7 w-20 ml-auto" />
            </div>
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
