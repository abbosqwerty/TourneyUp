import { ListSkeleton, PageHeadingSkeleton } from '@/components/skeletons'

export default function MatchesLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <PageHeadingSkeleton />
      <ListSkeleton rows={5} />
    </div>
  )
}
