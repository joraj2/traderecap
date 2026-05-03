window.Tabs = window.Tabs || {};
window.Tabs.alerts = (function () {
  function render(host) {
    const list = (Store.get('alerts') || []).slice().sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    host.innerHTML = `
      <div style="display:flex; align-items:center; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
        <h2 style="margin:0; font-size: 16px;">Price Alerts</h2>
        <span class="text-dim" style="font-size: 11px;">Polls every 60s while the app is open.</span>
        <div style="margin-left:auto;">
          <button class="btn btn-primary" id="add-alert"><i data-lucide="plus"></i> New Alert</button>
        </div>
      </div>

      <div class="card" style="margin-bottom: 12px; padding: 12px 14px;">
        <div class="text-2" style="font-size: 12px; line-height: 1.5;">
          <strong>Heads up:</strong> alerts use free public price feeds. Crypto pairs (BTCUSDT, ETHUSDT, ...) are reliable via Binance. Forex / metals / stocks (XAUUSD, EURUSD, AAPL) use Yahoo Finance and may be flaky or rate-limited. Background polling is not supported — the app must be open.
        </div>
      </div>

      ${list.length === 0 ? `
        <div class="empty">
          <div class="emoji">🔔</div>
          <h3>No Alerts Yet</h3>
          <div>Set a price target on any symbol. We'll notify you when it's hit.</div>
        </div>
      ` : `
        <div class="alerts-list">
          ${list.map(a => alertCard(a)).join('')}
        </div>
      `}
    `;

    if (window.lucide) lucide.createIcons();

    host.querySelector('#add-alert').addEventListener('click', () => openForm(null));
    host.querySelectorAll('[data-alert-id]').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('button') || e.target.closest('.toggle-switch')) return;
        const id = card.dataset.alertId;
        const a = list.find(x => x.id === id);
        if (a) openForm(a);
      });
    });
    host.querySelectorAll('[data-action="toggle-alert"]').forEach(t => {
      t.addEventListener('click', e => {
        e.stopPropagation();
        const id = t.dataset.id;
        const a = list.find(x => x.id === id);
        if (a) Alerts.update(id, { active: !a.active });
      });
    });
    host.querySelectorAll('[data-action="del-alert"]').forEach(b => {
      b.addEventListener('click', async e => {
        e.stopPropagation();
        if (await Modal.confirm({ title: 'Delete Alert', message: 'Remove this price alert?', okText: 'Delete', danger: true })) {
          Alerts.remove(b.dataset.id);
        }
      });
    });
  }

  function alertCard(a) {
    const status = a.active ? 'active' : 'paused';
    const lastPrice = a.last_price != null ? a.last_price : '—';
    const lastChecked = a.last_checked ? timeAgo(a.last_checked) : 'never';
    const errorRow = a.last_error ? `<div class="text-dim" style="font-size: 11px; color: var(--red); margin-top: 4px;">⚠ ${esc(a.last_error)}</div>` : '';
    return `
      <div class="alert-card" data-alert-id="${esc(a.id)}">
        <div class="alert-main">
          <div class="alert-symbol-block">
            <strong>${esc(a.symbol)}</strong>
            <span class="alert-rule">${a.direction === 'above' ? '↑' : '↓'} ${a.target} <span class="text-dim">(${a.repeat})</span></span>
          </div>
          <div class="alert-meta">
            <div><span class="text-dim">Last:</span> <strong class="num">${lastPrice}</strong></div>
            <div class="text-dim" style="font-size: 11px;">Checked ${lastChecked}</div>
            ${errorRow}
          </div>
        </div>
        <div class="alert-actions">
          <button class="toggle-switch ${status}" data-action="toggle-alert" data-id="${esc(a.id)}" aria-label="Toggle alert">
            <span class="knob"></span>
          </button>
          <button class="btn btn-icon btn-sm btn-danger" data-action="del-alert" data-id="${esc(a.id)}" aria-label="Delete alert"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `;
  }

  function openForm(existing) {
    const a = existing ? Object.assign({}, existing) : {
      id: null, symbol: '', target: '', direction: 'above', repeat: 'once',
      active: true, created_at: Date.now()
    };
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-grid cols-2">
        <div class="field">
          <label>Symbol</label>
          <input name="symbol" required value="${esc(a.symbol)}" placeholder="XAUUSD, BTCUSDT, AAPL..." autocomplete="off" />
        </div>
        <div class="field">
          <label>Target Price</label>
          <input name="target" type="number" step="any" required value="${a.target ?? ''}" placeholder="2105.50" />
        </div>
        <div class="field">
          <label>Direction</label>
          <select name="direction">
            <option value="above" ${a.direction === 'above' ? 'selected' : ''}>Above (Crosses Up)</option>
            <option value="below" ${a.direction === 'below' ? 'selected' : ''}>Below (Crosses Down)</option>
          </select>
        </div>
        <div class="field">
          <label>Repeat</label>
          <select name="repeat">
            <option value="once" ${a.repeat === 'once' ? 'selected' : ''}>Once (Then Off)</option>
            <option value="every" ${a.repeat === 'every' ? 'selected' : ''}>Every Time It Crosses</option>
          </select>
        </div>
        <div class="field full">
          <label style="display:flex; align-items:center; gap: 8px; cursor: pointer; font-weight: 400;">
            <input type="checkbox" name="active" ${a.active ? 'checked' : ''} />
            <span class="text-2" style="font-size: 13px;">Active</span>
          </label>
        </div>
      </div>
    `;
    const cancel = document.createElement('button'); cancel.className = 'btn btn-ghost'; cancel.textContent = 'Cancel'; cancel.type = 'button';
    const save = document.createElement('button'); save.className = 'btn btn-primary'; save.textContent = existing ? 'Save' : 'Add Alert'; save.type = 'submit';
    const foot = document.createElement('div'); foot.style.display = 'flex'; foot.style.gap = '8px'; foot.style.width = '100%';
    if (existing) {
      const del = document.createElement('button'); del.className = 'btn btn-danger'; del.type = 'button'; del.textContent = 'Delete'; del.style.marginRight = 'auto';
      del.addEventListener('click', async () => {
        if (await Modal.confirm({ title: 'Delete Alert', message: 'Remove this alert?', okText: 'Delete', danger: true })) {
          Alerts.remove(existing.id);
          Modal.close();
        }
      });
      foot.appendChild(del);
    } else {
      const sp = document.createElement('div'); sp.style.marginRight = 'auto'; foot.appendChild(sp);
    }
    foot.appendChild(cancel); foot.appendChild(save);
    Modal.open({ title: existing ? 'Edit Alert' : 'New Alert', body: form, footer: foot, width: 560 });
    cancel.addEventListener('click', () => Modal.close());
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const out = {
        id: existing ? existing.id : Store.uuid(),
        symbol: (fd.get('symbol') || '').toString().toUpperCase().trim(),
        target: Number(fd.get('target')),
        direction: fd.get('direction'),
        repeat: fd.get('repeat'),
        active: fd.get('active') === 'on',
        created_at: existing ? existing.created_at : Date.now(),
        last_price: existing?.last_price ?? null,
        last_checked: existing?.last_checked ?? null,
        last_triggered: existing?.last_triggered ?? null,
        trigger_count: existing?.trigger_count ?? 0,
        last_error: null
      };
      if (!out.symbol || !isFinite(out.target)) return;
      if (existing) {
        Store.update('alerts', list => {
          const i = list.findIndex(x => x.id === existing.id);
          if (i >= 0) list[i] = out;
        });
        Toast.success('Alert updated');
      } else {
        Alerts.add(out);
        Toast.success('Alert added');
      }
      Modal.close();
      // Kick off an immediate check
      Alerts.checkOnce();
    });
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { render };
})();
