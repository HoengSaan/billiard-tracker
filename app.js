/* ============================================================
   app.js — application logic

   Loaded after i18n.js as a classic script, because several rows are
   generated as HTML with inline onclick handlers, which need these
   functions to live on window.
   ============================================================ */

// ============================================================
// TDF CONSTANTS
// ============================================================
const TDF_MIN = 0.6316095;
const TDF_MAX = 2.67375;
const TDF_DEFAULT = 1.00;

// ============================================================
// TOAST
// ============================================================
function ensureToastContainer() {
  let c = document.getElementById('toastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}

const TOAST_ICONS = { info:'info', success:'circle-check', warning:'triangle-alert', error:'circle-x' };

function showToast(msg, type = 'info', duration = 3200) {
  const container = ensureToastContainer();
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `
    <span class="toast-icon">${ICON(TOAST_ICONS[type] || TOAST_ICONS.info)}</span>
    <span class="toast-body"></span>
    <button class="toast-close" aria-label="close">${ICON('x')}</button>`;
  el.querySelector('.toast-body').textContent = msg;
  const remove = () => {
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(() => el.remove(), 260);
  };
  el.querySelector('.toast-close').onclick = remove;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  if (duration > 0) setTimeout(remove, duration);
  return remove;
}

// ============================================================
// MODAL — confirm / prompt (returns Promise)
// ============================================================
function modalConfirm({ title, message, okText, cancelText, danger } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        ${title ? `<h3></h3>` : ''}
        ${message ? `<p></p>` : ''}
        <div class="modal-actions">
          <button class="cancel"></button>
          <button class="primary ok"></button>
        </div>
      </div>`;
    if (title) overlay.querySelector('h3').textContent = title;
    if (message) overlay.querySelector('p').textContent = message;
    const okBtn = overlay.querySelector('.ok');
    const cancelBtn = overlay.querySelector('.cancel');
    okBtn.textContent = okText || t('ok');
    cancelBtn.textContent = cancelText || t('cancel');
    if (danger) {
      okBtn.classList.remove('primary');
      okBtn.classList.add('danger');
    }
    const close = (val) => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
      document.removeEventListener('keydown', onKey);
      resolve(val);
    };
    const onKey = e => {
      if (e.key === 'Escape') close(false);
      else if (e.key === 'Enter') close(true);
    };
    okBtn.onclick = () => close(true);
    cancelBtn.onclick = () => close(false);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    setTimeout(() => {
      if (danger) cancelBtn.focus();
      else okBtn.focus();
    }, 60);
  });
}

// Multi-option variant of modalConfirm. `options` is an array of
// { value, label, style } where style is '' | 'primary' | 'danger'.
// Resolves with the chosen value.
function modalChoose({ title, message, options = [] } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        ${title ? `<h3></h3>` : ''}
        ${message ? `<p></p>` : ''}
        <div class="modal-actions"></div>
      </div>`;
    if (title) overlay.querySelector('h3').textContent = title;
    if (message) overlay.querySelector('p').textContent = message;

    const actions = overlay.querySelector('.modal-actions');
    options.forEach(opt => {
      const b = document.createElement('button');
      b.textContent = opt.label;
      if (opt.style) b.classList.add(opt.style);
      b.onclick = () => close(opt.value);
      actions.appendChild(b);
    });

    const close = (val) => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
      document.removeEventListener('keydown', onKey);
      resolve(val);
    };
    const onKey = e => { if (e.key === 'Escape') close(null); };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    setTimeout(() => {
      const first = actions.querySelector('button');
      if (first) first.focus();
    }, 60);
  });
}

function modalPrompt({ title, message, defaultValue = '', placeholder = '', okText, cancelText } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        ${title ? `<h3></h3>` : ''}
        ${message ? `<p></p>` : ''}
        <input type="text">
        <div class="modal-actions">
          <button class="cancel"></button>
          <button class="primary ok"></button>
        </div>
      </div>`;
    if (title) overlay.querySelector('h3').textContent = title;
    if (message) overlay.querySelector('p').textContent = message;
    const input = overlay.querySelector('input');
    input.value = defaultValue;
    input.placeholder = placeholder;
    const okBtn = overlay.querySelector('.ok');
    const cancelBtn = overlay.querySelector('.cancel');
    okBtn.textContent = okText || t('ok');
    cancelBtn.textContent = cancelText || t('cancel');
    const close = (val) => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
      document.removeEventListener('keydown', onKey);
      resolve(val);
    };
    const onKey = e => {
      if (e.key === 'Escape') close(null);
      else if (e.key === 'Enter') close(input.value.trim() || null);
    };
    okBtn.onclick = () => close(input.value.trim() || null);
    cancelBtn.onclick = () => close(null);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    setTimeout(() => { input.focus(); input.select(); }, 60);
  });
}

// Multi-field prompt. fields = [{ id, label, defaultValue, placeholder, type }]
function modalPrompt2({ title, message, fields = [], okText, cancelText } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const fieldsHTML = fields.map(f => {
      const id = escapeAttr(f.id);
      const lbl = f.label ? `<label for="${id}" style="display:block;font-size:.95rem;color:var(--text-secondary);margin-bottom:4px;">${escapeHtml(f.label)}</label>` : '';
      const inputType = f.type || 'text';
      const ph = f.placeholder ? ` placeholder="${escapeAttr(f.placeholder)}"` : '';
      const dv = f.defaultValue !== undefined && f.defaultValue !== null ? ` value="${escapeAttr(String(f.defaultValue))}"` : '';
      return `<div style="margin-bottom:12px;">${lbl}<input type="${inputType}" id="${id}"${ph}${dv} style="width:100%;"></div>`;
    }).join('');
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        ${title ? `<h3></h3>` : ''}
        ${message ? `<p></p>` : ''}
        ${fieldsHTML}
        <div class="modal-actions">
          <button class="cancel"></button>
          <button class="primary ok"></button>
        </div>
      </div>`;
    if (title) overlay.querySelector('h3').textContent = title;
    if (message) overlay.querySelector('p').textContent = message;
    // Reuse modal-box input style by wrapping
    overlay.querySelectorAll('input').forEach(inp => {
      inp.style.background = 'var(--bg-card-alt)';
      inp.style.border = '1px solid var(--border-light)';
      inp.style.borderRadius = '30px';
      inp.style.padding = '10px 18px';
      inp.style.fontFamily = 'inherit';
      inp.style.fontSize = '1.05rem';
      inp.style.color = 'var(--text-primary)';
      inp.style.minHeight = '44px';
      inp.style.marginBottom = '0';
    });
    const okBtn = overlay.querySelector('.ok');
    const cancelBtn = overlay.querySelector('.cancel');
    okBtn.textContent = okText || t('ok');
    cancelBtn.textContent = cancelText || t('cancel');
    const collect = () => {
      const out = {};
      fields.forEach(f => { out[f.id] = overlay.querySelector('#' + cssEscape(f.id)).value.trim(); });
      return out;
    };
    const close = (val) => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
      document.removeEventListener('keydown', onKey);
      resolve(val);
    };
    const onKey = e => {
      if (e.key === 'Escape') close(null);
      else if (e.key === 'Enter') close(collect());
    };
    okBtn.onclick = () => close(collect());
    cancelBtn.onclick = () => close(null);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    const first = overlay.querySelector('input');
    if (first) setTimeout(() => { first.focus(); first.select(); }, 60);
  });
}

function cssEscape(s) {
  return String(s).replace(/([^\w-])/g, '\\$1');
}

// ============================================================
// SUMMARY MODAL
// ============================================================
function modalSummary({ html, autoCloseMs = 30000, closeLabel = 'Close' } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box summary-box" role="dialog" aria-modal="true">
        ${html}
        <div class="summary-actions">
          <button class="summary-close"></button>
        </div>
      </div>`;
    const closeBtn = overlay.querySelector('.summary-close');
    const panel = overlay.querySelector('.modal-box');

    let remaining = Math.ceil(autoCloseMs / 1000);
    let timer = null;

    const refreshLabel = () => {
      closeBtn.textContent = remaining > 0
        ? closeLabel.replace('{s}', remaining)
        : t('close');
    };
    refreshLabel();

    const close = (val) => {
      if (timer) { clearInterval(timer); timer = null; }
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
      document.removeEventListener('keydown', onKey);
      resolve(val);
    };

    const startTimer = () => {
      if (autoCloseMs <= 0) return;
      timer = setInterval(() => {
        remaining--;
        if (remaining <= 0) { close(true); return; }
        refreshLabel();
      }, 1000);
    };

    const stopTimer = () => {
      if (timer) { clearInterval(timer); timer = null; }
      remaining = 0;
      refreshLabel();
    };

    panel.addEventListener('click', stopTimer);
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(true); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(true); });

    const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter') close(true); };
    document.addEventListener('keydown', onKey);

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    setTimeout(() => closeBtn.focus(), 60);
    startTimer();
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtDuration(secs) {
  if (secs === null || secs === undefined || isNaN(secs)) return '—';
  return formatTime(Math.round(secs));
}

function fmtNum(n, digits = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return digits === 0 ? String(Math.round(n)) : Number(n).toFixed(digits);
}

// Round half-down toward zero (104.5 -> 104, 105.5 -> 105)
function roundHalfDown(n) {
  return Math.ceil(n - 0.5);
}

// Return the TDF-adjusted score for a session using its stored table TDF.
// tdf is stored on the session at start time (tableTdf).
function adjustedScore(raw, tdf) {
  const f = (typeof tdf === 'number' && isFinite(tdf) && tdf > 0) ? tdf : TDF_DEFAULT;
  return roundHalfDown(raw * f);
}

// Whether the "Adjusted" display mode is on
function isTdfAdjustedMode() {
  const el = document.querySelector('input[name="tdfDisplay"]:checked');
  return el ? el.value === 'adjusted' : true;
}

// Return effective score for a session based on the toggle
function effectiveSessionScore(s) {
  const raw = s.totalScore || 0;
  if (!isTdfAdjustedMode()) return raw;
  return adjustedScore(raw, s.tableTdf);
}

function renderScorePair(raw, adj, digits = 0) {
  const r = fmtNum(raw, digits);
  if (adj === null || adj === undefined) return r;
  const a = fmtNum(adj, digits);
  return a === r ? r : `${r} <span class="tdf-adj">(${a})</span>`;
}

function summaryScoreCell(raw, tdf) {
  const r = Math.round(raw || 0);
  const adj = isTdfAdjustedMode() ? adjustedScore(raw || 0, tdf) : null;
  return renderScorePair(r, adj, 0);
}

function effectiveSessionAverage(s) {
  const raw = s.average || 0;
  if (!isTdfAdjustedMode()) return raw;
  return raw * (s.tableTdf || TDF_DEFAULT);
}

function summarizeSessionBreakdown(s) {
  const fouls = {}, mistakes = {}, breaks = {};

  if (s.mode === 'bowlard') {
    (s.frames || []).forEach(f => {
      if (!f) return;
      const slots = [
        f.details,
        f.details2,
        f.details3 
      ];
      slots.forEach(d => {
        if (!d) return;
        (d.fouls || []).forEach(x => {
          const tr = translateDetailItem(x);
          fouls[tr] = (fouls[tr] || 0) + 1;
        });
        (d.mistakes || []).forEach(x => {
          const tr = translateDetailItem(x);
          mistakes[tr] = (mistakes[tr] || 0) + 1;
        });
      });
    });
  } else {
    (s.innings || []).forEach(inn => {
      if (inn.breakResult) {
        const tr = translateBreakResult(inn.breakResult);
        breaks[tr] = (breaks[tr] || 0) + 1;
      }
      (inn.fouls || []).forEach(f => {
        const tr = translateDetailItem(f);
        fouls[tr] = (fouls[tr] || 0) + 1;
      });
      (inn.mistakes || []).forEach(m => {
        const tr = translateDetailItem(m);
        mistakes[tr] = (mistakes[tr] || 0) + 1;
      });
    });
  }

  const fmtMap = (map) =>
    Object.keys(map).length
      ? Object.entries(map).sort((a,b) => b[1]-a[1]).map(([k,v]) => `${escapeHtml(k)} ×${v}`).join(' · ')
      : '—';

  return {
    breaks: fmtMap(breaks),
    fouls: fmtMap(fouls),
    mistakes: fmtMap(mistakes),
  };
}

function rankPlateHtml(label, className) {
  return `<span class="rank-plate ${className}">${escapeHtml(label)}</span>`;
}

function showSessionSummary(s) {
  if (!s) return;
  const player = appData.players.find(p => p.id === s.playerId);
  const sameMode = appData.sessions.filter(x =>
    x.completed && x.playerId === s.playerId && x.mode === s.mode && x.id !== s.id
  );
  const last = sameMode[0] || null;
  const secondLast = sameMode[1] || null;

  const title = t('sessionSummary');
  const breakdown = summarizeSessionBreakdown(s);
  let tableHTML = '';
  let targetHTML = '';

  const buildTargetBar = (tgt, ach) => {
    const pctRaw = tgt > 0 ? (ach / tgt) * 100 : 0;
    const pct = Math.min(100, pctRaw);
    const pctText = Math.round(pctRaw);
    const labels = t('targetLine')
      .replace('{t}', String(tgt))
      .replace('{s}', String(ach))
      .replace('{p}', String(pctText));
    return `<div class="summary-target">
      <div class="target-labels"><span>${escapeHtml(labels)}</span></div>
      <div class="target-bar">
        <div class="target-bar-fill${pct >= 100 ? ' done' : ''}" style="width:${pct}%"></div>
      </div>
    </div>`;
  };

  if (s.mode === 'bowlard') {
    const allMode = appData.sessions.filter(x =>
      x.completed && x.playerId === s.playerId && x.mode === 'bowlard'
    );
    const lifeRawSum = allMode.reduce((sum, x) => sum + (x.totalScore || 0), 0);
    const lifeAdjSum = isTdfAdjustedMode()
      ? allMode.reduce((sum, x) => sum + adjustedScore(x.totalScore || 0, x.tableTdf), 0)
      : lifeRawSum;
    const lifeAvgRaw = allMode.length ? lifeRawSum / allMode.length : 0;
    const lifeAvgAdj = allMode.length ? lifeAdjSum / allMode.length : 0;
    const lifeAvg = isTdfAdjustedMode() ? lifeAvgAdj : lifeAvgRaw;  // 用於 rank

    const trio = [s, last, secondLast];
    const hasTrio = trio.every(Boolean);

    const marks = (sess) => sess ? countBowlardMarks(sess.frames || []) : null;
    const mCur = marks(s);
    const mLast = marks(last);
    const mSecond = marks(secondLast);

    const highRunOf = (sess) => {
      if (!sess) return null;
      const r = computeBowlardFrames(sess.frames || []);
      return r.high;
    };
    const playSecs = (sess) => sess ? parseDuration(sess.timeElapsed) : null;

    const avgMarks = (() => {
      if (!allMode.length) return { strikes: null, spares: null };
      let ts = 0, sp = 0;
      allMode.forEach(x => {
        const m = countBowlardMarks(x.frames || []);
        ts += m.strikes; sp += m.spares;
      });
      return { strikes: ts / allMode.length, spares: sp / allMode.length };
    })();
    const avgHighRun = (() => {
      if (!allMode.length) return null;
      let sum = 0;
      allMode.forEach(x => { sum += computeBowlardFrames(x.frames || []).high; });
      return sum / allMode.length;
    })();
    const avgPlayTime = (() => {
      if (!allMode.length) return null;
      let sum = 0, n = 0;
      allMode.forEach(x => {
        const secs = parseDuration(x.timeElapsed);
        if (secs !== null) { sum += secs; n++; }
      });
      return n ? sum / n : null;
    })();

    const rankOf = (score) => getBowlardRank(score || 0);
    const lifeRank = getBowlardRank(lifeAvg);

    const trioRawSum = hasTrio ? trio.reduce((sum, x) => sum + (x.totalScore || 0), 0) : null;
    const trioAdjSum = hasTrio && isTdfAdjustedMode()
      ? trio.reduce((sum, x) => sum + adjustedScore(x.totalScore || 0, x.tableTdf), 0)
      : trioRawSum;
    const trioScore = trioAdjSum;  // 用於 rank
    const trioAvg = trioScore === null ? null : trioScore / 3;
    const trioRank = trioAvg === null ? null : getBowlardRank(trioAvg);
    const trioStrikes = hasTrio ? trio.reduce((sum, x) => sum + (marks(x)?.strikes || 0), 0) : null;
    const trioSpares  = hasTrio ? trio.reduce((sum, x) => sum + (marks(x)?.spares  || 0), 0) : null;
    const trioHighRun = hasTrio ? Math.max(...trio.map(x => highRunOf(x) || 0)) : null;
    const trioPlayTime = hasTrio
      ? trio.reduce((sum, x) => sum + (playSecs(x) || 0), 0)
      : null;

    const curScore = effectiveSessionScore(s);
    const lastScore = last ? effectiveSessionScore(last) : null;
    const secondLastScore = secondLast ? effectiveSessionScore(secondLast) : null;
    const curScoreCell       = summaryScoreCell(s.totalScore || 0, s.tableTdf);
    const lastScoreCell      = last ? summaryScoreCell(last.totalScore || 0, last.tableTdf) : '—';
    const secondLastScoreCell = secondLast ? summaryScoreCell(secondLast.totalScore || 0, secondLast.tableTdf) : '—';

    tableHTML = `
      <table class="summary-table">
        <thead>
          <tr>
            <th></th>
            <th>${escapeHtml(t('current'))}</th>
            <th>${escapeHtml(t('lastCol'))}</th>
            <th>${escapeHtml(t('secondLast'))}</th>
            <th>${escapeHtml(t('threeTotal'))}</th>
            <th>${escapeHtml(t('averageCol'))}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(t('score'))}</td>
            <td>${curScoreCell}</td>
            <td>${lastScoreCell}</td>
            <td>${secondLastScoreCell}</td>
            <td>${trioRawSum === null ? '—' : renderScorePair(trioRawSum, isTdfAdjustedMode() ? trioAdjSum : null, 0)}</td>
            <td>${renderScorePair(lifeAvgRaw, isTdfAdjustedMode() ? lifeAvgAdj : null, 1)}</td>
          </tr>
          <tr>
            <td>${escapeHtml(t('strike'))}</td>
            <td>${mCur ? mCur.strikes : '—'}</td>
            <td>${mLast ? mLast.strikes : '—'}</td>
            <td>${mSecond ? mSecond.strikes : '—'}</td>
            <td>${trioStrikes !== null ? trioStrikes : '—'}</td>
            <td>${fmtNum(avgMarks.strikes, 1)}</td>
          </tr>
          <tr>
            <td>${escapeHtml(t('spare'))}</td>
            <td>${mCur ? mCur.spares : '—'}</td>
            <td>${mLast ? mLast.spares : '—'}</td>
            <td>${mSecond ? mSecond.spares : '—'}</td>
            <td>${trioSpares !== null ? trioSpares : '—'}</td>
            <td>${fmtNum(avgMarks.spares, 1)}</td>
          </tr>
          <tr>
            <td>${escapeHtml(t('highRun'))}</td>
            <td>${fmtNum(highRunOf(s), 0)}</td>
            <td>${last ? fmtNum(highRunOf(last), 0) : '—'}</td>
            <td>${secondLast ? fmtNum(highRunOf(secondLast), 0) : '—'}</td>
            <td>${trioHighRun !== null ? fmtNum(trioHighRun, 0) : '—'}</td>
            <td>${fmtNum(avgHighRun, 1)}</td>
          </tr>
          <tr>
            <td>${escapeHtml(t('playTime'))}</td>
            <td>${fmtDuration(playSecs(s))}</td>
            <td>${last ? fmtDuration(playSecs(last)) : '—'}</td>
            <td>${secondLast ? fmtDuration(playSecs(secondLast)) : '—'}</td>
            <td>${trioPlayTime !== null ? fmtDuration(trioPlayTime) : '—'}</td>
            <td>${fmtDuration(avgPlayTime)}</td>
          </tr>
          <tr>
            <td>${escapeHtml(t('rankLabel'))}</td>
            <td>${rankPlateHtml(rankOf(curScore).label, rankOf(curScore).className)}</td>
            <td>${lastScore !== null ? rankPlateHtml(rankOf(lastScore).label, rankOf(lastScore).className) : '—'}</td>
            <td>${secondLastScore !== null ? rankPlateHtml(rankOf(secondLastScore).label, rankOf(secondLastScore).className) : '—'}</td>
            <td>${trioRank ? rankPlateHtml(trioRank.label, trioRank.className) : '—'}</td>
            <td>${rankPlateHtml(lifeRank.label, lifeRank.className)}</td>
          </tr>
        </tbody>
      </table>`;

    targetHTML = buildTargetBar(s.targetScore || 0, s.totalScore || 0);
  } else {
    // Q SKILL
    const allMode = appData.sessions.filter(x =>
      x.completed && x.playerId === s.playerId && x.mode !== 'bowlard'
    );
    let lifeRawTotal = 0, lifeAdjTotal = 0, lifeN = 0;
    allMode.forEach(x => {
      (x.innings || []).forEach(inn => {
        const v = inn.netScore || 0;
        lifeRawTotal += v;
        lifeAdjTotal += isTdfAdjustedMode() ? v * (x.tableTdf || TDF_DEFAULT) : v;
        lifeN++;
      });
    });
    const lifeAvgRaw = lifeN ? lifeRawTotal / lifeN : 0;
    const lifeAvgAdj = lifeN ? lifeAdjTotal / lifeN : 0;
    const lifeAvg = isTdfAdjustedMode() ? lifeAvgAdj : lifeAvgRaw;

    const avgHigh = (() => {
      if (!allMode.length) return null;
      let sum = 0;
      allMode.forEach(x => { sum += (x.highRun || 0); });
      return sum / allMode.length;
    })();
    const avgPlayTime = (() => {
      if (!allMode.length) return null;
      let sum = 0, n = 0;
      allMode.forEach(x => {
        const secs = parseDuration(x.timeElapsed);
        if (secs !== null) { sum += secs; n++; }
      });
      return n ? sum / n : null;
    })();

    const rankOf = (avg) => getRank(avg || 0);
    const lifeRank = getRank(lifeAvg);

    const curScore = effectiveSessionScore(s);
    const lastScore = last ? effectiveSessionScore(last) : null;
    const curAvg = effectiveSessionAverage(s);
    const lastAvg = last ? effectiveSessionAverage(last) : null;
    const curScoreCell  = summaryScoreCell(s.totalScore || 0, s.tableTdf);
    const lastScoreCell = last ? summaryScoreCell(last.totalScore || 0, last.tableTdf) : '—';

    tableHTML = `
      <table class="summary-table">
        <thead>
          <tr>
            <th></th>
            <th>${escapeHtml(t('current'))}</th>
            <th>${escapeHtml(t('lastCol'))}</th>
            <th>${escapeHtml(t('averageCol'))}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(t('score'))}</td>
            <td>${curScoreCell}</td>
            <td>${lastScore !== null ? lastScoreCell : '—'}</td>
            <td>${lifeN ? renderScorePair(lifeAvgRaw, isTdfAdjustedMode() ? lifeAvgAdj : null, 1) : '—'}</td>
          </tr>
          <tr>
            <td>${escapeHtml(t('highRun'))}</td>
            <td>${fmtNum(s.highRun, 0)}</td>
            <td>${last ? fmtNum(last.highRun, 0) : '—'}</td>
            <td>${fmtNum(avgHigh, 1)}</td>
          </tr>
          <tr>
            <td>${escapeHtml(t('playTime'))}</td>
            <td>${fmtDuration(parseDuration(s.timeElapsed))}</td>
            <td>${last ? fmtDuration(parseDuration(last.timeElapsed)) : '—'}</td>
            <td>${fmtDuration(avgPlayTime)}</td>
          </tr>
          <tr>
            <td>${escapeHtml(t('rankLabel'))}</td>
            <td>${rankPlateHtml(rankOf(curAvg).label, rankOf(curAvg).className)}</td>
            <td>${lastAvg !== null ? rankPlateHtml(rankOf(lastAvg).label, rankOf(lastAvg).className) : '—'}</td>
            <td>${rankPlateHtml(lifeRank.label, lifeRank.className)}</td>
          </tr>
        </tbody>
      </table>`;

    targetHTML = buildTargetBar(s.targetScore || 0, s.totalScore || 0);
  }

  const breakdownHTML = `
    <div class="summary-breakdown">
      ${s.mode !== 'bowlard' ? `<div class="row"><strong>${escapeHtml(t('breakLine'))}:</strong> ${breakdown.breaks}</div>` : ''}
      <div class="row"><strong>${escapeHtml(t('fouls'))}:</strong> ${breakdown.fouls}</div>
      <div class="row"><strong>${escapeHtml(t('mistakes'))}:</strong> ${breakdown.mistakes}</div>
    </div>`;

  const headerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <div style="color:var(--text-muted);font-size:.95rem;margin-bottom:10px;">
      ${escapeHtml(player ? player.name : '')} · ${escapeHtml(s.tableName || '')}
    </div>`;

  modalSummary({
    html: headerHTML + '<div class="table-scroll">' + tableHTML + '</div>' + targetHTML + breakdownHTML,
    autoCloseMs: 30000,
    closeLabel: t('closeWithSeconds'),
  });
}

function parseDuration(str) {
  if (!str || typeof str !== 'string') return null;
  const m = str.match(/^(\d+):(\d+)$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

// ============================================================
// STATE
// ============================================================
let currentLang = 'en';
let appData = { players: [], tables: [], sessions: [], liveSession: null, lastUsed: { playerId:'', tableId:'' } };
let session = null, sessionActive = false, sessionPaused = false;
let timerInterval = null, timerSeconds = 0;
let hideScore = false, historyVisible = 5;
let focusMode = false, focusPrevScroll = 0;
let currentMode = 'standard';
// RDS is a reference view, not a recording mode: currentMode stays on the
// last real mode so every standard/bowlard code path keeps working.
let rdsView = false, rdsLevel = 1, rdsPlayerId = '', rdsChanging = false;
let rds100Timer = null;
let bowlardInputMode = 'cumulative';

// ============================================================
// I18N
// ============================================================
function t(key) {
  const lang = LANG[currentLang] || LANG.en;
  return lang[key] !== undefined ? lang[key] : (LANG.en[key] !== undefined ? LANG.en[key] : key);
}

// ============================================================
// ICONS — Lucide v1.55.0 (ISC), inline sprite at top of <body>
// ============================================================
const ICON = name => `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
const SVG_NS = 'http://www.w3.org/2000/svg';

// Points an existing <svg class="icon"> at a sprite symbol.
// The href must be set as an attribute: the HTML fragment parser used by
// innerHTML silently drops the leading '#' of a bare <use href="#id">.
function setIconTarget(svg, name) {
  const use = svg.querySelector('use');
  if (use && use.getAttribute('href') === '#' + name) return;
  svg.replaceChildren();
  const u = document.createElementNS(SVG_NS, 'use');
  u.setAttribute('href', '#' + name);
  svg.appendChild(u);
}
const ICON_BY_KEY = {
  start:'play', end:'square', hide:'eye-off', show:'eye',
  pause:'pause', resume:'play', undo:'undo-2',
  showMore:'chevron-down', showLess:'chevron-up',
  showRanks:'chevron-down', hideRanks:'chevron-up',
  focusOn:'maximize', focusOff:'minimize',
  deleteMenu:'eraser', export:'upload', import:'download', reset:'trash'
};

// Writes an element's text, keeping its icon. Any leftover text nodes and
// non-icon spans are cleared so repeated calls can never duplicate the label.
function setLabelText(el, text) {
  if (!el) return;
  let label = el.querySelector('.label');
  if (!label) {
    label = document.createElement('span');
    label.className = 'label';
    Array.from(el.childNodes).forEach(n => {
      if (n === label || (n.nodeType === 1 && n.classList.contains('icon'))) return;
      el.removeChild(n);
    });
    el.appendChild(label);
  }
  label.textContent = text;
}

// Sets label text + leading icon, creating either if the markup lacks them.
function setIconLabel(btn, key) {
  if (!btn) return;
  btn.dataset.i18n = key;

  let svg = btn.querySelector('svg.icon');
  if (!svg) {
    svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    btn.insertBefore(svg, btn.firstChild);
  }

  const icon = ICON_BY_KEY[key];
  if (icon) setIconTarget(svg, icon);
  else if (svg.parentNode) svg.parentNode.removeChild(svg);

  setLabelText(btn, t(key));
}

function setI18n(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.dataset.i18n = key;
  const mapped = ICON_BY_KEY[key];
  // A .label span is pure text: never wrap it in another label.
  if (el.classList.contains('label')) { el.textContent = t(key); return; }
  if (!mapped && !el.querySelector('svg.icon') && !el.querySelector('.label')) {
    el.textContent = t(key);
    return;
  }
  setIconLabel(el, key);
}

function setActionLabels() {
  document.querySelectorAll('.card-actions [data-action]').forEach(b => {
    const act = b.dataset.action;
    const key = act === 'hide'  ? (hideScore ? 'show' : 'hide')
              : act === 'pause' ? (sessionPaused ? 'resume' : 'pause')
              : act === 'focus' ? (focusMode ? 'focusOff' : 'focusOn')
              : 'undo';
    setIconLabel(b, key);
  });
}

function applyLanguage() {
  localStorage.setItem('qskill-language', currentLang);
  // Icon-bearing controls first: setI18n keeps their icon intact.
  setI18n('btnStart', sessionActive ? 'end' : 'start');
  setI18n('btnDeleteMenu', 'deleteMenu');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    // A .label span is pure text: never wrap it in another label.
    if (el.classList.contains('label')) { el.textContent = t(key); return; }
    const mapped = ICON_BY_KEY[key];
    if (!mapped && !el.querySelector('svg.icon') && !el.querySelector('.label')) {
      el.textContent = t(key);
      return;
    }
    setIconLabel(el, key);
  });
  setActionLabels();
  // The detail button is a modal trigger on small screens; it no longer
  // toggles an inline open/closed state, so the label is always "show".
  setI18n('detailsToggle', 'showMore');
  const ranksWrap = document.getElementById('infoWrap');
  setI18n('ranksToggle', ranksWrap && ranksWrap.style.display !== 'none' ? 'hideRanks' : 'showRanks');
  if (currentMode === 'bowlard') {
    setI18n('lblAvgLabel', 'bowlardAvgLabel');
    setI18n('lblInningsLabel', 'bowlardInningsLabel');
  } else {
    setI18n('lblAvgLabel', 'avgLabel');
    setI18n('lblInningsLabel', 'inningsLabel');
  }
  updateLifetimeStats();
  renderHistory();
  updateUI();
  setDeleteMenuChevron(document.getElementById('deleteMenuGroup').style.display !== 'none');
  // The RDS panel builds its rules/meta text from t(), so it must be rebuilt
  // whenever the language changes.
  if (rdsView) renderRds();
}

// Chevron on the "Delete…" split button, mirroring the sibling controls.
function setDeleteMenuChevron(open) {
  const btn = document.getElementById('btnDeleteMenu');
  if (!btn) return;
  btn.dataset.open = open ? '1' : '0';
  btn.setAttribute('aria-expanded', String(open));
  const chev = btn.querySelector('.chev');
  if (chev) setIconTarget(chev, open ? 'chevron-up' : 'chevron-down');
}

function setLanguage(lang) {
  if (!LANG[lang]) return;
  currentLang = lang;
  document.getElementById('langSelect').value = lang;
  applyLanguage();
}

// ============================================================
// INIT
// ============================================================
function init() {
  const savedLang = localStorage.getItem('qskill-language');
  if (savedLang && LANG[savedLang]) currentLang = savedLang;
  document.getElementById('langSelect').value = currentLang;

  const savedTheme = localStorage.getItem('qskill-theme');
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');

  loadData();
  ensureDefaults();
  applyTargetForMode(currentMode);
  buildScoreGrids();
  renderPlayers();
  renderTables();
  // Restore TDF display toggle
  const savedTdfDisplay = localStorage.getItem('qskill-tdfDisplay');
  if (savedTdfDisplay === 'raw' || savedTdfDisplay === 'adjusted') {
    const el = document.querySelector(`input[name="tdfDisplay"][value="${savedTdfDisplay}"]`);
    if (el) el.checked = true;
  }
  bindEvents();
  applyLanguage();
  updateTDF();
  // Last: offer to pick up a session interrupted by a reload or a closed tab.
  checkLiveSession().catch(() => {});
}

function normalizeData(obj) {
  if (!obj.players) obj.players = [];
  if (!obj.tables)  obj.tables  = [];
  if (!obj.sessions) obj.sessions = [];
  // In-progress session is stored OUTSIDE of sessions, so every
  // sessions.filter(...) in this file keeps meaning "finished sessions".
  if (!('liveSession' in obj)) obj.liveSession = null;
  if (!obj.rdsRecords || typeof obj.rdsRecords !== 'object') obj.rdsRecords = {};
  // RDS 100 games in progress, one per player, plus the finished-game log.
  if (!obj.rds100 || typeof obj.rds100 !== 'object') obj.rds100 = {};
  if (!Array.isArray(obj.rds100History)) obj.rds100History = [];
  if (!obj.lastUsed) obj.lastUsed = { playerId:'', tableId:'' };
  if (obj.lastUsed.targetStandard === undefined) obj.lastUsed.targetStandard = 100;
  if (obj.lastUsed.targetBowlard  === undefined) obj.lastUsed.targetBowlard  = 100;

  obj.tables.forEach(tb => {
    if (typeof tb.tdf !== 'number' || !isFinite(tb.tdf) || tb.tdf <= 0) tb.tdf = TDF_DEFAULT;
  });
  obj.sessions.forEach(s => {
    if (typeof s.tableTdf !== 'number' || !isFinite(s.tableTdf) || s.tableTdf <= 0) {
      const tb = obj.tables.find(t => t.id === s.tableId);
      s.tableTdf = tb ? (tb.tdf || TDF_DEFAULT) : TDF_DEFAULT;
    }
  });
  return obj;
}

function loadData() {
  const saved = localStorage.getItem('poolTrackerData');
  if (saved) {
    try { appData = JSON.parse(saved); } catch(e) {}
  }
  normalizeData(appData);
}

function ensureDefaults() {
  let changed = false;
  if (appData.players.length === 0) {
    appData.players.push({ id: 'p_default', name: 'Default' });
    changed = true;
  }
  if (appData.tables.length === 0) {
    appData.tables.push({ id: 't_default', name: 'Default', tdf: TDF_DEFAULT });
    changed = true;
  }
  if (changed) saveData();
}

// Writes appData to storage only. No re-render, so it is safe to call from
// inside an active session (saveLive) without recursion into renderHistory.
function persistData() {
  localStorage.setItem('poolTrackerData', JSON.stringify(appData));
}

function saveData() {
  appData.lastUsed.playerId  = document.getElementById('playerSelect').value || '';
  appData.lastUsed.tableId   = document.getElementById('tableSelect').value  || '';
  const tgt = parseInt(document.getElementById('targetScore').value);
  if (!isNaN(tgt)) {
    if (currentMode === 'bowlard') appData.lastUsed.targetBowlard  = tgt;
    else                           appData.lastUsed.targetStandard = tgt;
  }
  // Keep the in-progress session in the same write as the rest of appData.
  if (sessionActive && session) { syncLiveTime(); appData.liveSession = session; }
  persistData();
  updateLifetimeStats();
  renderHistory();
}

// The timer is the only live state not already held on the session object,
// so it is mirrored onto it before every write.
function syncLiveTime() {
  if (session) session.timeElapsed = formatTime(timerSeconds);
}

// Persists the in-progress session. Deliberately a no-op when no session is
// active, so callers can fire it freely without clobbering a stored session.
function saveLive() {
  if (!sessionActive || !session) return;
  syncLiveTime();
  appData.liveSession = session;
  persistData();
}

// Drops the stored in-progress session, but keeps a record of when it
// finished so a stale copy is never silently adopted as "in progress".
function clearLive() {
  if (appData.liveSession) appData.liveSession.savedAt = Date.now();
  appData.liveSession = null;
  persistData();
}

function applyTargetForMode(mode, { preserveValue = false } = {}) {
  const input = document.getElementById('targetScore');
  const saved = (mode === 'bowlard')
    ? (appData.lastUsed.targetBowlard  ?? 100)
    : (appData.lastUsed.targetStandard ?? 100);
  input.max = (mode === 'bowlard') ? 300 : 200;
  input.min = 0;
  if (!preserveValue) input.value = saved;
}

// ============================================================
// THEME
// ============================================================
function setTheme(val) {
  const isDark = (val === 'dark');
  if (isDark) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', 'light');
  localStorage.setItem('qskill-theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('themeToggle');
  if (btn) {
    // Icon shows the theme currently in effect (moon = dark, sun = light)
    btn.innerHTML = ICON(isDark ? 'moon' : 'sun');
    btn.setAttribute('aria-pressed', String(isDark));
  }
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  setTheme(isLight ? 'dark' : 'light');
}

// ============================================================
// PLAYER / TABLE
// ============================================================
function renderPlayers() {
  const sel = document.getElementById('playerSelect');
  const current = sel.value;
  sel.innerHTML = '<option value="">--</option>';
  appData.players.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id; o.textContent = p.name;
    sel.appendChild(o);
  });
  const wanted = current || (appData.lastUsed && appData.lastUsed.playerId) || '';
  if (wanted && appData.players.some(p => p.id === wanted)) sel.value = wanted;
  else if (appData.players.length) sel.value = appData.players[0].id;
  updateEditDeleteButtons();
  updateLifetimeStats();
  renderHistory();
}

function renderTables() {
  const sel = document.getElementById('tableSelect');
  const current = sel.value;
  sel.innerHTML = '<option value="">--</option>';
  appData.tables.forEach(tb => {
    const o = document.createElement('option');
    o.value = tb.id; o.textContent = tb.name;
    sel.appendChild(o);
  });
  const wanted = current || (appData.lastUsed && appData.lastUsed.tableId) || '';
  if (wanted && appData.tables.some(tb => tb.id === wanted)) sel.value = wanted;
  else if (appData.tables.length) sel.value = appData.tables[0].id;
  updateEditDeleteButtons();
}

function updateEditDeleteButtons() {
  const pid = document.getElementById('playerSelect').value;
  const hasP = pid && appData.players.some(p => p.id === pid);
  document.getElementById('btnEditPlayer').style.display   = hasP ? 'inline-flex' : 'none';
  document.getElementById('btnDeletePlayer').style.display = hasP ? 'inline-flex' : 'none';
  const tid = document.getElementById('tableSelect').value;
  const hasT = tid && appData.tables.some(tb => tb.id === tid);
  document.getElementById('btnEditTable').style.display   = hasT ? 'inline-flex' : 'none';
  document.getElementById('btnDeleteTable').style.display = hasT ? 'inline-flex' : 'none';
}

function getSelectedPlayer() {
  const id = document.getElementById('playerSelect').value;
  return appData.players.find(p => p.id === id) || null;
}
function getSelectedTable() {
  const id = document.getElementById('tableSelect').value;
  return appData.tables.find(tb => tb.id === id) || null;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---- Add / Edit Player via modalPrompt ----
async function showAddPlayer() {
  const name = await modalPrompt({
    title: t('addPlayerTitle'),
    message: '',
    defaultValue: '',
    placeholder: t('player'),
    okText: t('save'),
    cancelText: t('cancel')
  });
  if (!name) return;
  if (appData.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    showToast(t('playerExists'), 'warning');
    return;
  }
  const newP = { id:'p_'+Date.now(), name };
  appData.players.push(newP);
  saveData(); renderPlayers();
  document.getElementById('playerSelect').value = newP.id;
  updateEditDeleteButtons();
}

async function showEditPlayer() {
  const p = getSelectedPlayer();
  if (!p) return;
  const name = await modalPrompt({
    title: t('editPlayerTitle'),
    message: '',
    defaultValue: p.name,
    placeholder: t('player'),
    okText: t('save'),
    cancelText: t('cancel')
  });
  if (!name) return;
  if (appData.players.some(x => x.name.toLowerCase() === name.toLowerCase() && x.id !== p.id)) {
    showToast(t('playerExists'), 'warning');
    return;
  }
  p.name = name;
  saveData(); renderPlayers();
  document.getElementById('playerSelect').value = p.id;
  updateEditDeleteButtons();
}

async function deletePlayer() {
  const id = document.getElementById('playerSelect').value;
  if (!id) return;
  const ok = await modalConfirm({
    title: t('delete'),
    message: t('deletePlayerConfirm'),
    okText: t('delete'),
    cancelText: t('cancel'),
    danger: true
  });
  if (!ok) return;
  appData.players = appData.players.filter(p => p.id !== id);
  if (appData.lastUsed.playerId === id) appData.lastUsed.playerId = '';
  saveData(); renderPlayers();
  document.getElementById('playerSelect').value = '';
  updateEditDeleteButtons(); updateLifetimeStats(); renderHistory();
}

// ---- TDF input parsing / validation ----
// Returns { ok:true, value:number } or { ok:false, reason:'invalid'|'impossible' }
function parseTdfInput(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (s === '') return { ok: true, value: TDF_DEFAULT };
  // Accept "1", "1.05", ".5", "1,05" (comma -> dot)
  const norm = s.replace(',', '.');
  if (!/^-?\d*\.?\d+$/.test(norm)) return { ok: false, reason: 'invalid' };
  const n = parseFloat(norm);
  if (!isFinite(n)) return { ok: false, reason: 'invalid' };
  if (n < TDF_MIN || n > TDF_MAX) return { ok: false, reason: 'impossible' };
  return { ok: true, value: n };
}

// ---- Add / Edit Table via modalPrompt2 ----
async function showAddTable() {
  while (true) {
    const res = await modalPrompt2({
      title: t('addTableTitle'),
      message: '',
      fields: [
        { id: 'tblName', label: t('tableName'), defaultValue: '', placeholder: t('tableName') },
        { id: 'tblTdf',  label: t('tableTdf'),  defaultValue: '', placeholder: '1.00' }
      ],
      okText: t('save'),
      cancelText: t('cancel')
    });
    if (!res) return;
    const name = (res.tblName || '').trim();
    if (!name) { showToast(t('enterName'), 'warning'); continue; }
    if (appData.tables.some(tb => tb.name.toLowerCase() === name.toLowerCase())) {
      showToast(t('tableExists'), 'warning');
      continue;
    }
    const parsed = parseTdfInput(res.tblTdf);
    if (!parsed.ok) {
      showToast(parsed.reason === 'impossible' ? t('tdfImpossible') : t('tdfInvalid'), 'warning');
      continue;
    }
    const newT = { id:'t_'+Date.now(), name, tdf: parsed.value };
    appData.tables.push(newT);
    saveData(); renderTables();
    document.getElementById('tableSelect').value = newT.id;
    updateEditDeleteButtons();
    return;
  }
}

async function showEditTable() {
  const tb = getSelectedTable();
  if (!tb) return;
  while (true) {
    const res = await modalPrompt2({
      title: t('editTableTitle'),
      message: '',
      fields: [
        { id: 'tblName', label: t('tableName'), defaultValue: tb.name, placeholder: t('tableName') },
        { id: 'tblTdf',  label: t('tableTdf'),  defaultValue: (tb.tdf != null ? tb.tdf : TDF_DEFAULT), placeholder: '1.00' }
      ],
      okText: t('save'),
      cancelText: t('cancel')
    });
    if (!res) return;
    const name = (res.tblName || '').trim();
    if (!name) { showToast(t('enterName'), 'warning'); continue; }
    if (appData.tables.some(x => x.name.toLowerCase() === name.toLowerCase() && x.id !== tb.id)) {
      showToast(t('tableExists'), 'warning');
      continue;
    }
    const parsed = parseTdfInput(res.tblTdf);
    if (!parsed.ok) {
      showToast(parsed.reason === 'impossible' ? t('tdfImpossible') : t('tdfInvalid'), 'warning');
      continue;
    }
    tb.name = name;
    tb.tdf = parsed.value;
    appData.sessions.forEach(s => {
      if (s.tableId === tb.id) {
        s.tableName = name;
        s.tableTdf = parsed.value;
      }
    });
    saveData(); renderTables();
    document.getElementById('tableSelect').value = tb.id;
    updateEditDeleteButtons();
    updateUI();
    renderHistory();
    updateLifetimeStats();
    return;
  }
}

async function deleteTable() {
  const id = document.getElementById('tableSelect').value;
  if (!id) return;
  const ok = await modalConfirm({
    title: t('delete'),
    message: t('deleteTableConfirm'),
    okText: t('delete'),
    cancelText: t('cancel'),
    danger: true
  });
  if (!ok) return;
  appData.tables = appData.tables.filter(tb => tb.id !== id);
  if (appData.lastUsed.tableId === id) appData.lastUsed.tableId = '';
  saveData(); renderTables();
  document.getElementById('tableSelect').value = '';
  updateEditDeleteButtons();
}

// ============================================================
// SCORE GRID (generated)
// ============================================================
function buildScoreGrids() {
  const colors = [
    'color-red','color-red','color-red','color-red','color-red',
    'color-red','color-red','color-red','color-red','color-purple',
    'color-blue','color-blue','color-blue','color-blue','color-blue',
    'color-blue','color-blue','color-blue','color-blue','color-gold'
  ];
  ['scoreGridDesktop','scoreGridMobile'].forEach(id => {
    const container = document.getElementById(id);
    container.innerHTML = '';
    const zero = document.createElement('button');
    zero.className = 'score-btn zero-btn';
    zero.dataset.score = '0';
    zero.textContent = '0';
    zero.addEventListener('click', () => submitScore(0));
    container.appendChild(zero);
    for (let i = 1; i <= 20; i++) {
      const b = document.createElement('button');
      b.className = 'score-btn ' + colors[i-1];
      b.dataset.score = String(i);
      b.textContent = i;
      b.addEventListener('click', () => submitScore(i));
      container.appendChild(b);
    }
  });
}

// ============================================================
// SESSION
// ============================================================
async function startSession() {
  const player = getSelectedPlayer(), table = getSelectedTable();
  if (!player) { showToast(t('selectPlayerWarn'), 'warning'); return; }
  if (!table)  { showToast(t('selectTableWarn'),  'warning'); return; }
  if (sessionActive) {
    const ok = await modalConfirm({
      title: t('end'),
      message: t('endSessionConfirm'),
      okText: t('yes'),
      cancelText: t('no'),
      danger: true
    });
    if (ok) endSession();
    return;
  }
  // A stored session should have been resolved by the startup prompt; refuse
  // to silently overwrite it if that prompt was somehow skipped.
  if (appData.liveSession) {
    showToast(t('liveExistsWarn'), 'warning');
    checkLiveSession();
    return;
  }

  const mode = document.querySelector('input[name="gameMode"]:checked').value;
  currentMode = mode;
  if (mode === 'bowlard') {
    bowlardInputMode = document.querySelector('input[name="bowlardInputMode"]:checked').value;
  }
  const sessionNumber = document.querySelector('input[name="sessionType"]:checked');
  const totalInnings = mode === 'bowlard' ? 10 : (parseInt(sessionNumber?.value) || 10);
  const targetScore  = parseInt(document.getElementById('targetScore').value) || (mode === 'bowlard' ? 300 : 100);

  session = {
    id:'s_'+Date.now(), playerId:player.id, playerName:player.name,
    tableId:table.id, tableName:table.name,
    tableTdf: (typeof table.tdf === 'number' && isFinite(table.tdf) && table.tdf > 0) ? table.tdf : TDF_DEFAULT,
    date:new Date().toISOString(), mode,
    sessionType: totalInnings === 5 ? 'short' : 'standard',
    totalInnings, targetScore,
    // Stored so a recovered session keeps the input style it was started with.
    bowlardInputMode,
    completed:false, timeElapsed:'00:00',
    innings:[], frames:[], totalScore:0, average:0, highRun:0,
    startTime:Date.now()
  };
  sessionActive = true; sessionPaused = false; timerSeconds = 0;
  resetDetailInputs();
  updateUI(); startTimer(); saveLive(); saveData(); renderHistory(); applyLanguage();
}

function endSession() {
  if (!sessionActive) return;
  sessionActive = false; stopTimer();

  let finished = null;
  let isEmpty = true;

  if (session) {
    session.completed = true;
    session.timeElapsed = formatTime(timerSeconds);
    session.endTime = new Date().toISOString();

    if (session.mode === 'bowlard') {
      recalcBowlardSession(session);
    } else {
      recalcQSkillSession(session);
    }

    isEmpty = session.mode === 'bowlard'
      ? session.frames.length === 0
      : session.innings.length === 0;

    if (!isEmpty) {
      appData.sessions.unshift(session);
      finished = session;
      saveData(); renderHistory(); updateLifetimeStats();
    }
  }

  // The session was either committed to appData.sessions or discarded as
  // empty; either way it must no longer be stored as "in progress".
  clearLive();
  session = null;
  // Leave focus mode before updateUI() hides the cards, otherwise the body
  // would stay scroll-locked on an empty screen.
  if (focusMode) exitFocus();
  updateUI(); applyLanguage();

  if (isEmpty) {
    showToast(t('sessionEmpty'), 'info');
  } else {
    showToast(t('sessionEnded'), 'success');
    if (finished) showSessionSummary(finished);
  }
}

// ============================================================
// LIVE SESSION RECOVERY
// ============================================================
// Re-attaches a stored session object as the active one and brings the whole
// UI back in sync with it. Shared by the reload prompt and (later) the
// "continue" action on an unfinished history row.
// `focusPanel:false` is used when the caller is about to end the session
// immediately, where scrolling to controls that are about to disappear is noise.
function adoptSession(stored, { focusPanel = true } = {}) {
  if (!stored) return false;
  session = stored;
  sessionActive = true;
  sessionPaused = false;
  currentMode = session.mode || 'standard';

  // Restore the controls that were captured when the session started, so the
  // screen matches the session rather than whatever the last-used values are.
  const modeRadio = document.querySelector(`input[name="gameMode"][value="${currentMode}"]`);
  if (modeRadio) modeRadio.checked = true;

  // renderPlayers/renderTables preserve the current <select> value, so set the
  // session's ids first and they will survive the re-render.
  renderPlayers();
  renderTables();
  const pSel = document.getElementById('playerSelect');
  const tSel = document.getElementById('tableSelect');
  if (session.playerId && appData.players.some(p => p.id === session.playerId)) pSel.value = session.playerId;
  if (session.tableId  && appData.tables.some(tb => tb.id === session.tableId))  tSel.value = session.tableId;
  updateEditDeleteButtons();

  if (currentMode === 'bowlard') {
    const sType = document.querySelector('input[name="sessionType"][value="10"]');
    if (sType) sType.checked = true;
    document.querySelectorAll('input[name="sessionType"]').forEach(r => { r.disabled = true; });
    // Restore the input style recorded when the session was started.
    if (session.bowlardInputMode) {
      const r = document.querySelector(`input[name="bowlardInputMode"][value="${session.bowlardInputMode}"]`);
      if (r) { r.checked = true; bowlardInputMode = session.bowlardInputMode; }
    }
  } else {
    const sVal = (session.totalInnings === 5) ? '5' : '10';
    const sRadio = document.querySelector(`input[name="sessionType"][value="${sVal}"]`);
    if (sRadio) sRadio.checked = true;
    document.querySelectorAll('input[name="sessionType"]').forEach(r => { r.disabled = false; });
  }

  // applyTargetForMode would normally overwrite this from lastUsed.
  applyTargetForMode(currentMode, { preserveValue: true });
  document.getElementById('targetScore').value = session.targetScore ?? 100;

  timerSeconds = parseDuration(session.timeElapsed) ?? 0;
  resetDetailInputs();
  updateUI();
  startTimer();
  saveLive();
  renderHistory();
  updateLifetimeStats();
  applyLanguage();
  document.getElementById('timerDisplay').textContent = formatTime(timerSeconds);
  // Every entry point into a resumed session lands here, so the jump to the
  // controls lives here too: history "continue", the reload prompt, and any
  // future caller all get the same behaviour without remembering to add it.
  if (focusPanel) scrollToActivePanel();
  return true;
}

function liveProgressText(s) {
  const total = s.totalInnings || 10;
  const done  = s.mode === 'bowlard' ? (s.frames || []).length : (s.innings || []).length;
  return t('sessionProgress').replace('{done}', done).replace('{total}', total);
}

// Runs at startup: offers to pick up a session that was interrupted by a
// reload or by closing the tab.
async function checkLiveSession() {
  const stored = appData.liveSession;
  if (!stored || sessionActive) return;

  const modeLabel = stored.mode === 'bowlard' ? t('modeBowl') : t('modeStd');
  const message = t('liveFoundMsg')
    .replace('{mode}', modeLabel)
    .replace('{progress}', liveProgressText(stored))
    .replace('{time}', stored.timeElapsed || '00:00');

  const choice = await modalChoose({
    title: t('liveFoundTitle'),
    message,
    options: [
      { value: 'resume',  label: t('liveResume'),  style: 'primary' },
      { value: 'end',     label: t('liveEnd'),     style: '' },
      { value: 'discard', label: t('liveDiscard'), style: 'danger' }
    ]
  });

  if (choice === 'resume') {
    if (adoptSession(stored)) showToast(t('liveResumed'), 'success');
    return;
  }
  if (choice === 'end') {
    // Commit it through the normal path so it lands in history as an
    // unfinished session, where the "continue" action can pick it up again.
    adoptSession(stored, { focusPanel: false });
    endSession();
    return;
  }
  // 'discard' or dismissed via Escape/backdrop: stop tracking it.
  clearLive();
  updateUI();
}

// Brings the stats panel into view after resuming from history. Scrolling to
// the very top is not enough: the header and setup card push it below the
// fold, so we jump straight to the panel by id. Falls back to an instant jump
// when animations are unwanted.
function scrollToActivePanel() {
  const reduce = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Wait for the freshly revealed cards to settle, otherwise the browser
  // computes the position from the pre-resume layout.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const target = document.getElementById('statsCard');
    if (!target) return;
    target.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start'
    });
  }));
}

// Resumes an unfinished session straight from the history list. The record is
// taken out of history and handed to the same adoptSession() used by the
// reload prompt, so it becomes the live session again and is re-committed
// (with all its innings intact) when it is ended.
async function resumeSession(id) {
  const s = appData.sessions.find(x => x.id === id);
  if (!s) return;

  if (sessionActive) {
    const ok = await modalConfirm({
      title: t('liveResume'),
      message: t('endSessionConfirm'),
      okText: t('yes'),
      cancelText: t('no'),
      danger: true
    });
    if (!ok) return;
    endSession();
  }

  // Guard: a full session has nothing left to continue.
  const total = s.totalInnings || 10;
  const done  = s.mode === 'bowlard' ? (s.frames || []).length : (s.innings || []).length;
  if (done >= total) {
    showToast(t('sessionCompleteWarn'), 'warning');
    return;
  }

  // Detach from history, then adopt it as the live session.
  // adoptSession() performs the jump to the controls, so every entry point
  // (history, reload prompt) behaves identically.
  appData.sessions = appData.sessions.filter(x => x.id !== id);
  if (!adoptSession(s)) return;

  showToast(t('liveResumed'), 'success');
}


// ============================================================
// STANDARD SCORING
// ============================================================
function recalcQSkillSession(s) {
  if (!s.innings || s.innings.length === 0) {
    s.totalScore = 0;
    s.average = 0;
    s.highRun = 0;
    return;
  }
  s.totalScore = s.innings.reduce((sum, inn) => sum + inn.netScore, 0);
  s.average = s.totalScore / s.innings.length;
  s.highRun = Math.max(...s.innings.map(inn => inn.netScore));
}


function submitScore(balls) {
  if (!sessionActive || !session) { showToast(t('noActiveSession'), 'warning'); return; }
  if (sessionPaused) { showToast(t('sessionPausedWarn'), 'warning'); return; }
  const breakResult = document.querySelector('input[name="breakResult"]:checked').value;
  let penalty = 0;
  if (breakResult === 'scratch') penalty = -1;
  else if (breakResult === 'offTable') penalty = -2;
  else if (breakResult === 'reRack') penalty = -1;
  if (document.getElementById('chkBallInHand').checked) penalty -= 1;
  const net = Math.max(0, balls + penalty);
  const { fouls, mistakes } = collectDetails();
  const inning = {
    number: session.innings.length + 1,
    breakResult,
    breakPenalty: penalty < 0 ? penalty : 0,
    ballsPocketed: balls,
    netScore: net,
    fouls, mistakes,
    illegalBreak: document.getElementById('chkIllegalBreak').checked,
    breakNoIn: document.getElementById('chkBreakNoIn').checked,
    ballInHand: document.getElementById('chkBallInHand').checked,
    timestamp: new Date().toISOString()
  };
  session.innings.push(inning);
  recalcQSkillSession(session);
  resetDetailInputs();
  if (session.innings.length >= session.totalInnings) endSession();
  else { updateUI(); saveData(); renderHistory(); }
}

// ============================================================
// BOWLARD SCORING
// ============================================================
function recalcBowlardSession(s) {
  const r = computeBowlardFrames(s.frames || []);
  s.totalScore = r.total;
  s.highRun = r.high;
  s.average = s.frames && s.frames.length ? r.total / s.frames.length : 0;
  s.runningTotals = r.running;
  s.frameScores = r.frameScores;
}

function computeBowlardHighRun(frames) {
  const seq = [];

  (frames || []).forEach((f, i) => {
    if (!f) return;
    const isTenth = i === 9;

    if (!isTenth) {
      if (f.r1 === undefined) return;
      const isStrike = (f.r1 === 10);
      seq.push({ frameIdx: i, rollKey: 'r1', pins: f.r1, kind: 'first' });
      if (!isStrike && f.r2 !== undefined) {
        const isSpare = (f.r1 + f.r2 === 10);
        seq.push({
          frameIdx: i, rollKey: 'r2', pins: f.r2,
          kind: isSpare ? 'spare' : 'open'
        });
      }
    } else {
      if (f.r1 !== undefined) {
        seq.push({ frameIdx: i, rollKey: 'r1', pins: f.r1, kind: 'first' });
      }
      if (f.r2 !== undefined) {
        if (f.r1 === 10) {
          seq.push({ frameIdx: i, rollKey: 'r2', pins: f.r2, kind: 'first' });
        } else if (f.r1 + f.r2 === 10) {
          seq.push({ frameIdx: i, rollKey: 'r2', pins: f.r2, kind: 'spare' });
        } else {
          seq.push({ frameIdx: i, rollKey: 'r2', pins: f.r2, kind: 'open' });
        }
      }
      if (f.r3 !== undefined) {
        if (f.r2 === 10) {
          seq.push({ frameIdx: i, rollKey: 'r3', pins: f.r3, kind: 'first' });
        } else if (f.r1 === 10) {
          if (f.r2 + f.r3 === 10) {
            seq.push({ frameIdx: i, rollKey: 'r3', pins: f.r3, kind: 'spare' });
          } else {
            seq.push({ frameIdx: i, rollKey: 'r3', pins: f.r3, kind: 'open' });
          }
        } else if (f.r1 + f.r2 === 10) {
          seq.push({ frameIdx: i, rollKey: 'r3', pins: f.r3, kind: 'first' });
        } else {
          seq.push({ frameIdx: i, rollKey: 'r3', pins: f.r3, kind: 'first' });
        }
      }
    }
  });

  // A run keeps adding rolls until something ends it: a zero, or the roll that
  // closes an open frame. A spare restarts the count from its own pins, so a
  // spare followed by the next first roll forms one run (e.g. spare 3 + 5 = 8).
  // The roll that closes an open frame never continues a run, but it is still
  // a visit of its own, so it can be the high run by itself.
  let running = 0, high = 0;
  let bestStart = -1, bestEnd = -1, curStart = 0;

  for (let k = 0; k < seq.length; k++) {
    const r = seq[k];

    if (r.pins === 0) {
      running = 0;
      curStart = k + 1;
      continue;
    }

    if (r.kind === 'open') {
      if (r.pins > high) {
        high = r.pins;
        bestStart = k;
        bestEnd = k;
      }
      running = 0;
      curStart = k + 1;
      continue;
    }

    if (r.kind === 'spare') {
      running = r.pins;
      curStart = k;
      if (running > high) {
        high = running;
        bestStart = curStart;
        bestEnd = k;
      }
      continue;
    }

    if (running === 0) curStart = k;
    running += r.pins;
    if (running > high) {
      high = running;
      bestStart = curStart;
      bestEnd = k;
    }
  }

  const contributors = new Set();
  let ending = null;
  if (bestStart >= 0) {
    for (let k = bestStart; k <= bestEnd; k++) {
      contributors.add(seq[k].frameIdx + ':' + seq[k].rollKey);
    }
    ending = { frameIdx: seq[bestEnd].frameIdx, rollKey: seq[bestEnd].rollKey };
  }

  return { high, contributors, ending };
}

function computeBowlardFrames(frames) {
  const rolls = [];
  frames.forEach((f, i) => {
    if (i < 9) {
      rolls.push(f.r1);
      if (f.r1 !== 10 && f.r2 !== undefined) rolls.push(f.r2);
    } else {
      if (f.r1 !== undefined) rolls.push(f.r1);
      if (f.r2 !== undefined) rolls.push(f.r2);
      if (f.r3 !== undefined) rolls.push(f.r3);
    }
  });

  const frameScores = [];
  let idx = 0;
  for (let i = 0; i < 10; i++) {
    const f = frames[i];
    if (!f) { frameScores.push(null); idx += 1; continue; }
    if (i < 9) {
      if (f.r1 === 10) {
        const b1 = rolls[idx+1], b2 = rolls[idx+2];
        if (b1 !== undefined && b2 !== undefined) frameScores.push(10 + b1 + b2);
        else frameScores.push(null);
        idx += 1;
      } else if (f.r2 !== undefined && (f.r1 + f.r2 === 10)) {
        const b1 = rolls[idx+2];
        if (b1 !== undefined) frameScores.push(10 + b1);
        else frameScores.push(null);
        idx += 2;
      } else {
        if (f.r2 !== undefined) frameScores.push(f.r1 + f.r2);
        else frameScores.push(null);
        idx += (f.r2 !== undefined ? 2 : 1);
      }
    } else {
      const r1 = f.r1 || 0, r2 = f.r2 || 0, r3 = f.r3 || 0;
      const sc = r1 + r2 + r3;
      if (r1 === 10 || (r1 + r2) === 10) {
        frameScores.push(f.r3 !== undefined ? sc : null);
      } else {
        frameScores.push(f.r2 !== undefined ? sc : null);
      }
    }
  }

  const running = [];
  let total = 0, valid = true;
  frameScores.forEach(s => {
    if (s === null || !valid) { running.push(null); valid = false; }
    else { total += s; running.push(total); }
  });

  const hr = computeBowlardHighRun(frames);
  return {
    frameScores, running, total,
    high: hr.high,
    hrContributors: hr.contributors,
    hrEnding: hr.ending
  };
}

function getCurrentBowlardFrame() {
  if (!session || session.frames.length === 0) return 0;
  const f = session.frames;
  const last = f[f.length-1];
  const lastIdx = f.length - 1;
  if (lastIdx < 9) {
    if (last.r1 === 10) return lastIdx + 1;
    if (last.r2 !== undefined) return lastIdx + 1;
    return lastIdx;
  }
  if (last.r1 === 10) return (last.r2 !== undefined && last.r3 !== undefined) ? 10 : 9;
  if (last.r1 + (last.r2||0) === 10) return (last.r2 !== undefined && last.r3 !== undefined) ? 10 : 9;
  return last.r2 !== undefined ? 10 : 9;
}

function getCurrentBowlardRoll() {
  if (!session || session.frames.length === 0) return 1;
  const last = session.frames[session.frames.length-1];
  const lastIdx = session.frames.length - 1;
  if (lastIdx < 9) {
    if (last.r1 === 10) return 1;
    if (last.r2 !== undefined) return 1;
    return 2;
  }
  if (last.r1 === 10) {
    if (last.r2 === undefined) return 2;
    if (last.r3 === undefined) return 3;
    return 1;
  }
  if (last.r2 === undefined) return 2;
  if (last.r1 + last.r2 === 10) {
    if (last.r3 === undefined) return 3;
    return 1;
  }
  return 1;
}

function getMaxPinsForBowlardRoll() {
  const roll = getCurrentBowlardRoll();
  if (roll === 1) return 10;
  const last = session.frames[session.frames.length-1];
  if (!last) return 10;

  const isTenth = session.frames.length === 10;

  if (!isTenth) {
    return 10 - (last.r1 || 0);
  }

  if (roll === 2) {
    return last.r1 === 10 ? 10 : 10 - (last.r1 || 0);
  }

  if (last.r1 === 10) {
    return last.r2 === 10 ? 10 : 10 - (last.r2 || 0);
  }
  if ((last.r1 || 0) + (last.r2 || 0) === 10) return 10;
  return 10;
}

function getCurrentRackCumulative() {
  if (!session || session.frames.length === 0) return 0;
  const last = session.frames[session.frames.length - 1];
  const lastIdx = session.frames.length - 1;

  if (lastIdx < 9) {
    if (last.r1 === 10) return 0;
    if (last.r2 !== undefined) return 0;
    return last.r1 || 0;
  }

  if (isBowlardComplete()) return 0;

  if (last.r1 === 10) {
    if (last.r2 === undefined) return 0;
    if (last.r2 === 10) {
      return 0;
    }
    return last.r2 || 0;
  }
  if (last.r1 + (last.r2 || 0) === 10 && last.r2 !== undefined) {
    return 0;
  }
  return (last.r1 || 0) + (last.r2 || 0);
}

function submitBowlardRoll(pins) {
  if (!sessionActive || !session) return;
  if (sessionPaused) { showToast(t('sessionPausedWarn'), 'warning'); return; }

  const clickedValue = pins;

  let perRoll = pins;
  if (bowlardInputMode === 'cumulative' && pins !== 0) {
    const prev = getCurrentRackCumulative();
    perRoll = pins - prev;
    if (perRoll < 0) perRoll = 0;
  }
  pins = perRoll;

  if (session.frames.length === 0) {
    session.frames.push({ r1: pins, clicked1: clickedValue, details: collectDetails() });
  } else {
    const last = session.frames[session.frames.length - 1];
    const lastIdx = session.frames.length - 1;
    if (lastIdx < 9) {
      if (last.r1 === 10) {
        session.frames.push({ r1: pins, clicked1: clickedValue, details: collectDetails() });
      } else if (last.r2 === undefined) {
        last.r2 = pins; last.clicked2 = clickedValue; last.details2 = collectDetails();
      } else {
        session.frames.push({ r1: pins, clicked1: clickedValue, details: collectDetails() });
      }
    } else {
      if (last.r1 === 10) {
        if (last.r2 === undefined) {
          last.r2 = pins; last.clicked2 = clickedValue; last.details2 = collectDetails();
        } else if (last.r3 === undefined) {
          last.r3 = pins; last.clicked3 = clickedValue; last.details3 = collectDetails();
        }
      } else if (last.r2 === undefined) {
        last.r2 = pins; last.clicked2 = clickedValue; last.details2 = collectDetails();
      } else if (last.r1 + last.r2 === 10 && last.r3 === undefined) {
        last.r3 = pins; last.clicked3 = clickedValue; last.details3 = collectDetails();
      }
    }
  }

  resetDetailInputs();
  recalcBowlardSession(session);
  if (isBowlardComplete()) { endSession(); return; }
  updateUI(); saveData(); renderHistory();
}

function isBowlardComplete() {
  if (!session || session.frames.length < 10) return false;
  const last = session.frames[9];
  if (!last) return false;
  if (last.r1 === 10) return last.r2 !== undefined && last.r3 !== undefined;
  if (last.r1 + (last.r2||0) === 10) return last.r2 !== undefined && last.r3 !== undefined;
  return last.r2 !== undefined;
}

// ============================================================
// DETAILS
// ============================================================
const FOUL_MAP = {
  chkScratch:'Scratch', chkOffTable:'Off Table', chkNoCushion:'No Cushion',
  chkMiscue:'Miscue', chkDoubleTap:'Double Tap', chkOtherFouls:'Other Fouls'
};
const MISTAKE_MAP = {
  chkFluke:'Fluke', chkPositioning:'Positioning', chkSideSpin:'Side Spin', chkTopSpin:'Top Spin',
  chkButtonSpin:'Button Spin', chkHandBridge:'Hand Bridge', chkMechanicalBridge:'Mech. Bridge',
  chkKick:'Kick', chkBank:'Bank', chkCut:'Cut', chkCannon:'Cannon', chkKiss:'Kiss',
  chkCombo:'Combo', chkLong:'Long', chkMasse:'Masse', chkJump:'Jump', chkCushion:'Cushion',
  chkSidePocket:'Side Pocket', chkCornerPocket:'Corner Pocket'
};

function collectDetails() {
  const fouls = [], mistakes = [];
  for (const [id, label] of Object.entries(FOUL_MAP))    if (document.getElementById(id).checked) fouls.push(label);
  for (const [id, label] of Object.entries(MISTAKE_MAP)) if (document.getElementById(id).checked) mistakes.push(label);
  return { fouls, mistakes };
}

function resetDetailInputs() {
  document.querySelectorAll('#detailsGrid input[type="checkbox"]').forEach(cb => cb.checked = false);
  const bih = document.getElementById('chkBallInHand');
  if (bih) bih.checked = false;
  const clean = document.querySelector('input[name="breakResult"][value="clean"]');
  if (clean) clean.checked = true;
}

// ============================================================
// UNDO / TOGGLES
// ============================================================
async function undoInning() {
  if (!sessionActive || !session) { showToast(t('noActiveSession'), 'warning'); return; }
  const ok = await modalConfirm({
    title: t('undo'),
    message: t('undoConfirm'),
    okText: t('yes'),
    cancelText: t('no')
  });
  if (!ok) return;
  if (session.mode === 'bowlard') {
    if (session.frames.length === 0) { showToast(t('nothingToUndo'), 'warning'); return; }
    const last = session.frames[session.frames.length-1];
    const lastIdx = session.frames.length - 1;
    if (lastIdx < 9) {
      if (last.r2 !== undefined) delete last.r2;
      else session.frames.pop();
    } else {
      if (last.r3 !== undefined) delete last.r3;
      else if (last.r2 !== undefined) delete last.r2;
      else session.frames.pop();
    }
    const r = computeBowlardFrames(session.frames);
    recalcBowlardSession(session);
  } else {
    if (session.innings.length === 0) { showToast(t('nothingToUndo'), 'warning'); return; }
    session.innings.pop();
    recalcQSkillSession(session);
  }
  resetDetailInputs();
  updateUI(); saveData(); renderHistory();
  showToast(t('undoSuccess'), 'info');
}

function togglePause() {
  if (!sessionActive) return;
  sessionPaused = !sessionPaused;
  setActionLabels();
  updateScoreButtonsDisabled(); 
  saveLive();
}

function updateScoreButtonsDisabled() {
  const paused = sessionPaused;
  document.querySelectorAll('#scoreGridDesktop .score-btn, #scoreGridMobile .score-btn')
    .forEach(b => b.disabled = paused);
  document.querySelectorAll('#bowlardEntryGrid .score-btn')
    .forEach(b => b.disabled = paused || b.dataset.illegal === '1');
}

function toggleHide() {
  hideScore = !hideScore;
  updateUI();
  setActionLabels();
  saveLive();
}

// ============================================================
// FOCUS MODE
// ============================================================
// Locks page scrolling and shows only the stats + entry cards, so both fit the
// viewport. The two cards are MOVED into #focusMode (rather than duplicated) so
// every element id keeps working.
//
// Both cards are forced visible by CSS while focus is on, so updateUI() may run
// freely without collapsing them. toggleFocus() must therefore be called AFTER
// updateUI() so its button label is computed from the final state.
function toggleFocus() {
  if (!sessionActive) return;
  if (focusMode) exitFocus(); else enterFocus();
}

// Placeholder nodes remember where the cards belong, so exiting restores the
// normal page order instead of dumping them at the bottom of the grid.
function makeAnchor(card) {
  const a = document.createElement('div');
  a.hidden = true;
  a.dataset.focusAnchorFor = card.id;
  card.parentNode.insertBefore(a, card);
  return a;
}

function enterFocus() {
  const container = document.getElementById('focusMode');
  const stats = document.getElementById('statsCard');
  const entry = document.getElementById('entryCard');
  if (!container || !stats || !entry) return;

  focusPrevScroll = window.scrollY || window.pageYOffset || 0;
  makeAnchor(stats);
  makeAnchor(entry);

  container.appendChild(stats);
  container.appendChild(entry);
  document.body.classList.add('focus-mode');
  focusMode = true;
  setActionLabels();
}

function exitFocus() {
  const container = document.getElementById('focusMode');
  if (container) {
    container.querySelectorAll(':scope > .card').forEach(card => {
      const anchor = document.querySelector(`[data-focus-anchor-for="${card.id}"]`);
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(card, anchor);
        anchor.remove();
      } else if (container.parentNode) {
        container.parentNode.insertBefore(card, container);
      }
    });
  }
  // Any anchor whose card never made it back would linger as an empty node.
  document.querySelectorAll('[data-focus-anchor-for]').forEach(a => a.remove());

  document.body.classList.remove('focus-mode');
  focusMode = false;
  setActionLabels();
  window.scrollTo(0, focusPrevScroll);
}
// Large screens show the detail grid inline (see the 819px media queries).
// Small screens hide it and use this button, which opens the very same
// #detailsGrid inside a modal instead of expanding it in place.
//
// The grid is MOVED into the overlay rather than duplicated, so every
// getElementById('chk…') in collectDetails()/resetDetailInputs() keeps
// working untouched. It is moved back on close, so the ids survive.
function openDetailsModal() {
  const grid = document.getElementById('detailsGrid');
  const section = document.getElementById('detailSection');
  if (!grid || !section) return;

  const sectionClass = section.className;
  const gridClass = grid.className;
  const gridStyle = grid.getAttribute('style');
  const nextSibling = section.nextSibling;
  const parent = section.parentNode;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box modal-details" role="dialog" aria-modal="true">
      <h3></h3>
      <div class="modal-details-body"></div>
      <div class="modal-actions">
        <button class="primary ok"></button>
      </div>
    </div>`;
  overlay.querySelector('h3').textContent = t('Details');
  overlay.querySelector('.ok').textContent = t('ok');

  // Inside the modal the grid must always be visible. An inline style is
  // required: under 819px the stylesheet sets `.detail-grid{display:none}`
  // and only `.detail-grid.open` re-enables it, so stripping the class alone
  // would leave every checkbox hidden.
  section.className = '';
  grid.className = grid.className.replace(/\bopen\b/g, '').trim();
  grid.style.display = 'grid';
  overlay.querySelector('.modal-details-body').appendChild(grid);

  const restore = () => {
    section.className = sectionClass;
    grid.className = gridClass;
    if (gridStyle === null) grid.removeAttribute('style');
    else grid.setAttribute('style', gridStyle);
    // The grid was MOVED into the modal body, so it must be put back first —
    // otherwise it would be discarded along with the overlay.
    if (!section.contains(grid)) section.insertBefore(grid, section.firstChild);
    // Put the section back exactly where it was; if the card was re-rendered
    // while the modal was open the old anchor is stale, so fall back to append.
    if (parent && nextSibling && nextSibling.parentNode === parent) {
      parent.insertBefore(section, nextSibling);
    } else {
      const card = document.getElementById('entryCard');
      if (card) card.appendChild(section);
    }
    overlay.remove();
  };

  // Every toggle applies immediately (nothing to confirm), so closing via the
  // button, Escape or the backdrop is always safe.
  const close = () => { restore(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  overlay.querySelector('.ok').onclick = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  setTimeout(() => { const b = overlay.querySelector('.ok'); if (b) b.focus(); }, 60);
}
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!sessionPaused) {
      timerSeconds++;
      document.getElementById('timerDisplay').textContent = formatTime(timerSeconds);
      // Keep the phone summary line's clock in step.
      updateCompactStats();
    }
  }, 1000);
}
function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
function formatTime(secs) {
  const m = String(Math.floor(secs/60)).padStart(2,'0');
  const s = String(secs%60).padStart(2,'0');
  return `${m}:${s}`;
}

function getLastClickedButton() {
  if (!session) return null;

  if (session.mode === 'bowlard') {
    const frames = session.frames || [];
    for (let i = frames.length - 1; i >= 0; i--) {
      const f = frames[i];
      if (!f) continue;
      if (f.r3 !== undefined) return { value: f.clicked3 !== undefined ? f.clicked3 : f.r3 };
      if (f.r2 !== undefined) return { value: f.clicked2 !== undefined ? f.clicked2 : f.r2 };
      if (f.r1 !== undefined) return { value: f.clicked1 !== undefined ? f.clicked1 : f.r1 };
    }
    return null;
  }

  const innings = session.innings || [];
  if (!innings.length) return null;
  return { value: innings[innings.length - 1].ballsPocketed };
}

function applyLastClickedGlow() {
  document.querySelectorAll('.score-btn.last-clicked')
    .forEach(b => b.classList.remove('last-clicked'));

  if (!sessionActive || !session) return;

  const last = getLastClickedButton();
  if (last === null || last.value === undefined) return;

  const targets = session.mode === 'bowlard'
    ? [document.getElementById('bowlardEntryGrid')]
    : [document.getElementById('scoreGridDesktop'), document.getElementById('scoreGridMobile')];

  targets.forEach(grid => {
    if (!grid) return;
    const sel = session.mode === 'bowlard'
      ? `.score-btn[data-value="${last.value}"]`
      : `.score-btn[data-score="${last.value}"]`;
    const btn = grid.querySelector(sel);
    if (btn && !btn.disabled) btn.classList.add('last-clicked');
  });
}

// ============================================================
// UI UPDATE
// ============================================================
function renderScoreWithAdj(el, raw, tdf) {
  // Render e.g. "100 (105)" or "100"
  const adj = isTdfAdjustedMode() ? adjustedScore(raw, tdf) : null;
  if (adj === null || adj === raw) {
    el.textContent = String(raw);
  } else {
    el.textContent = String(raw);
    const span = document.createElement('span');
    span.className = 'tdf-adj';
    span.textContent = `(${adj})`;
    el.appendChild(span);
  }
}

// While a session is running the setup row must not change: the session has
// already captured mode / players / table / target. Everything is disabled
// except the TDF display toggle (a pure view preference, safe to flip mid-game)
// and the Start button itself, which is how the session gets ended.
// On phones the details trigger should sit next to the break options to keep the
// entry card short. It is MOVED into the break row (so its id and click handler
// keep working) and put back on wider screens.
//
// IMPORTANT: the break row is hidden in bowlard mode, so the trigger must only
// live there while the qskill group is visible — otherwise it would vanish.
function syncDetailTogglePlacement() {
  const toggle = document.getElementById('detailsToggle');
  const breakRow = document.getElementById('breakRow');
  const section = document.getElementById('detailSection');
  const qskillGroup = document.getElementById('qskillEntryGroup');
  if (!toggle || !breakRow || !section) return;

  const narrow = window.matchMedia('(max-width:819px)').matches;
  // Only pair it with the break row when that row is actually on screen.
  const breakRowVisible = !qskillGroup || qskillGroup.style.display !== 'none';

  if (narrow && breakRowVisible) {
    if (toggle.parentNode !== breakRow) breakRow.appendChild(toggle);
  } else if (toggle.parentNode !== section) {
    section.appendChild(toggle);
  }
}

function updateSetupLock() {
  const setup = document.querySelector('.setup-row');
  if (!setup) return;
  const locked = sessionActive;
  setup.querySelectorAll('select, input, button').forEach(el => {
    const keepUnlocked = el.closest('#tdfDisplayGroup') || el.id === 'btnStart';
    if (keepUnlocked) return;
    el.disabled = locked;
  });
}

// ============================================================
// RDS — Runout Drill System (interactive reference)
// Source: Dr. Dave Alciatore, Billiards Digest, Oct 2020.
// Rules for levels 1-13 are taken from the illustrated tables in the
// article; levels 14-16 come from the same progression (9-ball rules,
// 8-ball + remaining in order, full rotation).
// ============================================================

// Rack layouts, front row first. 'S'=solid, 'P'=stripe, '8'=the eight ball.
// The trailing number is the ball number, so the diagram doubles as a
// "which balls go where" reference.
const RDS_RACKS = {
  triangle6: [
    ['S1'],
    ['S2', 'S3'],
    ['S4', 'S5', 'S6']
  ],
  // 7 balls: a 6-ball triangle with the 8 added, so the 8 sits in the middle.
  // Ball 9 is kept out of the bottom slot (it would sit right under the 8).
  rack7: [
    ['S1'],
    ['P9', 'P10'],
    ['S2', '8', 'S3'],
    ['P11']
  ],
  // 8-ball variant of the 9-ball diamond: the 8 ball in the centre.
  diamond9: [
    ['S1'],
    ['S2', 'P11'],
    ['S3', '8', 'S4'],
    ['P10', 'P12'],
    ['P9']
  ],
  // Standard 9-ball rack: only balls 1-9, with the 1 on top, the 9 in the
  // centre and the 2 at the bottom.
  diamond9n: [
    ['S1'],
    ['S3', 'S4'],
    ['S5', 'P9', 'S6'],
    ['S7', '8'],
    ['S2']
  ],
  // 15-ball rack with the 8 in the middle of the third row.
  triangle15: [
    ['S1'],
    ['P15', 'S5'],
    ['S2', '8', 'P10'],
    ['P11', 'S7', 'P14', 'S3'],
    ['S4', 'P9', 'P13', 'S6', 'P12']
  ]
};

// Level name → rank-plate tier, so the RDS badge uses the same palette as
// the tracker's own rank plate.
const RDS_PL_TIER = {
  plNov: 'r-nov',
  plLowerBeg: 'r-beg-l', plMidBeg: 'r-beg-m', plUpperBeg: 'r-beg-u',
  plLowerInt: 'r-int-l', plMidInt: 'r-int-m', plUpperInt: 'r-int-u',
  plLowerAdv: 'r-adv-l', plMidAdv: 'r-adv-m', plUpperAdv: 'r-adv-u',
  plLowerShort: 'r-ama-l', plUpperShort: 'r-ama-u',
  plSemiPro: 'r-pro', plWorldPro: 'r-wc'
};

// The 14-tier rating table, top to bottom. `levels` lists the RDS levels that
// belong to the tier; `key` names the tier, `desc` carries its description.
const RANK_TIERS = [
  { key:'plWorldPro',   cls:'r-wc',    levels:[16],      bu:'185~200', abcd:'A++ / AAAA / SS', fargo:'> 750',     q:'—',      b:'—',      ars:'10-2',    cn:'11',      desc:'tdWc' },
  { key:'plSemiPro',    cls:'r-pro',   levels:[15],      bu:'175~184', abcd:'A+ / AAA / S',    fargo:'720~749',   q:'18.1+',  b:'210+',   ars:'10-1',    cn:'10, 11',  desc:'tdPro' },
  { key:'plUpperShort', cls:'r-ama-u', levels:[14],      bu:'165~174', abcd:'A / AA',          fargo:'680~719',   q:'16.1~18.0', b:'180~209', ars:'10, 10-1', cn:'9, 10', desc:'tdUAma' },
  { key:'plLowerShort', cls:'r-ama-l', levels:[13],      bu:'155~164', abcd:'A- / A',          fargo:'640~679',   q:'12.1~16.0', b:'140~179', ars:'9, 10',   cn:'8, 9',   desc:'tdLAma' },
  { key:'plUpperAdv',   cls:'r-adv-u', levels:[12],      bu:'140~154', abcd:'B+',              fargo:'600~639',   q:'11.1~12.0', b:'127~139', ars:'8, 9',   cn:'7, 8',   desc:'tdUAdv' },
  { key:'plMidAdv',     cls:'r-adv-m', levels:[11],      bu:'125~139', abcd:'B',               fargo:'550~599',   q:'10.1~11.0', b:'114~126', ars:'7, 8',   cn:'6, 7',   desc:'tdMAdv' },
  { key:'plLowerAdv',   cls:'r-adv-l', levels:[10],      bu:'110~124', abcd:'B-',              fargo:'500~549',   q:'9.1~10.0',  b:'100~113', ars:'7, 8',   cn:'5, 6',   desc:'tdLAdv' },
  { key:'plUpperInt',   cls:'r-int-u', levels:[9],       bu:'95~109',  abcd:'C+',              fargo:'450~499',   q:'8.1~9.0',   b:'87~99',   ars:'6, 7',   cn:'4, 5',   desc:'tdUInt' },
  { key:'plMidInt',     cls:'r-int-m', levels:[8],       bu:'70~94',   abcd:'C',               fargo:'400~449',   q:'7.1~8.0',   b:'74~86',   ars:'5, 6',   cn:'3, 4',   desc:'tdMInt' },
  { key:'plLowerInt',   cls:'r-int-l', levels:[7],       bu:'55~69',   abcd:'C-',              fargo:'350~399',   q:'6.1~7.0',   b:'60~73',   ars:'5, 6',   cn:'2, 3',   desc:'tdLInt' },
  { key:'plUpperBeg',   cls:'r-beg-u', levels:[6],       bu:'40~54',   abcd:'D+',              fargo:'325~349',   q:'5.1~6.0',   b:'50~59',   ars:'4, 5',   cn:'2',      desc:'tdUBeg' },
  { key:'plMidBeg',     cls:'r-beg-m', levels:[5],       bu:'30~39',   abcd:'D',               fargo:'300~324',   q:'4.1~5.0',   b:'40~49',   ars:'3, 4',   cn:'1',      desc:'tdMBeg' },
  { key:'plLowerBeg',   cls:'r-beg-l', levels:[4],       bu:'20~29',   abcd:'D-',              fargo:'200~299',   q:'3.1~4.0',   b:'29~39',   ars:'2, 3',   cn:'0',      desc:'tdLBeg' },
  { key:'plNov',        cls:'r-nov',   levels:[1,2,3],   bu:'0~19',    abcd:'D--',             fargo:'0~200',     q:'~3.0',      b:'~29',     ars:'1, 2',   cn:'0',      desc:'tdNov' }
];

function rdsLevelRange(tier) {
  const l = tier.levels;
  return l.length > 1 ? `${l[0]}–${l[l.length - 1]}` : String(l[0]);
}

// Rows for the 14-tier comparison table. `curIdx` marks the row to highlight;
// `activeCol` marks which Q Skill / Bowlard column belongs to the open mode.
function rankTierRows(curIdx, activeCol) {
  const qCls = activeCol === 'qskill'  ? ' class="col-active"' : '';
  const bCls = activeCol === 'bowlard' ? ' class="col-active"' : '';
  return RANK_TIERS.map((tier, i) => {
    // The column shows only the primary ABCD grade; the full list (e.g.
    // "A++ / AAAA / SS") stays in the expanded description.
    const abcdShort = String(tier.abcd).split(' / ')[0];
    const isCur = i === curIdx;
    return `<tr class="rds-rank-row${isCur ? ' current' : ''}" data-idx="${i}">`
      + `<td>${isCur ? '<span class="rds-cur-dot"></span>' : ''}<span class="rank-plate ${tier.cls}">${escapeHtml(t(tier.key))}</span></td>`
      + `<td>${escapeHtml(rdsLevelRange(tier))}</td>`
      + `<td>${escapeHtml(tier.bu)}</td>`
      + `<td>${escapeHtml(abcdShort)}</td>`
      + `<td>${escapeHtml(tier.fargo)}</td>`
      + `<td${qCls}>${escapeHtml(tier.q)}</td>`
      + `<td${bCls}>${escapeHtml(tier.b)}</td>`
      + `</tr>`
      + `<tr class="rds-rank-desc" data-idx="${i}" hidden><td colspan="7">`
      + `<span class="rds-tag">ABCD ${escapeHtml(tier.abcd)}</span>`
      + `<span class="rds-tag">ARS ${escapeHtml(tier.ars)}</span>`
      + `<span class="rds-tag">CN ${escapeHtml(tier.cn)}</span>`
      + `<p>${escapeHtml(t(tier.desc))}</p></td></tr>`;
  }).join('');
}

// Renders the 14-tier comparison table inside the RDS card. Clicking a row
// reveals that tier's description, ARS and CN rating.
function renderRdsRankTable() {
  const body = document.getElementById('rdsRankBody');
  if (!body) return;
  const curIdx = RANK_TIERS.findIndex(x => x.levels.indexOf(rdsLevel) !== -1);
  body.innerHTML = rankTierRows(curIdx, 'qskill');
}

// bih: 'none' | 'every' | <number of extra ball-in-hands>
// order: 'any' | 'rot'
// rule: 'none' | '8' | '9'
const RDS_LEVELS = [
  { n:1,  rack:'triangle6',  balls:6,  bih:'none',  order:'any', rule:'none', pl:'plNov',        abcd:'D--',      fargo:'0-200',   bu:'0-19',
    frags:['rfBreakN|6','rfRemoveCB','rfPocketDirect','rfWipe'] },
  { n:2,  rack:'triangle6',  balls:6,  bih:'every', order:'any', rule:'none', pl:'plNov',        abcd:'D--',      fargo:'0-200',   bu:'0-19',
    frags:['rfBreakN|6','rfBihEvery','rfPocketAny'] },
  { n:3,  rack:'triangle6',  balls:6,  bih:3,       order:'any', rule:'none', pl:'plNov',        abcd:'D--',      fargo:'0-200',   bu:'0-19',
    frags:['rfBreakN|6','rfBihPlus|3','rfPocketAny'] },
  { n:4,  rack:'triangle6',  balls:6,  bih:2,       order:'any', rule:'none', pl:'plLowerBeg',   abcd:'D-',       fargo:'200-299', bu:'20-29',
    frags:['rfBreakN|6','rfBihPlus|2','rfPocketAny'] },
  { n:5,  rack:'triangle6',  balls:6,  bih:1,       order:'any', rule:'none', pl:'plMidBeg',     abcd:'D',        fargo:'300-324', bu:'30-39',
    frags:['rfBreakN|6','rfBihPlus|1','rfPocketAny'] },
  { n:6,  rack:'rack7',      balls:7,  bih:1,       order:'any', rule:'8',    pl:'plUpperBeg',   abcd:'D+',       fargo:'325-349', bu:'40-54',
    frags:['rfBreak7','rf8ball','rfPocket8'] },
  { n:7,  rack:'diamond9n',  balls:9,  bih:1,       order:'any', rule:'none', pl:'plLowerInt',   abcd:'C-',       fargo:'350-399', bu:'55-69',
    frags:['rfBreakN|9','rfBihPlus|1','rfPocketAny'] },
  { n:8,  rack:'diamond9',   balls:9,  bih:1,       order:'any', rule:'8',    pl:'plMidInt',     abcd:'C',        fargo:'400-449', bu:'70-94',
    frags:['rfBreak9','rf8ball','rfPocket8'] },
  { n:9,  rack:'triangle15', balls:15, bih:2,       order:'any', rule:'none', pl:'plUpperInt',   abcd:'C+',       fargo:'450-499', bu:'95-109',
    frags:['rfBreakN|15','rfBihPlus|2','rfPocketAny'] },
  { n:10, rack:'triangle6',  balls:6,  bih:'after', order:'rot', rule:'none', pl:'plLowerAdv',   abcd:'B-',       fargo:'500-549', bu:'110-124',
    frags:['rfBreakN|6','rfBihAfter','rfRotation'] },
  { n:11, rack:'triangle15', balls:15, bih:'after', order:'any', rule:'none', pl:'plMidAdv',     abcd:'B',        fargo:'550-599', bu:'125-139',
    frags:['rfBreakN|15','rfBihAfter','rfPocketAny'] },
  { n:12, rack:'triangle15', balls:15, bih:'after', order:'any', rule:'8',    pl:'plUpperAdv',   abcd:'B+',       fargo:'600-639', bu:'140-154',
    frags:['rfBreakN|15','rf8ball','rfPocket8'] },
  { n:13, rack:'diamond9',   balls:9,  bih:'after', order:'rot', rule:'8',    pl:'plLowerShort', abcd:'A- / A',   fargo:'640-679', bu:'155-164',
    frags:['rfBreak9','rf8ball','rfPocket8','rfRemainingRotation'] },
  { n:14, rack:'diamond9n',  balls:9,  bih:'after', order:'rot', rule:'9',    pl:'plUpperShort', abcd:'A / AA',   fargo:'680-719', bu:'165-174',
    frags:['rfBreakN|9','rf9ball'] },
  { n:15, rack:'triangle15', balls:15, bih:'after', order:'rot', rule:'8',    pl:'plSemiPro',    abcd:'A+ / AAA', fargo:'720-749', bu:'175-184',
    frags:['rfBreakN|15','rf8ball','rfPocket8','rfRemainingRotation'] },
  { n:16, rack:'triangle15', balls:15, bih:'after', order:'rot', rule:'none', pl:'plWorldPro',   abcd:'A++ / AAAA', fargo:'750+',  bu:'185-200',
    frags:['rfBreakN|15','rfBihAfter','rfRotation'] }
];

// Ball colours: 1-8 are the solids; 9-15 repeat them as stripes.
const RDS_BALL_COLOR = {
  1:'#e6b800', 2:'#1c4fa1', 3:'#cf3030', 4:'#6b3fa0',
  5:'#e2761b', 6:'#1e7a3c', 7:'#8b1a1a'
};

function rdsBallSvg(x, y, r, spec, uid) {
  const num = spec === '8' ? 8 : parseInt(spec.slice(1), 10);
  const isStripe = spec !== '8' && spec[0] === 'P';
  const color = spec === '8' ? '#161616' : (RDS_BALL_COLOR[num >= 9 ? num - 8 : num] || '#777');
  const body = isStripe ? '#fbfbfb' : color;
  const numR = r * 0.46;
  const fontSize = (r * 0.62).toFixed(2);
  let out = `<g class="rds-ball">`;
  out += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r}" fill="${body}" stroke="rgba(0,0,0,.55)" stroke-width=".9"/>`;
  if (isStripe) {
    const bh = r * 1.02;
    out += `<clipPath id="rdsclip${uid}"><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r}"/></clipPath>`;
    out += `<rect x="${(x - r).toFixed(2)}" y="${(y - bh / 2).toFixed(2)}" width="${(r * 2).toFixed(2)}" height="${bh.toFixed(2)}" fill="${color}" clip-path="url(#rdsclip${uid})"/>`;
  }
  out += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${numR.toFixed(2)}" fill="#fbfbfb" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>`;
  out += `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-weight="700" fill="${spec === '8' ? '#111' : '#222'}">${num}</text>`;
  out += `</g>`;
  return out;
}

function rdsRackSvg(layout) {
  const r = 12, dx = r * 2 + 1.6, dy = r * 1.86;
  const rows = layout.length;
  const maxCols = Math.max(...layout.map(row => row.length));
  const w = maxCols * dx + r;
  // Place rows first: a lone ball below a wide row has nothing to nest into,
  // so it would sit flush against the ball above it. Push it down a little.
  const ys = layout.map((row, i) => {
    let y = r + 2 + i * dy;
    if (row.length === 1 && i > 0 && layout[i - 1].length >= 3) y += r * 0.3;
    return y;
  });
  const h = ys[ys.length - 1] + r + 2;
  const parts = [];
  layout.forEach((row, i) => {
    const y = ys[i];
    row.forEach((spec, j) => {
      const x = w / 2 + (j - (row.length - 1) / 2) * dx;
      parts.push(rdsBallSvg(x, y, r, spec, `${i}_${j}`));
    });
  });
  return `<svg class="rds-rack-svg" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" role="img">${parts.join('')}</svg>`;
}

// Builds the level chips. The blue chip is the level being VIEWED; the
// dotted one is the player's recorded level, so browsing never looks
// like it changed the record.
function rdsBuildChips() {
  const box = document.getElementById('rdsChips');
  if (!box) return;
  const rec = rdsRecordFor(rdsPlayerId);
  const cur = rec ? rec.level : -1;
  box.innerHTML = RDS_LEVELS.map(l =>
    `<button type="button" class="rds-chip${l.n === rdsLevel ? ' active' : ''}${l.n === cur ? ' is-current' : ''}" data-rds="${l.n}" title="${t('rdsLevelShort')} ${l.n}">${l.n}</button>`
  ).join('');
}

function rdsSetLevel(n) {
  rdsLevel = n;
  renderRds();
}

function rdsMetaCell(labelKey, value) {
  return `<div class="rds-cell"><span class="rds-celllabel" data-i18n="${labelKey}">${t(labelKey)}</span>` +
         `<span class="rds-cellvalue">${value}</span></div>`;
}

function renderRds() {
  const cfg = RDS_LEVELS.find(l => l.n === rdsLevel) || RDS_LEVELS[0];

  rdsBuildChips();

  const rackEl = document.getElementById('rdsRack');
  if (rackEl) rackEl.innerHTML = rdsRackSvg(RDS_RACKS[cfg.rack]);

  const titleEl = document.getElementById('rdsLevelTitle');
  if (titleEl) titleEl.innerHTML =
    `<span class="rds-lvlnum">${t('rdsLevel')} ${cfg.n}</span>` +
    `<span class="rank-plate ${RDS_PL_TIER[cfg.pl] || 'r-nov'}">${t(cfg.pl)}</span>`;

  // Rule bullets: each fragment is "key" or "key|param".
  const rulesEl = document.getElementById('rdsRules');
  if (rulesEl) {
    rulesEl.innerHTML = cfg.frags.map(f => {
      const [key, param] = f.split('|');
      const text = t(key).replace('{n}', param !== undefined ? param : '');
      return `<li>${text}</li>`;
    }).join('');
  }

  const bihText = cfg.bih === 'none' ? t('bihNone')
                : cfg.bih === 'every' ? t('bihEvery')
                : cfg.bih === 'after' ? t('bihAfter')
                : t('bihPlus').replace('{n}', cfg.bih);
  const orderText = cfg.order === 'rot' ? t('ordRotation') : t('ordAny');
  const ruleText = cfg.rule === '8' ? t('rule8') : cfg.rule === '9' ? t('rule9') : t('ruleNone');

  const metaEl = document.getElementById('rdsMeta');
  if (metaEl) metaEl.innerHTML =
      rdsMetaCell('rdsBalls', cfg.balls)
    + rdsMetaCell('rdsBih', bihText)
    + rdsMetaCell('rdsOrder', orderText)
    + rdsMetaCell('rdsRules', ruleText)
    + rdsMetaCell('rdsAbcd', cfg.abcd)
    + rdsMetaCell('rdsFargo', cfg.fargo)
    + rdsMetaCell('rdsBu', cfg.bu);

  rdsRenderRecord();
  rdsRender100();
  renderRdsRankTable();
}

// ============================================================
// RDS records — one entry per player: current level + round log.
// Progression comes from the article: run 2+ of 3 racks to move up
// one level, run none of 3 to move down one, run 1 of 3 to stay.
// ============================================================
const RDS_MIN_LEVEL = 1;
const RDS_MAX_LEVEL = RDS_LEVELS.length;
// Only the newest rounds are kept (and shown) — the log stays short.
const RDS_HIST_MAX = 10;

// One row per recorded round; shared by the "history" dialog.
function rdsRoundRowHtml(a) {
  const cls = { up: 'rds-badge-up', stay: 'rds-badge-stay', down: 'rds-badge-down' };
  const lbl = { up: 'rdsUp', stay: 'rdsStay', down: 'rdsDown' };
  const d = new Date(a.at);
  const pad = n => String(n).padStart(2, '0');
  const ds = `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const res = cls[a.result] ? a.result : rdsOutcome(a.racks);
  return `<div class="rds-hrow">`
    + `<span class="rds-hdate">${ds}</span>`
    + `<span class="rds-hlvl">${t('rdsLevelShort')} ${a.level}</span>`
    + `<span class="rds-hracks">${a.racks}/3 ${t('rdsRackUnit')}</span>`
    + `<span class="rds-badge ${cls[res]}">${t(lbl[res])}</span>`
    + `</div>`;
}

// One row per finished RDS 100 game.
function rds100RowHtml(h) {
  const d = new Date(h.at);
  const pad = n => String(n).padStart(2, '0');
  const ds = `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const lv = h.fromLevel === h.toLevel
    ? `${t('rdsLevelShort')} ${h.fromLevel}`
    : `${t('rdsLevelShort')} ${h.fromLevel}→${h.toLevel}`;
  // Show the table when the game was played on something other than the
  // default one, so a score can be traced back to its difficulty.
  const tbl = (h.tableName && h.tableTdf && h.tableTdf !== 1)
    ? `${h.tableName} · ${h.tableTdf.toFixed(2)}`
    : (h.tableName || '');
  // Keep the adjusted score too: a row can't be read back later without
  // knowing whether the number was before or after the difficulty factor.
  const adj = (typeof h.adjScore === 'number')
    ? h.adjScore
    : rds100EffScore(h.score, h.tableTdf);
  // Spell the second number out: "88 (75)" alone leaves the reader guessing
  // which of the two is the adjusted score.
  const scoreTxt = `${t('rds100Score')} ${h.score}` +
    (adj !== h.score ? ` (${adj})` : '');
  return `<div class="rds-hrow">`
    + `<span class="rds-hdate">${ds}</span>`
    + `<span class="rds-hlvl">${lv}</span>`
    + `<span class="rds-hracks">${formatTime(h.playTime)}</span>`
    + `<span class="rds-hracks" title="raw ${h.score}${adj !== h.score ? ' → adjusted ' + adj : ''}">${scoreTxt}</span>`
    + (tbl ? `<span class="rds-hracks rds-hmuted">${escapeHtml(tbl)}</span>` : '')
    + `<span class="rds-badge rds-badge-stay">${t('rdsLevelShort')} ${h.refLevel}</span>`
    + `</div>`;
}

// Rows live in a dialog rather than under the card, so the reference stays
// compact on a phone.
function rdsShowHistory(title, rowsHtml, emptyText) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box modal-rds-hist" role="dialog" aria-modal="true">
      <h3></h3>
      <div class="rds-history"></div>
      <div class="modal-actions"><button class="ok"></button></div>
    </div>`;
  overlay.querySelector('h3').textContent = title;
  const list = overlay.querySelector('.rds-history');
  if (rowsHtml.length) {
    list.innerHTML = rowsHtml.join('');
  } else {
    const empty = document.createElement('div');
    empty.className = 'rds-empty';
    empty.textContent = emptyText;
    list.appendChild(empty);
  }
  const ok = overlay.querySelector('.ok');
  ok.textContent = t('close');
  const onKey = e => { if (e.key === 'Escape') close(); };
  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 200);
    document.removeEventListener('keydown', onKey);
  };
  ok.onclick = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  setTimeout(() => ok.focus(), 60);
}

function rdsRecordFor(playerId) {
  if (!playerId) return null;
  if (!appData.rdsRecords) appData.rdsRecords = {};
  const rec = appData.rdsRecords[playerId];
  // No record yet: the player has not chosen a starting level, so callers must
  // treat this as "first run" rather than inventing level 1 for them.
  if (!rec || typeof rec !== 'object') return null;
  if (typeof rec.level !== 'number' || !isFinite(rec.level)) rec.level = RDS_MIN_LEVEL;
  rec.level = Math.min(RDS_MAX_LEVEL, Math.max(RDS_MIN_LEVEL, rec.level));
  if (!Array.isArray(rec.attempts)) rec.attempts = [];
  return rec;
}

// Creates the record on first run, or moves the level of an existing one
// (history is kept so a correction never wipes past rounds).
function rdsSetLevelForPlayer(playerId, level) {
  if (!playerId) return;
  if (!appData.rdsRecords) appData.rdsRecords = {};
  const n = Math.min(RDS_MAX_LEVEL, Math.max(RDS_MIN_LEVEL, level | 0 || RDS_MIN_LEVEL));
  const existing = appData.rdsRecords[playerId];
  if (existing && Array.isArray(existing.attempts) && existing.attempts.length) {
    existing.level = n;
  } else {
    appData.rdsRecords[playerId] = { level: n, attempts: [] };
  }
  rdsChanging = false;
  persistData();
  rdsLevel = n;
  renderRds();
}

function rdsOutcome(racks) {
  if (racks >= 2) return 'up';
  if (racks === 0) return 'down';
  return 'stay';
}

function rdsNextLevel(level, result) {
  if (result === 'up')   return Math.min(RDS_MAX_LEVEL, level + 1);
  if (result === 'down') return Math.max(RDS_MIN_LEVEL, level - 1);
  return level;
}

// Records a round at the player's CURRENT level (browsing with the chips
// never changes what gets logged), then moves the view to the new level.
function rdsLogRound(racks) {
  const rec = rdsRecordFor(rdsPlayerId);
  if (!rec) return;
  const level = rec.level;
  const result = rdsOutcome(racks);
  const next = rdsNextLevel(level, result);
  rec.attempts.unshift({ at: Date.now(), level, racks, result, next });
  // Keep the log short: only the newest RDS_HIST_MAX rounds are stored.
  rec.attempts = rec.attempts.slice(0, RDS_HIST_MAX);
  rec.level = next;
  persistData();
  rdsLevel = next;
  renderRds();
}

// The RDS view uses the shared Player selector, like every other mode — it
// has no selector of its own.
function rdsSyncPlayerSelect() {
  const sel = document.getElementById('playerSelect');
  const chosen = sel ? sel.value : '';
  if (chosen && appData.players.some(p => p.id === chosen)) {
    rdsPlayerId = chosen;
    return;
  }
  if (!rdsPlayerId || !appData.players.some(p => p.id === rdsPlayerId)) {
    const fallback = appData.lastUsed.playerId || (appData.players[0] && appData.players[0].id) || '';
    rdsPlayerId = appData.players.some(p => p.id === fallback) ? fallback
                : (appData.players[0] && appData.players[0].id) || '';
  }
}

function rdsBuildStartOptions() {
  const sel = document.getElementById('rdsStartLevel');
  if (!sel) return;
  // Rebuild when the language changes too, not just once.
  const version = `${currentLang}:${RDS_MAX_LEVEL}`;
  if (sel.dataset.built !== version) {
    const prev = sel.value;
    sel.innerHTML = RDS_LEVELS.map(l =>
      `<option value="${l.n}">${l.n} — ${t(l.pl)}</option>`).join('');
    sel.dataset.built = version;
    sel.value = prev || '5';
  }
}

function rdsRenderRecord() {
  rdsSyncPlayerSelect();
  const rec = rdsRecordFor(rdsPlayerId);
  const showSetup = !rec || rdsChanging;

  rdsBuildStartOptions();
  const setupEl  = document.getElementById('rdsSetup');
  const topEl    = document.getElementById('rdsRecordTop');
  const changeEl = document.getElementById('rdsChangeLevel');
  if (setupEl)  setupEl.style.display  = showSetup ? '' : 'none';
  if (topEl)    topEl.style.display    = showSetup ? 'none' : '';
  if (changeEl) changeEl.style.display = (rec && !rdsChanging) ? '' : 'none';

  const curEl = document.getElementById('rdsCurrentLevel');
  if (curEl) curEl.textContent = rec ? rec.level : '—';

  const btns = document.getElementById('rdsLogBtns');
  if (btns) {
    // "n/3" keeps the buttons compact and sidesteps plural forms.
    btns.innerHTML = [0, 1, 2, 3].map(n =>
      `<button type="button" class="rds-logbtn" data-racks="${n}" title="${n}/3 ${t('rdsRackUnit')}">${n}<span>/3</span></button>`
    ).join('');
  }

  const histBtn = document.getElementById('rdsHistBtn');
  if (histBtn) {
    const n = rec ? rec.attempts.length : 0;
    histBtn.textContent = `${t('rdsHistory')} (${n})`;
    histBtn.disabled = n === 0;
  }
}

// ============================================================
// RDS 100 — the scored variant. Start at 100 and play one rack per
// level; every miss or foul costs as many points as balls left on the
// table. Clearing a rack costs nothing and moves you up a level.
// Score x 2 is the BU score, so the score also has a level it maps to;
// the player only ever sees that mapped level, never the formula.
// ============================================================
const RDS100_START = 100;

function rds100For(playerId) {
  if (!playerId) return null;
  if (!appData.rds100 || typeof appData.rds100 !== 'object') appData.rds100 = {};
  const g = appData.rds100[playerId];
  if (!g || typeof g !== 'object') return null;
  if (typeof g.score !== 'number' || !isFinite(g.score)) g.score = RDS100_START;
  if (typeof g.elapsed !== 'number' || !isFinite(g.elapsed)) g.elapsed = 0;
  if (typeof g.level !== 'number' || !isFinite(g.level)) g.level = RDS_MIN_LEVEL;
  g.level = Math.min(RDS_MAX_LEVEL, Math.max(RDS_MIN_LEVEL, g.level));
  if (!Array.isArray(g.runs)) g.runs = [];
  if (typeof g.running !== 'boolean') g.running = false;
  if (typeof g.lastTick !== 'number') g.lastTick = null;
  return g;
}

// Score x 2 -> BU score -> the level whose BU band contains it.
// On a table with a difficulty factor the score is normalised first, the same
// way Q Skill adjusts a session score, so an easy table can't inflate a level.
function rds100EffScore(score, tdf) {
  const raw = Math.max(0, score);
  if (!isTdfAdjustedMode()) return raw;
  const f = (typeof tdf === 'number' && isFinite(tdf) && tdf > 0) ? tdf : TDF_DEFAULT;
  return adjustedScore(raw, f);
}

function rds100RefLevel(score, tdf) {
  const bu = rds100EffScore(score, tdf) * 2;
  let best = RDS_MIN_LEVEL;
  RDS_LEVELS.forEach(l => {
    const m = /^(\d+)-(\d+)$/.exec(l.bu);
    if (!m) return;
    if (bu >= parseInt(m[1], 10) && bu <= parseInt(m[2], 10)) best = l.n;
  });
  return best;
}

function rds100Balls(level) {
  const cfg = RDS_LEVELS[(level | 0) - 1] || RDS_LEVELS[0];
  return cfg.balls;
}

// Adds the seconds since the last tick to the game clock.
function rds100Tick() {
  const g = rds100For(rdsPlayerId);
  if (!g || !g.running || !g.lastTick) return g;
  const now = Date.now();
  g.elapsed += Math.max(0, Math.round((now - g.lastTick) / 1000));
  g.lastTick = now;
  return g;
}

function rds100Arm() {
  if (rds100Timer) { clearInterval(rds100Timer); rds100Timer = null; }
  const g = rds100For(rdsPlayerId);
  if (!g || !g.running || !rdsView) return;
  rds100Timer = setInterval(() => {
    const gg = rds100Tick();
    if (!gg || !gg.running) { clearInterval(rds100Timer); rds100Timer = null; return; }
    const el = document.getElementById('rds100Time');
    if (el) el.textContent = formatTime(gg.elapsed);
  }, 1000);
}

// The pre-game level picker mirrors the player's recorded level whenever no
// game is running, so it always starts from where they actually are.
function rds100SyncLevelSelect(active) {
  const sel = document.getElementById('rds100Level');
  if (!sel) return;
  // currentLang, not documentElement.lang: the page keeps the old lang
  // attribute, so keying on it never rebuilt the options.
  const version = `${currentLang}:${RDS_MAX_LEVEL}`;
  if (sel.dataset.built !== version) {
    const prev = sel.value;
    sel.innerHTML = RDS_LEVELS.map(l =>
      `<option value="${l.n}">${l.n} — ${t(l.pl)}</option>`).join('');
    sel.dataset.built = version;
    if (prev) sel.value = prev;
  }
  if (active) {
    if (sel.dataset.player !== rdsPlayerId) sel.dataset.player = rdsPlayerId;
    return;
  }
  const rec = rdsRecordFor(rdsPlayerId);
  sel.value = String(rec ? rec.level : RDS_MIN_LEVEL);
  sel.dataset.player = rdsPlayerId;
}

function rds100PickedLevel() {
  const sel = document.getElementById('rds100Level');
  const v = sel ? parseInt(sel.value, 10) : NaN;
  if (isFinite(v) && v >= RDS_MIN_LEVEL && v <= RDS_MAX_LEVEL) return v;
  const rec = rdsRecordFor(rdsPlayerId);
  return rec ? rec.level : RDS_MIN_LEVEL;
}

function rds100NewGame(startLevel) {
  if (!rdsPlayerId) return;
  if (!appData.rds100 || typeof appData.rds100 !== 'object') appData.rds100 = {};
  const now = Date.now();
  const level = Math.min(RDS_MAX_LEVEL,
    Math.max(RDS_MIN_LEVEL, startLevel || rds100PickedLevel()));
  const tbl = getSelectedTable();
  appData.rds100[rdsPlayerId] = {
    score: RDS100_START,
    level,
    elapsed: 0,
    running: true,
    lastTick: now,
    startedAt: now,
    // Locked in at start so the reference level stays meaningful if the
    // table selector changes mid-game.
    tableTdf: (tbl && typeof tbl.tdf === 'number' && isFinite(tbl.tdf) && tbl.tdf > 0) ? tbl.tdf : TDF_DEFAULT,
    tableName: tbl ? tbl.name : '',
    runs: []
  };
  // The reference card above follows the game.
  rdsLevel = level;
  persistData();
  renderRds();
  rds100Arm();
}

function rds100PauseToggle() {
  const g = rds100For(rdsPlayerId);
  if (!g) return;
  if (g.running) {
    rds100Tick();
    g.running = false;
    g.lastTick = null;
  } else {
    g.running = true;
    g.lastTick = Date.now();
  }
  persistData();
  rdsRender100();
  rds100Arm();
}

// n = balls still on the table. 0 means the rack was cleared.
// RDS 100 always climbs: every completed rack moves to the next level,
// cleared or not — the score is what records how well it went.
function rds100Choose(n) {
  const g = rds100For(rdsPlayerId);
  // Pausing only stops the clock, so a paused game still accepts the count.
  if (!g) return;
  const max = rds100Balls(g.level);
  const left = Math.max(0, Math.min(max, n | 0));
  rds100Tick();
  const level = g.level;
  const before = g.score;
  g.score = Math.max(0, before - left);
  g.runs.unshift({
    at: Date.now(), level, remaining: left,
    before, after: g.score, cleared: left === 0
  });
  const atTop = level >= RDS_MAX_LEVEL;
  if (!atTop) g.level = level + 1;
  // Keep the reference card on the level being played.
  rdsLevel = g.level;
  if (left === 0) showToast(t('rds100Cleared'), 'success');
  if (g.score <= 0 || atTop) {
    rds100Finish(true);
    showToast(t(g.score <= 0 ? 'rds100GameOver' : 'rds100Complete'), 'info');
    return;
  }
  persistData();
  renderRds();
  rds100Arm();
}

async function rds100EndGame() {
  const g = rds100For(rdsPlayerId);
  if (!g) return;
  const ok = await modalConfirm({
    title: t('rds100End'),
    message: t('rds100EndMsg'),
    okText: t('rds100End'),
    cancelText: t('cancel'),
    danger: true
  });
  if (!ok) return;
  rds100Finish(false);
}

function rds100Finish(silent) {
  const g = rds100For(rdsPlayerId);
  if (!g) return;
  rds100Tick();
  if (!Array.isArray(appData.rds100History)) appData.rds100History = [];
  const first = g.runs.length ? g.runs[g.runs.length - 1].level : g.level;
  appData.rds100History.unshift({
    at: Date.now(),
    playerId: rdsPlayerId,
    playTime: g.elapsed,
    score: g.score,
    refLevel: rds100RefLevel(g.score, g.tableTdf),
    adjScore: rds100EffScore(g.score, g.tableTdf),
    tableName: g.tableName || '',
    tableTdf: g.tableTdf || 1,
    fromLevel: first,
    toLevel: g.level,
    racks: g.runs.length
  });
  // Store at most RDS_HIST_MAX games per player.
  const mine = appData.rds100History.filter(h => h.playerId === rdsPlayerId);
  if (mine.length > RDS_HIST_MAX) {
    const keep = new Set(mine.slice(0, RDS_HIST_MAX));
    appData.rds100History = appData.rds100History.filter(
      h => h.playerId !== rdsPlayerId || keep.has(h));
  }
  delete appData.rds100[rdsPlayerId];
  persistData();
  rdsRender100();
  rds100Arm();
  if (!silent) showToast(t('rds100GameOver'), 'info');
}

function rdsRender100() {
  const g = rds100For(rdsPlayerId);
  rds100SyncLevelSelect(!!g);
  const live = document.getElementById('rds100Live');
  const idle = document.getElementById('rds100Idle');
  const play = document.getElementById('rds100Play');
  const startEl = document.getElementById('rds100Start');
  const pauseEl = document.getElementById('rds100Pause');
  const promptEl = document.getElementById('rds100Prompt');
  const scoreEl = document.getElementById('rds100Score');
  const refEl = document.getElementById('rds100Ref');
  const timeEl = document.getElementById('rds100Time');

  if (live)   live.style.display   = g ? '' : 'none';
  if (idle)   idle.style.display   = g ? 'none' : '';
  if (play)   play.style.display   = g ? '' : 'none';
  if (startEl) {
    const has = Array.isArray(appData.rds100History) &&
      appData.rds100History.some(h => h.playerId === rdsPlayerId);
    setLabelText(startEl, t(has ? 'rds100Restart' : 'rds100Start'));
  }
  if (pauseEl) {
    pauseEl.classList.toggle('is-on', !!(g && !g.running));
    setLabelText(pauseEl, t(g && !g.running ? 'rds100Resume' : 'rds100Pause'));
  }
  if (g) {
    if (scoreEl) scoreEl.textContent = String(g.score);
    const adjEl = document.getElementById('rds100Adj');
    if (adjEl) {
      const eff = rds100EffScore(g.score, g.tableTdf);
      adjEl.textContent = (eff !== g.score) ? ` (${eff})` : '';
    }
    const tblEl = document.getElementById('rds100Table');
    if (tblEl) {
      const tdf = (typeof g.tableTdf === 'number') ? g.tableTdf : 1;
      tblEl.textContent = (g.tableName || '—') + (tdf !== 1 ? ` · ${tdf.toFixed(2)}` : '');
    }
    if (refEl)   refEl.textContent   = String(rds100RefLevel(g.score, g.tableTdf));
    if (timeEl)  timeEl.textContent  = formatTime(g.elapsed);
    if (promptEl) {
      const lvl = RDS_LEVELS[g.level - 1] || RDS_LEVELS[0];
      promptEl.textContent = t('rds100Pick')
        .replace('{n}', lvl.balls)
        .replace('{l}', g.level);
    }
  }

  const balls = document.getElementById('rds100Balls');
  if (balls) {
    if (!g) {
      balls.innerHTML = '';
    } else {
      const max = rds100Balls(g.level);
      const opts = [];
      for (let i = 0; i <= max; i++) opts.push(i);
      balls.innerHTML = opts.map(i =>
        `<button type="button" class="rds100-ball" data-left="${i}">${i}</button>`
      ).join('');
    }
  }

  const hist = document.getElementById('rds100History');
  if (!hist) return;
  const list = (appData.rds100History || [])
    .filter(h => h.playerId === rdsPlayerId)
    .slice(0, RDS_HIST_MAX);
  // The clear button only makes sense when this player has something to clear.
  const clearEl = document.getElementById('rds100Clear');
  if (clearEl) clearEl.style.display = list.length ? '' : 'none';
  if (!list.length) {
    hist.innerHTML = `<div class="rds-empty">${t('rds100NoHist')}</div>`;
    return;
  }
  hist.innerHTML = list.map(rds100RowHtml).join('');
}

// Wipes the current player's RDS 100 history. The level record is untouched.
function rds100ClearHistory() {
  const mine = (appData.rds100History || []).filter(h => h.playerId === rdsPlayerId);
  if (!mine.length) return;
  modalConfirm({
    title: t('rds100Clear'),
    message: t('rds100ClearAsk'),
    okText: t('delete'),
    danger: true
  }).then(ok => {
    if (!ok) return;
    appData.rds100History = (appData.rds100History || [])
      .filter(h => h.playerId !== rdsPlayerId);
    persistData();
    rdsRender100();
    showToast(t('rds100HistCleared'), 'info');
  });
}

// Swaps the whole page between the tracker and the RDS reference.
function applyViewMode() {
  document.body.classList.toggle('rds-view', rdsView);
  const rdsRadio = document.querySelector('input[name="gameMode"][value="rds"]');
  if (rdsView) {
    if (rdsRadio) rdsRadio.checked = true;
    // Resume on the player's recorded level, not on whatever was browsed last.
    rdsSyncPlayerSelect();
    const rec = rdsRecordFor(rdsPlayerId);
    if (rec) rdsLevel = rec.level;
    renderRds();
    rds100Arm();
  } else {
    // Leaving the reference view stops the RDS 100 clock so it does not
    // keep running while the player is scoring another mode.
    const g = rds100For(rdsPlayerId);
    if (g && g.running) { rds100Tick(); g.running = false; g.lastTick = null; persistData(); }
    if (rds100Timer) { clearInterval(rds100Timer); rds100Timer = null; }
    const r = document.querySelector(`input[name="gameMode"][value="${currentMode}"]`);
    if (r) r.checked = true;
  }
}

function updateUI() {
  const has = sessionActive && !!session;
  updateSetupLock();
  document.getElementById('statsCard').style.display  = has ? 'block' : 'none';
  const isBowlard = has && session.mode === 'bowlard';
  document.getElementById('bowlardInputModeGroup').style.display =
    (currentMode === 'bowlard') ? '' : 'none';
  document.getElementById('sessionTypeGroup').style.display =
    (currentMode === 'bowlard') ? 'none' : '';
  // One card hosts both modes; only the group (and its title) swaps.
  document.getElementById('entryCard').style.display = has ? 'block' : 'none';
  document.getElementById('qskillEntryGroup').style.display  = (has && !isBowlard) ? '' : 'none';
  document.getElementById('bowlardEntryGroup').style.display = isBowlard ? '' : 'none';
  document.getElementById('qskillEntryTitle').style.display  = isBowlard ? 'none' : '';
  document.getElementById('bowlardEntryTitle').style.display = isBowlard ? '' : 'none';
  document.getElementById('highStatItem').style.display = 'flex';
  document.getElementById('bowlardScorecard').style.display = isBowlard ? 'block' : 'none';
  document.getElementById('inningScores').style.display = isBowlard ? 'none' : 'grid';
  // After the groups are toggled, so the break-row visibility is already final.
  syncDetailTogglePlacement();

  setI18n('btnStart', has ? 'end' : 'start');
  document.getElementById('btnStart').classList.toggle('end', has);

  if (!has) { document.getElementById('timerDisplay').textContent = '00:00'; return; }
  document.getElementById('timerDisplay').textContent = formatTime(timerSeconds);

  const tdf = session.tableTdf || TDF_DEFAULT;

  if (isBowlard) {
    document.getElementById('inningDisplay').textContent = `${session.frames.length}/10`;
    // Average: show adjusted if toggle on
    const rawAvg = session.frames.length ? (session.totalScore / session.frames.length) : 0;
    const avgEl = document.getElementById('avgDisplay');
    avgEl.textContent = rawAvg.toFixed(1);
    if (isTdfAdjustedMode() && rawAvg > 0) {
      const adjAvg = rawAvg * tdf;
      const span = document.createElement('span');
      span.className = 'tdf-adj';
      span.textContent = `(${adjAvg.toFixed(1)})`;
      avgEl.appendChild(span);
    }
    document.getElementById('highDisplay').textContent = session.highRun || 0;
    // Score: "100 (105)"
    const scoreEl = document.getElementById('scoreDisplay');
    renderScoreWithAdj(scoreEl, session.totalScore || 0, tdf);
    renderBowlardEntry();
    renderBowlardScorecard();
  } else {
    document.getElementById('inningDisplay').textContent = `${session.innings.length}/${session.totalInnings}`;
    const rawAvg = session.innings.length ? session.average : 0;
    const avgEl = document.getElementById('avgDisplay');
    avgEl.textContent = rawAvg.toFixed(1);
    if (isTdfAdjustedMode() && rawAvg > 0) {
      const adjAvg = rawAvg * tdf;
      const span = document.createElement('span');
      span.className = 'tdf-adj';
      span.textContent = `(${adjAvg.toFixed(1)})`;
      avgEl.appendChild(span);
    }
    document.getElementById('highDisplay').textContent = session.highRun || 0;
    const scoreEl = document.getElementById('scoreDisplay');
    renderScoreWithAdj(scoreEl, session.totalScore || 0, tdf);
    const container = document.getElementById('inningScores');
    container.innerHTML = '';
    for (let i = 0; i < session.totalInnings; i++) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      if (i < session.innings.length) { chip.textContent = session.innings[i].netScore; chip.classList.add('filled'); }
      else if (i === session.innings.length) { chip.innerHTML = ICON('circle-dot'); chip.classList.add('current'); }
      else chip.textContent = '_';
      container.appendChild(chip);
    }
    renderQSkillEntryTitle();
  }
  updateTargetBar();
  document.getElementById('statsCard').classList.toggle('hidden-score', hideScore);
  setActionLabels();
  updateScoreButtonsDisabled();
  applyLastClickedGlow();
}

function renderQSkillEntryTitle() {
  const el = document.getElementById('qskillEntryTitle');
  if (!el || !session) return;
  // Both titles live in the shared card header; only one is shown at a time.
  // Set this before any early return so the visible title can never go stale.
  el.style.display = (session.mode === 'bowlard') ? 'none' : '';
  const n = (session.innings || []).length + 1;
  const total = session.totalInnings || 10;
  el.textContent = `${t('frame')} ${Math.min(n, total)} / ${total}`;
}

function renderBowlardEntry() {
  const grid = document.getElementById('bowlardEntryGrid');
  const title = document.getElementById('bowlardEntryTitle');
  if (!session) return;
  // Set before the completion early-return, or the title would stay hidden.
  title.style.display = '';
  if (isBowlardComplete()) {
    title.textContent = t('bowlardComplete');
    grid.innerHTML = '';
    return;
  }
  const frame = Math.min(getCurrentBowlardFrame() + 1, 10);
  const roll = getCurrentBowlardRoll();
  const isCumulative = bowlardInputMode === 'cumulative';

  title.textContent = `${t('frame')} ${frame} · ${t('roll')} ${roll}`;
  grid.innerHTML = '';

  if (isCumulative) {
    const prev = getCurrentRackCumulative();
    for (let p = 0; p <= 10; p++) {
      const btn = document.createElement('button');
      btn.className = 'score-btn';
      btn.dataset.value = String(p);
      if (p === 0 || p === 10) btn.classList.add('span-full');
      if (p === 0) btn.classList.add('zero-btn');
      btn.textContent = p;
      const legal = (p === 0) || (p >= prev && p <= 10);
      btn.dataset.illegal = legal ? '0' : '1';
      if (legal) {
        if (roll === 1 && p === 10) btn.classList.add('strike');
        if (roll === 2 && p === 10 && prev > 0) btn.classList.add('spare');
        btn.onclick = () => submitBowlardRoll(p);
      } else {
        btn.disabled = true;
      }
      grid.appendChild(btn);
    }
    return;
  }

  const maxPins = getMaxPinsForBowlardRoll();
  for (let p = 0; p <= 10; p++) {
      const btn = document.createElement('button');
      btn.className = 'score-btn';
      btn.dataset.value = String(p);
      if (p === 0 || p === 10) btn.classList.add('span-full');
      if (p === 0 ) btn.classList.add('zero-btn');
      btn.textContent = p;
      btn.dataset.illegal = (p > maxPins) ? '1' : '0'; 
      if (p <= maxPins) {
        if (roll === 1 && p === 10) btn.classList.add('strike');
        if (roll === 2 && p === maxPins && maxPins > 0) btn.classList.add('spare');
        btn.onclick = () => submitBowlardRoll(p);
      }
      grid.appendChild(btn);
  }
}

function bowlardSymbols(f, isTenth) {
  if (!f) return isTenth ? ['','',''] : ['',''];
  const symbols = [];
  if (isTenth) {
    const r1 = f.r1, r2 = f.r2, r3 = f.r3;
    if (r1 === undefined) symbols.push('');
    else if (r1 === 10) symbols.push('X');
    else if (r1 === 0) symbols.push('-');
    else symbols.push(r1);
    if (r2 === undefined) symbols.push('');
    else if (r1 === 10) {
      if (r2 === 10) symbols.push('X');
      else if (r2 === 0) symbols.push('-');
      else symbols.push(r2);
    }
    else if (r1 + r2 === 10) symbols.push('/');
    else if (r2 === 0) symbols.push('-');
    else symbols.push(r2);
    if (r3 === undefined) symbols.push('');
    else if (r2 === 10) { symbols.push(r3 === 10 ? 'X' : (r3 === 0 ? '-' : r3)); }
    else if (r1 === 10 && r2 !== 10 && (r2 + r3) === 10) symbols.push('/');
    else if (r1 + r2 === 10 && r3 === 10) symbols.push('X');
    else if (r3 === 10) symbols.push('X');
    else if (r3 === 0) symbols.push('-');
    else symbols.push(r3);
  } else {
    if (f.r1 === undefined) symbols.push('');
    else if (f.r1 === 10) symbols.push('X');
    else if (f.r1 === 0) symbols.push('-');
    else symbols.push(f.r1);
    if (f.r2 === undefined) symbols.push('');
    else if (f.r1 + f.r2 === 10) symbols.push('/');
    else if (f.r2 === 0) symbols.push('-');
    else symbols.push(f.r2);
  }
  return symbols;
}

function renderBowlardScorecard() {
  const board = document.getElementById('bowlardBoard');
  board.innerHTML = '';
  const result = computeBowlardFrames(session.frames);
  const contributors = result.hrContributors;
  const ending = result.hrEnding;
  const currentFrame = getCurrentBowlardFrame();

  for (let i = 0; i < 10; i++) {
    const f = session.frames[i];
    const isTenth = i === 9;
    const div = document.createElement('div');
    div.className = 'bowlard-frame';
    if (i === currentFrame && !isBowlardComplete()) div.classList.add('current');

    const num = document.createElement('div');
    num.className = 'bowlard-frame-num';
    num.textContent = i + 1;
    div.appendChild(num);

    const rollsDiv = document.createElement('div');
    rollsDiv.className = 'bowlard-rolls' + (isTenth ? ' tenth' : '');
    const symbols = bowlardSymbols(f, isTenth);
    const cellCount = isTenth ? 3 : 2;
    const rollKeys = isTenth ? ['r1','r2','r3'] : ['r1','r2'];

    for (let c = 0; c < cellCount; c++) {
      const cell = document.createElement('div');
      const sym = symbols[c];
      const rollKey = rollKeys[c];
      const isContrib = contributors.has(i + ':' + rollKey);
      const isEnding  = ending && ending.frameIdx === i && ending.rollKey === rollKey;
      cell.className = 'bowlard-roll'
        + ((sym === '' || sym === undefined) ? ' empty' : '')
        + (isContrib ? ' high-run-fill' : '')
        + (isEnding  ? ' high-run' : '');
      cell.textContent = sym || '';
      rollsDiv.appendChild(cell);
    }
    div.appendChild(rollsDiv);

    const tot = document.createElement('div');
    tot.className = 'bowlard-frame-total'
      + ((result.running[i] === null || result.running[i] === undefined) ? ' empty' : '')
      + (ending && ending.frameIdx === i ? ' high-run' : '');
    tot.textContent = (result.running[i] !== null && result.running[i] !== undefined)
      ? result.running[i] : '';
    div.appendChild(tot);

    board.appendChild(div);
  }
}

function updateTargetBar() {
  if (!session) return;
  const target = session.targetScore || 100;
  const score = session.totalScore || 0;
  const pct = Math.min(100, (score / target) * 100);
  const fill = document.getElementById('targetBarFill');
  fill.style.width = pct + '%';
  fill.classList.toggle('done', pct >= 100);
  document.getElementById('targetProgressText').textContent = `${score} / ${target}`;
  updateCompactStats();
}

// One-line phone summary: "03:05 | 10 (12) / 100 point(s)".
// Kept separate from renderScoreWithAdj(), which owns the desktop #scoreDisplay.
function updateCompactStats() {
  const timeEl = document.getElementById('compactTime');
  if (!timeEl) return;
  if (!session) {
    timeEl.textContent = '00:00';
    document.getElementById('compactScore').textContent = '0';
    document.getElementById('compactTarget').textContent = '—';
    return;
  }
  const raw = session.totalScore || 0;
  const tdf = session.tableTdf || TDF_DEFAULT;
  const adjusted = adjustedScore(raw, tdf);
  const scoreEl = document.getElementById('compactScore');
  scoreEl.textContent = String(raw);
  // Only show the parenthesised value when TDF actually changes the score.
  if (adjusted !== null && adjusted !== raw) {
    const span = document.createElement('span');
    span.className = 'tdf-adj';
    span.textContent = `(${adjusted})`;
    scoreEl.appendChild(span);
  }
  timeEl.textContent = formatTime(timerSeconds);
  document.getElementById('compactTarget').textContent = String(session.targetScore || 100);
}

// ============================================================
// RANKS TABLE
// ============================================================
function renderRanksTable() {
  const tbody = document.getElementById('rankTiersBody');
  if (!tbody) return;

  // Highlight the tier implied by the CURRENT MODE's average, so the row
  // always matches the badge shown in the stats card. (The RDS record level
  // is a separate thing and is highlighted in the RDS card's own table.)
  const player = getSelectedPlayer();
  let curIdx = -1;
  if (player) {
    const ps = appData.sessions.filter(s => s.playerId === player.id && s.completed);
    let avg, kind = currentMode === 'bowlard' ? 'bowlard' : 'qskill';
    if (kind === 'bowlard') {
      const bs = ps.filter(s => s.mode === 'bowlard');
      avg = bs.length ? bs.reduce((a, x) => a + (x.totalScore || 0), 0) / bs.length : 0;
      if (isTdfAdjustedMode() && bs.length) {
        avg = bs.reduce((a, x) => a + adjustedScore(x.totalScore || 0, x.tableTdf), 0) / bs.length;
      }
    } else {
      let total = 0, n = 0;
      ps.filter(s => s.mode !== 'bowlard').forEach(s => {
        (s.innings || []).forEach(inn => {
          let v = inn.netScore || 0;
          if (isTdfAdjustedMode()) v = v * (s.tableTdf || TDF_DEFAULT);
          total += v; n++;
        });
      });
      avg = n ? total / n : 0;
    }
    const cls = rankFor(kind, avg).className;
    curIdx = RANK_TIERS.findIndex(x => x.cls === cls);
  }

  const activeCol = (currentMode === 'bowlard') ? 'bowlard' : 'qskill';
  tbody.innerHTML = rankTierRows(curIdx, activeCol);

  const thQ = document.getElementById('ranksColQSkill');
  const thB = document.getElementById('ranksColBowlard');
  if (thQ) thQ.classList.toggle('col-active', activeCol === 'qskill');
  if (thB) thB.classList.toggle('col-active', activeCol === 'bowlard');
}

function qskillRankIndex(avg)  { return rankIndexFor('qskill',  avg || 0); }
function bowlardRankIndex(avg) { return rankIndexFor('bowlard', avg || 0); }

function toggleRanks() {
  const wrap = document.getElementById('infoWrap');
  const open = wrap.style.display !== 'none';
  wrap.style.display = open ? 'none' : 'block';
  setI18n('ranksToggle', open ? 'showRanks' : 'hideRanks');
}

// ============================================================
// LIFETIME
// ============================================================
function translateDetailItem(item) {
  const map = {
    'Scratch':t('mScratch'), 'Off Table':t('mOffTable'), 'No Cushion':t('noCushion'),
    'Miscue':t('miscue'), 'Double Tap':t('doubleTap'), 'Other Fouls':t('otherFouls'),
    'Positioning':t('positioning'), 'Side Spin':t('sideSpin'), 'Top Spin':t('topSpin'),
    'Button Spin':t('buttonSpin'), 'Hand Bridge':t('handBridge'), 'Mech. Bridge':t('mechBridge'),
    'Kick':t('kick'), 'Bank':t('bank'), 'Cut':t('cut'), 'Cannon':t('cannon'),
    'Kiss':t('kiss'), 'Combo':t('combo'), 'Long':t('long'), 'Masse':t('masse'),
    'Jump':t('jump'), 'Cushion':t('cushion'), 'Side Pocket':t('sidePocket'),
    'Corner Pocket':t('cornerPocket'), 'Fluke':t('fluke')
  };
  return map[item] || item;
}

// One ladder everywhere: the badge uses the same tiers as the rating table.
// World Class has no Q Skill / Bowlard band, so the badge ladder ends at
// Professional (13 tiers).
const TIER_LADDER = RANK_TIERS
  .filter(x => x.key !== 'plWorldPro')
  .slice()
  .reverse();                       // Novice → Professional

const RANKS = {
  // Lower bounds taken from the Q Skill / Bowlard columns of the same table,
  // so a badge and a table row can never disagree.
  qskill:  { bounds: [3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1, 12.1, 16.1, 18.1] },
  bowlard: { bounds: [29, 40, 50, 60, 74, 87, 100, 114, 127, 140, 180, 210] },
};

const QSKILL_BOUNDS  = RANKS.qskill.bounds;
const BOWLARD_BOUNDS = RANKS.bowlard.bounds;

function rankIndexFor(kind, avg) {
  const b = RANKS[kind].bounds;
  for (let i = 0; i < b.length; i++) if (avg < b[i]) return i;
  return b.length;
}

function rankFor(kind, avg) {
  const i = rankIndexFor(kind, avg);
  const tier = TIER_LADDER[i] || TIER_LADDER[TIER_LADDER.length - 1];
  return {
    label:      t(tier.key),
    className:  tier.cls,
    index:      i,
  };
}

function nextRankHint(avg, bounds, unitLabel) {
  if (avg >= bounds[bounds.length - 1]) return '';
  let nextIdx = 0;
  for (let i = 0; i < bounds.length; i++) {
    if (avg < bounds[i]) { nextIdx = i; break; }
  }
  const needed = (bounds[nextIdx] - avg).toFixed(1);
  const nextTier = TIER_LADDER[nextIdx + 1] || TIER_LADDER[TIER_LADDER.length - 1];
  return `${needed} ${unitLabel} ${ICON('arrow-right')} ${t(nextTier.key)}`;
}

function updateLifetimeStats() {
  const player = getSelectedPlayer();
  if (!player) { resetLifetimeDisplay(); return; }
  const ps = appData.sessions.filter(s => s.playerId === player.id && s.completed);
  const stdSessions  = ps.filter(s => s.mode !== 'bowlard');
  const bowlSessions = ps.filter(s => s.mode === 'bowlard');

  const useAdj = isTdfAdjustedMode();

  let totalScore = 0, totalInnings = 0, highRun = 0;
  const foulCount = {}, mistakeCount = {};
  stdSessions.forEach(s => {
    s.innings.forEach(inn => {
      let v = inn.netScore || 0;
      totalScore += v;
      totalInnings++;
      if (v > highRun) highRun = v;
      if (inn.fouls)    inn.fouls.forEach(f => { const tr = translateDetailItem(f); foulCount[tr]    = (foulCount[tr]||0)+1; });
      if (inn.mistakes) inn.mistakes.forEach(m => { const tr = translateDetailItem(m); mistakeCount[tr] = (mistakeCount[tr]||0)+1; });
    });
  });
  const rawAvg = totalInnings ? totalScore / totalInnings : 0;
  // For rank use adjusted avg when toggle on
  const avg = rawAvg;

  let bTotal = 0, bCount = 0, bHighRun = 0;
  bowlSessions.forEach(s => {
    bTotal += s.totalScore || 0;
    bCount++;
    if ((s.highRun || 0) > bHighRun) bHighRun = s.highRun || 0;
  });
  const bAvgRaw = bCount ? bTotal / bCount : 0;

  if (currentMode === 'bowlard') {
    const bAvgRank = useAdj && bowlSessions.length
      ? bowlSessions.reduce((a, x) => a + adjustedScore(x.totalScore || 0, x.tableTdf), 0) / bowlSessions.length
      : bAvgRaw;
    document.getElementById('lifetimeAvg').textContent = bAvgRank.toFixed(1);
    document.getElementById('lifetimeHigh').textContent = bHighRun;
    document.getElementById('lifetimeInnings').textContent = bCount;
    const rank = getBowlardRank(bAvgRank);
    document.getElementById('lifetimeRank').textContent = rank.label;
    document.getElementById('lifetimeRank').className = 'rank-plate ' + rank.className;
    document.getElementById('lifetimeNextRank').innerHTML =
      nextRankHint(bAvgRank, BOWLARD_BOUNDS, t('point'));
  } else {
    let adjTotal = 0, adjN = 0;
    stdSessions.forEach(s => {
      (s.innings || []).forEach(inn => {
        let v = inn.netScore || 0;
        if (useAdj) v = v * (s.tableTdf || TDF_DEFAULT);
        adjTotal += v; adjN++;
      });
    });
    const dispAvg = adjN ? adjTotal / adjN : 0;
    document.getElementById('lifetimeAvg').textContent = dispAvg.toFixed(1);
    document.getElementById('lifetimeHigh').textContent = highRun;
    document.getElementById('lifetimeInnings').textContent = totalInnings;
    const rank = getRank(dispAvg);
    document.getElementById('lifetimeRank').textContent = rank.label;
    document.getElementById('lifetimeRank').className = 'rank-plate ' + rank.className;
    document.getElementById('lifetimeNextRank').innerHTML =
      nextRankHint(dispAvg, QSKILL_BOUNDS, t('point'));
  }

  setI18n('lblAvgLabel', currentMode === 'bowlard' ? 'bowlardAvgLabel' : 'avgLabel');
  setI18n('lblInningsLabel', currentMode === 'bowlard' ? 'bowlardInningsLabel' : 'inningsLabel');

  const fouls = Object.entries(foulCount).sort((a,b) => b[1]-a[1]).slice(0,3);
  document.getElementById('lifetimeFouls').textContent = fouls.length ? fouls.map(([k,v]) => `${k} (${v})`).join(', ') : t('none');
  const mistakes = Object.entries(mistakeCount).sort((a,b) => b[1]-a[1]).slice(0,3);
  document.getElementById('lifetimeMistakes').textContent = mistakes.length ? mistakes.map(([k,v]) => `${k} (${v})`).join(', ') : t('none');

  renderRanksTable();
}

function resetLifetimeDisplay() {
  document.getElementById('lifetimeAvg').textContent = '0.0';
  document.getElementById('lifetimeHigh').textContent = '0';
  document.getElementById('lifetimeRank').textContent = t(TIER_LADDER[0].key);
  document.getElementById('lifetimeRank').className = 'rank-plate ' + TIER_LADDER[0].cls;
  document.getElementById('lifetimeInnings').textContent = '0';
  document.getElementById('lifetimeNextRank').textContent = '';
  document.getElementById('lifetimeFouls').textContent = t('none');
  document.getElementById('lifetimeMistakes').textContent = t('none');
  renderRanksTable();
}

function getRank(avg)          { return rankFor('qskill',  avg || 0); }
function getBowlardRank(avg)   { return rankFor('bowlard', avg || 0); }

// ============================================================
// HISTORY
// ============================================================
function translateBreakResult(r) {
  const map = { clean:t('clean'), scratch:t('scratch'), offTable:t('offTable'), reRack:t('reRack') };
  return map[r] || r;
}

function renderHistory() {
  const container = document.getElementById('historyList');
  const player = getSelectedPlayer();
  let sessions = appData.sessions.filter(s => s.completed);
  if (player) sessions = sessions.filter(s => s.playerId === player.id);
  const show = Math.min(historyVisible, sessions.length);
  const display = sessions.slice(0, show);
  if (!display.length) {
    container.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">╮(´･ᴗ･`)╭</div>';
    document.getElementById('btnShowMore').style.display = 'none';
    return;
  }
  container.innerHTML = display.map((s, idx) => {
    const date = new Date(s.date);
    const localeMap = { en:'en-US', zh:'zh-CN', zh_TW:'zh-CN', yue:'zh-CN', jp:'zh-CN' };
    const dateStr = date.toLocaleDateString(localeMap[currentLang] || 'en-US');
    const timeStr = date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    const isBowl = s.mode === 'bowlard';
    const effScore = effectiveSessionScore(s);
    const rank = isBowl ? getBowlardRank(effScore) : getRank(effectiveSessionAverage(s));
    return isBowl
      ? renderBowlardHistory(s, idx, dateStr, timeStr, rank)
      : renderStandardHistory(s, idx, dateStr, timeStr, rank);
  }).join('');
  document.getElementById('btnShowMore').style.display = show < sessions.length ? 'block' : 'none';
}

function buildFrameDetailList(entries) {
  const rows = [];
  entries.forEach(e => {
    const hasFoul = e.fouls    && e.fouls.length    > 0;
    const hasMist = e.mistakes && e.mistakes.length > 0;
    if (!hasFoul && !hasMist) return;

    const foulText = hasFoul ? escapeHtml(e.fouls.join(', '))    : '—';
    const mistText = hasMist ? escapeHtml(e.mistakes.join(', ')) : '—';

    rows.push(
      '<div class="frame-row">' +
        '<span class="frame-tag">' + escapeHtml(e.label) + ':</span>' +
        '<span>' + escapeHtml(t('fouls'))    + ': ' + foulText + '</span>' +
        '<span class="frame-sep">·</span>' +
        '<span>' + escapeHtml(t('mistakes')) + ': ' + mistText + '</span>' +
      '</div>'
    );
  });
  if (!rows.length) return '';
  return '<div class="frame-detail-list">' + rows.join('') + '</div>';
}

function buildQSkillTimeline(s) {
  const innings = s.innings || [];
  if (innings.length === 0) return '';

  const high = s.highRun || 0;
  let highFilled = false;

  let html = '<div class="bowlard-board qskill-timeline">';
  innings.forEach((inn, i) => {
    const score = inn.netScore || 0;
    const isHigh = (!highFilled && score === high && high > 0);
    if (isHigh) highFilled = true;

    const hasFoul = inn.fouls && inn.fouls.length > 0;
    const hasMist = inn.mistakes && inn.mistakes.length > 0;

    const symParts = [];
    if (hasFoul) symParts.push('<span class="sym-foul" title="' + escapeAttr(inn.fouls.join(', ')) + '">！</span>');
    if (hasMist) symParts.push('<span class="sym-mistake" title="' + escapeAttr(inn.mistakes.join(', ')) + '">！</span>');

    const numContent = (i + 1) + (symParts.length ? ' ' + symParts.join('') : '');
    html += '<div class="bowlard-frame">';
    html +=   '<div class="bowlard-frame-num">' + numContent + '</div>';
    html +=   '<div class="bowlard-rolls">';
    html +=     '<div class="bowlard-roll' + (isHigh ? ' high-run high-run-fill' : '') + '">' + score + '</div>';
    html +=   '</div>';
    html +=   '<div class="bowlard-frame-total' + (isHigh ? ' high-run' : '') + '">' + escapeHtml(translateBreakResult(inn.breakResult || 'clean')) + '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function renderStandardHistory(s, idx, dateStr, timeStr, rank) {
  const timelineHTML = buildQSkillTimeline(s);

  const breakCounts = {};
  s.innings.forEach(inn => {
    const r = inn.breakResult || 'clean';
    breakCounts[r] = (breakCounts[r] || 0) + 1;
  });
  const breakSummary = Object.entries(breakCounts)
    .map(([k, c]) => `${translateBreakResult(k)} ×${c}`)
    .join(' · ');

  const foulItems = {}, mistakeItems = {};
  s.innings.forEach(inn => {
    (inn.fouls || []).forEach(f => {
      const tr = translateDetailItem(f);
      foulItems[tr] = (foulItems[tr] || 0) + 1;
    });
    (inn.mistakes || []).forEach(m => {
      const tr = translateDetailItem(m);
      mistakeItems[tr] = (mistakeItems[tr] || 0) + 1;
    });
  });

  const entries = (s.innings || []).map((inn, i) => ({
    label: 'Inn ' + (i + 1),
    fouls:    (inn.fouls    || []).map(translateDetailItem),
    mistakes: (inn.mistakes || []).map(translateDetailItem),
  }));
  const detailListHTML = buildFrameDetailList(entries);

  const rawScore = s.totalScore || 0;
  const adjScore = isTdfAdjustedMode() ? adjustedScore(rawScore, s.tableTdf) : null;
  const scoreDisplay = (adjScore !== null && adjScore !== rawScore)
    ? `${rawScore} <span class="tdf-adj">(${adjScore})</span>`
    : String(rawScore);

  const rawAvg = s.average || 0;
  const adjAvg = isTdfAdjustedMode() ? (rawAvg * (s.tableTdf || TDF_DEFAULT)) : null;
  const avgDisplay = (adjAvg !== null)
    ? `${rawAvg.toFixed(1)} <span class="tdf-adj">(${roundHalfDown(adjAvg)})</span>`
    : rawAvg.toFixed(1);

  return `<div class="history-item">
    <div class="history-header">
      <div class="history-left">
        <span>${ICON('chart-column')} ${dateStr} ${timeStr} (${s.timeElapsed || '00:00'})</span>
        <span style="color:var(--text-muted);">${t('table')}: ${s.tableName || '—'}${s.tableTdf ? ' · TDF ' + s.tableTdf.toFixed(2) : ''}</span>
        <span style="font-weight:600;">${scoreDisplay} ${t('point')}</span>
        <span style="color:var(--text-muted);">[ ${s.innings.length}/${s.totalInnings}, ${t('avg')}: ${avgDisplay} ]</span>
        <span class="rank-plate ${rank.className}" style="font-size:0.8rem;padding:2px 12px;">${rank.label}</span>
      </div>
      <div class="history-right">
        <button onclick="toggleHistoryDetail(${idx})">${ICON('chevron-down')}<span class="label">${t('viewDetails')}</span></button>
        ${isSessionUnfinished(s) ? `<button class="resume" data-resume="${s.id}">${ICON('undo-2')}<span class="label">${t('liveResume')}</span></button>` : ''}
        <button class="del" onclick="deleteSession('${s.id}')">${ICON('x')}<span class="label">${t('delete')}</span></button>
      </div>
    </div>
    <div class="history-details" id="historyDetail_${idx}">
      ${timelineHTML}
      ${detailListHTML}
    </div>
  </div>`;
}

function countBowlardMarks(frames) {
  let strikes = 0, spares = 0;
  (frames || []).forEach((f, i) => {
    if (!f) return;
    const isTenth = i === 9;
    if (!isTenth) {
      if (f.r1 === 10) { strikes++; return; }
      if (f.r2 !== undefined && f.r1 + f.r2 === 10) spares++;
      return;
    }
    if (f.r1 === 10) strikes++;
    if (f.r1 === 10) {
      if (f.r2 === 10) {
        strikes++;
        if (f.r3 === 10) strikes++;
      } else if (f.r2 !== undefined && f.r3 !== undefined) {
        if (f.r2 + f.r3 === 10) spares++;
      }
    } else if (f.r1 + (f.r2 ?? 0) === 10 && f.r2 !== undefined) {
      spares++;
      if (f.r3 === 10) strikes++;
    }
  });
  return { strikes, spares };
}

function renderBowlardHistory(s, idx, dateStr, timeStr, rank) {
  const result = computeBowlardFrames(s.frames || []);
  const contributors = result.hrContributors;
  const ending = result.hrEnding;

  let sc = '<div class="bowlard-board">';
  for (let i = 0; i < 10; i++) {
    const f = (s.frames || [])[i];
    const isTenth = i === 9;
    const symbols = bowlardSymbols(f, isTenth);
    const frameFouls = [], frameMistakes = [];
    if (f) {
      [f.details, f.details2, f.details3].forEach(d => {
        if (!d) return;
        (d.fouls    || []).forEach(x => frameFouls.push(x));
        (d.mistakes || []).forEach(x => frameMistakes.push(x));
      });
    }
    const hasFoul = frameFouls.length > 0;
    const hasMist = frameMistakes.length > 0;
    const symParts = [];
    if (hasFoul) symParts.push('<span class="sym-foul" title="' + escapeAttr(frameFouls.join(', ')) + '">！</span>');
    if (hasMist) symParts.push('<span class="sym-mistake" title="' + escapeAttr(frameMistakes.join(', ')) + '">！</span>');
    const numContent = (i + 1) + (symParts.length ? ' ' + symParts.join('') : '');
    const tot = result.running[i];

    let rollsHTML = '';
    const cellCount = isTenth ? 3 : 2;
    const rollKeys = isTenth ? ['r1','r2','r3'] : ['r1','r2'];

    for (let c = 0; c < cellCount; c++) {
      const sym = symbols[c];
      const rollKey = rollKeys[c];
      const isContrib = contributors.has(i + ':' + rollKey);
      const isEnding  = ending && ending.frameIdx === i && ending.rollKey === rollKey;
      const cls = 'bowlard-roll'
        + ((sym === '' || sym === undefined) ? ' empty' : '')
        + (isContrib ? ' high-run-fill' : '')
        + (isEnding  ? ' high-run' : '');
      rollsHTML += '<div class="' + cls + '">' + (sym || '') + '</div>';
    }

    const totalCls = 'bowlard-frame-total'
      + ((tot === null || tot === undefined) ? ' empty' : '')
      + (ending && ending.frameIdx === i ? ' high-run' : '');

    sc += '<div class="bowlard-frame">'
        +   '<div class="bowlard-frame-num">' + numContent + '</div>'
        +   '<div class="bowlard-rolls' + (isTenth ? ' tenth' : '') + '">' + rollsHTML + '</div>'
        +   '<div class="' + totalCls + '">'
        +     (tot !== null && tot !== undefined ? tot : '')
        +   '</div>'
        + '</div>';
  }
  sc += '</div>';

  const marks = countBowlardMarks(s.frames || []);
  const entries = (s.frames || []).map((f, i) => {
    const fouls = [], mistakes = [];
    if (f) {
      [f.details, f.details2, f.details3].forEach(d => {
        if (!d) return;
        (d.fouls    || []).forEach(x => fouls.push(x));
        (d.mistakes || []).forEach(x => mistakes.push(x));
      });
    }
    return {
      label: 'Frame ' + (i + 1),
      fouls:    fouls.map(translateDetailItem),
      mistakes: mistakes.map(translateDetailItem),
    };
  });
  const detailListHTML = buildFrameDetailList(entries);

  const rawScore = s.totalScore || 0;
  const adjScore = isTdfAdjustedMode() ? adjustedScore(rawScore, s.tableTdf) : null;
  const scoreDisplay = (adjScore !== null && adjScore !== rawScore)
    ? `${rawScore} <span class="tdf-adj">(${adjScore})</span>`
    : String(rawScore);

  return `<div class="history-item">
    <div class="history-header">
      <div class="history-left">
        <span>${ICON('circle-dot')} ${dateStr} ${timeStr} (${s.timeElapsed || '00:00'})</span>
        <span style="color:var(--text-muted);">${t('table')}: ${s.tableName || '—'}${s.tableTdf ? ' · TDF ' + s.tableTdf.toFixed(2) : ''}</span>
        <span style="font-weight:600;">${scoreDisplay} ${t('point')}</span>
        <span style="color:var(--text-muted);">[ ${(s.frames || []).length}/10, ${t('highRun')}: ${result.high}, ${t('strike')}: ${marks.strikes}, ${t('spare')}: ${marks.spares} ]</span>
        <span class="rank-plate ${rank.className}" style="font-size:0.8rem;padding:2px 12px;">${rank.label}</span>
      </div>
      <div class="history-right">
        <button onclick="toggleHistoryDetail(${idx})">${ICON('chevron-down')}<span class="label">${t('viewDetails')}</span></button>
        ${isSessionUnfinished(s) ? `<button class="resume" data-resume="${s.id}">${ICON('undo-2')}<span class="label">${t('liveResume')}</span></button>` : ''}
        <button class="del" onclick="deleteSession('${s.id}')">${ICON('x')}<span class="label">${t('delete')}</span></button>
      </div>
    </div>
    <div class="history-details" id="historyDetail_${idx}">
      ${sc}
      ${detailListHTML}
    </div>
  </div>`;
}

function toggleHistoryDetail(idx) {
  const el = document.getElementById('historyDetail_' + idx);
  if (!el) return;
  el.classList.toggle('open');
  const open = el.classList.contains('open');
  const btn = el.closest('.history-item').querySelector('.history-right button');
  setLabelText(btn, open ? t('hideDetails') : t('viewDetails'));
  const svg = btn.querySelector('svg.icon');
  if (svg) setIconTarget(svg, open ? 'chevron-up' : 'chevron-down');
}
function showMoreHistory() { historyVisible += 5; renderHistory(); }
async function deleteSession(id) {
  const ok = await modalConfirm({
    title: t('delete'),
    message: t('deleteSessionConfirm'),
    okText: t('delete'),
    cancelText: t('cancel'),
    danger: true
  });
  if (!ok) return;
  appData.sessions = appData.sessions.filter(s => s.id !== id);
  saveData(); renderHistory(); updateLifetimeStats();
}

// ============================================================
// EXPORT / IMPORT / RESET
// ============================================================
function exportData() {
  const blob = new Blob([JSON.stringify(appData, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pool_tracker_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
async function importData(file) {
  if (!file) return;
  const ok = await modalConfirm({
    title: t('import'),
    message: t('importConfirm'),
    okText: t('import'),
    cancelText: t('cancel'),
    danger: true
  });
  if (!ok) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.players && data.tables && data.sessions) {
        appData = normalizeData(data);
        ensureDefaults();
        saveData(); renderPlayers(); renderTables();
        updateLifetimeStats(); renderHistory();
        showToast(t('importSuccess'), 'success');
      } else showToast(t('importInvalid'), 'error');
    } catch (err) { showToast(t('importFailed') + ': ' + err.message, 'error'); }
  };
  reader.readAsText(file);
}

async function resetAll() {
  const ok = await modalConfirm({
    title: t('reset'),
    message: t('resetConfirm'),
    okText: t('reset'),
    cancelText: t('cancel'),
    danger: true
  });
  if (!ok) return;
  appData = { players:[], tables:[], sessions:[], liveSession:null, lastUsed:{ playerId:'', tableId:'' } };
  if (sessionActive) { sessionActive = false; stopTimer(); session = null; }
  localStorage.removeItem('poolTrackerData');
  ensureDefaults();
  saveData(); renderPlayers(); renderTables();
  document.getElementById('playerSelect').value = appData.players[0]?.id || '';
  document.getElementById('tableSelect').value = appData.tables[0]?.id || '';
  updateEditDeleteButtons(); updateLifetimeStats(); renderHistory(); updateUI();
  showToast(t('resetDone'), 'success');
}

function isEmptySession(s) {
  if (!s) return true;
  if (s.mode === 'bowlard') {
    return !s.frames || s.frames.length === 0;
  }
  return !s.innings || s.innings.length === 0;
}

function deleteEmptySessions() {
  const player = getSelectedPlayer();
  if (!player) {
    showToast(t('selectPlayerFirst'), 'warning');
    return 0;
  }
  const before = appData.sessions.length;
  appData.sessions = appData.sessions.filter(s => {
    if (s.playerId !== player.id) return true; 
    return !isEmptySession(s);
  });
  const deleted = before - appData.sessions.length;
  if (deleted > 0) {
    saveData();
    renderHistory();
    updateLifetimeStats();
    showToast(t('deletedSessions').replace('{n}', deleted), 'success');
  } else {
    showToast(t('noMatching'), 'info');
  }
  return deleted;
}
function _currentPlayerOrWarn() {
  const player = getSelectedPlayer();
  if (!player) {
    showToast(t('selectPlayerFirst'), 'warning');
    return null;
  }
  return player;
}

function isSessionUnfinished(s) {
  if (!s) return false;
  if (!s.completed) return true;
  if (s.mode === 'bowlard') return (s.frames || []).length < 10;
  return (s.innings || []).length < (s.totalInnings || 10);
}

async function deleteUnfinishedSessions() {
  const player = _currentPlayerOrWarn();
  if (!player) return;
  const matches = appData.sessions.filter(s =>
    s.playerId === player.id && isSessionUnfinished(s)
  );
  if (matches.length === 0) {
    showToast(t('noMatching'), 'info');
    return;
  }
  const ok = await modalConfirm({
    title: t('deleteUnfinished'),
    message: t('deletingSessions').replace('{n}', matches.length),
    okText: t('delete'),
    cancelText: t('cancel'),
    danger: true
  });
  if (!ok) return;
  const ids = new Set(matches.map(s => s.id));
  appData.sessions = appData.sessions.filter(s => !ids.has(s.id));
  saveData(); renderHistory(); updateLifetimeStats();
  showToast(t('deletedSessions').replace('{n}', matches.length), 'success');
}

async function _deleteBelowThreshold(mode) {
  const player = _currentPlayerOrWarn();
  if (!player) return;

  let threshold = null;
  while (threshold === null) {
    const input = await modalPrompt({
      title: mode === 'bowlard' ? t('deleteBowlardBelow') : t('deleteQSkillBelow'),
      message: t('enterThreshold'),
      defaultValue: '',
      placeholder: 'X',
      okText: t('ok'),
      cancelText: t('cancel')
    });
    if (input === null) return;
    const n = Number(input);
    if (!isFinite(n) || n < 0 || input.trim() === '') {
      showToast(t('thresholdInvalid'), 'warning');
      continue;
    }
    threshold = n;
  }

  const matches = appData.sessions.filter(s => {
    if (!s.completed) return false;
    if (s.playerId !== player.id) return false;
    const isBowl = s.mode === 'bowlard';
    if (mode === 'bowlard' && !isBowl) return false;
    if (mode === 'standard' && isBowl) return false;
    return (s.totalScore || 0) < threshold;
  });

  if (matches.length === 0) {
    showToast(t('noMatching'), 'info');
    return;
  }

  const ok = await modalConfirm({
    title: mode === 'bowlard' ? t('deleteBowlardBelow') : t('deleteQSkillBelow'),
    message: t('deletingSessions').replace('{n}', matches.length),
    okText: t('delete'),
    cancelText: t('cancel'),
    danger: true
  });
  if (!ok) return;

  const ids = new Set(matches.map(s => s.id));
  appData.sessions = appData.sessions.filter(s => !ids.has(s.id));
  saveData(); renderHistory(); updateLifetimeStats();
  showToast(t('deletedSessions').replace('{n}', matches.length), 'success');
}

function deleteBowlardBelowThreshold() { return _deleteBelowThreshold('bowlard'); }
function deleteQSkillBelowThreshold()  { return _deleteBelowThreshold('standard'); }

function countDeletableSessions() {
  const player = getSelectedPlayer();
  if (!player) return { empty: 0, total: 0 };
  let empty = 0, total = 0;
  appData.sessions.forEach(s => {
    if (s.playerId !== player.id) return;
    total++;
    if (isEmptySession(s)) empty++;
  });
  return { empty, total };
}

// ============================================================
// TDF CALCULATOR
// ============================================================
function tdfPSF(mouth) {
  if (mouth <= 3.375) return 1.55;
  if (mouth <= 3.5)   return 1.46;
  if (mouth <= 3.625) return 1.38;
  if (mouth <= 3.75)  return 1.31;
  if (mouth <= 3.875) return 1.25;
  if (mouth <= 4.0)   return 1.20;
  if (mouth <= 4.125) return 1.15;
  if (mouth <= 4.25)  return 1.10;
  if (mouth <= 4.375) return 1.05;
  if (mouth <= 4.5)   return 1.00;
  if (mouth <= 4.75)  return 0.95;
  if (mouth <= 5.0)   return 0.91;
  if (mouth <= 5.25)  return 0.88;
  return 0.85;
}

const TDF_PAF_ROWS = {
  low:  [1.09, 1.07, 1.05, 1.03, 1.01, 1.00, 0.98, 0.96, 0.94],
  mid:  [1.14, 1.10, 1.07, 1.04, 1.02, 1.00, 0.98, 0.97, 0.95],
  high: [1.20, 1.14, 1.09, 1.05, 1.02, 1.00, 0.99, 0.98, 0.97],
};

const TDF_PAF_DIFF_THRESHOLDS  = [1.25, 1.0, 0.875, 0.75, 0.625, 0.5, 0.375, 0.25];
const TDF_PAF_ANGLE_THRESHOLDS = [145.3, 143.5, 142.6, 141.7, 140.7, 139.6, 138.6, 137.0];

function tdfPAFRowIndex(x, thresholds) {
  for (let i = 0; i < thresholds.length; i++) {
    if (x > thresholds[i]) return i;
  }
  return thresholds.length;
}

function tdfPAFRowLookup(idx, psf) {
  if (psf <= 0.90) return TDF_PAF_ROWS.low[idx];
  if (psf < 1.10)  return TDF_PAF_ROWS.mid[idx];
  return TDF_PAF_ROWS.high[idx];
}

function tdfPAFValue({ useAngle, diff, angle, psf }) {
  const thresholds = useAngle ? TDF_PAF_ANGLE_THRESHOLDS : TDF_PAF_DIFF_THRESHOLDS;
  const x = useAngle ? angle : diff;
  return tdfPAFRowLookup(tdfPAFRowIndex(x, thresholds), psf);
}

function tdfPLF(shelf, psf, paf) {
  let idx;
  if (shelf > 2.25)      idx = 0;
  else if (shelf > 2.0)  idx = 1;
  else if (shelf > 1.75) idx = 2;
  else if (shelf > 1.5)  idx = 3;
  else if (shelf > 1.25) idx = 4;
  else                   idx = 5;
  const rowA = [1.07, 1.03, 1.01, 1.00, 0.97, 0.93];
  const rowB = [1.10, 1.05, 1.03, 1.00, 0.98, 0.95];
  const rowC = [1.15, 1.07, 1.03, 1.00, 0.99, 0.98];
  if (psf <= 0.90) return rowA[idx];
  if (psf < 1.10 && paf < 1.10) return rowB[idx];
  return rowC[idx];
}

function parseInches(v) {
  v = String(v).trim();
  const m = v.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return +m[1] + (+m[2] / +m[3]);
  const f = v.match(/^(\d+)\/(\d+)$/);
  if (f) return +f[1] / +f[2];
  return parseFloat(v);
}

function tdfDescriptionKey(tdf) {
  if (tdf < 0.70) return 'tdfTooEasy';
  if (tdf < 0.85) return 'tdfVeryEasy';
  if (tdf < 0.95) return 'tdfEasy';
  if (tdf <= 1.05) return 'tdfAverage';
  if (tdf <= 1.15) return 'tdfTough';
  if (tdf <= 1.30) return 'tdfVeryTough';
  return 'tdfTooTough';
}

function updateTDF() {
  const unitEl  = document.querySelector('input[name="tdfUnit"]:checked');
  const depthEl = document.querySelector('input[name="tdfDepthMode"]:checked');
  if (!unitEl || !depthEl) return;
  const unit = unitEl.value;
  const isMetric = unit === 'metric';
  const useAngle = depthEl.value === 'angle';

  const ts = parseFloat(document.getElementById('tdfTableSize').value) || 1;
  let mouth  = parseInches(document.getElementById('tdfMouth').value)  || 0;
  let throat = parseInches(document.getElementById('tdfThroat').value) || 0;
  let shelf  = parseInches(document.getElementById('tdfShelf').value)  || 0;
  let angle  = parseFloat(document.getElementById('tdfAngle').value)  || 0;
  if (isMetric) { mouth /= 2.54; throat /= 2.54; shelf /= 2.54; }

  const psf = tdfPSF(mouth);
  const diff = Math.max(0, mouth - throat);
  const paf = tdfPAFValue({ useAngle, diff, angle, psf });
  const plf = tdfPLF(shelf, psf, paf);
  const tdf = ts * psf * paf * plf;

  document.getElementById('tdfTSF').textContent = ts.toFixed(2);
  document.getElementById('tdfPSF').textContent = psf.toFixed(2);
  document.getElementById('tdfPAF').textContent = paf.toFixed(2);
  document.getElementById('tdfPLF').textContent = plf.toFixed(2);
  document.getElementById('tdfValue').textContent = tdf.toFixed(2);

  const descEl = document.getElementById('tdfDesc');
  descEl.dataset.i18n = tdfDescriptionKey(tdf);
  descEl.textContent = t(descEl.dataset.i18n);

  document.getElementById('tdfThroat').disabled = useAngle;
  document.getElementById('tdfAngle').disabled  = !useAngle;
  document.getElementById('tdfThroat').style.opacity = useAngle ? '0.4' : '1';
  document.getElementById('tdfAngle').style.opacity  = useAngle ? '1' : '0.4';

  document.querySelectorAll('span[data-i18n="tdfThroat"], span[data-i18n="tdfAngle"]')
    .forEach(el => { el.textContent = t(el.dataset.i18n); });
}

function setTDFUnit() {
  const isMetric = document.querySelector('input[name="tdfUnit"]:checked').value === 'metric';
  const m = document.getElementById('tdfMouth');
  const th = document.getElementById('tdfThroat');
  const sh = document.getElementById('tdfShelf');
  const conv = (el, f) => { const v = parseInches(el.value); if (!isNaN(v)) el.value = (v * f).toFixed(3); };
  if (isMetric) { conv(m, 2.54); conv(th, 2.54); conv(sh, 2.54); }
  else          { conv(m, 1/2.54); conv(th, 1/2.54); conv(sh, 1/2.54); }
  updateTDF();
}

// ============================================================
// EVENT BINDING
// ============================================================
function bindEvents() {
  document.getElementById('langSelect').addEventListener('change', e => setLanguage(e.target.value));
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('playerSelect').addEventListener('change', () => {
    updateEditDeleteButtons(); updateLifetimeStats(); renderHistory();
    // In the RDS view the same selector drives the level and the RDS 100 clock.
    if (rdsView) { rdsSyncPlayerSelect(); const rec = rdsRecordFor(rdsPlayerId); rdsLevel = rec ? rec.level : RDS_MIN_LEVEL; renderRds(); rds100Arm(); }
  });
  document.getElementById('tableSelect').addEventListener('change', () => { updateEditDeleteButtons(); updateUI(); });
  document.getElementById('btnAddPlayer').addEventListener('click', showAddPlayer);
  document.getElementById('btnEditPlayer').addEventListener('click', showEditPlayer);
  document.getElementById('btnDeletePlayer').addEventListener('click', deletePlayer);
  document.getElementById('btnAddTable').addEventListener('click', showAddTable);
  document.getElementById('btnEditTable').addEventListener('click', showEditTable);
  document.getElementById('btnDeleteTable').addEventListener('click', deleteTable);
  document.getElementById('btnStart').addEventListener('click', startSession);
  // History rows are re-rendered constantly, so their buttons are delegated.
  document.getElementById('historyList').addEventListener('click', (e) => {
    const rb = e.target.closest('button.resume');
    if (rb && rb.dataset.resume) { resumeSession(rb.dataset.resume); return; }
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-actions .btn-sm');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'hide')  toggleHide();
    if (action === 'pause') togglePause();
    if (action === 'undo')  undoInning();
    // Last: focus may reformat the cards, so let the other actions finish first.
    if (action === 'focus') toggleFocus();
  });
  document.getElementById('detailsToggle').addEventListener('click', openDetailsModal);
  document.getElementById('ranksToggle').addEventListener('click', toggleRanks);
  document.getElementById('btnShowMore').addEventListener('click', showMoreHistory);
  document.getElementById('btnExport').addEventListener('click', exportData);
  document.getElementById('btnImport').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', e => { importData(e.target.files[0]); e.target.value = ''; });
  document.getElementById('btnReset').addEventListener('click', resetAll);

  // TDF display toggle
  document.querySelectorAll('input[name="tdfDisplay"]').forEach(r => {
    r.addEventListener('change', e => {
      localStorage.setItem('qskill-tdfDisplay', e.target.value);
      updateUI();
      updateLifetimeStats();
      renderHistory();
    });
  });

  document.getElementById('btnDeleteMenu').addEventListener('click', () => {
    const group = document.getElementById('deleteMenuGroup');
    const open  = group.style.display !== 'none';
    group.style.display = open ? 'none' : 'inline-flex';
    setDeleteMenuChevron(!open);
  });
  document.getElementById('btnDeleteEmpty').addEventListener('click', async () => {
    const player = getSelectedPlayer();
    if (!player) { showToast(t('selectPlayerFirst'), 'warning'); return; }
    const counts = countDeletableSessions();
    if (counts.empty === 0) {
      showToast(t('noMatching'), 'info');
      return;
    }
    const ok = await modalConfirm({
      title: t('deleteEmpty'),
      message: t('deletingSessions').replace('{n}', counts.empty),
      okText: t('delete'),
      cancelText: t('cancel'),
      danger: true
    });
    if (!ok) return;
    deleteEmptySessions();
  });

  document.getElementById('btnDeleteUnfinished').addEventListener('click', deleteUnfinishedSessions);
  document.getElementById('btnDeleteBowlardBelow').addEventListener('click', deleteBowlardBelowThreshold);
  document.getElementById('btnDeleteQSkillBelow').addEventListener('click', deleteQSkillBelowThreshold);

  document.querySelectorAll('input[name="bowlardInputMode"]').forEach(r => {
    r.addEventListener('change', e => {
      // Locked while a session runs (updateSetupLock), so no guard is needed.
      bowlardInputMode = e.target.value;
    });
  });

  document.querySelectorAll('input[name="gameMode"]').forEach(r => {
    r.addEventListener('change', e => {
      // RDS is a reference view, not a scoring mode: it never becomes
      // currentMode and never touches the saved setup.
      if (e.target.value === 'rds') {
        rdsView = true;
        applyViewMode();
        return;
      }
      if (rdsView) {
        rdsView = false;
        document.body.classList.remove('rds-view');
      }
      // Mode is locked while a session runs (updateSetupLock).
      const prevTgt = parseInt(document.getElementById('targetScore').value);
      if (!isNaN(prevTgt)) {
        if (currentMode === 'bowlard') appData.lastUsed.targetBowlard  = prevTgt;
        else                           appData.lastUsed.targetStandard = prevTgt;
      }
      currentMode = e.target.value;
      applyTargetForMode(currentMode);
      if (currentMode === 'bowlard') {
        document.querySelectorAll('input[name="sessionType"]').forEach(r => {
          r.disabled = true;
          r.checked = (r.value === '10');
        });
      } else {
        document.querySelectorAll('input[name="sessionType"]').forEach(r => r.disabled = false);
      }
      updateLifetimeStats();
      renderHistory();
      applyLanguage();
      saveData();
    });
  });

  // RDS level picker (delegated: the chips are rebuilt on every render).
  const rdsChipsEl = document.getElementById('rdsChips');
  if (rdsChipsEl) {
    rdsChipsEl.addEventListener('click', e => {
      const btn = e.target.closest('.rds-chip');
      if (btn) rdsSetLevel(parseInt(btn.dataset.rds, 10));
    });
  }

  // Rating tables: tap a row to show that tier's description.
  ['rdsRankBody', 'rankTiersBody'].forEach(function (id) {
    const body = document.getElementById(id);
    if (!body) return;
    body.addEventListener('click', e => {
      const row = e.target.closest('.rds-rank-row');
      if (!row) return;
      const desc = body.querySelector('.rds-rank-desc[data-idx="' + row.dataset.idx + '"]');
      if (desc) desc.hidden = !desc.hidden;
    });
  });

  // RDS record: round logging. The player comes from the shared selector.
  const rdsLogEl = document.getElementById('rdsLogBtns');
  if (rdsLogEl) {
    rdsLogEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-racks]');
      if (btn) rdsLogRound(parseInt(btn.dataset.racks, 10));
    });
  }

  // History lives behind a button so the card stays compact.
  const rdsHistEl = document.getElementById('rdsHistBtn');
  if (rdsHistEl) {
    rdsHistEl.addEventListener('click', () => {
      const rec = rdsRecordFor(rdsPlayerId);
      const rows = rec ? rec.attempts.slice(0, RDS_HIST_MAX).map(rdsRoundRowHtml) : [];
      rdsShowHistory(t('rdsHistory'), rows, t('rdsNoRecord'));
    });
  }

  // RDS first-run level picker + "change level" link.
  const rdsStartOk = document.getElementById('rdsStartOk');
  if (rdsStartOk) {
    rdsStartOk.addEventListener('click', () => {
      const sel = document.getElementById('rdsStartLevel');
      rdsSetLevelForPlayer(rdsPlayerId, sel ? parseInt(sel.value, 10) : RDS_MIN_LEVEL);
    });
  }
  const rdsChangeEl = document.getElementById('rdsChangeLevel');
  if (rdsChangeEl) {
    rdsChangeEl.addEventListener('click', () => {
      const rec = rdsRecordFor(rdsPlayerId);
      const sel = document.getElementById('rdsStartLevel');
      if (sel && rec) sel.value = String(rec.level);
      rdsChanging = true;
      renderRds();
    });
  }

  // RDS 100 — start / pause / end and the "balls left" picker.
  const rds100StartEl = document.getElementById('rds100Start');
  if (rds100StartEl) {
    rds100StartEl.addEventListener('click', () => rds100NewGame(rds100PickedLevel()));
  }
  const rds100PauseEl = document.getElementById('rds100Pause');
  if (rds100PauseEl) {
    rds100PauseEl.addEventListener('click', () => rds100PauseToggle());
  }
  const rds100EndEl = document.getElementById('rds100End');
  if (rds100EndEl) {
    rds100EndEl.addEventListener('click', () => rds100EndGame());
  }
  const rds100ClearEl = document.getElementById('rds100Clear');
  if (rds100ClearEl) {
    rds100ClearEl.addEventListener('click', rds100ClearHistory);
  }
  const rds100BallsEl = document.getElementById('rds100Balls');
  if (rds100BallsEl) {
    rds100BallsEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-left]');
      if (btn) rds100Choose(parseInt(btn.dataset.left, 10));
    });
  }

  document.querySelectorAll('input[name="tdfUnit"]').forEach(r =>
    r.addEventListener('change', setTDFUnit)
  );
  ['tdfTableSize','tdfMouth','tdfThroat','tdfShelf','tdfAngle'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', updateTDF);
    el.addEventListener('change', updateTDF);
  });
  document.querySelectorAll('input[name="tdfDepthMode"]').forEach(r => {
    r.addEventListener('change', updateTDF);
    r.addEventListener('click', updateTDF);
  });

  // Flush the elapsed time so a reload/close keeps the most recent value.
  // pagehide fires more reliably than beforeunload on mobile Safari.
  const flushLive = () => { saveLive(); };
  window.addEventListener('beforeunload', flushLive);
  window.addEventListener('pagehide', flushLive);
  // Re-place the details trigger when crossing the phone breakpoint.
  window.addEventListener('resize', syncDetailTogglePlacement);
  // Catch up the stored elapsed time periodically; scoring already saves.
  setInterval(() => { if (sessionActive && !sessionPaused) saveLive(); }, 15000);
}

// ============================================================
// START
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

