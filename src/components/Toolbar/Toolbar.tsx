import type { NoteActions } from '../../hooks/useNotes'
import type { NoteColor } from '../NoteCard/NoteCard.types'
import { OptionHeader } from '../OptionsHeader/OptionHeader'
import './Toolbar.css'

interface ToolbarProps {
  readonly newNoteColor: NoteColor
  readonly onNewNoteColorChange: (color: NoteColor) => void
  readonly actions: NoteActions
}

export function Toolbar({
  newNoteColor,
  onNewNoteColorChange,
  actions,
}: ToolbarProps) {
  console.log(newNoteColor, 'newNoteColornewNoteColor')

  return (
    <header className="toolbar">
      <h1 className="toolbar__title">Sticky Notes</h1>
      <OptionHeader
        label="Color for new notes"
        value={newNoteColor}
        onChange={onNewNoteColorChange}
      />
      <button
        type="button"
        className="toolbar__restore"
        onClick={() => actions.undoRemoveLastCards()}
      >
        Restore
      </button>
    </header>
  )
}
