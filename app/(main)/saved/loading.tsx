import { CardGridSkeleton, PageHeadingSkeleton } from '@/components/skeletons'

export default function SavedLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <PageHeadingSkeleton />
      <CardGridSkeleton count={4} />
    </div>
  )
}
