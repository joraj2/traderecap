window.Tabs = window.Tabs || {};
window.Tabs.help = (function () {
  const FAQ = [
    {
      cat: 'Getting started',
      q: 'How do I log my first trade?',
      a: 'Tap the green <b>+ Add Trade</b> button (top-right, or use the <kbd>N</kbd> shortcut on desktop). Pick the asset class (Stock, Option, Future, Crypto), fill entry/exit/size, and save. Your stats on the Today and Analytics tabs update instantly.'
    },
    {
      cat: 'Getting started',
      q: 'What asset classes are supported?',
      a: 'Stocks, Options (with strike, expiry, IV, delta), Futures (contract, tick value, ticks captured), and Crypto (pair, leverage, perp/spot). Each asset class shows the right fields automatically.'
    },
    {
      cat: 'Getting started',
      q: 'Can I journal swing/position trades, not just day trades?',
      a: 'Yes. Each trade has a <b>style</b> field — pick day, swing, or position. Holding period is computed from your entry and exit timestamps.'
    },
    {
      cat: 'Data & privacy',
      q: 'Where is my trade data stored?',
      a: 'On your device only — nothing is sent to a server. Data lives in the app\'s local storage. We don\'t see your trades, your P&L, or your strategies.'
    },
    {
      cat: 'Data & privacy',
      q: 'How do I back up my data?',
      a: 'Tap <b>Export</b> in the top bar. You\'ll get a JSON file with all your trades, watchlist, patterns, reviews, and settings. Save it to Google Drive, Dropbox, or email it to yourself. Use <b>Import</b> to restore.'
    },
    {
      cat: 'Data & privacy',
      q: 'How do I move data to another phone?',
      a: 'Export on phone A → save the JSON to cloud storage → on phone B, install the app and tap Import → pick the file. Everything restores.'
    },
    {
      cat: 'Data & privacy',
      q: 'Will my data survive an app update?',
      a: 'Yes. App updates do not clear your local storage. Still, export weekly as insurance — phones get reset, lost, or replaced.'
    },
    {
      cat: 'Data & privacy',
      q: 'How do I delete all my data?',
      a: 'Settings → <b>Reset all data</b>. This is permanent and not recoverable, so export first if you want a backup.'
    },
    {
      cat: 'Stats & analytics',
      q: 'How is win rate calculated?',
      a: 'Win rate = winning trades ÷ total trades. A trade with P&L > 0 is a win. Breakeven trades count as neither.'
    },
    {
      cat: 'Stats & analytics',
      q: 'What is profit factor?',
      a: 'Profit factor = gross profits ÷ gross losses. Above 1.5 is decent; above 2.0 is strong. Below 1.0 means you\'re losing money overall.'
    },
    {
      cat: 'Stats & analytics',
      q: 'What is expectancy?',
      a: 'Expectancy is the average dollars you can expect per trade. Formula: (win rate × avg win) − (loss rate × avg loss). Positive expectancy = profitable strategy long-run.'
    },
    {
      cat: 'Stats & analytics',
      q: 'What does R-multiple mean?',
      a: 'R = your reward divided by your initial risk. If you risked $100 and made $250, that\'s a 2.5R win. R-multiples normalize trades across different position sizes so you can compare setups fairly.'
    },
    {
      cat: 'Stats & analytics',
      q: 'Why is my Sharpe ratio low?',
      a: 'Sharpe penalizes inconsistency. Even a profitable trader has a low Sharpe if returns are very volatile. Aim for steadier daily P&L rather than home-run days alongside big losses.'
    },
    {
      cat: 'Calendar & heatmap',
      q: 'How does the P&L heatmap work?',
      a: 'Each day shows total P&L. Green = winning day, red = losing day, deeper shade = larger move. Tap any day to see the trades that produced that result.'
    },
    {
      cat: 'Calendar & heatmap',
      q: 'Can I switch to weekly or yearly view?',
      a: 'Yes — toggle Month / Week / Year at the top of the Calendar tab.'
    },
    {
      cat: 'Patterns & playbook',
      q: 'What is the Patterns tab for?',
      a: 'Build your personal playbook: name a setup, write the entry rules, exit rules, and invalidation. Tag trades with the pattern when you log them. The app then shows you per-pattern win rate, expectancy, and average R automatically.'
    },
    {
      cat: 'Patterns & playbook',
      q: 'How do I link a trade to a pattern?',
      a: 'When adding/editing a trade, pick the pattern from the Setup chip-picker. Once linked, that trade contributes to the pattern\'s stats.'
    },
    {
      cat: 'Watchlist & pre-market',
      q: 'What\'s the difference between Watchlist and Pre-market?',
      a: 'Watchlist = ongoing setups you\'re monitoring (stays until you trade or it expires). Pre-market = today\'s plan only — bias, levels, catalysts, invalidation. Pre-market is date-keyed so yesterday\'s plan is preserved.'
    },
    {
      cat: 'Watchlist & pre-market',
      q: 'Why did my watchlist item disappear?',
      a: 'Watchlist items auto-expire after their <b>Valid until</b> date. Expired items still show but greyed out. Bump the date to keep them active.'
    },
    {
      cat: 'Mistakes & review',
      q: 'How does the Mistakes tab work?',
      a: 'Tag a trade with one or more mistakes (chased breakout, oversized, revenge trade, etc.). The app aggregates them, ranking by total dollar impact so you see exactly which mistake is costing you the most.'
    },
    {
      cat: 'Mistakes & review',
      q: 'When should I do a Review?',
      a: 'Weekly review every Sunday — what worked, what failed, repeat mistakes, adjustments for next week. Monthly review on the 1st — bigger themes, regime shifts, drawdown analysis. Both forms are in the Review tab.'
    },
    {
      cat: 'Macro tracking',
      q: 'What goes in the Macro tab?',
      a: 'Daily tape note: regime (bull/bear/chop), market breadth, VIX reading, key levels (e.g. SPX 5000), upcoming catalysts (FOMC, CPI, earnings). Useful to look back later and ask "did I respect macro on losing days?"'
    },
    {
      cat: 'Pricing & ads',
      q: 'Is the app free?',
      a: 'Yes. The app is free, supported by occasional ads. Ads appear at the bottom of secondary tabs (Calendar, Analytics, Watchlist) and never during trade entry. We will never sell or share your trade data.'
    },
    {
      cat: 'Pricing & ads',
      q: 'Why am I seeing ads?',
      a: 'Ads keep the app free and let us keep building features. We\'ve placed them where they don\'t interrupt your workflow — never during trade entry, never as pop-ups while you\'re reviewing the day.'
    },
    {
      cat: 'Pricing & ads',
      q: 'Can I remove ads?',
      a: 'A one-tap ad removal option may arrive in a future update. For now, ads are required to keep the app free.'
    },
    {
      cat: 'Troubleshooting',
      q: 'Stats look wrong after I deleted a trade. Why?',
      a: 'Pull down to refresh, or switch to another tab and back. The store updates instantly but a stale tab view may briefly persist.'
    },
    {
      cat: 'Troubleshooting',
      q: 'My screenshots are missing.',
      a: 'Screenshots are stored as base64 in local storage. If you cleared app data or migrated devices without exporting, they\'ll be gone. Always export before resetting or switching phones.'
    },
    {
      cat: 'Troubleshooting',
      q: 'The app is slow with thousands of trades.',
      a: 'Local storage handles roughly 5–10 MB. If you have years of trades with many screenshots, export and archive older years to a separate JSON file, then clear them from the app. We\'re working on a performance pass for v2.'
    },
    {
      cat: 'Contact',
      q: 'How do I report a bug or request a feature?',
      a: 'Email <b>support@traderecap.app</b> with a description and a screenshot if possible. Bug reports with reproduction steps get fixed first.'
    }
  ];

  function render(host) {
    const cats = [...new Set(FAQ.map(f => f.cat))];
    host.innerHTML = `
      <div class="help-hero card">
        <div class="help-hero-text">
          <h2 class="help-h2">Help & FAQ</h2>
          <p class="text-2">Search common questions or browse by category. Can't find what you need? Email <b>support@traderecap.app</b>.</p>
        </div>
        <div class="help-search-wrap">
          <i data-lucide="search"></i>
          <input id="help-search" type="search" placeholder="Search the help center…" autocomplete="off" />
        </div>
      </div>

      <div class="help-cats" id="help-cats">
        ${cats.map(c => `<button class="help-cat-chip" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
        <button class="help-cat-chip active" data-cat="">All</button>
      </div>

      <div class="help-list" id="help-list"></div>

      <div class="help-foot card">
        <div>
          <h3 style="margin:0 0 6px;font-size:14px;">Still stuck?</h3>
          <p class="text-2" style="margin:0;font-size:13px;">Email <b>support@traderecap.app</b> with your question and (if relevant) a screenshot. We read every message.</p>
        </div>
        <a class="btn btn-primary" href="mailto:support@traderecap.app?subject=TradeRecap%20support">
          <i data-lucide="mail"></i><span>Email support</span>
        </a>
      </div>
    `;

    const list = host.querySelector('#help-list');
    const search = host.querySelector('#help-search');
    const chips = host.querySelectorAll('.help-cat-chip');
    let activeCat = '';
    let query = '';

    function paint() {
      const q = query.trim().toLowerCase();
      const filtered = FAQ.filter(f => {
        if (activeCat && f.cat !== activeCat) return false;
        if (!q) return true;
        return (f.q + ' ' + f.a + ' ' + f.cat).toLowerCase().includes(q);
      });
      if (!filtered.length) {
        list.innerHTML = `<div class="empty"><div class="emoji">🔍</div><h3>No matches</h3><div>Try different keywords or clear the search.</div></div>`;
        return;
      }
      list.innerHTML = filtered.map((f, i) => `
        <details class="help-item" ${q ? 'open' : ''}>
          <summary>
            <span class="help-q">${highlight(f.q, q)}</span>
            <span class="help-cat">${esc(f.cat)}</span>
            <i data-lucide="chevron-down" class="help-chev"></i>
          </summary>
          <div class="help-a">${highlight(f.a, q)}</div>
        </details>
      `).join('');
      if (window.lucide) lucide.createIcons();
    }

    function highlight(s, q) {
      if (!q) return s;
      try {
        const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
        return s.replace(re, '<mark>$1</mark>');
      } catch (e) { return s; }
    }

    search.addEventListener('input', e => { query = e.target.value; paint(); });
    chips.forEach(c => c.addEventListener('click', () => {
      chips.forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      activeCat = c.dataset.cat;
      paint();
    }));

    paint();
    if (window.lucide) lucide.createIcons();
  }

  function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  return { render };
})();
