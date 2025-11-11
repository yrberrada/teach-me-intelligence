const container = document.getElementById('hints');
let lastShowTs = 0;

export function showHint(html, ms = 10000, opts = {}) {
    if (!container) return;
    const { pin = false } = opts;

    const el = document.createElement('div');
    el.className = 'hint';
    el.innerHTML = html;

    if (pin) {
        const close = document.createElement('button');
        close.textContent = '×';
        close.ariaLabel = 'Close';
        close.style.cssText = `
      position:absolute; top:6px; right:8px;
      background:none; border:0; color:#9fb2d8; font-size:16px; cursor:pointer;
    `;
        close.onclick = () => dismiss();
        el.style.position = 'relative';
        el.appendChild(close);
    }

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));

    let timeoutId;
    let remaining = ms;
    let started = performance.now();

    const startTimer = () => { if (!pin) timeoutId = setTimeout(dismiss, remaining); };
    const pauseTimer = () => { if (!pin){ clearTimeout(timeoutId); remaining -= performance.now() - started; } };
    const resumeTimer = () => { if (!pin){ started = performance.now(); startTimer(); } };

    const dismiss = () => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 350);
    };

    el.addEventListener('pointerenter', pauseTimer);
    el.addEventListener('pointerleave', resumeTimer);

    const now = performance.now();
    const delay = Math.max(0, 400 - (now - lastShowTs));
    lastShowTs = now + delay;
    setTimeout(startTimer, delay);

    return { dismiss, el };
}

export function scheduleAtMs(delayMs, html, ms = 10000, opts = {}) {
    return setTimeout(() => showHint(html, ms, opts), delayMs);
}

export const scheduleHint = scheduleAtMs;
