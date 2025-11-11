// ch1_script.js — Chapter 1 sequencing (voices + ambience + captions)
// Works with: src/ch1.config.js, src/audio/cues.js, src/audio/sound.js
// Requires Tone.js (loaded in index.html)

import * as Tone from "tone";
import { CH1 } from "./ch1.config.js";
import { Narrator, Core, FX } from "./audio/cues.js";
import { bus, ensureAudio, tinyMelodyClose } from "./audio/sound.js";

// ---------- small UI: captions ----------
function getOrCreateCaption() {
    let el = document.getElementById("caption");
    if (!el) {
        el = document.createElement("div");
        el.id = "caption";
        el.style.cssText = `
      position: fixed; left: 50%; bottom: 40px; transform: translateX(-50%);
      max-width: 70ch; padding: 12px 16px; border-radius: 12px;
      background: rgba(10,16,28,.55); color: #e7eef7; text-align: center;
      border: 1px solid rgba(255,255,255,.08); backdrop-filter: blur(6px);
      font: 16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Arial;
    `;
        document.body.appendChild(el);
    }
    return el;
}
function setCaption(id) {
    const el = getOrCreateCaption();
    el.textContent = CH1.lines[id] || "";
}

// ---------- helpers ----------
const P = (url, chain = bus.voice, loop = false, vol = 0) => {
    const p = new Tone.Player(url).connect(chain);
    p.loop = loop;
    p.volume.value = vol;
    return p;
};

let started = false;
let disposables = [];
let clickHandler = null;

function add(d) { disposables.push(d); return d; }
function disposeAll() {
    try { Tone.Transport.stop(); } catch {}
    disposables.forEach(d => { try { d.stop?.(); d.dispose?.(); } catch {} });
    disposables = [];
    started = false;
    if (clickHandler) {
        window.removeEventListener("click", clickHandler);
        clickHandler = null;
    }
}

// ---------- build players ----------
function buildPlayers() {
    // ambience
    const hum   = add(P(FX.hum,    bus.amb, true, -15));
    const wind  = add(P(FX.air,    bus.amb, true, -20));
    const heart = add(P(FX.heartbeat, bus.fx, true, -18));
    const theme = add(P(FX.theme,  bus.amb, true, -12));
    const chime = add(P(FX.chime,  bus.fx, false, -10));
    const crack = add(P(FX.crackle,bus.fx, false, -8));
    const bloom = add(P(FX.bloom,  bus.fx, false, -6));

    // voices (map by id used in CH1.order)
    const voices = {
        narr_01: add(P(Narrator.silence)),
        core_01: add(P(Core.spark,      bus.voice, false, -2)),
        narr_02: add(P(Narrator.recognition)),
        core_02: add(P(Core.curiosity,  bus.voice, false, -2)),
        narr_03: add(P(Narrator.mirror)),
        core_03: add(P(Core.thinking,   bus.voice, false, -2)),
        narr_04: add(P(Narrator.light)),
        core_04: add(P(Core.joy,        bus.voice, false, -2)),
        narr_05: add(P(Narrator.together)),
    };

    return { hum, wind, heart, theme, chime, crack, bloom, voices };
}

// ---------- AUTOPLAY MODE ----------
async function runAutoplay() {
    const { hum, wind, heart, theme, chime, crack, bloom, voices } = buildPlayers();
    await Tone.loaded();

    // Base ambience at chapter start
    let t = 0;
    Tone.Transport.scheduleOnce(() => hum.start(), t);
    Tone.Transport.scheduleOnce(() => theme.start(), t + 12);

    // Sequence each line using the real audio durations
    const order = CH1.order;
    const fxFor = (id) => {
        if (id === "core_01") return () => { heart.start(); crack.start(); };
        if (id === "core_02") return () => chime.start();
        if (id === "narr_02") return () => wind.start();
        if (id === "narr_03") return () => crack.start();
        if (id === "core_04") return () => chime.start();
        if (id === "narr_05") return () => bloom.start();
        return null;
    };

    for (const id of order) {
        const p = voices[id];
        if (!p || !p.buffer) continue;

        // caption + line
        Tone.Transport.scheduleOnce(() => setCaption(id), t);
        Tone.Transport.scheduleOnce(() => p.start(), t);

        // context FX (when the line starts)
        const cue = fxFor(id);
        if (cue) Tone.Transport.scheduleOnce(cue, t + 0.2);

        // advance by duration + a tiny spacer
        t += p.buffer.duration + 0.6;
    }

    // close + fade ambience
    Tone.Transport.scheduleOnce(() => {
        tinyMelodyClose();
        heart.stop(); wind.stop(); theme.stop(); hum.stop();
    }, t + 1.2);

    Tone.Transport.start();
}

// ---------- INTERACTIVE MODE ----------
async function runInteractive() {
    const { hum, wind, heart, theme, chime, crack, bloom, voices } = buildPlayers();
    await Tone.loaded();

    // base ambience as soon as we start interactive
    hum.start();
    theme.start();

    const thresholds = CH1.thresholds;
    const order = CH1.order;
    let tap = 0;
    let progressed = new Set();

    setCaption("narr_01");              // show intro text
    voices["narr_01"].start();          // play intro line once

    clickHandler = () => {
        tap += 1;

        for (const id of order) {
            const need = thresholds[id];
            if (need && tap === need && !progressed.has(id)) {
                progressed.add(id);

                // voice + caption
                setCaption(id);
                voices[id].start("+0.05");

                // FX per beat
                if (id === "core_01") { heart.start(); crack.start(); }
                if (id === "narr_02") { wind.start(); }
                if (id === "core_02" || id === "core_04") { chime.start(); }
                if (id === "narr_03") { crack.start(); }
                if (id === "narr_05") { bloom.start(); }

                // on the last line, schedule a gentle end
                if (id === "narr_05") {
                    setTimeout(() => {
                        tinyMelodyClose();
                        heart.stop(); wind.stop(); theme.stop(); hum.stop();
                    }, 2500);
                }
            }
        }
    };

    window.addEventListener("click", clickHandler);
}

// ---------- PUBLIC API ----------
export async function startChapter1() {
    if (started) return;
    started = true;
    await ensureAudio({ enableProceduralAmbient: false });

    if (CH1.mode === "interactive") {
        await runInteractive();
    } else {
        await runAutoplay();
    }
}

export function stopChapter1() { disposeAll(); }
