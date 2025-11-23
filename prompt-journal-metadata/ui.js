// ui.js - small UI helpers: confirm modal and toast notifications

function createModal() {
  const modal = document.createElement('div');
  modal.className = 'ui-modal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.background = 'rgba(2,6,23,0.5)';
  modal.style.zIndex = 9999;

  const box = document.createElement('div');
  box.style.background = '#fff';
  box.style.padding = '18px';
  box.style.borderRadius = '10px';
  box.style.maxWidth = '520px';
  box.style.width = '92%';
  box.style.boxShadow = '0 30px 80px rgba(2,6,23,0.35)';

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
    btnCancel.style.background = 'transparent';
    btnCancel.style.border = '1px solid #cbd5e1';
    btnCancel.style.padding = '8px 12px';
    btnCancel.style.borderRadius = '8px';
    btnCancel.onclick = () => { document.body.removeChild(modal); resolve(false); };

    const btnOk = document.createElement('button');
    btnOk.textContent = okLabel;
    btnOk.style.background = '#0b63d6';
    btnOk.style.color = '#fff';
    btnOk.style.border = 'none';
    btnOk.style.padding = '8px 12px';
    btnOk.style.borderRadius = '8px';
    btnOk.onclick = () => { document.body.removeChild(modal); resolve(true); };

    modal.actions.appendChild(btnCancel);
    modal.actions.appendChild(btnOk);

    modal.addEventListener('click', (ev) => { if (ev.target === modal) { document.body.removeChild(modal); resolve(false); } });

    document.body.appendChild(modal);
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
  t.style.background = options.type === 'error' ? '#ffe6e6' : '#0b63d6';
  t.style.color = options.type === 'error' ? '#7a1313' : '#fff';
  t.style.padding = '10px 14px';
  t.style.borderRadius = '10px';
  t.style.minWidth = '180px';
  t.style.boxShadow = '0 6px 18px rgba(2,6,23,0.12)';
  t.style.display = 'flex';
  t.style.alignItems = 'center';
  t.style.justifyContent = 'space-between';

  const txt = document.createElement('div');
  txt.textContent = message;
  t.appendChild(txt);

  if (options.actionLabel && typeof options.action === 'function') {
    const act = document.createElement('button');
    act.textContent = options.actionLabel;
    act.style.marginLeft = '12px';
    act.style.background = 'transparent';
    act.style.border = '1px solid rgba(255,255,255,0.2)';
    act.style.color = '#fff';
    act.style.padding = '6px 8px';
    act.style.borderRadius = '8px';
    act.onclick = () => { options.action(); container.removeChild(t); };
    t.appendChild(act);
  }

  container.appendChild(t);
  const duration = options.duration || 4000;
  if (!options.sticky) setTimeout(() => { if (t.parentNode) container.removeChild(t); }, duration);
  return t;
}
