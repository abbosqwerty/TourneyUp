import { ListSkeleton, PageHeadingSkeleton } from '@/components/skeletons'

export default function MessagesLoading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <PageHeadingSkeleton />
      <ListSkeleton rows={6} />
    </div>
  )
}
