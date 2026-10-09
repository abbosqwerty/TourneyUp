import { FormSkeleton, PageHeadingSkeleton } from '@/components/skeletons'

export default function CreateLoading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <PageHeadingSkeleton />
      <FormSkeleton fields={6} />
    </div>
  )
}
