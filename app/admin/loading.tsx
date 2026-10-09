import { ListSkeleton, PageHeadingSkeleton, StatTilesSkeleton } from '@/components/skeletons'

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <PageHeadingSkeleton />
      <StatTilesSkeleton />
      <ListSkeleton rows={5} />
    </div>
  )
}
