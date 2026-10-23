import { useState } from 'react'
import { useNotes } from './hooks/useNotes'
import './App.css'
import { Board } from './components/Board/Board'
import { Toolbar } from './components/Toolbar/Toolbar'
import type { NoteColor } from './components/NoteCard/NoteCard.types'
import type { NotesApi } from './api/notesApi'
import type { NotesSync } from './sync/NotesSync'

interface AppProps {
  readonly api: NotesApi
  readonly sync: NotesSync
}

function App({ api, sync }: AppProps) {
  const { notes, actions, loadingStatus } = useNotes(api, sync)
  const [newNoteColor, setNewNoteColor] = useState<NoteColor>('yellow')
  return (
    <div className="app">
      <Toolbar
        newNoteColor={newNoteColor}
        onNewNoteColorChange={setNewNoteColor}
      />

      {loadingStatus === 'ready' ? (
        <Board notes={notes} actions={actions} newNoteColor={newNoteColor} />
      ) : (
        <div className='loading'>Loading...</div>
      )}
    </div>
  )
}

export default App
