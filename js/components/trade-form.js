window.TradeForm = (function () {
  // Built-in suggestions, by asset class. Combined with the user's own history
  // (extracted from Store.get('trades')) into a single deduped datalist.
  const COMMON_SYMBOLS = {
    stock:  ['SPY', 'QQQ', 'IWM', 'DIA', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'META', 'AMZN', 'AMD', 'NFLX', 'COIN', 'PLTR'],
    future: ['ES', 'NQ', 'YM', 'RTY', 'MES', 'MNQ', 'GC', 'SI', 'CL', 'NG', 'ZB', 'ZN', 'ZC', 'ZW'],
    crypto: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'DOGEUSD', 'ADAUSD'],
    forex:  ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'XAUUSD', 'XAGUSD'],
    option: []
  };

  // Last N unique symbols the user has logged, most recent first.
  // Empty if the user has no trade history yet.
  function recentSymbols(n) {
    const trades = Store.get('trades') || [];
    const seen = new Set();
    const out = [];
    for (let i = trades.length - 1; i >= 0 && out.length < n; i--) {
      const s = (trades[i].symbol || '').toUpperCase();
      if (s && !seen.has(s)) { seen.add(s); out.push(s); }
    }
    return out;
  }

  function symbolSuggestions(currentClass) {
    const trades = Store.get('trades') || [];
    const seen = new Set();
    const list = [];
    // 1. User's own history first (most recent first)
    for (let i = trades.length - 1; i >= 0; i--) {
      const s = (trades[i].symbol || '').toUpperCase();
      if (s && !seen.has(s)) { seen.add(s); list.push(s); }
    }
    // 2. Built-ins for the active asset class, then everything else
    const order = [currentClass, 'stock', 'future', 'crypto', 'forex'];
    for (const ac of order) {
      for (const s of (COMMON_SYMBOLS[ac] || [])) {
        if (!seen.has(s)) { seen.add(s); list.push(s); }
      }
    }
    return list;
  }

  function open(existing) {
    const isEdit = !!existing;
    const t = existing ? JSON.parse(JSON.stringify(existing)) : freshTrade();
    const tags = Store.get('tags') || {};
    const patterns = Store.get('patterns') || [];
    const mistakes = Store.get('mistakes') || [];
    const symbolList = symbolSuggestions(t.asset_class);

    const recentSyms = recentSymbols(5);

    const form = document.createElement('form');
    form.id = 'trade-form';
    form.innerHTML = `
      <div class="tab-strip" role="tablist">
        <button type="button" class="tab-btn active" data-tab="general" role="tab">General</button>
        <button type="button" class="tab-btn" data-tab="orders" role="tab">Orders</button>
        <button type="button" class="tab-btn" data-tab="journal" role="tab">Journal</button>
      </div>

      <div class="tab-pane active" data-pane="general">
        <div class="form-grid cols-2">
          <div class="field">
            <label>Date</label>
            <input type="date" name="date" value="${t.date || Compute.todayISO()}" required />
          </div>
          <div class="field">
            <label>Asset Class</label>
            <select name="asset_class" id="asset-class">
              ${opt('stock', 'Stock', t.asset_class)}
              ${opt('option', 'Option', t.asset_class)}
              ${opt('future', 'Future', t.asset_class)}
              ${opt('forex', 'Forex / Metal', t.asset_class)}
              ${opt('crypto', 'Crypto', t.asset_class)}
            </select>
          </div>
          <div class="field full">
            <label>Symbol</label>
            ${recentSyms.length ? `
              <div class="recent-symbols" id="recent-symbols">
                ${recentSyms.map(s => `<button type="button" class="recent-chip" data-sym="${esc(s)}">${esc(s)}</button>`).join('')}
              </div>
            ` : ''}
            <input list="symbol-list" name="symbol" placeholder="Start typing — AAPL, ES, BTC..." value="${esc(t.symbol)}" autocomplete="off" required />
            <datalist id="symbol-list">
              ${symbolList.map(s => `<option value="${esc(s)}">`).join('')}
            </datalist>
          </div>
          <div class="field">
            <label>Side</label>
            <div class="seg-toggle" data-name="side">
              <button type="button" class="seg ${(t.side || 'long') === 'long' ? 'active long' : ''}" data-val="long">Buy (Long)</button>
              <button type="button" class="seg ${t.side === 'short' ? 'active short' : ''}" data-val="short">Sell (Short)</button>
              <input type="hidden" name="side" value="${t.side || 'long'}" />
            </div>
          </div>
          <div class="field">
            <label>Style</label>
            <select name="style">
              ${opt('day', 'Day', t.style || 'day')}
              ${opt('swing', 'Swing', t.style)}
              ${opt('position', 'Position', t.style)}
            </select>
          </div>
          <div class="field full">
            <label>Conviction <span class="text-dim conviction-val">${t.conviction || 3} / 5</span></label>
            <input type="range" name="conviction" min="1" max="5" value="${t.conviction || 3}" class="range-slider" />
          </div>
        </div>
      </div>

      <div class="tab-pane" data-pane="orders">
        <div class="fills-section">
          <div class="fills-head">
            <div class="section-title" style="margin: 0;"><i data-lucide="log-in" style="width:14px; height:14px; vertical-align: -2px;"></i> Entries</div>
            <button type="button" class="btn btn-sm" id="add-entry"><i data-lucide="plus"></i> Add Entry</button>
          </div>
          <div class="fills-list" id="entries-list"></div>
        </div>

        <div class="fills-section" style="margin-top: 16px;">
          <div class="fills-head">
            <div class="section-title" style="margin: 0;"><i data-lucide="log-out" style="width:14px; height:14px; vertical-align: -2px;"></i> Exits</div>
            <button type="button" class="btn btn-sm" id="add-exit"><i data-lucide="plus"></i> Add Exit</button>
          </div>
          <div class="fills-list" id="exits-list"></div>
        </div>

        <div class="fills-summary" id="fills-summary"></div>

        <div class="divider"></div>

        <div class="form-grid cols-2">
          <div class="field">
            <label>Stop Loss</label>
            <input type="number" name="stop_loss" step="any" value="${t.stop_loss ?? ''}" />
          </div>
          <div class="field">
            <label>Target</label>
            <input type="number" name="target" step="any" value="${t.target ?? ''}" />
          </div>
          <div class="field">
            <label>Fees ($)</label>
            <input type="number" name="fees" step="any" value="${t.fees ?? 0}" />
          </div>
          <div class="field">
            <label>Catalyst</label>
            <select name="catalyst">
              <option value="">—</option>
              ${(tags.catalysts || []).map(c => opt(c, c, t.catalyst)).join('')}
            </select>
          </div>
          <div class="field">
            <label title="Maximum Adverse Excursion — worst price reached against you during the trade">MAE <span class="text-dim">(Worst Price)</span></label>
            <input type="number" name="mae" step="any" value="${t.mae ?? ''}" placeholder="Worst price hit" />
          </div>
          <div class="field">
            <label title="Maximum Favourable Excursion — best price reached in your favour">MFE <span class="text-dim">(Best Price)</span></label>
            <input type="number" name="mfe" step="any" value="${t.mfe ?? ''}" placeholder="Best price hit" />
          </div>
        </div>

        <div id="asset-specific" style="margin-top: 12px;"></div>
      </div>

      <div class="tab-pane" data-pane="journal">
        <div class="form-grid">
          <div class="field full">
            <label>Setup</label>
            <input list="setup-list" name="setup" value="${esc(t.setup)}" placeholder="vwap_reclaim / orb / etc." />
            <datalist id="setup-list">
              ${(tags.setups || []).map(s => `<option value="${esc(s)}">`).join('')}
            </datalist>
          </div>

          <div class="field full">
            <label>Pattern (Link to Playbook)</label>
            <select name="pattern_id">
              <option value="">—</option>
              ${patterns.map(p => `<option value="${esc(p.id)}" ${t.pattern_id === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
            </select>
          </div>

          <div class="field full">
            <label>Thesis (Why I Took This)</label>
            <textarea name="thesis" placeholder="What's the edge? What invalidates it?">${esc(t.thesis)}</textarea>
          </div>

          <div class="field full">
            <label>Emotions</label>
            <div class="chip-picker" data-multi="emotions">
              ${(tags.emotions || []).map(e => chip(e, e, (t.emotions || []).includes(e))).join('')}
            </div>
          </div>

          <div class="field full">
            <label>Mistakes</label>
            <div class="chip-picker" data-multi="mistakes" data-red="true">
              ${mistakes.map(m => chip(m.id, m.label, (t.mistakes || []).includes(m.id), true)).join('')}
            </div>
          </div>

          <div class="field full">
            <label>Lesson / What to Do Differently</label>
            <textarea name="lesson" placeholder="Key takeaway from this trade...">${esc(t.lesson)}</textarea>
          </div>

          <div class="field full">
            <label>Screenshots</label>
            <div class="dropzone" id="dropzone">Drop chart images here, or click to select. Stored locally as data URLs.</div>
            <input type="file" id="file-input" accept="image/*" multiple style="display:none" />
            <div class="thumbs" id="thumbs"></div>
          </div>
        </div>
      </div>
    `;

    const cancelBtn = el('button', { class: 'btn btn-ghost', type: 'button' }, 'Cancel');
    const saveBtn = el('button', { class: 'btn btn-primary', type: 'submit', form: 'trade-form' }, isEdit ? 'Save' : 'Add Trade');
    if (isEdit) {
      const delBtn = el('button', { class: 'btn btn-danger', type: 'button', style: 'margin-right:auto' }, 'Delete');
      delBtn.addEventListener('click', async () => {
        if (await Modal.confirm({ title: 'Delete Trade', message: 'This cannot be undone.', okText: 'Delete', danger: true })) {
          Store.update('trades', list => list.filter(x => x.id !== existing.id));
          Toast.success('Trade deleted');
          Modal.close();
        }
      });
      var foot = wrapFoot(delBtn, cancelBtn, saveBtn);
    } else {
      var foot = wrapFoot(cancelBtn, saveBtn);
    }

    const m = Modal.open({ title: isEdit ? 'Edit Trade' : 'Add Trade', body: form, footer: foot, width: 760 });

    // State for chip pickers + screenshots + fills
    const state = {
      emotions: [...(t.emotions || [])],
      mistakes: [...(t.mistakes || [])],
      screenshots: [...(t.screenshots || [])],
      entries: seedFills(t, 'entry'),
      exits: seedFills(t, 'exit')
    };

    // Render fills (entries/exits) and the live summary
    const entriesList = form.querySelector('#entries-list');
    const exitsList = form.querySelector('#exits-list');
    const summary = form.querySelector('#fills-summary');
    function renderFills() {
      entriesList.innerHTML = state.entries.map((e, i) => fillRow('entry', e, i, state.entries.length === 1)).join('');
      exitsList.innerHTML = state.exits.map((e, i) => fillRow('exit', e, i, state.exits.length === 1)).join('');
      wireFillRows();
      renderSummary();
      if (window.lucide) lucide.createIcons();
    }
    function wireFillRows() {
      form.querySelectorAll('.fill-row input').forEach(inp => {
        inp.addEventListener('input', () => {
          const row = inp.closest('.fill-row');
          const kind = row.dataset.kind;
          const i = +row.dataset.idx;
          const field = inp.dataset.field;
          state[kind === 'entry' ? 'entries' : 'exits'][i][field] = inp.value;
          renderSummary();
        });
      });
      form.querySelectorAll('.fill-row .remove-fill').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('.fill-row');
          const kind = row.dataset.kind;
          const i = +row.dataset.idx;
          state[kind === 'entry' ? 'entries' : 'exits'].splice(i, 1);
          renderFills();
        });
      });
    }
    function renderSummary() {
      const draft = { side: form.querySelector('[name="side"]')?.value || 'long', asset_class: form.querySelector('[name="asset_class"]')?.value || 'stock', entries: state.entries, exits: state.exits, asset_specific: t.asset_specific };
      const ae = Compute.avgEntry(draft);
      const ax = Compute.avgExit(draft);
      const sz = Compute.totalSize(draft);
      const gross = Compute.computeGross(draft);
      const tone = gross > 0 ? 'text-pos' : gross < 0 ? 'text-neg' : 'text-dim';
      summary.innerHTML = ae != null && ax != null && sz ? `
        <div class="fills-summary-row">
          <span><span class="text-dim">Avg Entry:</span> <strong class="num">${ae.toFixed(4).replace(/\.?0+$/,'')}</strong></span>
          <span><span class="text-dim">Avg Exit:</span> <strong class="num">${ax.toFixed(4).replace(/\.?0+$/,'')}</strong></span>
          <span><span class="text-dim">Size:</span> <strong class="num">${sz}</strong></span>
          <span style="margin-left:auto;"><span class="text-dim">Projected P&L:</span> <strong class="num ${tone}">${Compute.fmtMoney(gross)}</strong></span>
        </div>
      ` : `<div class="text-dim" style="font-size: 12px; padding: 6px 0;">Add at least one entry and one exit to see your projected P&L.</div>`;
    }
    renderFills();
    form.querySelector('#add-entry').addEventListener('click', () => {
      state.entries.push({ price: '', size: '', time: Compute.nowTime() });
      renderFills();
    });
    form.querySelector('#add-exit').addEventListener('click', () => {
      state.exits.push({ price: '', size: '', time: Compute.nowTime() });
      renderFills();
    });
    // Tab switching
    form.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        form.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        form.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === target));
      });
    });

    // Side seg-toggle (Buy/Sell pills) — sync to hidden input
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

    // Conviction slider — live label
    const convInp = form.querySelector('input[name="conviction"]');
    const convVal = form.querySelector('.conviction-val');
    if (convInp && convVal) {
      convInp.addEventListener('input', () => { convVal.textContent = `${convInp.value} / 5`; });
    }

    // Recent symbol chips — autofill symbol input on tap
    form.querySelectorAll('.recent-chip').forEach(c => {
      c.addEventListener('click', () => {
        const inp = form.querySelector('input[name="symbol"]');
        if (inp) { inp.value = c.dataset.sym; inp.dispatchEvent(new Event('input', { bubbles: true })); }
      });
    });

    form.querySelector('#asset-class').addEventListener('change', renderSummary);
    const thumbs = form.querySelector('#thumbs');
    function renderThumbs() {
      thumbs.innerHTML = state.screenshots.map((src, i) =>
        `<div class="thumb" style="background-image:url('${src}')"><span class="x" data-i="${i}">×</span></div>`
      ).join('');
      thumbs.querySelectorAll('.x').forEach(x => x.addEventListener('click', () => {
        state.screenshots.splice(+x.dataset.i, 1); renderThumbs();
      }));
    }
    renderThumbs();

    form.querySelectorAll('.chip-picker .pick').forEach(p => {
      p.addEventListener('click', () => {
        const wrap = p.closest('.chip-picker');
        const key = wrap.dataset.multi;
        const v = p.dataset.value;
        const idx = state[key].indexOf(v);
        if (idx >= 0) state[key].splice(idx, 1); else state[key].push(v);
        p.classList.toggle('active');
        if (wrap.dataset.red) p.classList.toggle('red', p.classList.contains('active'));
      });
    });

    // Asset-specific renderer
    const acSel = form.querySelector('#asset-class');
    const acHost = form.querySelector('#asset-specific');
    function renderAssetSpecific() {
      const ac = acSel.value;
      const a = (t.asset_specific || {})[ac] || {};
      if (ac === 'option') {
        acHost.innerHTML = `
          <div class="section-title">Option specifics</div>
          <div class="form-grid cols-4">
            <div class="field"><label>Strike</label><input name="opt_strike" type="number" step="any" value="${a.strike ?? ''}" /></div>
            <div class="field"><label>Expiry</label><input name="opt_expiry" type="date" value="${a.expiry || ''}" /></div>
            <div class="field"><label>Type</label><select name="opt_type">${opt('call','Call',a.type)}${opt('put','Put',a.type)}${opt('spread','Spread',a.type)}</select></div>
            <div class="field"><label>IV @ entry</label><input name="opt_iv" type="number" step="any" value="${a.iv_entry ?? ''}" /></div>
            <div class="field"><label>Δ @ entry</label><input name="opt_delta" type="number" step="any" value="${a.delta_entry ?? ''}" /></div>
          </div>`;
      } else if (ac === 'future') {
        acHost.innerHTML = `
          <div class="section-title">Future specifics</div>
          <div class="form-grid cols-4">
            <div class="field"><label>Contract</label><input name="fut_contract" placeholder="ESM6 / NQU6" value="${esc(a.contract)}" /></div>
            <div class="field"><label>Tick value $</label><input name="fut_tick_value" type="number" step="any" value="${a.tick_value ?? ''}" /></div>
            <div class="field"><label>Tick size</label><input name="fut_tick_size" type="number" step="any" value="${a.tick_size ?? ''}" /></div>
            <div class="field"><label>Ticks captured</label><input name="fut_ticks" type="number" step="any" value="${a.ticks ?? ''}" /></div>
          </div>`;
      } else if (ac === 'crypto') {
        acHost.innerHTML = `
          <div class="section-title">Crypto specifics</div>
          <div class="form-grid cols-4">
            <div class="field"><label>Pair</label><input name="cry_pair" placeholder="BTC/USDT" value="${esc(a.pair)}" /></div>
            <div class="field"><label>Exchange</label><input name="cry_exchange" placeholder="Binance / Coinbase" value="${esc(a.exchange)}" /></div>
            <div class="field"><label>Leverage</label><input name="cry_leverage" type="number" step="any" value="${a.leverage ?? ''}" /></div>
            <div class="field"><label>Perp?</label><select name="cry_perp">${opt('false','Spot', a.perp ? 'true':'false')}${opt('true','Perp', a.perp ? 'true':'false')}</select></div>
          </div>`;
      } else {
        acHost.innerHTML = '';
      }
    }
    renderAssetSpecific();
    acSel.addEventListener('change', renderAssetSpecific);

    // Drop zone
    const dz = form.querySelector('#dropzone');
    const fi = form.querySelector('#file-input');
    dz.addEventListener('click', () => fi.click());
    fi.addEventListener('change', e => addFiles(e.target.files));
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
    dz.addEventListener('drop', e => addFiles(e.dataTransfer.files));

    function addFiles(files) {
      Array.from(files || []).forEach(f => {
        if (!f.type.startsWith('image/')) return;
        const r = new FileReader();
        r.onload = () => { state.screenshots.push(r.result); renderThumbs(); };
        r.readAsDataURL(f);
      });
    }

    cancelBtn.addEventListener('click', () => Modal.close());

    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = Object.fromEntries(fd);
      const cleanEntries = state.entries.map(e => ({ price: num(e.price), size: num(e.size), time: e.time || null })).filter(e => isFinite(e.price) && e.price > 0 && isFinite(e.size) && e.size > 0);
      const cleanExits = state.exits.map(e => ({ price: num(e.price), size: num(e.size), time: e.time || null })).filter(e => isFinite(e.price) && e.price > 0 && isFinite(e.size) && e.size > 0);
      if (!cleanEntries.length || !cleanExits.length) {
        Toast.error('Add at least one entry and one exit (price + size).');
        return;
      }
      const totalEntrySize = cleanEntries.reduce((s, e) => s + e.size, 0);
      const totalExitSize = cleanExits.reduce((s, e) => s + e.size, 0);
      const matchedSize = Math.min(totalEntrySize, totalExitSize);
      const wAvgEntry = cleanEntries.reduce((s, e) => s + e.price * e.size, 0) / totalEntrySize;
      const wAvgExit = cleanExits.reduce((s, e) => s + e.price * e.size, 0) / totalExitSize;
      const firstEntryTime = cleanEntries.map(e => e.time).filter(Boolean).sort()[0] || null;
      const lastExitTime = cleanExits.map(e => e.time).filter(Boolean).sort().slice(-1)[0] || null;

      const out = {
        id: existing ? existing.id : Store.uuid(),
        date: data.date,
        asset_class: data.asset_class,
        symbol: (data.symbol || '').toUpperCase().trim(),
        side: data.side,
        style: data.style,
        entries: cleanEntries,
        exits: cleanExits,
        entry_time: firstEntryTime,
        exit_time: lastExitTime,
        entry_price: wAvgEntry,
        exit_price: wAvgExit,
        size: matchedSize,
        stop_loss: num(data.stop_loss, true),
        target: num(data.target, true),
        mae: num(data.mae, true),
        mfe: num(data.mfe, true),
        fees: num(data.fees, true) || 0,
        setup: data.setup || '',
        pattern_id: data.pattern_id || null,
        thesis: data.thesis || '',
        conviction: parseInt(data.conviction || 3, 10),
        catalyst: data.catalyst || null,
        emotions: state.emotions,
        mistakes: state.mistakes,
        lesson: data.lesson || '',
        screenshots: state.screenshots,
        asset_specific: {}
      };
      if (out.asset_class === 'option') {
        out.asset_specific.option = {
          strike: num(data.opt_strike, true),
          expiry: data.opt_expiry || null,
          type: data.opt_type || null,
          iv_entry: num(data.opt_iv, true),
          delta_entry: num(data.opt_delta, true)
        };
      } else if (out.asset_class === 'future') {
        out.asset_specific.future = {
          contract: data.fut_contract || null,
          tick_value: num(data.fut_tick_value, true),
          tick_size: num(data.fut_tick_size, true),
          ticks: num(data.fut_ticks, true)
        };
      } else if (out.asset_class === 'crypto') {
        out.asset_specific.crypto = {
          pair: data.cry_pair || null,
          exchange: data.cry_exchange || null,
          leverage: num(data.cry_leverage, true),
          perp: data.cry_perp === 'true'
        };
      }
      out.gross_pnl = Compute.computeGross(out);
      out.net_pnl = out.gross_pnl - (out.fees || 0);
      out.r_multiple = Compute.rMultiple(out);

      // Auto-add new setup/catalyst to tags
      Store.update('tags', tg => {
        if (out.setup && !(tg.setups || []).includes(out.setup)) (tg.setups = tg.setups || []).push(out.setup);
        if (out.catalyst && !(tg.catalysts || []).includes(out.catalyst)) (tg.catalysts = tg.catalysts || []).push(out.catalyst);
      });

      Store.update('trades', list => {
        if (existing) {
          const i = list.findIndex(x => x.id === existing.id);
          if (i >= 0) list[i] = out;
        } else {
          list.push(out);
        }
      });
      Toast.success(existing ? 'Trade updated' : 'Trade added');
      Modal.close();
    });
  }

  function freshTrade() {
    return {
      id: null, date: Compute.todayISO(), asset_class: 'stock', symbol: '',
      side: 'long', style: 'day', entry_time: Compute.nowTime(), exit_time: null,
      entries: [], exits: [],
      entry_price: null, exit_price: null, size: null,
      stop_loss: null, target: null, mae: null, mfe: null, fees: 0,
      setup: '', pattern_id: null, thesis: '', conviction: 3, catalyst: null,
      emotions: [], mistakes: [], lesson: '', screenshots: [],
      asset_specific: {}
    };
  }

  // Seed entries/exits state from a trade (existing or fresh).
  // Migrates legacy single-fill trades on the fly so the form always edits arrays.
  function seedFills(t, kind) {
    const arr = kind === 'entry' ? t.entries : t.exits;
    if (Array.isArray(arr) && arr.length) {
      return arr.map(f => ({ price: f.price ?? '', size: f.size ?? '', time: f.time || '' }));
    }
    const price = kind === 'entry' ? t.entry_price : t.exit_price;
    const time = kind === 'entry' ? t.entry_time : t.exit_time;
    if (price != null || t.size != null) {
      return [{ price: price ?? '', size: t.size ?? '', time: time || '' }];
    }
    return [{ price: '', size: '', time: kind === 'entry' ? Compute.nowTime() : '' }];
  }

  function fillRow(kind, f, idx, isOnly) {
    const label = kind === 'entry' ? 'Entry' : 'Exit';
    return `
      <div class="fill-row" data-kind="${kind}" data-idx="${idx}">
        <div class="fill-label">${label} ${idx + 1}</div>
        <div class="fill-fields">
          <input type="number" step="any" data-field="price" placeholder="Price" value="${f.price ?? ''}" />
          <input type="number" step="any" data-field="size" placeholder="Size" value="${f.size ?? ''}" />
          <input type="time" data-field="time" value="${f.time || ''}" />
        </div>
        <button type="button" class="btn btn-icon btn-sm btn-danger remove-fill" ${isOnly ? 'style="visibility:hidden"' : ''} aria-label="Remove ${label}"><i data-lucide="x"></i></button>
      </div>
    `;
  }

  function num(v, allowEmpty = false) {
    if (v === '' || v == null) return allowEmpty ? null : 0;
    const n = Number(v);
    return isFinite(n) ? n : (allowEmpty ? null : 0);
  }
  function opt(v, label, sel) { return `<option value="${esc(v)}" ${sel === v ? 'selected' : ''}>${esc(label)}</option>`; }
  function chip(value, label, active, red) {
    return `<span class="pick${active ? ' active' : ''}${red && active ? ' red' : ''}" data-value="${esc(value)}">${esc(label)}</span>`;
  }
  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text) e.textContent = text;
    return e;
  }
  function wrapFoot(...kids) {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex'; wrap.style.gap = '8px'; wrap.style.width = '100%';
    kids.forEach(k => wrap.appendChild(k));
    return wrap;
  }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { open };
})();
