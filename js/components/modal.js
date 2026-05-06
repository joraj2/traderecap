window.Modal = (function () {
  let activeOverlay = null;

  function open({ title, body, footer, width, onClose }) {
    close();
    const overlay = document.createElement('div');
    overlay.className = 'modal-bg';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3 class="modal-title">${escape(title || '')}</h3>
          <button class="btn btn-icon modal-close" aria-label="Close"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body"></div>
        ${footer ? '<div class="modal-foot"></div>' : ''}
      </div>
    `;
    if (width) {
      // Use max-width (not width) so mobile's `.modal { width: 100vw }` rule wins.
      // Setting width inline overrides the media query and produces a wider-than-
      // viewport modal that scrolls horizontally inside the WebView.
      overlay.querySelector('.modal').style.maxWidth = `${width}px`;
    }
    const bodyEl = overlay.querySelector('.modal-body');
    if (typeof body === 'string') bodyEl.innerHTML = body;
    else if (body instanceof Node) bodyEl.appendChild(body);
    if (footer) {
      const footEl = overlay.querySelector('.modal-foot');
      if (typeof footer === 'string') footEl.innerHTML = footer;
      else if (footer instanceof Node) footEl.appendChild(footer);
    }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.getElementById('modal-root').appendChild(overlay);
    activeOverlay = { overlay, onClose };
    if (window.lucide) lucide.createIcons();
    document.addEventListener('keydown', escListener);
    return { overlay, body: bodyEl, foot: overlay.querySelector('.modal-foot'), close };
  }

  function close() {
    if (!activeOverlay) return;
    const { overlay, onClose } = activeOverlay;
    overlay.remove();
    activeOverlay = null;
    document.removeEventListener('keydown', escListener);
    if (typeof onClose === 'function') onClose();
  }

  function escListener(e) { if (e.key === 'Escape') close(); }

  function confirm({ title = 'Confirm', message = 'Are you sure?', okText = 'Confirm', danger = false } = {}) {
    return new Promise(resolve => {
      const body = document.createElement('div');
      body.innerHTML = `<p style="margin:0; color: var(--text-2); line-height: 1.5;">${escape(message)}</p>`;
      const foot = document.createElement('div');
      const cancel = document.createElement('button');
      cancel.className = 'btn btn-ghost'; cancel.textContent = 'Cancel';
      const ok = document.createElement('button');
      ok.className = danger ? 'btn btn-danger' : 'btn btn-primary'; ok.textContent = okText;
      foot.appendChild(cancel); foot.appendChild(ok);
      const m = open({ title, body, footer: foot, width: 440 });
      cancel.addEventListener('click', () => { m.close(); resolve(false); });
      ok.addEventListener('click', () => { m.close(); resolve(true); });
    });
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { open, close, confirm };
})();

window.Toast = (function () {
  function show(msg, type = '') {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .25s'; el.style.opacity = '0'; }, 2400);
    setTimeout(() => el.remove(), 2800);
  }
  return { show, success: m => show(m, 'success'), error: m => show(m, 'error') };
})();
