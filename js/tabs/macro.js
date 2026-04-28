window.Tabs = window.Tabs || {};
window.Tabs.macro = (function () {
  let editing = null;

  function render(host) {
    const today = Compute.todayISO();
    if (!editing) editing = today;
    const all = Store.get('macro') || {};
    const note = all[editing] || blank();
    const dates = Object.keys(all).sort().reverse();

    host.innerHTML = `
      <div class="row-2">
        <div class="card">
          <div class="card-title-row">
            <span class="dot"></span>
            <h3 class="card-title">Macro / Tape Note</h3>
            <input type="date" id="m-date" value="${editing}" style="margin-left:auto; height: 28px; padding: 0 8px; font-size: 12px;" />
          </div>
          <div class="form-grid cols-2">
            <div class="field"><label>Regime</label>
              <select id="m-regime">${['risk_on','risk_off','chop','transition','trend_up','trend_down'].map(s => `<option ${note.regime === s ? 'selected' : ''}>${s.replace('_',' ')}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Bias</label>
              <select id="m-bias">${['long','short','neutral','no_trade'].map(s => `<option ${note.bias === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Breadth</label><input id="m-breadth" value="${esc(note.breadth || '')}" placeholder="A/D, McClellan, % above 20EMA" /></div>
            <div class="field"><label>Volatility (VIX)</label><input id="m-vix" value="${esc(note.vix || '')}" /></div>
            <div class="field full"><label>Key levels (SPX / NDX / BTC / DXY)</label>
              <input id="m-levels" value="${esc((note.levels || []).join(', '))}" placeholder="SPX 4502/4485/4520, NDX 15800, BTC 92500, DXY 104" />
            </div>
            <div class="field full"><label>Catalysts ahead</label>
              <input id="m-catalysts" value="${esc((note.catalysts || []).join(', '))}" placeholder="CPI Wed, FOMC Thu, NVDA earnings Fri" />
            </div>
            <div class="field full"><label>Notes</label>
              <textarea id="m-notes" rows="6" placeholder="Tape thoughts, sector rotation, themes...">${esc(note.notes || '')}</textarea>
            </div>
          </div>
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button class="btn btn-primary" id="m-save"><i data-lucide="save"></i> Save Note</button>
            <button class="btn btn-ghost" id="m-clear">Clear</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title-row"><span class="dot"></span><h3 class="card-title">Recent Notes</h3></div>
          ${dates.length ? dates.slice(0, 14).map(d => `
            <div style="padding:8px 0; border-bottom: 1px solid var(--border); cursor:pointer;" data-m-date="${d}">
              <div><strong>${d}</strong> <span class="text-dim" style="font-size: 11px;">${(all[d].regime || '').replace('_',' ')}</span></div>
              <div class="text-dim" style="font-size: 11px;">${esc((all[d].notes || '').slice(0, 90))}${(all[d].notes || '').length > 90 ? '…' : ''}</div>
            </div>
          `).join('') : `<div class="text-dim" style="font-size: 12px;">No notes yet.</div>`}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    host.querySelector('#m-date').addEventListener('change', e => { editing = e.target.value; render(host); });
    host.querySelectorAll('[data-m-date]').forEach(d => d.addEventListener('click', () => { editing = d.dataset.mDate; render(host); }));

    host.querySelector('#m-save').addEventListener('click', () => {
      const out = {
        regime: host.querySelector('#m-regime').value,
        bias: host.querySelector('#m-bias').value,
        breadth: host.querySelector('#m-breadth').value,
        vix: host.querySelector('#m-vix').value,
        levels: host.querySelector('#m-levels').value.split(',').map(s => s.trim()).filter(Boolean),
        catalysts: host.querySelector('#m-catalysts').value.split(',').map(s => s.trim()).filter(Boolean),
        notes: host.querySelector('#m-notes').value,
        saved_at: new Date().toISOString()
      };
      Store.update('macro', obj => { obj[editing] = out; });
      Toast.success(`Macro note saved for ${editing}`);
    });
    host.querySelector('#m-clear').addEventListener('click', async () => {
      if (await Modal.confirm({ title: 'Clear note', message: `Delete the macro note for ${editing}?`, okText: 'Clear', danger: true })) {
        Store.update('macro', obj => { delete obj[editing]; });
        render(host);
      }
    });
  }

  function blank() { return { regime: 'chop', bias: 'neutral', breadth: '', vix: '', levels: [], catalysts: [], notes: '' }; }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { render };
})();
