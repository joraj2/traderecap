window.Tabs = window.Tabs || {};
window.Tabs.mistakes = (function () {
  function render(host) {
    const defs = Store.get('mistakes') || [];
    const trades = Store.get('trades') || [];
    const agg = {};
    for (const t of trades) {
      for (const m of (t.mistakes || [])) {
        const a = agg[m] || (agg[m] = { count: 0, impact: 0, recent: null });
        a.count++;
        a.impact += Compute.pnl(t);
        if (!a.recent || t.date > a.recent) a.recent = t.date;
      }
    }

    const sorted = defs.map(d => Object.assign({}, d, agg[d.id] || { count: 0, impact: 0, recent: null }))
      .sort((a, b) => a.impact - b.impact);

    host.innerHTML = `
      <div style="display:flex; align-items:center; margin-bottom: 12px;">
        <h2 style="margin:0; font-size: 16px;">Mistakes Catalog</h2>
        <span class="text-dim" style="margin-left: 12px; font-size: 12px;">Tag mistakes on individual trades — repeat offenders rise to the top here.</span>
        <div style="margin-left:auto;"><button class="btn btn-primary" id="add-mistake"><i data-lucide="plus"></i> New Mistake</button></div>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Mistake</th><th>Description</th><th class="num">Times Tagged</th><th class="num">Total Impact</th><th class="num">Avg / Occurrence</th><th>Last Seen</th><th></th></tr></thead>
          <tbody>
            ${sorted.map(m => `
              <tr data-mistake-id="${m.id}" style="cursor:pointer;">
                <td><span class="tag red">${esc(m.label)}</span></td>
                <td class="text-2" style="font-size: 12px;">${esc(m.description || '—')}</td>
                <td class="num">${m.count}</td>
                <td class="num ${m.impact < 0 ? 'text-neg' : 'text-pos'}">${m.count ? Compute.fmtMoney(m.impact) : '—'}</td>
                <td class="num">${m.count ? Compute.fmtMoney(m.impact / m.count) : '—'}</td>
                <td class="text-dim">${m.recent || '—'}</td>
                <td><button class="btn btn-icon btn-sm btn-danger" data-action="del-mistake" data-id="${m.id}"><i data-lucide="trash-2"></i></button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    host.querySelector('#add-mistake').addEventListener('click', () => openForm(null));
    host.querySelectorAll('[data-mistake-id]').forEach(r => r.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      const id = r.dataset.mistakeId;
      const m = defs.find(x => x.id === id);
      if (m) {
        // Show linked trades
        const linked = trades.filter(t => (t.mistakes || []).includes(id));
        const body = document.createElement('div');
        if (!linked.length) body.innerHTML = '<div class="text-dim">No trades tagged with this mistake yet.</div>';
        else body.innerHTML = `
          <div class="table-wrap"><table class="table">${TradeRow.header()}<tbody>${linked.map(t => TradeRow.row(t)).join('')}</tbody></table></div>
        `;
        const editBtn = document.createElement('button'); editBtn.className = 'btn'; editBtn.textContent = 'Edit Definition';
        editBtn.addEventListener('click', () => { Modal.close(); openForm(m); });
        const foot = document.createElement('div'); foot.style.marginLeft = 'auto'; foot.appendChild(editBtn);
        Modal.open({ title: m.label, body, footer: foot, width: 920 });
      }
    }));
    host.querySelectorAll('[data-action="del-mistake"]').forEach(b => b.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (await Modal.confirm({ title: 'Delete Mistake Definition', message: 'Trades tagged with this mistake will keep the tag string but lose the label.', okText: 'Delete', danger: true })) {
        Store.update('mistakes', list => list.filter(x => x.id !== b.dataset.id));
      }
    }));
  }

  function openForm(existing) {
    const m = existing ? Object.assign({}, existing) : { id: '', label: '', description: '' };
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-grid">
        <div class="field"><label>ID (Slug)</label><input name="id" value="${esc(m.id)}" required placeholder="chased_breakout" ${existing ? 'readonly' : ''} /></div>
        <div class="field"><label>Label</label><input name="label" value="${esc(m.label)}" required placeholder="Chased breakout" /></div>
        <div class="field full"><label>Description</label><textarea name="description">${esc(m.description)}</textarea></div>
      </div>
    `;
    const cancel = el('button', { class: 'btn btn-ghost', type: 'button' }, 'Cancel');
    const save = el('button', { class: 'btn btn-primary', type: 'submit' }, existing ? 'Save' : 'Add');
    const foot = document.createElement('div'); foot.style.marginLeft = 'auto'; foot.style.display = 'flex'; foot.style.gap = '8px';
    foot.appendChild(cancel); foot.appendChild(save);
    Modal.open({ title: existing ? 'Edit Mistake' : 'New Mistake', body: form, footer: foot, width: 600 });
    cancel.addEventListener('click', () => Modal.close());
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const out = { id: (fd.get('id') || '').toString().trim().toLowerCase().replace(/\s+/g, '_'), label: fd.get('label'), description: fd.get('description') || '' };
      if (!out.id || !out.label) return;
      Store.update('mistakes', list => {
        const i = list.findIndex(x => x.id === out.id);
        if (i >= 0) list[i] = out; else list.push(out);
      });
      Toast.success(existing ? 'Mistake updated' : 'Mistake added');
      Modal.close();
    });
    save.addEventListener('click', () => form.requestSubmit());
  }

  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text) e.textContent = text;
    return e;
  }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { render };
})();
