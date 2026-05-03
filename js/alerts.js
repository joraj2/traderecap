// Price alerts — polls free public APIs while the app is open and fires
// a local notification when a target is hit.
//
// Coverage caveat (intentionally surfaced in the UI):
//   - Crypto pairs (BTCUSDT, ETHUSDT, ...): Binance public ticker — reliable
//   - Forex / metals / stocks: Yahoo Finance — best effort, can be flaky/rate-limited
// Background polling is NOT supported. The app must be open.
window.Alerts = (function () {
  let pollHandle = null;
  const POLL_MS = 60 * 1000;

  function getAll() {
    return Store.get('alerts') || [];
  }

  function add(alert) {
    Store.update('alerts', list => { list.push(alert); });
  }

  function remove(id) {
    Store.update('alerts', list => list.filter(a => a.id !== id));
  }

  function update(id, patch) {
    Store.update('alerts', list => {
      const a = list.find(x => x.id === id);
      if (a) Object.assign(a, patch);
    });
  }

  // Symbol classifiers ─────────────────────────────────────────────────
  function isCryptoLike(sym) {
    const s = (sym || '').toUpperCase();
    return /^(BTC|ETH|SOL|BNB|XRP|DOGE|ADA|AVAX|MATIC|DOT|LINK|LTC|TRX|ATOM|UNI|NEAR|APT|ARB|OP)/.test(s)
        && /(USDT|USDC|BUSD|USD)$/.test(s);
  }

  // Fetch helpers ──────────────────────────────────────────────────────
  async function fetchBinance(symbol) {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`);
    if (!r.ok) throw new Error(`binance ${r.status}`);
    const j = await r.json();
    return Number(j.price);
  }

  async function fetchYahoo(symbol) {
    // Yahoo expects forex/metals like "XAUUSD=X", crypto like "BTC-USD"
    let s = symbol;
    if (/^(XAU|XAG|EUR|GBP|USD|AUD|NZD|CAD|JPY|CHF)/.test(symbol) && !symbol.includes('=')) s = symbol + '=X';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?interval=1m&range=1d`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`yahoo ${r.status}`);
    const j = await r.json();
    const meta = j?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error('yahoo: no data');
    return Number(meta.regularMarketPrice);
  }

  async function fetchPrice(symbol) {
    if (isCryptoLike(symbol)) return fetchBinance(symbol);
    return fetchYahoo(symbol);
  }

  // Notification ──────────────────────────────────────────────────────
  async function notify(title, body) {
    try {
      const LN = window.Capacitor?.Plugins?.LocalNotifications;
      if (LN) {
        // Permission (Android 13+ requires explicit grant)
        try {
          const perm = await LN.checkPermissions();
          if (perm.display !== 'granted') await LN.requestPermissions();
        } catch (_) {}
        await LN.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 1e9),
            title,
            body,
            schedule: { at: new Date(Date.now() + 100) }
          }]
        });
        return;
      }
    } catch (e) { console.warn('LocalNotifications failed:', e); }
    // Fallback: in-app toast + sound
    if (window.Toast) Toast.success(`${title} — ${body}`);
  }

  // Poll loop ─────────────────────────────────────────────────────────
  async function checkOnce() {
    const alerts = getAll().filter(a => a.active);
    for (const a of alerts) {
      try {
        const price = await fetchPrice(a.symbol);
        a.last_price = price;
        a.last_checked = Date.now();
        const triggered = (a.direction === 'above' && price >= a.target)
                       || (a.direction === 'below' && price <= a.target);
        if (triggered) {
          await notify(`${a.symbol} ${a.direction} ${a.target}`, `Last price: ${price}`);
          if (a.repeat === 'once') a.active = false;
          a.last_triggered = Date.now();
          a.trigger_count = (a.trigger_count || 0) + 1;
        }
      } catch (e) {
        a.last_error = String(e.message || e);
      }
    }
    // Persist any stamp updates without triggering the global re-render
    // (we still write so reloads see fresh state)
    try { localStorage.setItem('tr_alerts', JSON.stringify(getAll())); } catch (_) {}
  }

  function start() {
    stop();
    checkOnce();
    pollHandle = setInterval(checkOnce, POLL_MS);
  }

  function stop() {
    if (pollHandle) { clearInterval(pollHandle); pollHandle = null; }
  }

  return { getAll, add, remove, update, start, stop, checkOnce, fetchPrice };
})();
