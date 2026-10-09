import { CardGridSkeleton, PageHeadingSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function FeedLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-6 h-10 w-full" />
      <PageHeadingSkeleton />
      <CardGridSkeleton />
    </div>
  )
}
