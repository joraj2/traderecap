window.Store = (function () {
  const KEYS = ['trades', 'watchlist', 'patterns', 'mistakes', 'premarket', 'review', 'macro', 'notes', 'tags', 'settings', 'alerts'];
  const PREFIX = 'tr_';
  const state = {};
  const listeners = new Set();

  const DEFAULT_SETTINGS = {
    trader_name: 'Trader',
    starting_balance: 25000,
    currency: 'USD',
    goals: { daily: 500, weekly: 2500, monthly: 10000, yearly: 100000 },
    session_hours: { premarket_start: '04:00', open: '09:30', close: '16:00', afterhours_end: '20:00' },
    ui: { theme: 'light', default_tab: 'today' }
  };

  const DEFAULT_TAGS = {
    setups: ['vwap_reclaim', 'opening_range_breakout', 'gap_and_go', 'trend_pullback', 'breakdown_short', 'demand_zone_long', 'earnings_drift', 'range_break'],
    emotions: ['calm', 'fomo', 'revenge', 'fear', 'greed', 'tilt', 'confident', 'rushed'],
    catalysts: ['earnings', 'guidance', 'fda', 'macro_data', 'fed', 'news', 'technical', 'no_catalyst']
  };

  const DEFAULT_MISTAKES = [
    { id: 'chased_breakout', label: 'Chased breakout' },
    { id: 'oversized', label: 'Oversized' },
    { id: 'no_stop', label: 'No stop' },
    { id: 'moved_stop', label: 'Moved stop further' },
    { id: 'revenge_trade', label: 'Revenge trade' },
    { id: 'fomo', label: 'FOMO entry' },
    { id: 'no_thesis', label: 'No clear thesis' },
    { id: 'exit_early', label: 'Exited too early' },
    { id: 'exit_late', label: 'Held too long' },
    { id: 'averaged_down', label: 'Averaged down a loser' },
    { id: 'ignored_macro', label: 'Ignored macro' }
  ];

  const DEFAULTS = {
    trades: [], watchlist: [], patterns: [], notes: [], alerts: [],
    mistakes: DEFAULT_MISTAKES,
    premarket: {}, review: { weekly: {}, monthly: {} }, macro: {},
    tags: DEFAULT_TAGS, settings: DEFAULT_SETTINGS
  };

  async function loadAll() {
    for (const key of KEYS) {
      const stored = localStorage.getItem(PREFIX + key);
      if (stored) {
        try { state[key] = JSON.parse(stored); continue; } catch (e) { /* fallthrough */ }
      }
      try {
        const res = await fetch(`data/${key}.json`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          state[key] = (data == null || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0))
            ? cloneDefault(key) : data;
          continue;
        }
      } catch (e) { /* fallthrough */ }
      state[key] = cloneDefault(key);
    }
    // Backfill any missing setting fields
    state.settings = Object.assign({}, DEFAULT_SETTINGS, state.settings || {});
    state.settings.goals = Object.assign({}, DEFAULT_SETTINGS.goals, state.settings.goals || {});
    state.settings.ui = Object.assign({}, DEFAULT_SETTINGS.ui, state.settings.ui || {});
    state.tags = Object.assign({}, DEFAULT_TAGS, state.tags || {});
    notify();
  }

  function cloneDefault(key) {
    return JSON.parse(JSON.stringify(DEFAULTS[key]));
  }

  function get(key) { return state[key]; }
  function getAll() { return state; }

  function set(key, value) {
    state[key] = value;
    persist(key);
    notify(key);
  }

  function update(key, fn) {
    const ret = fn(state[key]);
    if (ret !== undefined) state[key] = ret;
    persist(key);
    notify(key);
  }

  function persist(key) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(state[key])); }
    catch (e) { console.error('Persist failed:', e); }
  }

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function notify(key) { listeners.forEach(fn => { try { fn(key); } catch (e) { console.error(e); } }); }

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportAll() {
    downloadJSON(`traderecap-export-${new Date().toISOString().slice(0, 10)}.json`, state);
  }

  function exportKey(key) {
    downloadJSON(`${key}.json`, state[key]);
  }

  async function importBundle(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (Array.isArray(data) || data == null) throw new Error('Expected an export bundle (object with keys), or use per-file import.');
    for (const key of KEYS) {
      if (data[key] !== undefined) {
        state[key] = data[key];
        persist(key);
      }
    }
    notify();
  }

  async function importKey(key, file) {
    const text = await file.text();
    state[key] = JSON.parse(text);
    persist(key);
    notify(key);
  }

  function reset() {
    for (const key of KEYS) {
      state[key] = cloneDefault(key);
      persist(key);
    }
    notify();
  }

  return {
    loadAll, get, getAll, set, update, subscribe, uuid,
    exportAll, exportKey, importBundle, importKey, reset
  };
})();
