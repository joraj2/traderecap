window.Tabs = window.Tabs || {};
window.Tabs.notes = (function () {
  function render(host) {
    const notes = (Store.get('notes') || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created_at || '').localeCompare(a.created_at || ''));

    host.innerHTML = `
      <div class="card-title-row" style="margin-bottom: 12px;">
        <h3 class="card-title" style="font-size: 14px;">Journal</h3>
        <button class="btn btn-primary btn-sm" id="n-add" style="margin-left: auto;">
          <i data-lucide="plus"></i><span>New Entry</span>
        </button>
      </div>

      ${notes.length === 0 ? `
        <div class="empty">
          <div class="emoji">📓</div>
          <h3>Start Journaling</h3>
          <div>Daily reflection beats checking P&amp;L. Capture thoughts, market reads, lessons — anything that doesn't fit a single trade.</div>
        </div>
      ` : `
        <div class="notes-list">
          ${notes.map(n => `
            <div class="card note-card" data-id="${esc(n.id)}" style="margin-bottom: 10px; cursor: pointer;">
              <div style="display:flex; align-items:baseline; gap: 10px;">
                <strong>${esc(n.title || 'Untitled')}</strong>
                <span class="text-dim" style="font-size: 11px; margin-left:auto;">${esc(n.date || '')}</span>
              </div>
              <p class="text-2" style="margin: 6px 0 0; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${esc((n.body || '').slice(0, 240))}${(n.body || '').length > 240 ? '…' : ''}</p>
            </div>
          `).join('')}
        </div>
      `}
    `;

    if (window.lucide) lucide.createIcons();

    host.querySelector('#n-add').addEventListener('click', () => openEditor());
    host.querySelectorAll('.note-card').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const note = (Store.get('notes') || []).find(x => x.id === id);
        if (note) openEditor(note);
      });
    });
  }

  function openEditor(existing) {
    const isEdit = !!existing;
    const note = existing || { id: null, date: Compute.todayISO(), title: '', body: '' };

    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-grid cols-2">
        <div class="field">
          <label>Date</label>
          <input type="date" name="date" value="${esc(note.date || Compute.todayISO())}" required />
        </div>
        <div class="field">
          <label>Title</label>
          <input name="title" value="${esc(note.title || '')}" placeholder="Short headline" maxlength="80" />
        </div>
        <div class="field full">
          <label>Body</label>
          <textarea name="body" rows="10" placeholder="What's on your mind today? Lessons, observations, mood, market reads…">${esc(note.body || '')}</textarea>
        </div>
      </div>
    `;

    const cancel = document.createElement('button'); cancel.className = 'btn btn-ghost'; cancel.textContent = 'Cancel'; cancel.type = 'button';
    const save = document.createElement('button'); save.className = 'btn btn-primary'; save.textContent = isEdit ? 'Save' : 'Add Note'; save.type = 'submit';
    const foot = document.createElement('div'); foot.style.display = 'flex'; foot.style.gap = '8px'; foot.style.width = '100%';
    if (isEdit) {
      const del = document.createElement('button'); del.className = 'btn btn-danger'; del.type = 'button'; del.textContent = 'Delete';
      del.style.marginRight = 'auto';
      del.addEventListener('click', async () => {
        if (await Modal.confirm({ title: 'Delete Note', message: 'This cannot be undone.', okText: 'Delete', danger: true })) {
          Store.update('notes', list => list.filter(x => x.id !== existing.id));
          Toast.success('Note deleted');
          Modal.close();
        }
      });
      foot.appendChild(del);
    } else {
      const sp = document.createElement('div'); sp.style.marginRight = 'auto'; foot.appendChild(sp);
    }
    foot.appendChild(cancel); foot.appendChild(save);

    Modal.open({ title: isEdit ? 'Edit Entry' : 'New Journal Entry', body: form, footer: foot, width: 640 });

    cancel.addEventListener('click', () => Modal.close());
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const out = {
        id: existing ? existing.id : Store.uuid(),
        date: fd.get('date') || Compute.todayISO(),
        title: (fd.get('title') || '').toString().trim(),
        body: (fd.get('body') || '').toString(),
        created_at: existing ? existing.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      Store.update('notes', list => {
        if (existing) {
          const i = list.findIndex(x => x.id === existing.id);
          if (i >= 0) list[i] = out;
        } else {
          list.push(out);
        }
      });
      Toast.success(existing ? 'Note saved' : 'Note added');
      Modal.close();
    });
  }

  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { render };
})();
