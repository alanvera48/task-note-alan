import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/global.css'
import { createNotesApiRest } from './api/notesApi.ts'
import { createMockFetch } from './api/mockServer.ts'
import { NotesSync } from './sync/NotesSync.ts'

const failureRate = Number(
  new URLSearchParams(window.location.search).get('failureRate') ?? 0,
)

const notesApi = createNotesApiRest({
  base: '/api',
  fetch: createMockFetch({
    storage: window.localStorage,
    basePath: '/api',
    failureRate,
  }),
})

const sync = new NotesSync(notesApi)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App api={notesApi} sync={sync} />
  </StrictMode>,
)
