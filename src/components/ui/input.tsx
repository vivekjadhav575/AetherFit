import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-2xl border border-white/20 bg-background/70 px-4 text-sm text-foreground shadow-inset outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20',
        className,
      )}
      {...props}
    />
  )
}
