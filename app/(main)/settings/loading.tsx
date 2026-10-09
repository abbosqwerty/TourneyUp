import { FormSkeleton, PageHeadingSkeleton } from '@/components/skeletons'

export default function SettingsLoading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <PageHeadingSkeleton />
      <FormSkeleton fields={4} />
    </div>
  )
}
