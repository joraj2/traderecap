(function () {
  const NAV = [
    { id: 'today',     label: 'Today',       icon: 'layout-dashboard', primary: true },
    { id: 'trades',    label: 'Trades',      icon: 'list-checks',      primary: true },
    { id: 'calendar',  label: 'Calendar',    icon: 'calendar-days',    primary: true },
    { id: 'analytics', label: 'Analytics',   icon: 'bar-chart-3',      primary: true },
    { id: 'watchlist', label: 'Watchlist',   icon: 'eye' },
    { id: 'patterns',  label: 'Patterns',    icon: 'layers' },
    { id: 'premarket', label: 'Pre-market',  icon: 'sunrise' },
    { id: 'review',    label: 'Review',      icon: 'rotate-ccw' },
    { id: 'mistakes',  label: 'Mistakes',    icon: 'octagon-alert' },
    { id: 'macro',     label: 'Macro',       icon: 'globe' },
    { id: 'notes',     label: 'Journal',     icon: 'notebook-pen' },
    { id: 'help',      label: 'Help',        icon: 'help-circle' }
  ];

  const PAGE_TITLES = {
    today: 'Dashboard', calendar: 'Calendar', trades: 'Trades', analytics: 'Analytics',
    watchlist: 'Watchlist', patterns: 'Patterns', premarket: 'Pre-market Plan',
    review: 'Review', mistakes: 'Mistakes', macro: 'Macro Notes', notes: 'Journal', help: 'Help & FAQ'
  };

  let currentTab = null;

  async function init() {
    renderNav();
    renderBottomNav();
    wireTopbar();
    wireKeyboard();
    wireMobileMenu();
    wireFab();
    await Store.loadAll();

    // First-launch onboarding (blocks until user provides name + capital)
    if (window.Onboarding) {
      try { await Onboarding.maybeShow(); } catch (e) { console.warn(e); }
    }

    // Initialize ads (no-op on web, real AdMob on Android via Capacitor)
    if (window.Ads) {
      try { await Ads.init({ useTestAds: true }); } catch (e) { console.warn(e); }
    }

    // Re-render current tab on data changes — preserve scroll so the page
    // doesn't jump to top after a trade is added.
    Store.subscribe(() => {
      const c = document.getElementById('content');
      const sy = window.scrollY || document.documentElement.scrollTop || 0;
      if (currentTab && Tabs[currentTab]) Tabs[currentTab].render(c);
      // Restore on next frame so layout settles first
      requestAnimationFrame(() => window.scrollTo({ top: sy, behavior: 'instant' }));
      updateMiniPnL();
    });

    const initial = (location.hash || '#today').slice(1);
    go(NAV.find(n => n.id === initial) ? initial : 'today');

    window.addEventListener('hashchange', () => {
      const id = (location.hash || '#today').slice(1);
      if (NAV.find(n => n.id === id)) go(id);
    });

    updateMiniPnL();

    // Cold-start interstitial (frequency-capped, only after first 60s)
    if (window.Ads) {
      setTimeout(() => Ads.maybeShowColdStartInterstitial(), 90 * 1000);
    }
  }

  function renderNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = NAV.map(n => `
      <a href="#${n.id}" class="nav-item" data-tab="${n.id}">
        <i data-lucide="${n.icon}"></i>
        <span>${n.label}</span>
      </a>
    `).join('');
    if (window.lucide) lucide.createIcons();
  }

  function renderBottomNav() {
    const bn = document.getElementById('bottom-nav');
    if (!bn) return;
    const primary = NAV.filter(n => n.primary);
    bn.innerHTML = primary.map(n => `
      <a href="#${n.id}" class="bn-item" data-tab="${n.id}">
        <i data-lucide="${n.icon}"></i>
        <span>${n.label}</span>
      </a>
    `).join('') + `
      <button class="bn-item bn-more" id="bn-more">
        <i data-lucide="more-horizontal"></i>
        <span>More</span>
      </button>
    `;
    document.getElementById('bn-more').addEventListener('click', openMoreSheet);
    if (window.lucide) lucide.createIcons();
  }

  function openMoreSheet() {
    const overflow = NAV.filter(n => !n.primary);
    const body = document.createElement('div');
    body.className = 'more-sheet';
    body.innerHTML = overflow.map(n => `
      <a href="#${n.id}" class="more-item" data-tab="${n.id}">
        <i data-lucide="${n.icon}"></i>
        <span>${n.label}</span>
        <i data-lucide="chevron-right" class="chev"></i>
      </a>
    `).join('') + `
      <div class="more-divider"></div>
      <button class="more-item" id="more-import"><i data-lucide="upload"></i><span>Import data</span></button>
      <button class="more-item" id="more-export"><i data-lucide="download"></i><span>Export data</span></button>
      <button class="more-item" id="more-report"><i data-lucide="file-text"></i><span>Performance report</span></button>
      <button class="more-item" id="more-settings"><i data-lucide="settings"></i><span>Settings</span></button>
    `;
    Modal.open({ title: 'More', body, width: 480 });
    body.querySelectorAll('.more-item[data-tab]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        Modal.close();
        go(a.dataset.tab);
      });
    });
    body.querySelector('#more-import').addEventListener('click', () => { Modal.close(); triggerImport(); });
    body.querySelector('#more-export').addEventListener('click', () => { Modal.close(); Store.exportAll(); });
    body.querySelector('#more-report').addEventListener('click', () => { Modal.close(); openReport(); });
    body.querySelector('#more-settings').addEventListener('click', () => { Modal.close(); openSettings(); });
    if (window.lucide) lucide.createIcons();
  }

  function go(id) {
    currentTab = id;
    document.querySelectorAll('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.tab === id));
    document.querySelectorAll('.bn-item').forEach(a => a.classList.toggle('active', a.dataset && a.dataset.tab === id));
    document.getElementById('page-title').textContent = PAGE_TITLES[id] || id;
    const c = document.getElementById('content');
    c.innerHTML = '';
    if (Tabs[id]) {
      try { Tabs[id].render(c); }
      catch (e) {
        console.error(e);
        c.innerHTML = `<div class="empty"><h3>Tab error</h3><div>${(e && e.message) || e}</div></div>`;
      }
    } else {
      c.innerHTML = `<div class="empty"><h3>Coming soon</h3></div>`;
    }
    if (location.hash !== '#' + id) location.hash = id;
    // Show/hide ad banner based on tab
    if (window.Ads) Ads.showBannerForTab(id);
  }

  function wireMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    if (!btn) return;
    btn.addEventListener('click', openMoreSheet);
  }

  function wireFab() {
    const fab = document.getElementById('fab-add-trade');
    if (!fab) return;
    fab.addEventListener('click', () => TradeForm.open());
  }

  function openReport() {
    const trades = Store.get('trades') || [];
    const t = Compute.totals(trades);
    const body = document.createElement('div');
    body.innerHTML = `
      <p class="text-2" style="margin: 0 0 12px;">Snapshot summary of all logged trades.</p>
      <div class="stat-grid stat-grid-3">
        ${StatCard.render({ label: 'Net P&L', value: Compute.fmtMoney(t.total), tone: StatCard.tone(t.total) })}
        ${StatCard.render({ label: 'Trades', value: t.count, sub: `${t.wins}W / ${t.losses}L` })}
        ${StatCard.render({ label: 'Win Rate', value: Compute.fmtPct(t.winRate) })}
        ${StatCard.render({ label: 'Profit Factor', value: t.profitFactor === Infinity ? '∞' : Compute.fmtNum(t.profitFactor) })}
        ${StatCard.render({ label: 'Expectancy', value: Compute.fmtMoney(t.expectancy), tone: StatCard.tone(t.expectancy) })}
        ${StatCard.render({ label: 'Avg R', value: Compute.fmtNum(t.avgR) })}
      </div>
      <p class="text-dim" style="font-size: 12px; margin-top: 12px;">Export the JSON for a complete dataset.</p>
    `;
    const dl = document.createElement('button'); dl.className = 'btn btn-primary'; dl.textContent = 'Download JSON';
    dl.addEventListener('click', () => Store.exportAll());
    const foot = document.createElement('div'); foot.style.marginLeft = 'auto'; foot.appendChild(dl);
    Modal.open({ title: 'Performance Report', body, footer: foot, width: 720 });
  }

  function wireTopbar() {
    document.getElementById('add-trade-btn').addEventListener('click', () => TradeForm.open());

    document.getElementById('export-btn').addEventListener('click', () => Store.exportAll());
    document.getElementById('import-top-btn').addEventListener('click', triggerImport);
    document.getElementById('import-btn').addEventListener('click', triggerImport);

    document.getElementById('report-btn').addEventListener('click', openReport);

    document.getElementById('settings-btn').addEventListener('click', openSettings);
  }

  function triggerImport() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.addEventListener('change', async () => {
      const f = input.files && input.files[0];
      if (!f) return;
      try {
        await Store.importBundle(f);
        Toast.success('Imported');
      } catch (e) {
        Toast.error('Import failed: ' + e.message);
      }
    });
    input.click();
  }

  function openSettings() {
    const s = Store.get('settings');
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-grid cols-2">
        <div class="field"><label>Trader name</label><input name="trader_name" value="${esc(s.trader_name)}" /></div>
        <div class="field"><label>Starting balance</label><input name="starting_balance" type="number" step="any" value="${s.starting_balance}" /></div>
        <div class="field"><label>Currency</label>
          <select name="currency">
            ${['USD','EUR','GBP','AUD','NZD','CAD','JPY','INR','SGD','HKD'].map(c => `<option value="${c}" ${s.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Daily goal</label><input name="g_daily" type="number" step="any" value="${s.goals.daily}" /></div>
        <div class="field"><label>Weekly goal</label><input name="g_weekly" type="number" step="any" value="${s.goals.weekly}" /></div>
        <div class="field"><label>Monthly goal</label><input name="g_monthly" type="number" step="any" value="${s.goals.monthly}" /></div>
        <div class="field"><label>Yearly goal</label><input name="g_yearly" type="number" step="any" value="${s.goals.yearly}" /></div>
      </div>
      <div class="divider"></div>
      <div style="display:flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn" type="button" id="reset-btn">Reset all data</button>
        <span class="text-dim" style="font-size: 11px; align-self: center;">Wipes all trades, watchlist, patterns, etc. Cannot be undone.</span>
      </div>
    `;
    const cancel = document.createElement('button'); cancel.className = 'btn btn-ghost'; cancel.textContent = 'Cancel'; cancel.type = 'button';
    const save = document.createElement('button'); save.className = 'btn btn-primary'; save.textContent = 'Save'; save.type = 'submit';
    const foot = document.createElement('div'); foot.style.display = 'flex'; foot.style.gap = '8px'; foot.style.marginLeft = 'auto';
    foot.appendChild(cancel); foot.appendChild(save);
    Modal.open({ title: 'Settings', body: form, footer: foot, width: 720 });
    cancel.addEventListener('click', () => Modal.close());
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      Store.update('settings', curr => {
        curr.trader_name = fd.get('trader_name') || 'Trader';
        curr.starting_balance = Number(fd.get('starting_balance')) || 0;
        curr.currency = fd.get('currency') || 'USD';
        curr.goals = {
          daily: Number(fd.get('g_daily')) || 0,
          weekly: Number(fd.get('g_weekly')) || 0,
          monthly: Number(fd.get('g_monthly')) || 0,
          yearly: Number(fd.get('g_yearly')) || 0
        };
      });
      Toast.success('Settings saved');
      Modal.close();
    });
    save.addEventListener('click', () => form.requestSubmit());
    form.querySelector('#reset-btn').addEventListener('click', async () => {
      if (await Modal.confirm({ title: 'Reset all data', message: 'This will permanently erase all trades, watchlist items, patterns, plans, reviews, and macro notes. Cannot be undone.', okText: 'Erase everything', danger: true })) {
        Store.reset();
        Toast.success('All data reset');
        Modal.close();
      }
    });
  }

  function wireKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        TradeForm.open();
      } else if (e.key === '/') {
        e.preventDefault();
        if (currentTab !== 'trades') go('trades');
        setTimeout(() => {
          const s = document.getElementById('f-search');
          if (s) s.focus();
        }, 50);
      }
    });
  }

  function updateMiniPnL() {
    const trades = Store.get('trades') || [];
    const todayTrades = Compute.tradesForDate(trades, Compute.todayISO());
    const t = Compute.totals(todayTrades).total;
    const el = document.getElementById('mini-pnl');
    if (!el) return;
    el.textContent = todayTrades.length ? Compute.fmtMoney(t) : '—';
    el.className = 'mono ' + (t > 0 ? 'text-pos' : t < 0 ? 'text-neg' : 'text-dim');
  }

  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
