window.Onboarding = (function () {
  const FLAG_KEY = 'tr_onboarded';

  const CURRENCIES = [
    { code: 'USD', label: 'USD — US Dollar' },
    { code: 'EUR', label: 'EUR — Euro' },
    { code: 'GBP', label: 'GBP — British Pound' },
    { code: 'AUD', label: 'AUD — Australian Dollar' },
    { code: 'NZD', label: 'NZD — New Zealand Dollar' },
    { code: 'CAD', label: 'CAD — Canadian Dollar' },
    { code: 'JPY', label: 'JPY — Japanese Yen' },
    { code: 'INR', label: 'INR — Indian Rupee' },
    { code: 'SGD', label: 'SGD — Singapore Dollar' },
    { code: 'HKD', label: 'HKD — Hong Kong Dollar' }
  ];

  const INSTRUMENTS = ['Stocks', 'Options', 'Futures', 'Forex', 'Crypto'];

  function isOnboarded() {
    return localStorage.getItem(FLAG_KEY) === 'true';
  }

  function maybeShow() {
    if (isOnboarded()) return Promise.resolve();
    return show();
  }

  function show() {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-bg onboarding-overlay';
      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" style="width: min(560px, calc(100vw - 32px));">
          <div class="modal-head">
            <h3 class="modal-title">Welcome — let's set up your journal</h3>
          </div>
          <div class="modal-body">
            <p class="text-2" style="margin: 0 0 16px; line-height: 1.5;">
              Just a few details so your dashboard shows your real numbers, not placeholders.
            </p>
            <form id="onboard-form" class="form-grid cols-2">
              <div class="field full">
                <label>What should we call you?</label>
                <input name="trader_name" required autofocus placeholder="e.g. Alex" maxlength="40" />
              </div>
              <div class="field">
                <label>Starting capital</label>
                <input name="starting_balance" type="number" min="0" step="any" required placeholder="10000" />
              </div>
              <div class="field">
                <label>Currency</label>
                <select name="currency" required>
                  ${CURRENCIES.map(c => `<option value="${c.code}">${c.label}</option>`).join('')}
                </select>
              </div>
              <div class="field full">
                <label>What do you trade? <span class="text-dim" style="font-weight: 400;">(pick any)</span></label>
                <div class="instrument-chips" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;">
                  ${INSTRUMENTS.map(i => `
                    <label class="chip-toggle" style="cursor:pointer;">
                      <input type="checkbox" name="instruments" value="${i}" style="display:none;" />
                      <span class="btn btn-ghost" style="padding: 6px 14px; font-size: 13px;">${i}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
              <div class="field full">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:400;">
                  <input type="checkbox" name="auto_goals" checked />
                  <span class="text-2" style="font-size: 13px;">Auto-set goals from capital (0.5% daily / 2.5% weekly / 10% monthly)</span>
                </label>
              </div>
            </form>
            <p class="text-dim" style="font-size: 11px; margin: 16px 0 0; line-height: 1.5;">
              All data stays on your device. You can change everything later in Settings.
            </p>
          </div>
          <div class="modal-foot">
            <button class="btn btn-primary" id="onboard-save" type="button" style="margin-left: auto;">
              Get started
            </button>
          </div>
        </div>
      `;

      document.getElementById('modal-root').appendChild(overlay);

      // Style selected instrument chips
      overlay.querySelectorAll('.chip-toggle input').forEach(cb => {
        cb.addEventListener('change', () => {
          const span = cb.parentElement.querySelector('span');
          if (cb.checked) {
            span.classList.remove('btn-ghost');
            span.classList.add('btn-primary');
          } else {
            span.classList.remove('btn-primary');
            span.classList.add('btn-ghost');
          }
        });
      });

      const form = overlay.querySelector('#onboard-form');
      const saveBtn = overlay.querySelector('#onboard-save');

      function commit() {
        const fd = new FormData(form);
        const name = (fd.get('trader_name') || '').toString().trim();
        const balance = Number(fd.get('starting_balance')) || 0;
        const currency = (fd.get('currency') || 'USD').toString();
        const autoGoals = fd.get('auto_goals') === 'on';
        const instruments = fd.getAll('instruments').map(s => s.toString());

        if (!name) {
          form.querySelector('input[name="trader_name"]').focus();
          return;
        }
        if (balance <= 0) {
          form.querySelector('input[name="starting_balance"]').focus();
          return;
        }

        Store.update('settings', curr => {
          curr.trader_name = name;
          curr.starting_balance = balance;
          curr.currency = currency;
          curr.instruments = instruments;
          if (autoGoals) {
            curr.goals = {
              daily: Math.round(balance * 0.005),
              weekly: Math.round(balance * 0.025),
              monthly: Math.round(balance * 0.10),
              yearly: Math.round(balance * 1.0)
            };
          }
        });

        localStorage.setItem(FLAG_KEY, 'true');
        overlay.remove();
        if (window.Toast) Toast.success(`Welcome aboard, ${name}`);
        resolve();
      }

      saveBtn.addEventListener('click', commit);
      form.addEventListener('submit', e => { e.preventDefault(); commit(); });

      if (window.lucide) lucide.createIcons();
    });
  }

  function reset() {
    localStorage.removeItem(FLAG_KEY);
  }

  return { maybeShow, show, isOnboarded, reset };
})();
