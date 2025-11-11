// src/audio/sound.js
// Global audio buses + subtle voice shimmer, UI SFX, and safe fallbacks.
// Tone.js is loaded via <script> in index.html.

let audioStarted = false;

/* ----------------------- BUSES (mix groups) ----------------------- */
export const bus = {
    amb:   new Tone.Gain(0.7),   // ambience & music
    fx:    new Tone.Gain(0.9),   // one-shots, UI, transitions
    voice: new Tone.Gain(0.9),   // narrator + core
};

// Subtle spatial chain for voices (makes speech feel “in-world”)
const chorus = new Tone.Chorus({
    frequency: 0.6, depth: 0.25, delayTime: 3.5, wet: 0.18
}).start();
const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.25 });

bus.voice.chain(chorus, reverb, Tone.Destination);
bus.fx.toDestination();
bus.amb.toDestination();

// Global tempo feel (slow, breathing). Chapter timelines may change BPM later.
Tone.Transport.bpm.value = 66;

/* --------------------- INIT / POWER-ON SEQUENCE -------------------- */
export async function ensureAudio() {
    // Call once (e.g., from main.js on button click) to unlock audio context.
    if (audioStarted) return;
    await Tone.start();
    audioStarted = true;
}

/* --------------------------- UI FEEDBACK --------------------------- */
// Soft “tick + bell” on interactions (keeps the interface feeling physical)
const clickDrum = new Tone.MembraneSynth({ octaves: 6, pitchDecay: 0.01 }).connect(bus.fx);
const bell = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.20, sustain: 0, release: 0.20 },
}).connect(bus.fx);

export function pulseClick() {
    if (!audioStarted) return;
    clickDrum.triggerAttackRelease("C2", "16n");
    bell.triggerAttackRelease("C5", "16n", "+0.02");
}

// Small closing melody for scene transitions
export function tinyMelodyClose() {
    if (!audioStarted) return;
    const s = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.4 }
    }).connect(bus.fx);

    const seq = new Tone.Sequence(
        (time, note) => s.triggerAttackRelease(note, "8n", time),
        ["E5", "G5", "C5", "G5"],
        "8n"
    ).start("+0.1");

    // auto-stop the short sequence
    setTimeout(() => seq.stop(), 1500);
}

/* ----------------------- MUSICAL FALLBACKS ------------------------ */
// Use when a voice file is missing during development.
// It “suggests” speech intonation with a gentle sine sequence.
export function speakOrFallback(voiceUrl, fallbackNotes = ["G4", "A#4", "D5"]) {
    if (!audioStarted) return;

    if (voiceUrl) {
        const player = new Tone.Player({ url: voiceUrl, fadeIn: 0.05, fadeOut: 0.1 })
            .connect(bus.voice);
        player.autostart = true;
        return player;
    }

    const synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.12, sustain: 0, release: 0.25 },
    }).connect(bus.voice);

    const seq = new Tone.Sequence(
        (time, note) => synth.triggerAttackRelease(note, "8n", time),
        fallbackNotes,
        "8n"
    ).start("+0.03");

    setTimeout(() => seq.stop(), 1400);
    return seq;
}

/* ---------------------------- UTILITIES --------------------------- */
export function stopAllSound() {
    try { Tone.Transport.stop(); } catch {}
}
