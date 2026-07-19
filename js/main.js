import { CHALLENGE_BANK } from './challenges-data.js';
import { state, loadProfile, loadRoundStats, saveProfile, addEntry } from './data.js';
import {
  $, setStatus, renderAll, renderChallenges, renderMilestoneEditor,
  openModal, closeModal,
} from './render.js';

async function refresh() {
  setStatus('Loading…');
  try {
    await Promise.all([loadProfile(), loadRoundStats()]);
    setStatus('Synced');
    renderAll();
  } catch (err) {
    setStatus('Could not connect to Supabase — check your URL/key in the file.', true);
    console.error(err);
  }
}

document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
document.querySelectorAll('.cf-modal-backdrop').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeModal(); }));

// Log round
$('cfLogRoundBtn').addEventListener('click', () => { $('cfRoundScore').value = ''; openModal('cfModalRound'); });
$('cfRoundSave').addEventListener('click', async () => {
  const score = parseFloat($('cfRoundScore').value);
  if (isNaN(score)) return;
  let amount = Number(state.profile.round_flat);
  const notes = [];
  if (state.profile.best_score == null || score < state.profile.best_score) {
    amount += Number(state.profile.best_bonus);
    notes.push('personal best!');
    state.profile.best_score = score;
  }
  const achieved = state.profile.milestones_achieved || [];
  const newlyAchieved = [...achieved];
  for (const m of (state.profile.milestones || [])) {
    if (score <= m.score && !achieved.includes(m.score)) {
      amount += Number(m.bonus);
      notes.push(`broke ${m.score}`);
      newlyAchieved.push(m.score);
    }
  }
  await saveProfile({ best_score: state.profile.best_score, milestones_achieved: newlyAchieved });
  const label = `Round — shot ${score}${notes.length ? ' (' + notes.join(', ') + ')' : ''}`;
  closeModal();
  await addEntry('round', label, amount, { score });
  renderAll();
});

// Log practice
$('cfLogPracticeBtn').addEventListener('click', () => openModal('cfModalPractice'));
$('cfPracticeSave').addEventListener('click', async () => {
  const type = $('cfPracticeType').value;
  closeModal();
  await addEntry('practice', `Practice — ${type}`, Number(state.profile.practice_flat), { practice_type: type });
  renderAll();
});

// Challenges
$('cfNewChallengeBtn').addEventListener('click', async () => {
  const active = state.profile.active_challenges || [];
  if (active.length >= 3) { setStatus('Max 3 active challenges — complete or skip one first.'); return; }
  const used = new Set(active.map(c => c.text));
  const pool = CHALLENGE_BANK.filter(c => !used.has(c.text));
  const pick = pool[Math.floor(Math.random() * pool.length)] || CHALLENGE_BANK[Math.floor(Math.random() * CHALLENGE_BANK.length)];
  const min = Number(state.profile.challenge_min), max = Number(state.profile.challenge_max);
  const amount = Math.round((min + Math.random() * (max - min)) / 5) * 5;
  const challenge = { id: crypto.randomUUID(), tag: pick.tag, text: pick.text, amount };
  await saveProfile({ active_challenges: [...active, challenge] });
  renderChallenges();
});

$('cfChallenges').addEventListener('click', async (e) => {
  const completeId = e.target.getAttribute('data-complete');
  const skipId = e.target.getAttribute('data-skip');
  if (completeId) {
    const c = state.profile.active_challenges.find(x => x.id === completeId);
    const remaining = state.profile.active_challenges.filter(x => x.id !== completeId);
    await saveProfile({ active_challenges: remaining });
    await addEntry('challenge', `Challenge — ${c.text}`, Number(c.amount), { tag: c.tag });
    renderAll();
  } else if (skipId) {
    const remaining = state.profile.active_challenges.filter(x => x.id !== skipId);
    await saveProfile({ active_challenges: remaining });
    renderChallenges();
  }
});

// Settings
$('cfSettingsLink').addEventListener('click', () => {
  $('cfSetRoundFlat').value = state.profile.round_flat;
  $('cfSetBestBonus').value = state.profile.best_bonus;
  $('cfSetPracticeFlat').value = state.profile.practice_flat;
  $('cfSetBestScore').value = state.profile.best_score ?? '';
  $('cfSetChalMin').value = state.profile.challenge_min;
  $('cfSetChalMax').value = state.profile.challenge_max;
  $('cfSetBalanceAdjust').value = '';
  renderMilestoneEditor();
  openModal('cfModalSettings');
});

$('cfAddMilestone').addEventListener('click', () => {
  state.profile.milestones = [...(state.profile.milestones || []), { score: 90, bonus: 50 }];
  renderMilestoneEditor();
});

$('cfMilestoneList').addEventListener('click', (e) => {
  const idx = e.target.getAttribute('data-mremove');
  if (idx !== null) {
    state.profile.milestones.splice(Number(idx), 1);
    renderMilestoneEditor();
  }
});

$('cfApplyAdjust').addEventListener('click', async () => {
  const val = parseFloat($('cfSetBalanceAdjust').value);
  if (isNaN(val)) return;
  $('cfSetBalanceAdjust').value = '';
  await addEntry('adjustment', val >= 0 ? 'Manual adjustment' : 'Spent on clubs', val);
  renderAll();
});

$('cfSettingsSave').addEventListener('click', async () => {
  const rows = document.querySelectorAll('#cfMilestoneList .cf-milestone-row');
  const milestones = [];
  rows.forEach(row => {
    const score = parseFloat(row.querySelector('[data-mscore]').value);
    const bonus = parseFloat(row.querySelector('[data-mbonus]').value);
    if (!isNaN(score) && !isNaN(bonus)) milestones.push({ score, bonus });
  });
  const bestScoreVal = $('cfSetBestScore').value;
  const patch = {
    round_flat: parseFloat($('cfSetRoundFlat').value) || 0,
    best_bonus: parseFloat($('cfSetBestBonus').value) || 0,
    practice_flat: parseFloat($('cfSetPracticeFlat').value) || 0,
    challenge_min: parseFloat($('cfSetChalMin').value) || 0,
    challenge_max: parseFloat($('cfSetChalMax').value) || 0,
    best_score: bestScoreVal === '' ? null : parseFloat(bestScoreVal),
    milestones,
    milestones_achieved: (state.profile.milestones_achieved || []).filter(sc => milestones.some(m => m.score === sc)),
  };
  await saveProfile(patch);
  closeModal();
  renderAll();
});

refresh();
