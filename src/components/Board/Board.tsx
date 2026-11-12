import { useCallback, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useElementSize } from '../../hooks/useElementSize'
import {
  centerRectAt,
  clampRect,
  DEFAULT_NOTE_SIZE,
  type Rect,
  type Size,
} from '../../model/geometry'

import { useGestures, type Gesture } from '../../hooks/useGestures'
import { createNoteId, type NoteActions } from '../../hooks/useNotes'
import { TrashZone, type TrashStateZone } from '../TrashZone/TrashZone'
import './Board.css'
import type { Note, NoteColor } from '../NoteCard/NoteCard.types'
import { NoteCard } from '../NoteCard/NoteCard'

const UNBOUNDED: Size = {
  width: Infinity,
  height: Infinity,
}

function boardExtent(notes: readonly Note[], gesture: Gesture | null): Size {
  let width = 0
  let height = 0
  for (const note of notes) {
    width = Math.max(width, note.rect.x + note.rect.width)
    height = Math.max(height, note.rect.y + note.rect.height)
  }
  if (gesture) {
    width = Math.max(width, gesture.rect.x + gesture.rect.width)
    height = Math.max(height, gesture.rect.y + gesture.rect.height)
  }
  return { width, height }
}

interface BoardProps {
  notes: readonly Note[]
  newNoteColor: NoteColor
  actions: NoteActions
}
export function Board({ notes, newNoteColor, actions }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const bounds = useElementSize(boardRef) ?? UNBOUNDED
  const [focusId, setFocusId] = useState<string | null>(null)
  const trashRef = useRef<HTMLDivElement>(null)

  console.log(newNoteColor, 'newNoteColor')

  const createNote = useCallback(
    (rect: Rect) => {
      const id = createNoteId()
      console.log(newNoteColor, 'create note no');
      
      actions.add({ id, rect, color: newNoteColor, text: '' })
      setFocusId(id)
    },
    [actions, newNoteColor],
  )

  const { gesture, startCreateNote, startMove, startResize } = useGestures(
    boardRef,
    trashRef,
    {
      onCreate: createNote,
      onRectChange: actions.setRect,
      onRemove: actions.remove,
    },
  )
  const extent = useMemo(() => boardExtent(notes, gesture), [notes, gesture])
  const noteGesture = gesture && gesture.kind !== 'create' ? gesture : undefined

  const handleDoubleClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    const box = event.currentTarget.getBoundingClientRect()
    const center = { x: event.clientX - box.x, y: event.clientY - box.y }

    console.log(center, "center");
    createNote(clampRect(centerRectAt(center, DEFAULT_NOTE_SIZE), box))
  }

  let trashState: TrashStateZone = 'idle'
  if (gesture?.kind === 'move') trashState = gesture.overTrash ? 'hot' : 'armed'

  return (
    <main className="board" aria-label="Notes board">
      <div className="board__scroll">
        <div
          ref={boardRef}
          className="board__canvas"
          style={{
            width: extent.width || undefined,
            height: extent.height || undefined,
          }}
          onPointerDown={startCreateNote}
          onDoubleClick={handleDoubleClick}
        >
          <div className="board__notes">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                bounds={bounds}
                gesture={noteGesture?.noteId === note.id ? noteGesture : undefined}
                autoFocus={note.id === focusId}
                onActivate={actions.bringToFront}
                onMoveStart={startMove}
                onResizeStart={startResize}
                onTextChange={actions.setText}
                onColorChange={actions.setColor}
              />
            ))}
          </div>
          {gesture?.kind === 'create' && (
            <div
              className="board__draft"
              data-color={newNoteColor}
              style={{
                width: gesture.rect.width,
                height: gesture.rect.height,
                transform: `translate(${String(gesture.rect.x)}px, ${String(gesture.rect.y)}px)`,
              }}
            >
              {Math.round(gesture.rect.width)} × {Math.round(gesture.rect.height)}
            </div>
          )}
        </div>
      </div>
      <TrashZone ref={trashRef} state={trashState} />
    </main>
  )
}
