import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { rectsEqual, topZ, type Rect } from '../model/geometry'
import type { NotesApi } from '../api/notesApi'
import type { NotesSync } from '../sync/NotesSync'
import type { Note } from '../components/NoteCard/NoteCard.types'

interface NotesState {
  readonly notes: readonly Note[]
  readonly removedLast: Note | null
}

export type NewNote = Omit<Note, 'z'>

export type LoadStatus = 'loading' | 'ready' | 'failed'

export interface NoteActions {
  readonly add: (note: NewNote) => void
  readonly setRect: (id: string, rect: Rect) => void
  readonly setText: (id: string, text: string) => void
  readonly setColor: (id: string, color: NoteColor) => void
  readonly bringToFront: (id: string) => void
  readonly remove: (id: string) => void
  readonly undoRemove: () => void
  readonly dismissRemoved: () => void
}

export type NotesAction =
  | { readonly type: 'load'; readonly notes: readonly Note[] }
  | { readonly type: 'add'; readonly note: NewNote }
  | { readonly type: 'setRect'; readonly id: string; readonly rect: Rect }
  | { readonly type: 'setText'; readonly id: string; readonly text: string }
  | {
      readonly type: 'setColor'
      readonly id: string
      readonly color: NoteColor
    }
  | { readonly type: 'bringToFront'; readonly id: string }
  | { readonly type: 'remove'; readonly id: string }
  | { readonly type: 'undoRemove' }
  | { readonly type: 'dismissRemoved' }

export const NOTE_COLORS = ['yellow', 'pink', 'green', 'blue', 'violet'] as const
type NoteColor = (typeof NOTE_COLORS)[number]

const INITIAL_STATE: NotesState = {
  notes: [],
  removedLast: null,
}

export function createNoteId(): string {
  // randomUUID is only exposed in secure contexts thats why i used it over hre
  const id = isSecureContext
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('')
  return id as string
}

function updateNote(
  state: NotesState,
  id: string,
  update: (note: Note) => Note,
): NotesState {
  const index = state.notes.findIndex((note) => note.id === id)
  const current = state.notes[index]
  if (!current) return state
  const next = update(current)
  return next === current
    ? state
    : { ...state, notes: state.notes.with(index, next) }
}

export function notesReducer(
  state: NotesState,
  action: NotesAction,
): NotesState {
  switch (action.type) {
    case 'load':
      return { notes: action.notes, removedLast: null }

    case 'add':
      return {
        ...state,
        notes: [...state.notes, { ...action.note, z: topZ(state.notes) + 1 }],
      }

    case 'setRect':
      return updateNote(state, action.id, (note) =>
        rectsEqual(note.rect, action.rect)
          ? note
          : { ...note, rect: action.rect },
      )

    case 'setText':
      return updateNote(state, action.id, (note) =>
        note.text === action.text ? note : { ...note, text: action.text },
      )

    case 'setColor':
      return updateNote(state, action.id, (note) =>
        note.color === action.color ? note : { ...note, color: action.color },
      );

    case 'bringToFront': {
      const top = topZ(state.notes)
      return updateNote(state, action.id, (note) =>
        note.z === top ? note : { ...note, z: top + 1 },
      )
    }

    case 'remove': {
      const removed = state.notes.find((note) => note.id === action.id)
      if (!removed) return state
      return {
        notes: state.notes.filter((note) => note !== removed),
        removedLast: removed,
      }
    }

    case 'undoRemove': {
      const { removedLast } = state
      if (!removedLast) return state
      return {
        notes: [...state.notes, { ...removedLast, z: topZ(state.notes) + 1 }],
        removedLast: null,
      }
    }

    case 'dismissRemoved':
      return state.removedLast ? { ...state, removedLast: null } : state
  }
}

export function useNotes(api: NotesApi, sync: NotesSync) {
  const [status, dispatch] = useReducer(notesReducer, INITIAL_STATE)
  const [loadingStatus, setLoadingStatus] = useState<LoadStatus>('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)

  console.log(status, 'status')


  useEffect(() => {
    const controller = new AbortController();
    api.list(controller.signal).then(
      (notes) => {
        if (controller.signal.aborted) return;
        dispatch({ type: 'load', notes });
        setLoadingStatus('ready');
      },
      () => {
        if (!controller.signal.aborted) setLoadingStatus('failed');
      },
    );
    return () => {
      controller.abort();
    };
  }, [api, loadAttempt]);


  const sentNotes = useRef<readonly Note[] | null>(null)

  useEffect(() => {
    if (loadingStatus !== 'ready') {
      sentNotes.current = null
      return
    }

    const previous = sentNotes.current
    sentNotes.current = status.notes
    if (!previous) return

    const removed = new Map(previous.map((note) => [note.id, note]))
    for (const note of status.notes) {
      if (removed.get(note.id) !== note) sync.save(note)
      removed.delete(note.id)
    }
    for (const id of removed.keys()) sync.remove(id)
  }, [status.notes, loadingStatus, sync])

  const actions = useMemo<NoteActions>(
    () => ({
      add: (note) => {
        dispatch({ type: 'add', note })
      },
      setRect: (id, rect) => {
        dispatch({ type: 'setRect', id, rect })
      },
      setText: (id, text) => {
        dispatch({ type: 'setText', id, text })
      },
      setColor: (id, color) => {
        dispatch({ type: 'setColor', id, color })
      },
      bringToFront: (id) => {
        dispatch({ type: 'bringToFront', id })
      },
      remove: (id) => {
        dispatch({ type: 'remove', id })
      },
      undoRemove: () => {
        dispatch({ type: 'undoRemove' })
      },
      dismissRemoved: () => {
        dispatch({ type: 'dismissRemoved' })
      },
    }),
    [],
  )

  const retryLoad = useCallback(() => {
    setLoadingStatus('loading')
    setLoadAttempt((attempt) => attempt + 1)
  }, [])

  return {
    notes: status.notes,
    removedLast: status.removedLast,
    status,
    actions,
    retryLoad,
    loadingStatus
  }
}
