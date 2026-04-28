window.Tabs = window.Tabs || {};
window.Tabs.patterns = (function () {
  function render(host) {
    const patterns = Store.get('patterns') || [];
    const trades = Store.get('trades') || [];

    host.innerHTML = `
      <div style="display:flex; align-items: center; margin-bottom: 12px;">
        <h2 style="margin:0; font-size: 16px;">Pattern Playbook</h2>
        <div style="margin-left:auto;">
          <button class="btn btn-primary" id="add-pattern"><i data-lucide="plus"></i> New Pattern</button>
        </div>
      </div>

      ${patterns.length ? `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;">
          ${patterns.map(p => card(p, trades)).join('')}
        </div>
      ` : `<div class="empty"><div class="emoji">📚</div><h3>No patterns in your playbook yet</h3><div>Add named setups with rules + ideal/anti examples. Trades you tag with a pattern populate its stats automatically.</div></div>`}
    `;

    if (window.lucide) lucide.createIcons();

    host.querySelector('#add-pattern').addEventListener('click', () => openForm(null));
    host.querySelectorAll('[data-pattern-id]').forEach(c => c.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      const id = c.dataset.patternId;
      const p = patterns.find(x => x.id === id);
      if (p) openForm(p);
    }));
    host.querySelectorAll('[data-action="del-pattern"]').forEach(b => b.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (await Modal.confirm({ title: 'Delete pattern', message: 'Linked trades will keep their pattern_id but the pattern entry will be removed.', okText: 'Delete', danger: true })) {
        Store.update('patterns', list => list.filter(x => x.id !== b.dataset.id));
      }
    }));
  }

  function card(p, trades) {
    const linked = trades.filter(t => t.pattern_id === p.id);
    const totals = Compute.totals(linked);
    return `
      <div class="pattern-card" data-pattern-id="${p.id}" style="cursor:pointer;">
        <div style="display:flex; align-items: center; gap: 8px;">
          <h3 style="margin:0">${esc(p.name || 'Unnamed')}</h3>
          <span class="chip" style="margin-left:auto">${esc((p.bias || 'either').toUpperCase())}</span>
          <button class="btn btn-icon btn-sm btn-danger" data-action="del-pattern" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
        </div>
        <div class="text-2" style="font-size: 13px; line-height: 1.45;">${esc(p.description || '—')}</div>
        ${p.rules ? `<div style="font-size: 12px; color: var(--text-2);"><b>Rules:</b> ${esc(p.rules)}</div>` : ''}
        ${p.invalidation ? `<div style="font-size: 12px; color: var(--text-2);"><b>Invalidation:</b> ${esc(p.invalidation)}</div>` : ''}
        <div class="pat-stats">
          <span>Trades <b>${totals.count}</b></span>
          <span>Win <b>${Compute.fmtPct(totals.winRate)}</b></span>
          <span>P&L <b class="${totals.total >= 0 ? 'text-pos' : 'text-neg'}">${Compute.fmtMoney(totals.total)}</b></span>
          <span>Avg R <b>${Compute.fmtNum(totals.avgR)}</b></span>
        </div>
      </div>
    `;
  }

  function openForm(existing) {
    const p = existing ? JSON.parse(JSON.stringify(existing)) : { id: null, name: '', bias: 'either', description: '', rules: '', invalidation: '', timeframes: [], assets: [] };

    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-grid cols-2">
        <div class="field"><label>Name</label><input name="name" value="${esc(p.name)}" required placeholder="VWAP Reclaim" /></div>
        <div class="field"><label>Bias</label>
          <select name="bias">
            ${['long','short','either'].map(s => `<option ${p.bias === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="field full"><label>Description</label><textarea name="description" placeholder="When does this setup work? Tape conditions, prerequisites, expected behaviour.">${esc(p.description)}</textarea></div>
        <div class="field full"><label>Rules</label><textarea name="rules" placeholder="Entry trigger, stop placement, target, sizing rules.">${esc(p.rules)}</textarea></div>
        <div class="field full"><label>Invalidation</label><textarea name="invalidation" placeholder="What proves this thesis wrong? Where do I bail?">${esc(p.invalidation)}</textarea></div>
        <div class="field"><label>Timeframes (comma-separated)</label><input name="timeframes" value="${esc((p.timeframes || []).join(', '))}" placeholder="1m, 5m, daily" /></div>
        <div class="field"><label>Asset classes (comma-separated)</label><input name="assets" value="${esc((p.assets || []).join(', '))}" placeholder="stock, future" /></div>
      </div>
    `;
    const cancel = el('button', { class: 'btn btn-ghost', type: 'button' }, 'Cancel');
    const save = el('button', { class: 'btn btn-primary', type: 'submit' }, existing ? 'Save' : 'Add');
    const foot = document.createElement('div');
    foot.style.display = 'flex'; foot.style.gap = '8px'; foot.style.marginLeft = 'auto';
    foot.appendChild(cancel); foot.appendChild(save);
    const m = Modal.open({ title: existing ? 'Edit Pattern' : 'New Pattern', body: form, footer: foot, width: 700 });
    cancel.addEventListener('click', () => Modal.close());
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const out = {
        id: existing ? existing.id : Store.uuid(),
        name: fd.get('name'),
        bias: fd.get('bias'),
        description: fd.get('description'),
        rules: fd.get('rules'),
        invalidation: fd.get('invalidation'),
        timeframes: (fd.get('timeframes') || '').toString().split(',').map(s => s.trim()).filter(Boolean),
        assets: (fd.get('assets') || '').toString().split(',').map(s => s.trim()).filter(Boolean)
      };
      Store.update('patterns', list => {
        if (existing) {
          const i = list.findIndex(x => x.id === existing.id);
          if (i >= 0) list[i] = out;
        } else list.push(out);
      });
      Toast.success(existing ? 'Pattern updated' : 'Pattern added');
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
