import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TableRowsSkeleton } from '@/components/skeletons'

export default function ProfileLoading() {
  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Card className="overflow-hidden">
        <Skeleton className="h-32 w-full rounded-none md:h-40" />
        <CardContent className="space-y-4 px-4 pb-6 md:px-6">
          <div className="-mt-12 flex items-end gap-4">
            <Skeleton className="h-28 w-28 rounded-full md:h-32 md:w-32" />
            <div className="flex-1 space-y-2 pb-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
      <TableRowsSkeleton rows={5} />
    </div>
  )
}
