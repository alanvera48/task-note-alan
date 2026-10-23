import { isNote, type Note } from "../components/NoteCard/NoteCard.types";

/** Persistence boundary for notes. */
export interface NotesApi {
  readonly list: (signal?: AbortSignal) => Promise<readonly Note[]>;
  readonly save: (note: Note) => Promise<void>;
  readonly remove: (id: string) => Promise<void>;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RestNotesApiOptions {
  readonly base: string;
  readonly fetch: typeof fetch;
}

export function createNotesApiRest({ base, fetch: send }: RestNotesApiOptions): NotesApi {
  const collectionUrl = `${base}/notes`;
  const noteUrl = (id: string) => `${collectionUrl}/${encodeURIComponent(id)}`;

  async function request(url: string, init: RequestInit): Promise<Response> {
    const response = await send(url, init);
    if (!response.ok) {
      throw new ApiError(
        response.status,
        `${init.method ?? 'GET'} ${url} failed with ${String(response.status)}`,
      );
    }
    return response;
  }

  return {
    async list(signal) {
      const response = await request(collectionUrl, { signal });
      const body: unknown = await response.json();
      if (!Array.isArray(body)) throw new ApiError(response.status, 'Malformed notes payload');
      return body.filter(isNote);
    },

    async save(note) {
      await request(noteUrl(note.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
    },

    async remove(id) {
      await request(noteUrl(id), { method: 'DELETE' });
    },
  };
}
