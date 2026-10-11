import { ListSkeleton } from '@/components/skeletons'

export default function MessagesLoading() {
  return (
    <div className="p-4">
      <ListSkeleton rows={6} />
    </div>
  )
}
