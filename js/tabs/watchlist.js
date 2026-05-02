window.Tabs = window.Tabs || {};
window.Tabs.watchlist = (function () {
  function render(host) {
    autoExpire();
    const items = Store.get('watchlist') || [];
    const buckets = { watching: [], triggered: [], traded: [], expired: [] };
    items.forEach(w => (buckets[w.status] || buckets.watching).push(w));

    host.innerHTML = `
      <div style="display:flex; align-items: center; margin-bottom: 12px;">
        <h2 style="margin:0; font-size: 16px;">Best Opps & Watchlist</h2>
        <div style="margin-left:auto; display:flex; gap: 8px;">
          <button class="btn btn-primary" id="add-watch"><i data-lucide="plus"></i> Add Watch</button>
        </div>
      </div>

      ${section('Watching', buckets.watching)}
      ${section('Triggered', buckets.triggered)}
      ${section('Traded', buckets.traded)}
      ${section('Expired', buckets.expired)}

      ${items.length === 0 ? `<div class="empty"><div class="emoji">🎯</div><h3>No watch items yet</h3><div>Add setups you're stalking. We auto-expire stale ones based on your rule.</div></div>` : ''}
    `;

    if (window.lucide) lucide.createIcons();

    host.querySelector('#add-watch').addEventListener('click', () => openForm(null));

    host.querySelectorAll('[data-watch-id]').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('button') || e.target.closest('select')) return;
        const id = row.dataset.watchId;
        const w = items.find(x => x.id === id);
        if (w) openForm(w);
      });
    });
    host.querySelectorAll('select[data-status-id]').forEach(s => s.addEventListener('change', () => {
      Store.update('watchlist', list => {
        const w = list.find(x => x.id === s.dataset.statusId);
        if (w) w.status = s.value;
      });
    }));
    host.querySelectorAll('[data-action="del-watch"]').forEach(b => b.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (await Modal.confirm({ title: 'Delete watch item', message: 'Remove this from the watchlist?', okText: 'Delete', danger: true })) {
        Store.update('watchlist', list => list.filter(x => x.id !== b.dataset.id));
      }
    }));
  }

  function section(title, list) {
    if (!list.length) return '';
    return `
      <div class="card" style="margin-bottom: 12px;">
        <div class="card-title-row"><span class="dot"></span><h3 class="card-title">${title} <span class="text-dim">· ${list.length}</span></h3></div>
        <div class="table-wrap" style="border:0;">
          <table class="table">
            <thead><tr><th>Symbol</th><th>Setup</th><th>Trigger</th><th>Stop</th><th>Target</th><th>Conviction</th><th>Expires</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${list.map(w => `
                <tr data-watch-id="${w.id}" style="cursor:pointer;">
                  <td><strong>${esc(w.symbol || '')}</strong> <span class="chip">${esc((w.asset_class || 'stock').toUpperCase())}</span></td>
                  <td>${esc(w.setup || '')}</td>
                  <td class="num">${fmt(w.trigger_price)}</td>
                  <td class="num">${fmt(w.stop_loss)}</td>
                  <td class="num">${fmt(w.target)}</td>
                  <td>${'★'.repeat(w.conviction || 3)}</td>
                  <td class="text-dim">${w.expires || '—'}</td>
                  <td>
                    <select data-status-id="${w.id}">
                      ${['watching','triggered','traded','expired'].map(s => `<option ${w.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                  </td>
                  <td><button class="btn btn-icon btn-sm btn-danger" data-action="del-watch" data-id="${w.id}"><i data-lucide="trash-2"></i></button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function openForm(existing) {
    const w = existing ? JSON.parse(JSON.stringify(existing)) : freshWatch();
    const tags = Store.get('tags') || {};
    const today = Compute.todayISO();
    const expiresDefault = (() => {
      const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + 5);
      return d.toISOString().slice(0, 10);
    })();

    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-grid cols-3">
        <div class="field"><label>Symbol</label><input name="symbol" value="${esc(w.symbol)}" required /></div>
        <div class="field"><label>Asset Class</label>
          <select name="asset_class">
            ${['stock','option','future','forex','crypto'].map(a => `<option ${(w.asset_class || 'stock') === a ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Side</label>
          <select name="side">${['long','short'].map(s => `<option ${(w.side || 'long') === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Trigger</label><input type="number" step="any" name="trigger_price" value="${w.trigger_price ?? ''}" /></div>
        <div class="field"><label>Stop</label><input type="number" step="any" name="stop_loss" value="${w.stop_loss ?? ''}" /></div>
        <div class="field"><label>Target</label><input type="number" step="any" name="target" value="${w.target ?? ''}" /></div>
        <div class="field"><label>Setup</label>
          <input list="watch-setup-list" name="setup" value="${esc(w.setup)}" />
          <datalist id="watch-setup-list">${(tags.setups || []).map(s => `<option value="${esc(s)}">`).join('')}</datalist>
        </div>
        <div class="field"><label>Conviction (1-5)</label><input type="number" min="1" max="5" name="conviction" value="${w.conviction || 3}" /></div>
        <div class="field"><label>Expires</label><input type="date" name="expires" value="${w.expires || expiresDefault}" /></div>
        <div class="field full"><label>Thesis</label><textarea name="thesis">${esc(w.thesis)}</textarea></div>
        <div class="field full"><label>Status</label>
          <select name="status">${['watching','triggered','traded','expired'].map(s => `<option ${(w.status || 'watching') === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        </div>
      </div>
    `;
    const cancel = btn('btn-ghost', 'Cancel');
    const save = btn('btn-primary', existing ? 'Save' : 'Add Watch');
    save.type = 'submit';
    save.setAttribute('form', '');
    const foot = document.createElement('div');
    foot.style.display = 'flex'; foot.style.gap = '8px'; foot.style.marginLeft = 'auto';
    foot.appendChild(cancel); foot.appendChild(save);

    const m = Modal.open({ title: existing ? 'Edit Watch' : 'Add Watch', body: form, footer: foot, width: 720 });
    cancel.addEventListener('click', () => Modal.close());
    save.addEventListener('click', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const out = {
        id: existing ? existing.id : Store.uuid(),
        added: existing ? existing.added : today,
        symbol: (fd.get('symbol') || '').toString().toUpperCase().trim(),
        asset_class: fd.get('asset_class'),
        side: fd.get('side'),
        trigger_price: numOrNull(fd.get('trigger_price')),
        stop_loss: numOrNull(fd.get('stop_loss')),
        target: numOrNull(fd.get('target')),
        setup: fd.get('setup') || '',
        conviction: parseInt(fd.get('conviction') || 3, 10),
        expires: fd.get('expires') || null,
        thesis: fd.get('thesis') || '',
        status: fd.get('status') || 'watching'
      };
      if (!out.symbol) return;
      Store.update('watchlist', list => {
        if (existing) {
          const i = list.findIndex(x => x.id === existing.id);
          if (i >= 0) list[i] = out;
        } else list.push(out);
      });
      Toast.success(existing ? 'Watch updated' : 'Watch added');
      Modal.close();
    });
  }

  function freshWatch() {
    return { id: null, added: Compute.todayISO(), symbol: '', asset_class: 'stock', side: 'long', status: 'watching', conviction: 3 };
  }

  function autoExpire() {
    const today = Compute.todayISO();
    Store.update('watchlist', list => {
      for (const w of list) {
        if (w.status === 'watching' && w.expires && w.expires < today) w.status = 'expired';
      }
    });
  }

  function btn(cls, text) { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = text; return b; }
  function fmt(v) { if (v == null || v === '') return '–'; return Number(v).toLocaleString(undefined, { maximumFractionDigits: 4 }); }
  function numOrNull(v) { if (v === '' || v == null) return null; const n = Number(v); return isFinite(n) ? n : null; }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { render };
})();
