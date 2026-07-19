import { supabase } from './supabase-client.js';

// `state` holds the app's current data in memory.
// Other files import this same object, so they all see the same data.
export const state = {
  profile: null,
  entries: [],
};

// Home page load: just the profile row (balance, best score, rules — one small row).
export async function loadProfile() {
  const { data, error } = await supabase.from('cf_profile').select('*').eq('id', 1).single();
  if (error) throw error;
  state.profile = data;
}

// Home page load: only what's needed to compute average score / rounds count.
// Selects just `meta` on round-type rows, not the full ledger (no labels/amounts/other types).
export async function loadRoundStats(limit = 300) {
  const { data, error } = await supabase
    .from('cf_entries')
    .select('meta')
    .eq('type', 'round')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  state.entries = data || [];
}

// Ledger page load only: the full entry history.
export async function loadEntries(limit = 300) {
  const { data, error } = await supabase
    .from('cf_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  state.entries = data || [];
}

export async function saveProfile(patch) {
  Object.assign(state.profile, patch);
  const { error } = await supabase.from('cf_profile').update(patch).eq('id', 1);
  if (error) throw error;
}

export async function addEntry(type, label, amount, meta = null) {
  const { error } = await supabase.from('cf_entries').insert({ type, label, amount, meta });
  if (error) throw error;
  state.profile.balance = Number(state.profile.balance) + amount;
  if (amount > 0) state.profile.total_earned = Number(state.profile.total_earned) + amount;
  await saveProfile({ balance: state.profile.balance, total_earned: state.profile.total_earned });
  // Update stats locally instead of refetching — this is the trip that was slowing things down on-course.
  if (type === 'round') {
    state.entries = [{ meta }, ...state.entries];
  }
}
