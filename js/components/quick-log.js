// Quick Log — 4-field flash form for lazy journaling.
// Symbol + Side + Entry + Exit + Size, all on one screen, ~10s to save.
// Sets sensible defaults (today, day style, conviction 3) and can hand off to
// the full TradeForm if the user wants to add thesis/lesson/screenshots.
window.QuickLog = (function () {
  function inferAssetClass(symbol) {
    const s = (symbol || '').toUpperCase();
    if (/^(BTC|ETH|SOL|BNB|XRP|DOGE|ADA|AVAX|MATIC|DOT|LINK|LTC|TRX|ATOM)/.test(s)) return 'crypto';
    if (/^(XAU|XAG|EUR|GBP|USD|AUD|NZD|CAD|JPY|CHF)/.test(s)) return 'forex';
    if (/^(ES|NQ|YM|RTY|MES|MNQ|GC|SI|CL|NG|ZB|ZN|ZC|ZW)/.test(s) && s.length <= 4) return 'future';
    return 'stock';
  }

  function recentSymbols(n) {
    const trades = Store.get('trades') || [];
    const seen = new Set();
    const out = [];
    for (let i = trades.length - 1; i >= 0 && out.length < n; i--) {
      const sy = (trades[i].symbol || '').toUpperCase();
      if (sy && !seen.has(sy)) { seen.add(sy); out.push(sy); }
    }
    return out;
  }

  function open() {
    const recent = recentSymbols(6);
    const form = document.createElement('form');
    form.id = 'quick-log-form';
    form.className = 'quick-log';
    form.innerHTML = `
      <div class="quick-log-hint">Just the basics. You can add notes, mistakes, and screenshots later.</div>

      ${recent.length ? `
        <div class="recent-symbols" id="ql-recent">
          ${recent.map(s => `<button type="button" class="recent-chip" data-sym="${esc(s)}">${esc(s)}</button>`).join('')}
        </div>
      ` : ''}

      <div class="field full">
        <label>Symbol</label>
        <input name="symbol" placeholder="XAUUSD, BTCUSDT, AAPL..." autocomplete="off" required />
      </div>

      <div class="field full">
        <label>Side</label>
        <div class="seg-toggle" data-name="side">
          <button type="button" class="seg active long" data-val="long">Buy (Long)</button>
          <button type="button" class="seg" data-val="short">Sell (Short)</button>
          <input type="hidden" name="side" value="long" />
        </div>
      </div>

      <div class="quick-log-row">
        <div class="field">
          <label>Entry</label>
          <input name="entry_price" type="number" inputmode="decimal" step="any" required />
        </div>
        <div class="field">
          <label>Exit</label>
          <input name="exit_price" type="number" inputmode="decimal" step="any" required />
        </div>
        <div class="field">
          <label>Size</label>
          <input name="size" type="number" inputmode="decimal" step="any" required />
        </div>
      </div>

      <div class="quick-log-row">
        <div class="field">
          <label>Stop Loss <span class="text-dim">(opt.)</span></label>
          <input name="stop_loss" type="number" inputmode="decimal" step="any" />
        </div>
        <div class="field">
          <label>Fees <span class="text-dim">(opt.)</span></label>
          <input name="fees" type="number" inputmode="decimal" step="any" placeholder="0" />
        </div>
      </div>

      <div class="ql-summary" id="ql-summary"></div>
    `;

    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'btn btn-ghost';
    moreBtn.style.marginRight = 'auto';
    moreBtn.innerHTML = '<i data-lucide="settings-2"></i> More Fields';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn btn-ghost';
    cancel.textContent = 'Cancel';

    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'btn btn-primary';
    save.setAttribute('form', 'quick-log-form');
    save.textContent = 'Save Trade';

    const foot = document.createElement('div');
    foot.style.display = 'flex';
    foot.style.gap = '8px';
    foot.style.width = '100%';
    foot.appendChild(moreBtn);
    foot.appendChild(cancel);
    foot.appendChild(save);

    const m = Modal.open({ title: 'Quick Log', body: form, footer: foot, width: 480 });
    if (window.lucide) lucide.createIcons();

    // Wire side toggle
    const sideHidden = form.querySelector('input[type="hidden"][name="side"]');
    form.querySelectorAll('.seg-toggle .seg').forEach(s => {
      s.addEventListener('click', () => {
        const v = s.dataset.val;
        sideHidden.value = v;
        s.closest('.seg-toggle').querySelectorAll('.seg').forEach(x => {
          x.classList.toggle('active', x === s);
          x.classList.toggle('long', x === s && v === 'long');
          x.classList.toggle('short', x === s && v === 'short');
        });
        renderSummary();
      });
    });

    // Recent symbol chips
    form.querySelectorAll('.recent-chip').forEach(c => {
      c.addEventListener('click', () => {
        const inp = form.querySelector('input[name="symbol"]');
        inp.value = c.dataset.sym;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    // Live projected P&L summary
    const sumEl = form.querySelector('#ql-summary');
    function renderSummary() {
      const e = parseFloat(form.elements.entry_price.value);
      const x = parseFloat(form.elements.exit_price.value);
      const s = parseFloat(form.elements.size.value);
      if (!isFinite(e) || !isFinite(x) || !isFinite(s) || s <= 0) {
        sumEl.innerHTML = '';
        return;
      }
      const dir = sideHidden.value === 'short' ? -1 : 1;
      const fees = parseFloat(form.elements.fees.value) || 0;
      const gross = (x - e) * s * dir;
      const net = gross - fees;
      const tone = net > 0 ? 'text-pos' : net < 0 ? 'text-neg' : 'text-dim';
      sumEl.innerHTML = `
        <div class="ql-summary-row">
          <span class="text-dim">Projected P&amp;L</span>
          <strong class="num ${tone}">${Compute.fmtMoney(net)}</strong>
        </div>
      `;
    }
    form.addEventListener('input', renderSummary);

    cancel.addEventListener('click', () => Modal.close());

    moreBtn.addEventListener('click', () => {
      // Hand off whatever's been entered so far to the full TradeForm
      const partial = collect(form);
      Modal.close();
      TradeForm.open({
        id: null,
        date: Compute.todayISO(),
        asset_class: inferAssetClass(partial.symbol),
        symbol: partial.symbol || '',
        side: partial.side || 'long',
        style: 'day',
        entry_time: Compute.nowTime(),
        exit_time: Compute.nowTime(),
        entries: partial.entry_price && partial.size ? [{ price: partial.entry_price, size: partial.size, time: Compute.nowTime() }] : [],
        exits: partial.exit_price && partial.size ? [{ price: partial.exit_price, size: partial.size, time: Compute.nowTime() }] : [],
        entry_price: partial.entry_price ?? null,
        exit_price: partial.exit_price ?? null,
        size: partial.size ?? null,
        stop_loss: partial.stop_loss ?? null,
        target: null, mae: null, mfe: null,
        fees: partial.fees ?? 0,
        setup: '', pattern_id: null, thesis: '', conviction: 3, catalyst: null,
        emotions: [], mistakes: [], lesson: '', screenshots: [],
        asset_specific: {}
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = collect(form);
      if (!data.symbol || !isFinite(data.entry_price) || !isFinite(data.exit_price) || !isFinite(data.size) || data.size <= 0) {
        Toast.error('Fill in symbol, entry, exit, and size.');
        return;
      }
      const ac = inferAssetClass(data.symbol);
      const now = Compute.nowTime();
      const trade = {
        id: Store.uuid(),
        date: Compute.todayISO(),
        asset_class: ac,
        symbol: data.symbol,
        side: data.side || 'long',
        style: 'day',
        entries: [{ price: data.entry_price, size: data.size, time: now }],
        exits: [{ price: data.exit_price, size: data.size, time: now }],
        entry_time: now, exit_time: now,
        entry_price: data.entry_price,
        exit_price: data.exit_price,
        size: data.size,
        stop_loss: data.stop_loss ?? null,
        target: null, mae: null, mfe: null,
        fees: data.fees ?? 0,
        setup: '', pattern_id: null, thesis: '',
        conviction: 3, catalyst: null,
        emotions: [], mistakes: [], lesson: '', screenshots: [],
        asset_specific: {}
      };
      trade.gross_pnl = Compute.computeGross(trade);
      trade.net_pnl = trade.gross_pnl - (trade.fees || 0);
      trade.r_multiple = Compute.rMultiple(trade);
      Store.update('trades', list => { list.push(trade); });
      Toast.success(`Logged ${trade.symbol} ${Compute.fmtMoney(trade.net_pnl)}`);
      Modal.close();
    });
  }

  function collect(form) {
    const fd = new FormData(form);
    return {
      symbol: (fd.get('symbol') || '').toString().toUpperCase().trim(),
      side: fd.get('side'),
      entry_price: numOrNull(fd.get('entry_price')),
      exit_price: numOrNull(fd.get('exit_price')),
      size: numOrNull(fd.get('size')),
      stop_loss: numOrNull(fd.get('stop_loss')),
      fees: numOrNull(fd.get('fees'))
    };
  }
  function numOrNull(v) {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
  }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { open };
})();
