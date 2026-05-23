import { Card } from '@/components/ui/card'

export function LoadingCard() {
  return (
    <Card className="space-y-4">
      <div className="h-4 w-28 rounded-full bg-muted/70" />
      <div className="h-10 w-36 rounded-full bg-muted/70" />
      <div className="h-24 rounded-3xl bg-muted/70" />
    </Card>
  )
}
