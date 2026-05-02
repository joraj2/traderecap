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

    const form = document.createElement('form');
    form.id = 'trade-form';
    form.innerHTML = `
      <div class="form-grid cols-3">
        <div class="field">
          <label>Date</label>
          <input type="date" name="date" value="${t.date || Compute.todayISO()}" required />
        </div>
        <div class="field">
          <label>Symbol</label>
          <input list="symbol-list" name="symbol" placeholder="Start typing — AAPL, ES, BTC..." value="${esc(t.symbol)}" autocomplete="off" required />
          <datalist id="symbol-list">
            ${symbolList.map(s => `<option value="${esc(s)}">`).join('')}
          </datalist>
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

        <div class="field">
          <label>Side</label>
          <select name="side">
            ${opt('long', 'Long', t.side || 'long')}
            ${opt('short', 'Short', t.side)}
          </select>
        </div>
        <div class="field">
          <label>Style</label>
          <select name="style">
            ${opt('day', 'Day', t.style || 'day')}
            ${opt('swing', 'Swing', t.style)}
            ${opt('position', 'Position', t.style)}
          </select>
        </div>
        <div class="field">
          <label>Conviction (1-5)</label>
          <input type="number" name="conviction" min="1" max="5" value="${t.conviction || 3}" />
        </div>

        <div class="field">
          <label>Entry Time</label>
          <input type="time" name="entry_time" value="${t.entry_time || ''}" />
        </div>
        <div class="field">
          <label>Exit Time</label>
          <input type="time" name="exit_time" value="${t.exit_time || ''}" />
        </div>
        <div class="field">
          <label>Size</label>
          <input type="number" name="size" step="any" value="${t.size ?? ''}" required />
        </div>

        <div class="field">
          <label>Entry Price</label>
          <input type="number" name="entry_price" step="any" value="${t.entry_price ?? ''}" required />
        </div>
        <div class="field">
          <label>Exit Price</label>
          <input type="number" name="exit_price" step="any" value="${t.exit_price ?? ''}" required />
        </div>
        <div class="field">
          <label>Fees ($)</label>
          <input type="number" name="fees" step="any" value="${t.fees ?? 0}" />
        </div>

        <div class="field">
          <label>Stop Loss</label>
          <input type="number" name="stop_loss" step="any" value="${t.stop_loss ?? ''}" />
        </div>
        <div class="field">
          <label>Target</label>
          <input type="number" name="target" step="any" value="${t.target ?? ''}" />
        </div>
        <div class="field">
          <label>Catalyst</label>
          <select name="catalyst">
            <option value="">—</option>
            ${(tags.catalysts || []).map(c => opt(c, c, t.catalyst)).join('')}
          </select>
        </div>
      </div>

      <div id="asset-specific" style="margin-top: 12px;"></div>

      <div class="divider"></div>

      <div class="form-grid">
        <div class="field full">
          <label>Setup</label>
          <input list="setup-list" name="setup" value="${esc(t.setup)}" placeholder="vwap_reclaim / orb / etc." />
          <datalist id="setup-list">
            ${(tags.setups || []).map(s => `<option value="${esc(s)}">`).join('')}
          </datalist>
        </div>

        <div class="field full">
          <label>Pattern (link to Playbook)</label>
          <select name="pattern_id">
            <option value="">—</option>
            ${patterns.map(p => `<option value="${esc(p.id)}" ${t.pattern_id === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
          </select>
        </div>

        <div class="field full">
          <label>Thesis (why I took this)</label>
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
          <label>Lesson / What to do differently</label>
          <textarea name="lesson" placeholder="Key takeaway from this trade...">${esc(t.lesson)}</textarea>
        </div>

        <div class="field full">
          <label>Screenshots</label>
          <div class="dropzone" id="dropzone">Drop chart images here, or click to select. Stored locally as data URLs.</div>
          <input type="file" id="file-input" accept="image/*" multiple style="display:none" />
          <div class="thumbs" id="thumbs"></div>
        </div>
      </div>
    `;

    const cancelBtn = el('button', { class: 'btn btn-ghost', type: 'button' }, 'Cancel');
    const saveBtn = el('button', { class: 'btn btn-primary', type: 'submit', form: 'trade-form' }, isEdit ? 'Save' : 'Add Trade');
    if (isEdit) {
      const delBtn = el('button', { class: 'btn btn-danger', type: 'button', style: 'margin-right:auto' }, 'Delete');
      delBtn.addEventListener('click', async () => {
        if (await Modal.confirm({ title: 'Delete trade', message: 'This cannot be undone.', okText: 'Delete', danger: true })) {
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

    // State for chip pickers + screenshots
    const state = {
      emotions: [...(t.emotions || [])],
      mistakes: [...(t.mistakes || [])],
      screenshots: [...(t.screenshots || [])]
    };
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
      const out = {
        id: existing ? existing.id : Store.uuid(),
        date: data.date,
        asset_class: data.asset_class,
        symbol: (data.symbol || '').toUpperCase().trim(),
        side: data.side,
        style: data.style,
        entry_time: data.entry_time || null,
        exit_time: data.exit_time || null,
        entry_price: num(data.entry_price),
        exit_price: num(data.exit_price),
        size: num(data.size),
        stop_loss: num(data.stop_loss, true),
        target: num(data.target, true),
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
      entry_price: null, exit_price: null, size: null,
      stop_loss: null, target: null, fees: 0,
      setup: '', pattern_id: null, thesis: '', conviction: 3, catalyst: null,
      emotions: [], mistakes: [], lesson: '', screenshots: [],
      asset_specific: {}
    };
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
