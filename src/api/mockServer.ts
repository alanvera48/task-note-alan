import { isNote, type Note } from "../components/NoteCard/NoteCard.types";

interface MockServerOptions {
  /** Where the "server" keeps its data; localStorage makes notes survive page reloads. */
  readonly storage: Pick<Storage, 'getItem' | 'setItem'>;
  /** Path prefix the API is served under, e.g. `/api`. */
  readonly basePath: string;
  readonly storageKey?: string;
  readonly latencyMs?: { readonly min: number; readonly max: number };
  /** Probability (0..1) of answering with a simulated 503, to exercise error handling. */
  readonly failureRate?: number;
}

const json = (status: number, data: unknown): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('The request was aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

/**
 * Creates a `fetch`-compatible function that serves the notes REST API in the browser:
 *
 *   GET    {basePath}/notes      -> 200 Note[]
 *   PUT    {basePath}/notes/:id  -> 200 Note (create or replace)
 *   DELETE {basePath}/notes/:id  -> 204
 *
 * Every response is delayed to behave like a real network round trip.
 */
export function createMockFetch({
  storage,
  basePath,
  storageKey = 'sticky-notes:v1',
  latencyMs = { min: 150, max: 450 },
  failureRate = 0,
}: MockServerOptions): typeof fetch {
  const collectionPath = `${basePath}/notes`;

  const readNotes = (): Note[] => {
    const raw = storage.getItem(storageKey);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isNote) : [];
  };

  const writeNotes = (notes: readonly Note[]): void => {
    storage.setItem(storageKey, JSON.stringify(notes));
  };

  async function handle(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === collectionPath) {
      return request.method === 'GET'
        ? json(200, readNotes())
        : json(405, { error: 'Method not allowed' });
    }
    if (!pathname.startsWith(`${collectionPath}/`)) return json(404, { error: 'Not found' });

    const id = decodeURIComponent(pathname.slice(collectionPath.length + 1));
    switch (request.method) {
      case 'PUT': {
        const body: unknown = await request.json().catch(() => null);
        if (!isNote(body) || body.id !== id) return json(400, { error: 'Invalid note' });
        const notes = readNotes();
        const index = notes.findIndex((note) => note.id === id);
        if (index === -1) notes.push(body);
        else notes[index] = body;
        writeNotes(notes);
        return json(200, body);
      }
      case 'DELETE':
        writeNotes(readNotes().filter((note) => note.id !== id));
        return new Response(null, { status: 204 });
      default:
        return json(405, { error: 'Method not allowed' });
    }
  }

  return async (input, init) => {
    const request = new Request(input, init);
    await delay(latencyMs.min + Math.random() * (latencyMs.max - latencyMs.min), request.signal);
    if (Math.random() < failureRate) return json(503, { error: 'Simulated outage' });
    try {
      return await handle(request);
    } catch {
      // Corrupted JSON in storage, quota exceeded, storage disabled...
      return json(500, { error: 'Storage unavailable' });
    }
  };
}
