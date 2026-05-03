window.Tabs = window.Tabs || {};
window.Tabs.premarket = (function () {
  let editingDate = null;

  function render(host) {
    const today = Compute.todayISO();
    if (!editingDate) editingDate = today;
    const all = Store.get('premarket') || {};
    const plan = all[editingDate] || blankPlan();

    const dates = Object.keys(all).sort().reverse();

    host.innerHTML = `
      <div class="row-2">
        <div>
          <div class="card">
            <div class="card-title-row">
              <span class="dot"></span>
              <h3 class="card-title">Pre-market Plan</h3>
              <input type="date" id="pm-date" value="${editingDate}" style="margin-left:auto; height: 28px; padding: 0 8px; font-size: 12px;" />
            </div>
            <div class="form-grid cols-2">
              <div class="field"><label>Bias</label>
                <select id="pm-bias">
                  ${['long','short','neutral','no_trade'].map(s => `<option value="${s}" ${plan.bias === s ? 'selected' : ''}>${s.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>`).join('')}
                </select>
              </div>
              <div class="field"><label>Conviction (1-5)</label>
                <input type="number" min="1" max="5" id="pm-conviction" value="${plan.conviction || 3}" />
              </div>
              <div class="field full"><label>Levels (Comma-Separated)</label>
                <input id="pm-levels" value="${esc((plan.levels || []).join(', '))}" placeholder="SPX 4502, NDX 15800, BTC 92500" />
              </div>
              <div class="field full"><label>Catalysts</label>
                <input id="pm-catalysts" value="${esc((plan.catalysts || []).join(', '))}" placeholder="CPI 8:30, FOMC 14:00, NVDA earnings AH" />
              </div>
              <div class="field full"><label>Watchlist (Symbols)</label>
                <input id="pm-symbols" value="${esc((plan.symbols || []).join(', '))}" placeholder="AAPL, NVDA, ES, BTC" />
              </div>
              <div class="field full"><label>Plan / Notes</label>
                <textarea id="pm-notes" rows="6" placeholder="What am I looking for? What do I do if X? What invalidates the bias?">${esc(plan.notes || '')}</textarea>
              </div>
              <div class="field full"><label>Invalidation (What Kills the Bias)</label>
                <textarea id="pm-invalid" rows="3" placeholder="If SPX loses 4485 with conviction, scrap longs.">${esc(plan.invalidation || '')}</textarea>
              </div>
            </div>
            <div style="margin-top: 12px; display:flex; gap: 8px;">
              <button class="btn btn-primary" id="pm-save"><i data-lucide="save"></i> Save Plan</button>
              <button class="btn btn-ghost" id="pm-clear">Clear</button>
              <span class="text-dim" style="margin-left:auto; font-size: 11px;">Auto-keyed by date.</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title-row"><span class="dot"></span><h3 class="card-title">Recent Plans</h3></div>
          ${dates.length ? dates.slice(0, 14).map(d => `
            <div style="padding:8px 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; cursor: pointer;" data-pm-date="${d}">
              <strong>${d}</strong>
              <span class="text-dim" style="font-size: 11px;">${(all[d].bias || '').toUpperCase()}</span>
              <span class="text-dim" style="font-size: 11px;">${(all[d].symbols || []).slice(0, 4).join(', ')}</span>
            </div>
          `).join('') : `<div class="text-dim" style="font-size: 12px;">No saved plans yet.</div>`}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    host.querySelector('#pm-date').addEventListener('change', e => { editingDate = e.target.value; render(host); });
    host.querySelectorAll('[data-pm-date]').forEach(d => d.addEventListener('click', () => { editingDate = d.dataset.pmDate; render(host); }));

    host.querySelector('#pm-save').addEventListener('click', () => {
      const out = {
        bias: host.querySelector('#pm-bias').value,
        conviction: parseInt(host.querySelector('#pm-conviction').value || 3, 10),
        levels: host.querySelector('#pm-levels').value.split(',').map(s => s.trim()).filter(Boolean),
        catalysts: host.querySelector('#pm-catalysts').value.split(',').map(s => s.trim()).filter(Boolean),
        symbols: host.querySelector('#pm-symbols').value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
        notes: host.querySelector('#pm-notes').value,
        invalidation: host.querySelector('#pm-invalid').value,
        saved_at: new Date().toISOString()
      };
      Store.update('premarket', obj => { obj[editingDate] = out; });
      Toast.success(`Plan saved for ${editingDate}`);
    });
    host.querySelector('#pm-clear').addEventListener('click', async () => {
      if (await Modal.confirm({ title: 'Clear Plan', message: `Delete the plan for ${editingDate}?`, okText: 'Clear', danger: true })) {
        Store.update('premarket', obj => { delete obj[editingDate]; });
        render(host);
      }
    });
  }

  function blankPlan() { return { bias: 'neutral', conviction: 3, levels: [], catalysts: [], symbols: [], notes: '', invalidation: '' }; }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { render };
})();
