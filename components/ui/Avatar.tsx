'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn, generateAvatar } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

interface AvatarProps {
  src?: string
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  verified?: boolean
  onClick?: () => void
}

export function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  className, 
  verified = false,
  onClick 
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  const verifiedSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  }

  const fallbackSrc = generateAvatar(alt)

  return (
    <div 
      className={cn(
        'relative inline-block',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'rounded-full overflow-hidden bg-muted flex items-center justify-center',
          sizeClasses[size]
        )}
      >
        {src && !imageError ? (
          <Image
            src={src}
            alt={alt}
            width={64}
            height={64}
            className={cn(
              'object-cover transition-opacity duration-200',
              isLoading ? 'opacity-0' : 'opacity-100',
              sizeClasses[size]
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImageError(true)
              setIsLoading(false)
            }}
          />
        ) : (
          <Image
            src={fallbackSrc}
            alt={alt}
            width={64}
            height={64}
            className={cn('object-cover', sizeClasses[size])}
          />
        )}
      </div>

      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5">
          <CheckCircle 
            className={cn(
              'text-cirkel-500 bg-background rounded-full',
              verifiedSizes[size]
            )}
            fill="currentColor"
          />
        </div>
      )}

      {isLoading && src && !imageError && (
        <div className={cn(
          'absolute inset-0 rounded-full bg-muted animate-pulse',
          sizeClasses[size]
        )} />
      )}
    </div>
  )
}