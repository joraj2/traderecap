window.TradeRow = (function () {
  function row(t) {
    const p = Compute.pnl(t);
    const r = Compute.rMultiple(t);
    const rTxt = r != null ? r.toFixed(2) + 'R' : '–';
    const ac = assetClassChip(t.asset_class);
    const sideCls = t.side === 'short' ? 'short' : 'long';
    return `
      <tr data-trade-id="${t.id}" class="trade-row">
        <td class="num text-dim">${t.date}${t.entry_time ? ' <span class="text-dim">' + t.entry_time + '</span>' : ''}</td>
        <td><strong>${esc(t.symbol || '')}</strong> ${ac}</td>
        <td><span class="tag ${sideCls}">${(t.side || '').toUpperCase()}</span></td>
        <td>${esc(t.setup || '')}</td>
        <td class="num">${fmt(t.entry_price)}</td>
        <td class="num">${fmt(t.exit_price)}</td>
        <td class="num">${t.size || ''}</td>
        <td class="num ${p >= 0 ? 'text-pos' : 'text-neg'}"><strong>${Compute.fmtMoney(p)}</strong></td>
        <td class="num ${r != null && r >= 0 ? 'text-pos' : (r != null ? 'text-neg' : 'text-dim')}">${rTxt}</td>
      </tr>
    `;
  }

  function detail(t) {
    const shots = (t.screenshots || []).map(src => `<img src="${escAttr(src)}" alt="screenshot" />`).join('');
    const tags = [];
    if (t.pattern_id && Store.get('patterns').find(p => p.id === t.pattern_id)) {
      tags.push(`<span class="tag">${esc(Store.get('patterns').find(p => p.id === t.pattern_id).name)}</span>`);
    }
    if (t.catalyst) tags.push(`<span class="tag">${esc(t.catalyst)}</span>`);
    (t.emotions || []).forEach(e => tags.push(`<span class="tag">${esc(e)}</span>`));
    (t.mistakes || []).forEach(m => {
      const obj = (Store.get('mistakes') || []).find(x => x.id === m);
      tags.push(`<span class="tag red">${esc(obj ? obj.label : m)}</span>`);
    });
    const fields = assetSpecificFields(t);
    return `
      <tr class="trade-detail-row"><td colspan="9" style="padding:0;">
        <div class="trade-detail">
          <div>
            <h4>Thesis</h4>
            <p>${esc(t.thesis || '—')}</p>
            <h4>Lesson / Reflection</h4>
            <p>${esc(t.lesson || '—')}</p>
            ${shots ? `<h4>Screenshots</h4><div class="shots">${shots}</div>` : ''}
          </div>
          <div>
            <h4>Meta</h4>
            <p class="text-2">
              ${t.style ? `<div><span class="text-dim">Style:</span> ${esc(t.style)}</div>` : ''}
              ${t.exit_time ? `<div><span class="text-dim">Exit:</span> ${esc(t.exit_time)}</div>` : ''}
              ${t.stop_loss ? `<div><span class="text-dim">Stop:</span> ${fmt(t.stop_loss)}</div>` : ''}
              ${t.target ? `<div><span class="text-dim">Target:</span> ${fmt(t.target)}</div>` : ''}
              ${t.fees ? `<div><span class="text-dim">Fees:</span> $${Number(t.fees).toFixed(2)}</div>` : ''}
              ${t.conviction ? `<div><span class="text-dim">Conviction:</span> ${'★'.repeat(t.conviction)}</div>` : ''}
              ${fields}
            </p>
            ${tags.length ? `<h4>Tags</h4><div style="display:flex; flex-wrap: wrap; gap: 4px;">${tags.join('')}</div>` : ''}
            <div style="margin-top:12px; display:flex; gap: 6px;">
              <button class="btn btn-sm" data-action="edit-trade" data-id="${t.id}"><i data-lucide="pencil"></i> Edit</button>
              <button class="btn btn-sm btn-danger" data-action="delete-trade" data-id="${t.id}"><i data-lucide="trash-2"></i> Delete</button>
            </div>
          </div>
        </div>
      </td></tr>
    `;
  }

  function assetSpecificFields(t) {
    const a = t.asset_specific || {};
    if (t.asset_class === 'option' && a.option) {
      const o = a.option;
      return `
        <div><span class="text-dim">Strike:</span> ${o.strike || '–'}</div>
        <div><span class="text-dim">Expiry:</span> ${o.expiry || '–'}</div>
        <div><span class="text-dim">Type:</span> ${o.type || '–'}</div>
        ${o.iv_entry ? `<div><span class="text-dim">IV:</span> ${o.iv_entry}</div>` : ''}
        ${o.delta_entry ? `<div><span class="text-dim">Δ:</span> ${o.delta_entry}</div>` : ''}
      `;
    }
    if (t.asset_class === 'future' && a.future) {
      const f = a.future;
      return `
        <div><span class="text-dim">Contract:</span> ${f.contract || '–'}</div>
        ${f.tick_value ? `<div><span class="text-dim">Tick $:</span> ${f.tick_value}</div>` : ''}
        ${f.ticks ? `<div><span class="text-dim">Ticks:</span> ${f.ticks}</div>` : ''}
      `;
    }
    if (t.asset_class === 'crypto' && a.crypto) {
      const c = a.crypto;
      return `
        <div><span class="text-dim">Pair:</span> ${esc(c.pair || '')}</div>
        <div><span class="text-dim">Exchange:</span> ${esc(c.exchange || '')}</div>
        ${c.leverage ? `<div><span class="text-dim">Leverage:</span> ${c.leverage}x${c.perp ? ' (perp)' : ''}</div>` : ''}
      `;
    }
    return '';
  }

  function assetClassChip(ac) {
    const map = { stock: 'STK', option: 'OPT', future: 'FUT', crypto: 'CRY' };
    return `<span class="chip">${map[ac] || ac || '–'}</span>`;
  }

  function fmt(v) { if (v == null || v === '') return '–'; return Number(v).toLocaleString(undefined, { maximumFractionDigits: 4 }); }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function escAttr(s) { return esc(s); }

  function header() {
    return `
      <thead>
        <tr>
          <th>Date / Time</th>
          <th>Symbol</th>
          <th>Side</th>
          <th>Setup</th>
          <th class="num">Entry</th>
          <th class="num">Exit</th>
          <th class="num">Size</th>
          <th class="num">P&amp;L</th>
          <th class="num">R</th>
        </tr>
      </thead>
    `;
  }

  return { row, detail, header };
})();
