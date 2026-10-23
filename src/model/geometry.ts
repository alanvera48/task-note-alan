import type { Note } from "../components/NoteCard/NoteCard.types";


export interface Point {
  readonly x: number
  readonly y: number
}

export interface Size {
  readonly width: number
  readonly height: number
}

export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export const RESIZE_HANDLES: readonly ResizeHandle[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
export interface Rect extends Point, Size {}

export const MIN_SIZE: Size = {
  width: 140,
  height: 100,
}

export const DEFAULT_NOTE_SIZE: Size = {
  width: 220,
  height: 200,
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max))

export function clampRect(rect: Rect, bounds: Size): Rect {
  const width = Math.min(rect.width, bounds.width)
  const height = Math.min(rect.height, bounds.height)
  return {
    x: clamp(rect.x, 0, bounds.width - width),
    y: clamp(rect.y, 0, bounds.height - height),
    width,
    height,
  }
}

export function rectFromDrag(origin: Point, delta: Point, minSize: Size): Rect {
  const width = Math.max(Math.abs(delta.x), minSize.width)
  const height = Math.max(Math.abs(delta.y), minSize.height)
  return {
    x: delta.x < 0 ? origin.x - width : origin.x,
    y: delta.y < 0 ? origin.y - height : origin.y,
    width,
    height,
  }
}

export const topZ = (notes: readonly Note[]): number =>
    notes.reduce((max, note) => Math.max(max, note.z), 0);

export function rectsEqual(a: Rect, b: Rect): boolean {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  }
  

  export function translateRect(rect: Rect, delta: Point, bounds: Size): Rect {
    return clampRect({ ...rect, x: rect.x + delta.x, y: rect.y + delta.y }, bounds);
  }

  export function containsPoint(rect: Rect, point: Point): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  export function resizeRect(
    rect: Rect,
    handle: ResizeHandle,
    delta: Point,
    minSize: Size,
    bounds: Size,
  ): Rect {
    let left = rect.x;
    let top = rect.y;
    let right = rect.x + rect.width;
    let bottom = rect.y + rect.height;
  
    if (handle.includes('w')) left = clamp(left + delta.x, 0, right - minSize.width);
    if (handle.includes('e')) right = clamp(right + delta.x, left + minSize.width, bounds.width);
    if (handle.includes('n')) top = clamp(top + delta.y, 0, bottom - minSize.height);
    if (handle.includes('s')) bottom = clamp(bottom + delta.y, top + minSize.height, bounds.height);
  
    return { x: left, y: top, width: right - left, height: bottom - top };
  }

  export function centerRectAt(center: Point, size: Size): Rect {
    return { x: center.x - size.width / 2, y: center.y - size.height / 2, ...size };
  }
  