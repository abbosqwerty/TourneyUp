import { Card, CardContent } from '@/components/ui/card'

/**
 * Shown when a server component's data load throws (usually the database being
 * unreachable). Pages catch the error, keep the JSX outside the `try`, and
 * render this instead of taking the whole route down.
 */
export function DbErrorCard({
  message = 'Ma‘lumotlarni yuklab bo‘lmadi. Keyinroq qayta urinib ko‘ring.',
  bare = false,
}: {
  message?: string
  /** Skip the page container — for pages that already sit inside one. */
  bare?: boolean
}) {
  const card = (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )

  if (bare) return card
  return <div className="container mx-auto px-4 py-6">{card}</div>
}
