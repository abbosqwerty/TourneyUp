import { PageHeadingSkeleton, TableRowsSkeleton } from '@/components/skeletons'

export default function ParticipantsLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <PageHeadingSkeleton />
      <TableRowsSkeleton rows={8} />
    </div>
  )
}
