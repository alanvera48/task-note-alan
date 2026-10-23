import { useLayoutEffect, useState, type RefObject } from 'react'
import type { Size } from '../model/geometry'

export function useElementSize(ref: RefObject<HTMLElement | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const observe = new ResizeObserver(([entry]) => {
      if (entry)
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      observe.observe(element)
      return () => observe.disconnect()
    })
  }, [ref])
  return size
}
