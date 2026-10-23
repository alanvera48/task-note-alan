import type { NoteColor } from '../NoteCard/NoteCard.types';
import { OptionHeader } from '../OptionsHeader/OptionHeader';
import './Toolbar.css';


interface ToolbarProps {
  readonly newNoteColor: NoteColor;
  readonly onNewNoteColorChange: (color: NoteColor) => void;
}

export function Toolbar({ newNoteColor, onNewNoteColorChange }: ToolbarProps) {
  console.log(newNoteColor, "newNoteColornewNoteColor");
  
  return (
    <header className="toolbar">
      <h1 className="toolbar__title">Sticky Notes</h1>
      <div className="toolbar__color">
        <span>New note</span>
        <OptionHeader
          label="Color for new notes"
          value={newNoteColor}
          onChange={onNewNoteColorChange}
        />
      </div>
      <p className="toolbar__hint">
        Drag your notes around the board
      </p>
    </header>
  );
}
