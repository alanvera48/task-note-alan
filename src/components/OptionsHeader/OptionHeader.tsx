
import { NOTE_COLORS } from '../../hooks/useNotes';
import { NOTE_COLOR_LABELS, type NoteColor } from '../NoteCard/NoteCard.types';
import './OptionHeader.css';

interface OptionHeaderProps {
  readonly value: NoteColor;
  readonly onChange: (color: NoteColor) => void;
  readonly label: string;
  readonly className?: string;
}

export function OptionHeader({ value, onChange, label, className }: OptionHeaderProps) {
  return (
    <div
      className={className ? `option-header ${className}` : 'option-header'}
      role="group"
      aria-label={label}
    >
      {NOTE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="option"
          data-color={color}
          aria-pressed={color === value}
          aria-label={NOTE_COLOR_LABELS[color as NoteColor]}
          title={NOTE_COLOR_LABELS[color as NoteColor]}
          onClick={() => {
            onChange(color);
          }}
        />
      ))}
    </div>
  );
}
