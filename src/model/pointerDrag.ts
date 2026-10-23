import type { PointerEvent as Reactpoint } from 'react'
import type { Point } from './geometry'

export interface DragHandlers {
  readonly cursor: string
  readonly onMove: (delta: Point, pointer: Point) => void
  readonly onEnd: (delta: Point, pointer: Point) => void
  readonly onCancel: () => void
}

const DRAG_THRESHOLD = 3;
const DRAGGING_CLASS = 'is-dragging';

export function startPointerDrag(
  event: Reactpoint,
  handlers: DragHandlers,
): void {
  if (event.button !== 0 || !event.isPrimary) return

  const { pointerId, currentTarget: target } = event
  const origin: Point = { x: event.clientX, y: event.clientY }
  let pointer = origin
  let started = false
  let frame = 0
  const listeners = new AbortController()
  const root = document.documentElement

  const delta = (): Point => ({
    x: Math.round(pointer.x - origin.x),
    y: Math.round(pointer.y - origin.y),
  })

  const emitMove = () => {
    frame = 0
    handlers.onMove(delta(), pointer)
  }

  const finish = (commit: boolean) => {
    listeners.abort()
    cancelAnimationFrame(frame)
    if (target.hasPointerCapture(pointerId))
      target.releasePointerCapture(pointerId)
    if (!started) return
    root.classList.remove(DRAGGING_CLASS)
    root.style.removeProperty('--drag-cursor')
    if (commit) handlers.onEnd(delta(), pointer)
    else handlers.onCancel()
  }

  const isOwnPointer = (e: PointerEvent) => e.pointerId === pointerId
  const { signal } = listeners

  window.addEventListener(
    'pointermove',
    (e) => {
      if (!isOwnPointer(e)) return
      pointer = { x: e.clientX, y: e.clientY }
      if (!started) {
        const { x, y } = delta()
        if (Math.hypot(x, y) < DRAG_THRESHOLD) return
        started = true
        root.classList.add(DRAGGING_CLASS)
        root.style.setProperty('--drag-cursor', handlers.cursor)
      }
      // Pointer events can fire far more often than the screen refreshes.
      if (frame === 0) frame = requestAnimationFrame(emitMove)
    },
    { signal },
  )
  window.addEventListener(
    'pointerup',
    (e) => {
      if (!isOwnPointer(e)) return
      pointer = { x: e.clientX, y: e.clientY }
      finish(true)
    },
    { signal },
  )
  window.addEventListener(
    'pointercancel',
    (e) => {
      if (isOwnPointer(e)) finish(false)
    },
    { signal },
  )
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') finish(false)
    },
    { signal },
  )
  window.addEventListener(
    'blur',
    () => {
      finish(false)
    },
    { signal },
  )

  target.setPointerCapture(pointerId)
}
