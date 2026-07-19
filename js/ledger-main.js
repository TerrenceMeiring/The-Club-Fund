import { loadEntries } from './data.js';
import { setStatus, renderLedger } from './render.js';

async function refresh() {
  setStatus('Loading…');
  try {
    await loadEntries();
    setStatus('Synced');
    renderLedger();
  } catch (err) {
    setStatus('Could not connect to Supabase — check your URL/key in the file.', true);
    console.error(err);
  }
}

refresh();
