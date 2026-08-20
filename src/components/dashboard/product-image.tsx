'use client'

import * as React from 'react'
import Image from 'next/image'
import { Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProductImage({
  src,
  alt,
  className,
  imageClassName,
}: {
  src?: string | null
  alt: string
  className?: string
  imageClassName?: string
}) {
  const [errored, setErrored] = React.useState(false)
  const hasValidSrc = !!src && !errored

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-muted',
        className,
      )}
    >
      {hasValidSrc ? (
        <img
          src={src as string}
          alt={alt}
          onError={() => setErrored(true)}
          className={cn('h-full w-full object-cover', imageClassName)}
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground/70">
          <Dumbbell className="size-8" />
          <span className="text-[10px] font-medium">нет фото</span>
        </div>
      )}
    </div>
  )
}

// Next/Image variant for when we want optimised loading of locally known images.
export function ProductImageNext({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="320px" />
    </div>
  )
}
