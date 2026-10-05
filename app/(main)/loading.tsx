import { LoadingAnimation } from '@/components/loading-animation'

export default function Loading() {
  return (
    <div className="flex min-h-[65vh] w-full flex-col items-center justify-center gap-4">
      <LoadingAnimation size={160} />
      <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">
        Loading tournaments...
      </p>
    </div>
  )
}
