// ui.js - small UI helpers: confirm modal and toast notifications

function createModal() {
  const modal = document.createElement('div');
  modal.className = 'ui-modal';

  const box = document.createElement('div');
  box.className = 'ui-modal-box';
  box.style.width = '92%';

  const msg = document.createElement('div');
  msg.style.marginBottom = '12px';
  box.appendChild(msg);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '8px';
  box.appendChild(actions);

  modal.appendChild(box);
  modal.box = box;
  modal.msg = msg;
  modal.actions = actions;
  return modal;
}

export function showConfirm(message, opts = {}) {
  return new Promise((resolve) => {
    const modal = createModal();
    modal.msg.textContent = message;
    const okLabel = opts.okLabel || 'OK';
    const cancelLabel = opts.cancelLabel || 'Cancel';

    const btnCancel = document.createElement('button');
    btnCancel.textContent = cancelLabel;
    btnCancel.className = 'ui-btn ui-btn-secondary';
    btnCancel.onclick = () => { modal.remove(); resolve(false); };

    const btnOk = document.createElement('button');
    btnOk.textContent = okLabel;
    btnOk.className = 'ui-btn';
    btnOk.onclick = () => { modal.remove(); resolve(true); };

    modal.actions.appendChild(btnCancel);
    modal.actions.appendChild(btnOk);

    modal.addEventListener('click', (ev) => { if (ev.target === modal) { document.body.removeChild(modal); resolve(false); } });
    const onKey = (e) => { if (e.key === 'Escape') { if (document.body.contains(modal)) { document.body.removeChild(modal); resolve(false); } } };
    document.addEventListener('keydown', onKey);

    document.body.appendChild(modal);
    // cleanup when removed
    const origRemove = modal.remove;
    modal.remove = function () { if (document.body.contains(modal)) { document.body.removeChild(modal); document.removeEventListener('keydown', onKey); } };
  });
}

// Toast system
const TOAST_CONTAINER_ID = 'ui-toast-container';
function getToastContainer() {
  let c = document.getElementById(TOAST_CONTAINER_ID);
  if (!c) {
    c = document.createElement('div');
    c.id = TOAST_CONTAINER_ID;
    c.style.position = 'fixed';
    c.style.right = '18px';
    c.style.top = '18px';
    c.style.zIndex = 99999;
    c.style.display = 'flex';
    c.style.flexDirection = 'column';
    c.style.gap = '8px';
    document.body.appendChild(c);
  }
  return c;
}

export function showToast(message, options = {}) {
  const container = getToastContainer();
  const t = document.createElement('div');
  t.className = 'ui-toast';
  if (options.type === 'error') t.classList.add('error');

  const txt = document.createElement('div');
  txt.textContent = message;
  t.appendChild(txt);

  if (options.actionLabel && typeof options.action === 'function') {
    const act = document.createElement('button');
    act.textContent = options.actionLabel;
    act.className = 'action';
    act.onclick = () => { options.action(); container.removeChild(t); };
    t.appendChild(act);
  }

  container.appendChild(t);
  const duration = options.duration || 4000;
  if (!options.sticky) setTimeout(() => { if (t.parentNode) container.removeChild(t); }, duration);
  return t;
}
