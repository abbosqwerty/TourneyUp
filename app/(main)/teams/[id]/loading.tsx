import { CardGridSkeleton, PageHeadingSkeleton } from '@/components/skeletons'

export default function TeamsLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <PageHeadingSkeleton />
      <CardGridSkeleton count={3} />
    </div>
  )
}
