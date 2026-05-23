import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function StatCard({
  icon: Icon,
  title,
  value,
  helper,
  trend,
}: {
  icon: LucideIcon
  title: string
  value: string
  helper: string
  trend?: number
}) {
  const TrendIcon = trend === undefined ? Minus : trend >= 0 ? ArrowUpRight : ArrowDownRight
  const trendVariant = trend === undefined ? 'muted' : trend >= 0 ? 'success' : 'warning'

  return (
    <Card className="overflow-hidden">
      <CardHeader className="mb-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined ? <Badge variant={trendVariant}>{trend >= 0 ? `+${trend}%` : `${trend}%`}</Badge> : null}
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <CardTitle className="text-3xl">{value}</CardTitle>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendIcon className="h-4 w-4" />
          <span>{helper}</span>
        </div>
      </CardContent>
    </Card>
  )
}
