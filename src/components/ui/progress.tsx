import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

export function Progress({ className, value = 0 }: { className?: string; value?: number }) {
  return (
    <ProgressPrimitive.Root className={cn('relative h-3 w-full overflow-hidden rounded-full bg-muted/70', className)} value={value}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-gradient-to-r from-primary via-sky-400 to-teal-300 transition-all duration-300"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
