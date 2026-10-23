import type { Rect } from "../../model/geometry";

export const NOTE_COLORS = [
    'yellow',
    'pink',
    'green',
    'blue',
    'violet',
  ] as const
  
  export type NoteColor = (typeof NOTE_COLORS)[number]
  
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;
  
  const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);
  
  const isRect = (value: unknown): value is Rect =>
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height);
  
  
  export const isNote = (value: unknown): value is Note =>
    isRecord(value) &&
    typeof value.id === 'string' &&
    isRect(value.rect) &&
    typeof value.text === 'string' &&
    isNoteColor(value.color) &&
    isFiniteNumber(value.z);
  
    export const isNoteColor = (value: unknown): value is NoteColor =>
      NOTE_COLORS.some((color) => color === value);
  
  
  export const NOTE_COLOR_LABELS: Readonly<Record<NoteColor, string>> = {
    yellow: 'Yellow',
    pink: 'Pink',
    green: 'Green',
    blue: 'Blue',
    violet: 'Violet',
  }
  
  export interface Note {
    id: string
    color: NoteColor
    text: string
    z: number
    rect: Rect
  }