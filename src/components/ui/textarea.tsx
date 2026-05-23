import type { TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-[110px] w-full rounded-2xl border border-white/20 bg-background/70 px-4 py-3 text-sm text-foreground shadow-inset outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20',
        className,
      )}
      {...props}
    />
  )
}
