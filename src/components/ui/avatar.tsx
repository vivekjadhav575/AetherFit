import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

export function Avatar({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>) {
  return <AvatarPrimitive.Root className={cn('relative flex h-11 w-11 shrink-0 overflow-hidden rounded-2xl', className)} {...props} />
}

export const AvatarImage = AvatarPrimitive.Image

export function AvatarFallback({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn('flex h-full w-full items-center justify-center bg-primary/10 text-sm font-semibold text-primary', className)}
      {...props}
    />
  )
}
