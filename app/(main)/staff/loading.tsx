import { ListSkeleton, PageHeadingSkeleton } from '@/components/skeletons'

export default function StaffLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <PageHeadingSkeleton />
      <ListSkeleton rows={4} />
    </div>
  )
}
