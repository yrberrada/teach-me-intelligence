import { ensureAudio } from './audio/sound.js';
import { startVisuals, stopVisuals, clickImpulse } from './visuals/coreVisual.js';
import { playChapter1, stopChapter1, nudgeHeartbeat } from './chapter1.js';

function ready(fn){ document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

ready(() => {
    const canvas        = document.getElementById('scene');
    const hud           = document.getElementById('hud');
    const startBtn      = document.getElementById('startBtn');
    const synopsisBtn   = document.getElementById('synopsisBtn');
    const synopsisPanel = document.getElementById('synopsisPanel');
    const closeSynopsis = document.getElementById('closeSynopsis');

    if (synopsisBtn && synopsisPanel) synopsisBtn.addEventListener('click', () => (synopsisPanel.hidden = false));
    if (closeSynopsis && synopsisPanel) closeSynopsis.addEventListener('click', () => (synopsisPanel.hidden = true));

    startBtn.addEventListener('click', async () => {
        try {
            await ensureAudio();
            startVisuals(canvas);
            canvas.style.pointerEvents = 'auto';
            await playChapter1();

            if (hud) hud.classList.add('hide');
            startBtn.classList.add('fading');
            setTimeout(() => startBtn.remove(), 280);
            if (synopsisPanel) synopsisPanel.hidden = true;
        } catch (err) {
            console.error('[main] Start failed:', err);
            alert('Audio init failed. See console for details.');
        }
    });

    canvas.addEventListener('click', (e) => {
        const r = canvas.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top)  / r.height;
        clickImpulse(nx, ny);
        nudgeHeartbeat(0.05);
    });

    window.addEventListener('beforeunload', () => { stopChapter1(); stopVisuals(); });
});
