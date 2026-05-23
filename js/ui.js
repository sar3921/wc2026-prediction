// =============================================================================
// ui.js — Shared UI helpers (toast, spinner, modal, team pickers)
// =============================================================================

// ---------------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------------
function ensureToastContainer() {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = 'info', duration = 3000) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---------------------------------------------------------------------------
// Spinner overlay
// ---------------------------------------------------------------------------
function showSpinner() {
  let el = document.getElementById('spinner-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'spinner-overlay';
    el.className = 'spinner-overlay';
    el.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(el);
  }
  el.classList.add('active');
}

function hideSpinner() {
  const el = document.getElementById('spinner-overlay');
  if (el) el.classList.remove('active');
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
function showModal({ title, body, confirmLabel = 'OK', confirmClass = 'btn-primary', cancelLabel = '閉じる', onConfirm, onCancel } = {}) {
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 id="modal-title"></h3>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
        <div class="modal-footer" id="modal-footer"></div>
      </div>`;
    document.body.appendChild(overlay);
  }

  document.getElementById('modal-title').textContent = title || '';
  document.getElementById('modal-body').innerHTML = body || '';

  const footer = document.getElementById('modal-footer');
  footer.innerHTML = '';

  if (cancelLabel) {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-ghost btn-sm';
    cancelBtn.textContent = cancelLabel;
    cancelBtn.onclick = () => { closeModal(); if (onCancel) onCancel(); };
    footer.appendChild(cancelBtn);
  }

  if (onConfirm) {
    const confirmBtn = document.createElement('button');
    confirmBtn.className = `btn ${confirmClass} btn-sm`;
    confirmBtn.textContent = confirmLabel;
    confirmBtn.onclick = () => { closeModal(); onConfirm(); };
    footer.appendChild(confirmBtn);
  }

  document.getElementById('modal-close-btn').onclick = () => { closeModal(); if (onCancel) onCancel(); };
  overlay.onclick = (e) => { if (e.target === overlay) { closeModal(); if (onCancel) onCancel(); } };
  overlay.classList.add('active');
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

// ---------------------------------------------------------------------------
// Team multi-select grid (reusable)
// ---------------------------------------------------------------------------
function renderTeamGrid({ containerId, teams, selected = [], maxSelect = null, onSelect, disabled = false }) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  container.className = 'team-grid';

  const selectedSet = new Set(selected.map(t => t.toLowerCase()));

  teams.forEach(team => {
    const chip = document.createElement('div');
    chip.className = 'team-chip';
    chip.textContent = teamJa(team);
    chip.dataset.team = team;

    const isSelected = selectedSet.has(team.toLowerCase());
    if (isSelected) chip.classList.add('selected');
    if (disabled) chip.classList.add('disabled');

    if (!disabled) {
      chip.addEventListener('click', () => {
        const nowSelected = chip.classList.contains('selected');
        if (nowSelected) {
          chip.classList.remove('selected');
          selectedSet.delete(team.toLowerCase());
        } else {
          if (maxSelect && selectedSet.size >= maxSelect) {
            showToast(`最大${maxSelect}チームまで選択できます`, 'error');
            return;
          }
          chip.classList.add('selected');
          selectedSet.add(team.toLowerCase());
        }
        if (onSelect) onSelect([...selectedSet]);
      });
    }

    container.appendChild(chip);
  });
}

function getSelectedTeams(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return [...container.querySelectorAll('.team-chip.selected')].map(el => el.dataset.team);
}

// ---------------------------------------------------------------------------
// Group row picker (1st / 2nd dropdowns for a single group)
// ---------------------------------------------------------------------------
function renderGroupRow({ containerId, groupKey, teams, first = '', second = '', locked = false, onChange }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const makeSelect = (label, value, name) => {
    const sel = document.createElement('select');
    sel.className = 'form-select';
    sel.style.flex = '1';
    sel.disabled = locked;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = `${label}を選択`;
    sel.appendChild(placeholder);
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (t === value) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      if (onChange) {
        const selects = container.querySelectorAll('select');
        onChange(groupKey, selects[0].value, selects[1].value);
      }
    });
    return sel;
  };

  container.style.cssText = 'display:flex;gap:6px;align-items:center;';

  const label = document.createElement('span');
  label.style.cssText = 'font-weight:700;font-size:14px;width:24px;flex-shrink:0;';
  label.textContent = groupKey;

  container.appendChild(label);
  container.appendChild(makeSelect('1位', first, 'first'));
  container.appendChild(makeSelect('2位', second, 'second'));
}

// ---------------------------------------------------------------------------
// Score display helpers
// ---------------------------------------------------------------------------
function formatPts(n) {
  return n === null || n === undefined ? '—' : `${n}pt`;
}

function ptsColor(pts, max) {
  if (!pts || !max) return '';
  const ratio = pts / max;
  if (ratio >= 0.8) return 'text-green';
  if (ratio >= 0.5) return '';
  return 'text-muted';
}

// ---------------------------------------------------------------------------
// Copy to clipboard
// ---------------------------------------------------------------------------
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('クリップボードにコピーしました', 'success');
  }).catch(() => {
    showToast('コピーできませんでした', 'error');
  });
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
function initTabs(tabBarId, defaultTab) {
  const bar = document.getElementById(tabBarId);
  if (!bar) return;
  bar.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
  activateTab(defaultTab || bar.querySelector('.tab-btn')?.dataset.tab);
}

function activateTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabId));
}

// ---------------------------------------------------------------------------
// Debounce
// ---------------------------------------------------------------------------
function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// ---------------------------------------------------------------------------
// Format datetime
// ---------------------------------------------------------------------------
function fmtDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
