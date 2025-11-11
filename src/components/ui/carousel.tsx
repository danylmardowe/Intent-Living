// src/components/ui/carousel.tsx
'use client'

import { PropsWithChildren } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'


export function Carousel({ children }: PropsWithChildren) {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-md">{children}</div>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="pointer-events-auto h-8 w-8 rounded-full"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="pointer-events-auto h-8 w-8 rounded-full"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default Carousel
