import type { Ref } from 'react';
import './TrashZone.css';

export type TrashStateZone = 'idle' | 'armed' | 'hot';

const LABELS: Readonly<Record<TrashStateZone, string>> = {
  idle: 'Trash',
  armed: 'Drop here to delete',
  hot: 'Release to delete',
};

interface TrashZoneProps {
  readonly ref: Ref<HTMLDivElement>;
  readonly state: TrashStateZone;
}

export function TrashZone({ ref, state }: TrashZoneProps) {
  console.log(ref, "refref");
  
  return (
    <div ref={ref} className="trash" data-state={state} title="Drag a note here to delete it">
      <svg
        className="trash__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <g className="trash__lid">
          <path d="M4 7h16" />
          <path d="M9.5 7V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
        </g>
        <path d="M6 7l.9 12.1a1.5 1.5 0 0 0 1.5 1.4h7.2a1.5 1.5 0 0 0 1.5-1.4L18 7" />
        <path d="M10 11v6M14 11v6" />
      </svg>
      <span className="trash__label" aria-live="polite">
        {LABELS[state]}
      </span>
    </div>
  );
}
