import { ensureAudio } from './audio/sound.js';
import { startVisuals, stopVisuals, clickImpulse } from './visuals/coreVisual.js';
import { playChapter1, stopChapter1, nudgeHeartbeat, handleCanvasClick } from './chapter1.js';

function ready(fn){ document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

ready(() => {
    const canvas        = document.getElementById('scene');
    const hud           = document.getElementById('hud');
    const startBtn      = document.getElementById('startBtn');
    const synopsisBtn   = document.getElementById('synopsisBtn');
    const synopsisPanel = document.getElementById('synopsisPanel');
    const closeSynopsis = document.getElementById('closeSynopsis');
    const idleHint      = document.getElementById('idleHint'); // ← new hint overlay

    // --- Small helpers ---
    const show = el => el && (el.hidden = false);
    const hide = el => el && (el.hidden = true);

    // --- Synopsis toggles ---
    if (synopsisBtn && synopsisPanel) synopsisBtn.addEventListener('click', () => show(synopsisPanel));
    if (closeSynopsis && synopsisPanel) closeSynopsis.addEventListener('click', () => hide(synopsisPanel));

    // --- Interaction cadence controls ---
    const MIN_CLICK_GAP = 800; // ms — block rapid-fire spam (pairs with speech queue)
    const COOLDOWN_MS   = 300; // cursor cooldown for tactile feedback
    const IDLE_MS       = 8000; // show hint after this many ms of no interactions

    let lastClickAt = 0;
    let lastActivityAt = performance.now();
    let idleTimer = null;

    function bumpActivity() {
        lastActivityAt = performance.now();
        hide(idleHint);
        restartIdleTimer();
    }

    function restartIdleTimer() {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            // Only show hint if the chapter actually started (canvas interactive)
            if (canvas && getComputedStyle(canvas).pointerEvents !== 'none') {
                show(idleHint);
            }
        }, IDLE_MS);
    }

    // --- Start Chapter ---
    startBtn.addEventListener('click', async () => {
        try {
            await ensureAudio();                // unlock audio via user gesture
            startVisuals(canvas);
            canvas.style.pointerEvents = 'auto';
            await playChapter1();               // starts ambience + Live Mode core logic

            if (hud) hud.classList.add('hide');
            startBtn.classList.add('fading');
            setTimeout(() => startBtn.remove(), 280);
            if (synopsisPanel) hide(synopsisPanel);

            bumpActivity(); // arm idle timer after start
        } catch (err) {
            console.error('[main] Start failed:', err);
            alert('Audio init failed. See console for details.');
        }
    });

    // --- Canvas Click → Stimulus ---
    canvas.addEventListener('click', async (e) => {
        const now = performance.now();
        if (now - lastClickAt < MIN_CLICK_GAP) return; // debounce
        lastClickAt = now;

        const r = canvas.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top)  / r.height;

        canvas.classList.add('cooldown');       // subtle cursor state
        setTimeout(() => canvas.classList.remove('cooldown'), COOLDOWN_MS);

        clickImpulse(nx, ny);                   // particle ripple
        nudgeHeartbeat(0.05);                   // subtle pulse

        try {
            await handleCanvasClick(nx, ny);    // ← trigger AI reply (Core or Narrator)
        } catch (err) {
            console.error('AI click error:', err);
        } finally {
            bumpActivity();
        }
    });

    // --- Idle hint click also counts as a wake gesture ---
    if (idleHint) {
        idleHint.addEventListener('click', () => {
            hide(idleHint);
            // A synthetic ripple to suggest it's interactive
            const rect = canvas.getBoundingClientRect();
            const nx = 0.5, ny = 0.5;
            clickImpulse(nx, ny);
            nudgeHeartbeat(0.05);
            // We don’t force an AI call here; next real click will
            bumpActivity();
        });
    }

    // Arm an idle timer in case the user lands and waits
    restartIdleTimer();

    // --- Cleanup ---
    window.addEventListener('beforeunload', () => { stopChapter1(); stopVisuals(); });
});
