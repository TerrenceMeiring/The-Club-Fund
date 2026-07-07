import { state } from './data.js';

export const $ = (id) => document.getElementById(id);
export const fmt = (n) => `R${Number(n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;

export function setStatus(msg, isError = false) {
  $('cfStatus').textContent = msg;
  $('cfStatus').style.color = isError ? 'var(--flag)' : 'var(--ink-soft)';
}

export function renderBalance() {
  $('cfBalance').textContent = fmt(state.profile.balance);
  $('cfEarned').textContent = `${fmt(state.profile.total_earned)} earned to date`;
}

export function renderStats() {
  const rounds = state.entries.filter(e => e.type === 'round' && e.meta && e.meta.score != null);
  $('cfStatBest').textContent = state.profile.best_score != null ? state.profile.best_score : '—';
  $('cfStatRounds').textContent = rounds.length;
  if (rounds.length) {
    const avg = rounds.reduce((s, r) => s + Number(r.meta.score), 0) / rounds.length;
    $('cfStatAvg').textContent = avg.toFixed(1);
  } else {
    $('cfStatAvg').textContent = '—';
  }
}

export function renderChallenges() {
  const wrap = $('cfChallenges');
  const active = state.profile.active_challenges || [];
  if (!active.length) {
    wrap.innerHTML = '<p class="cf-empty">No active challenges — draw one above.</p>';
    return;
  }
  wrap.innerHTML = active.map(c => `
    <div class="cf-chal">
      <div>
        <span class="cf-chal-tag">${c.tag}</span>
        <span class="cf-chal-text">${c.text}</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="cf-chal-amt">+${fmt(c.amount)}</span>
        <div class="cf-chal-actions">
          <button class="cf-btn cf-small" data-complete="${c.id}">Complete</button>
          <button class="cf-btn cf-ghost cf-small" data-skip="${c.id}">Skip</button>
        </div>
      </div>
    </div>
  `).join('');
}

export function renderLedger() {
  const wrap = $('cfLedger');
  if (!state.entries.length) {
    wrap.innerHTML = '<p class="cf-empty">Nothing logged yet.</p>';
    return;
  }
  wrap.innerHTML = state.entries.slice(0, 50).map(e => {
    const date = new Date(e.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
    const cls = e.amount >= 0 ? 'pos' : 'neg';
    const sign = e.amount >= 0 ? '+' : '';
    return `
      <div class="cf-ledger-row">
        <div class="cf-ledger-main">
          <span>${e.label}</span>
          <span class="cf-ledger-date">${date}</span>
        </div>
        <span class="cf-ledger-amt ${cls}">${sign}${fmt(e.amount)}</span>
      </div>
    `;
  }).join('');
}

export function renderAll() {
  renderBalance();
  renderStats();
  renderChallenges();
  renderLedger();
}

export function renderMilestoneEditor() {
  const list = $('cfMilestoneList');
  list.innerHTML = (state.profile.milestones || []).map((m, i) => `
    <div class="cf-milestone-row">
      <input type="number" data-mscore value="${m.score}" placeholder="score" />
      <input type="number" data-mbonus value="${m.bonus}" placeholder="bonus R" />
      <button class="cf-btn cf-ghost cf-small" data-mremove="${i}">✕</button>
    </div>
  `).join('');
}

export function openModal(id) { $(id).classList.remove('cf-hidden'); }
export function closeModal() { document.querySelectorAll('.cf-modal-backdrop').forEach(m => m.classList.add('cf-hidden')); }