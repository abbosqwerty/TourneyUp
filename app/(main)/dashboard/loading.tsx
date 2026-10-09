import { ListSkeleton, PageHeadingSkeleton, StatTilesSkeleton } from '@/components/skeletons'

export default function DashboardLoading() {
  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6">
      <PageHeadingSkeleton />
      <StatTilesSkeleton />
      <ListSkeleton rows={4} />
    </div>
  )
}
