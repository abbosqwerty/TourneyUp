import { LoadingAnimation } from '@/components/loading-animation'

export default function RootLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <LoadingAnimation size={180} />
      <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">
        Loading TourneyUp...
      </p>
    </div>
  )
}
