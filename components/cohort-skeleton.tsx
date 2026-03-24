import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function CampusSkeleton() {
  return (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full" />
      ))}
    </div>
  )
}

export function CohortCardSkeleton() {
  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}
