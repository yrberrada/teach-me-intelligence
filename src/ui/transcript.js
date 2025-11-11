// ui/transcript.js — single-line bubble captions with "smoke" fade
// API: resetTranscript(), queueLine(atMs, speaker, text), startTranscript()

let schedule = [];
let started = false;
let timerIds = [];
let container;

/* ---------- styles (injected once) ---------- */
function injectStyles() {
    if (document.getElementById("transcript-styles")) return;
    const css = `
  /* Safety: hide any legacy rails if present */
  #caption, #caption-rail, .caption-rail, .subtitle-rail, .transcript-rail {
    display: none !important; visibility: hidden !important;
  }

  .t-wrap{
    position:fixed; left:50%; bottom:42px; transform:translateX(-50%);
    max-width:min(84ch, calc(100vw - 48px));
    pointer-events:none; z-index:20;
  }
  .t-line{
    margin:0; padding:12px 18px; border-radius:14px;
    background:rgba(8,15,26,.58); backdrop-filter:blur(6px);
    border:1px solid rgba(255,255,255,.08); color:#e7eef7;
    font: 17px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Arial;
    box-shadow: 0 10px 34px rgba(0,0,0,.28);
    display:inline-block; opacity:0; transform:translateY(6px);
    transition: opacity .28s ease, transform .28s ease, filter .28s ease;
    white-space:pre-wrap;
  }
  .t-line.small { font-size:16px; } /* shrink long lines slightly */

  .t-line.enter { opacity:1; transform:translateY(0); }

  /* "Smoke" exit: drift up + blur + fade */
  @keyframes smokeOut {
    0%   { opacity:1; transform:translateY(0);    filter:blur(0px); }
    60%  { opacity:.35; transform:translateY(-6px); filter:blur(2px); }
    100% { opacity:0; transform:translateY(-12px); filter:blur(4px); }
  }
  .t-line.exit  {
    animation: smokeOut 420ms ease-out forwards;
  }

  .t-speaker{
    text-transform:uppercase; letter-spacing:.04em; font-weight:800;
    opacity:.95; margin-right:.6ch;
  }
  .t-speaker.core       { color:#ffd78a; }   /* warm amber */
  .t-speaker.narrator   { color:#a7c4ff; }   /* cool blue  */
  `;
    const tag = document.createElement("style");
    tag.id = "transcript-styles";
    tag.textContent = css;
    document.head.appendChild(tag);
}

/* ---------- legacy cleanup ---------- */
function cleanupLegacyRails() {
    const selectors = [
        '#caption', '#caption-rail', '.caption-rail', '.subtitle-rail', '.transcript-rail'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(n => n.remove());
    // heuristic: remove any fixed bottom thin bars accidentally left
    document.querySelectorAll('div,section,footer').forEach(n => {
        try {
            const s = getComputedStyle(n);
            const rect = n.getBoundingClientRect();
            if (
                s.position === 'fixed' &&
                rect.bottom >= (window.innerHeight - 5) &&
                rect.height < 36 &&
                rect.width > 300 &&
                (s.borderRadius.includes('999') || parseFloat(s.borderRadius) >= 10)
            ) {
                n.remove();
            }
        } catch {}
    });
}

/* ---------- DOM helpers ---------- */
function getContainer() {
    if (container) return container;
    injectStyles();
    cleanupLegacyRails();
    container = document.createElement("div");
    container.className = "t-wrap";
    document.body.appendChild(container);
    return container;
}

function makeLineEl(speaker, text) {
    const el = document.createElement("div");
    el.className = "t-line";
    if ((text || "").length > 160) el.classList.add("small");

    const sp = document.createElement("span");
    sp.className = "t-speaker " + (speaker.toLowerCase() === "core" ? "core" : "narrator");
    sp.textContent = speaker.toUpperCase() + ": ";

    const body = document.createElement("span");
    body.textContent = text;

    el.appendChild(sp);
    el.appendChild(body);
    return el;
}

function showSingleLine(speaker, text) {
    const wrap = getContainer();

    // fade out previous line if present
    const prev = wrap.firstElementChild;
    if (prev) {
        prev.classList.remove("enter");
        prev.classList.add("exit");
        prev.addEventListener('animationend', () => prev.remove(), { once:true });
    }

    const line = makeLineEl(speaker, text);
    wrap.appendChild(line);
    requestAnimationFrame(() => line.classList.add("enter"));
}

/* ---------- Public API ---------- */

export function resetTranscript() {
    started = false;
    schedule = [];
    timerIds.forEach(id => clearTimeout(id));
    timerIds = [];

    const wrap = getContainer();
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);

    cleanupLegacyRails();
}

export function queueLine(atMs, speaker, text) {
    schedule.push({ at: Math.max(0, atMs|0), speaker, text });
}

export function startTranscript() {
    if (started) return;
    started = true;

    schedule.sort((a,b) => a.at - b.at);

    const t0 = performance.now();
    for (const item of schedule) {
        const delay = Math.max(0, item.at - (performance.now() - t0));
        const id = setTimeout(() => showSingleLine(item.speaker, item.text), delay);
        timerIds.push(id);
    }
}

/* also run cleanup ASAP if module is imported early */
if (document.readyState !== 'loading') {
    injectStyles(); cleanupLegacyRails();
} else {
    document.addEventListener('DOMContentLoaded', () => { injectStyles(); cleanupLegacyRails(); });
}
