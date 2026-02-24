import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function StatsSkeleton() {
  return (
    <Card className="relative overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3 md:p-3.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="size-6 md:size-7 rounded-md" />
      </CardHeader>
      <CardContent className="px-3 pb-3 md:px-3.5 md:pb-3.5 pt-0">
        <Skeleton className="h-7 w-12 mb-1" />
        <Skeleton className="h-2.5 w-24" />
      </CardContent>
    </Card>
  )
}
