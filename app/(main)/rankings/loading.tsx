import { PageHeadingSkeleton, TableRowsSkeleton } from '@/components/skeletons'

export default function RankingsLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <PageHeadingSkeleton />
      <TableRowsSkeleton rows={10} />
    </div>
  )
}
