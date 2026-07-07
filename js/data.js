import { supabase } from './supabase-client.js';

// `state` holds the app's current data in memory.
// Other files import this same object, so they all see the same data.
export const state = {
  profile: null,
  entries: [],
};

export async function loadAll() {
  const [{ data: p, error: pErr }, { data: e, error: eErr }] = await Promise.all([
    supabase.from('cf_profile').select('*').eq('id', 1).single(),
    supabase.from('cf_entries').select('*').order('created_at', { ascending: false }).limit(300),
  ]);
  if (pErr || eErr) {
    throw pErr || eErr;
  }
  state.profile = p;
  state.entries = e || [];
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
  await loadAll();
}