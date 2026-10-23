import { useCallback, useState, type RefObject, type PointerEvent } from 'react';
import {
  clampRect,
  containsPoint,
  MIN_SIZE,
  rectFromDrag,
  resizeRect,
  translateRect,
  type Point,
  type Rect,
  type ResizeHandle,
} from '../model/geometry'
import { startPointerDrag } from '../model/pointerDrag'



export const RESIZE_CURSORS: Readonly<Record<ResizeHandle, string>> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
  };

export type Gesture =
  | { kind: 'create'; rect: Rect }
  | {
      kind: 'move'
      noteId: string
      rect: Rect
      overTrash: boolean
    }
  | { kind: 'resize'; noteId: string; rect: Rect }

export type NoteGesture = Exclude<Gesture, { kind: 'create' }>

interface GestureSpec<G extends Gesture> {
  cursor: string
  compute: (delta: Point, pointer: Point) => G
  commit: (gesture: G) => void
}

interface GestureHandlers {
  readonly onCreate: (rect: Rect) => void
  readonly onRectChange: (id: string, rect: Rect) => void
  readonly onRemove: (id: string) => void
}

function trackGesture<G extends Gesture>(
  event: PointerEvent,
  setGesture: (gesture: G | null) => void,
  { cursor, compute, commit }: GestureSpec<G>,
): void {
  startPointerDrag(event, {
    cursor,
    onMove: (delta, pointer) => {
      setGesture(compute(delta, pointer))
    },
    onEnd: (delta, pointer) => {
      setGesture(null)
      commit(compute(delta, pointer))
    },
    onCancel: () => {
      setGesture(null)
    },
  })
}

export function useGestures(
  boardRef: RefObject<HTMLElement | null>,
  trashRef: RefObject<HTMLElement | null>,
  { onCreate, onRectChange, onRemove }: GestureHandlers,
) {
  const [gesture, setGesture] = useState<any>(null)

  const startCreateNote = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return

    const bounds = event.currentTarget.getBoundingClientRect()

    const origin = {
      x: Math.round(event.clientX - bounds.x),
      y: Math.round(event.clientY - bounds.y),
    }

    trackGesture(event, setGesture, {
      cursor: 'crosshair',
      compute: (delta) => ({
        kind: 'create',
        rect: clampRect(rectFromDrag(origin, delta, MIN_SIZE), bounds),
      }),
      commit: ({ rect }) => {
        onCreate(rect)
      },
    })
  }, [])


  const startMove = useCallback(
    (event: PointerEvent, noteId: string, startRect: Rect) => {
      const bounds = boardRef.current?.getBoundingClientRect();
      if (!bounds) return;
      //the trash shoudl not move the note sizing while moving
      const trash = trashRef.current?.getBoundingClientRect();
      trackGesture(event, setGesture, {
        cursor: 'grabbing',
        compute: (delta, pointer) => ({
          kind: 'move',
          noteId,
          rect: translateRect(startRect, delta, bounds),
          overTrash: trash !== undefined && containsPoint(trash, pointer),
        }),
        commit: ({ rect, overTrash }) => {
          if (overTrash) onRemove(noteId);
          else onRectChange(noteId, rect);
        },
      });
    },
    [boardRef, trashRef, onRectChange, onRemove],
  );

  const startResize = useCallback(
    (event: PointerEvent, noteId: string, handle: ResizeHandle, startRect: Rect) => {
      const bounds = boardRef.current?.getBoundingClientRect();
      if (!bounds) return;
      trackGesture(event, setGesture, {
        cursor: RESIZE_CURSORS[handle],
        compute: (delta) => ({
          kind: 'resize',
          noteId,
          rect: resizeRect(startRect, handle, delta, MIN_SIZE, bounds),
        }),
        commit: ({ rect }) => {
          onRectChange(noteId, rect);
        },
      });
    },
    [boardRef, onRectChange],
  );

  return {
    gesture,
    startCreateNote,
    startMove,
    startResize,
  }
}
