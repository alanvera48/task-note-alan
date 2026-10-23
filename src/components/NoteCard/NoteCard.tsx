import { memo, type PointerEvent } from 'react'
import { RESIZE_CURSORS, type NoteGesture } from '../../hooks/useGestures'
import {
  clampRect,
  RESIZE_HANDLES,
  type Rect,
  type ResizeHandle,
  type Size,
} from '../../model/geometry'
import './NoteCard.css'
import { OptionHeader } from '../OptionsHeader/OptionHeader'
import type { Note, NoteColor } from './NoteCard.types'



export interface NoteCardProps {
  note: Note
  bounds: Size
  gesture: NoteGesture | undefined
  readonly autoFocus: boolean
  readonly onActivate: (id: string) => void
  readonly onMoveStart: (event: PointerEvent, id: string, rect: Rect) => void
  readonly onResizeStart: (
    event: PointerEvent,
    id: string,
    handle: ResizeHandle,
    rect: Rect,
  ) => void
  readonly onTextChange: (id: string, text: string) => void
  readonly onColorChange: (id: string, color: NoteColor) => void
}

export const NoteCard = memo(
  ({
    note,
    bounds,
    gesture,
    autoFocus,
    onActivate,
    onMoveStart,
    onResizeStart,
    onTextChange,
    onColorChange,
  }: NoteCardProps) => {
    const { id } = note
    const rect = gesture?.rect ?? clampRect(note.rect, bounds)

    return (
      <article
        className="note"
        data-color={note.color}
        data-gesture={gesture?.kind}
        data-over-trash={gesture?.kind === 'move' && gesture.overTrash}
        style={{
          width: rect.width,
          height: rect.height,
          transform: `translate(${String(rect.x)}px, ${String(rect.y)}px)`,
          zIndex: note.z,
        }}
        onPointerDownCapture={() => {
          onActivate(id)
        }}
      >
        <header
          className="note__header"
          title="Drag to move"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget)
              onMoveStart(event, id, rect)
          }}
        >
          <OptionHeader
            className="note__option-header"
            label="Note color"
            value={note.color}
            onChange={(color) => {
              onColorChange(id, color)
            }}
          />
        </header>
        <textarea
          className="note__text"
          aria-label="Note text"
          placeholder="Write something…"
          value={note.text}
          autoFocus={autoFocus}
          onChange={(event) => {
            onTextChange(id, event.target.value)
          }}
        />
        {RESIZE_HANDLES.map((handle) => (
          <div
            key={handle}
            className={`note__resize note__resize--${handle}`}
            style={{ cursor: RESIZE_CURSORS[handle] }}
            aria-hidden="true"
            onPointerDown={(event) => {
              onResizeStart(event, id, handle, rect)
            }}
          />
        ))}
      </article>
    )
  },
)
