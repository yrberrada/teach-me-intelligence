// src/chapter1.js
import { bus } from './audio/sound.js';
import { heartbeatPulse } from './visuals/coreVisual.js';
import { createCoreLogic } from './ai/coreLogic.js';

const P = (url, chain = Tone.Destination, loop = false, vol = 0) => {
    const p = new Tone.Player(url).connect(chain);
    p.loop = loop; p.volume.value = vol; return p;
};

let started = false;
let players = [];
let core;

export async function playChapter1() {
    if (started) return; started = true;

    // Load your FX paths from cues.js
    const { FX } = await import('./audio/cues.js');

    // Ambient layers (no speech; user must wake the Core)
    const hum   = P(FX.hum, bus.amb, true, -15);
    const theme = P(FX.theme, bus.amb, true, -12);
    const air   = P(FX.air, bus.amb, true, -20);
    const heart = P(FX.heartbeat, bus.fx, true, -20);

    players = [hum, theme, air, heart];
    await Tone.loaded();

    hum.start(); theme.start(); air.start(); heart.start();
    heartbeatPulse(0.22);

    // Create live logic (strict input lock is enforced inside coreLogic/speechQueue)
    core = createCoreLogic();

    // IMPORTANT: no narrator intro here — silent start by design
    Tone.Transport.start();
}

export function nudgeHeartbeat(delta = 0.05) {
    heartbeatPulse(0.20 + delta);
}

// main.js will call this on canvas click
export async function handleCanvasClick(nx, ny) {
    if (!core) return;
    await core.onClick(nx, ny);
}

export function stopChapter1() {
    try { Tone.Transport.stop(); } catch {}
    players.forEach(p => { try { p.stop(); } catch {} });
    players = []; started = false; core = null;
}
