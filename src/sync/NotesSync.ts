import type { NotesApi } from '../api/notesApi'
import type { Note } from '../components/NoteCard/NoteCard.types';

const DEBOUNCE_MS = 400
const RETRY_MS = 3000

type Job = { readonly kind: 'save'; readonly note: Note } | { readonly kind: 'remove' }

export class NotesSync {
  private readonly jobs = new Map<string, Job>()
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly sending = new Set<string>()
  private readonly api: NotesApi

  constructor(api: NotesApi) {
    this.api = api
  }

  save(note: Note): void {
    console.log('save', note);
    
    this.enqueue(note.id, { kind: 'save', note }, DEBOUNCE_MS)
  }

  remove(id: string): void {
    this.enqueue(id, { kind: 'remove' }, 0)
  }

  private enqueue(id: string, job: Job, delayMs: number): void {
    this.jobs.set(id, job)
    const timer = this.timers.get(id)
    if (timer) clearTimeout(timer)
    this.timers.set(
      id,
      setTimeout(() => {
        void this.flush(id)
      }, delayMs),
    )
  }

  private async flush(id: string): Promise<void> {
    this.timers.delete(id)
    if (this.sending.has(id)) return

    const job = this.jobs.get(id)
    if (!job) return

    this.jobs.delete(id)
    this.sending.add(id)
    try {
      if (job.kind === 'save') await this.api.save(job.note)
      else await this.api.remove(id)
    } catch {
      if (!this.jobs.has(id)) {
        this.jobs.set(id, job)
        this.timers.set(
          id,
          setTimeout(() => {
            void this.flush(id)
          }, RETRY_MS),
        )
      }
    } finally {
      this.sending.delete(id)
      if (this.jobs.has(id) && !this.timers.has(id)) void this.flush(id)
    }
  }
}
