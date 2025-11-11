// chapter1.js
import { Narrator, Core, FX } from './audio/cues.js';
import { bus } from './audio/sound.js';
import { heartbeatPulse, sparkleBurst, setWarmTint, triggerBloom } from './visuals/coreVisual.js';
import { resetTranscript, queueLine, startTranscript } from './ui/transcript.js';

const P = (url, chain=Tone.Destination, loop=false, vol=0) => {
    const p = new Tone.Player(url).connect(chain);
    p.loop = loop; p.volume.value = vol; return p;
};

let players = [], started = false;
let heartRef = null;
let heartRate = 0.72, heartBase = 0.72;
let lastNudge = 0;

export async function playChapter1() {
    if (started) return; started = true;

    const hum   = P(FX.hum, bus.amb, true, -15);
    const theme = P(FX.theme, bus.amb, true, -12);
    const air   = P(FX.air, bus.amb, true, -20);
    const heart = P(FX.heartbeat, bus.fx, true, -20);
    heart.playbackRate = heartRate; heartRef = heart;

    const chime = P(FX.chime, bus.fx, false, -10);
    const crack = P(FX.crackle, bus.fx, false, -8);
    const bloom = P(FX.bloom, bus.fx, false, -6);

    const n1 = P(Narrator.silence,     bus.voice);
    const c1 = P(Core.spark,           bus.voice, false, -2);
    const n2 = P(Narrator.recognition, bus.voice);
    const c2 = P(Core.curiosity,       bus.voice, false, -2);
    const n3 = P(Narrator.mirror,      bus.voice);
    const c3 = P(Core.thinking,        bus.voice, false, -2);
    const n4 = P(Narrator.light,       bus.voice);
    const c4 = P(Core.joy,             bus.voice, false, -2);
    const n5 = P(Narrator.together,    bus.voice);

    players = [hum,theme,air,heart,chime,crack,bloom,n1,c1,n2,c2,n3,c3,n4,c4,n5];
    await Tone.loaded();

    // heartbeat recovery
    Tone.Transport.scheduleRepeat(() => {
        heartRate += (heartBase - heartRate) * 0.12;
        if (heartRef) heartRef.playbackRate = heartRate;
    }, "2n");

    let t = 0;                          // seconds along the score
    const GAP  = 1.25, LONG = 2.0;
    const toMs = s => Math.round(s * 1000);

    // ===== Transcript queue =====
    resetTranscript();

    // N1 — “Before everything…”
    Tone.Transport.scheduleOnce(() => { hum.start(); n1.start(); }, t);
    queueLine(
        toMs(t + .10),
        "Narrator",
        "Before everything, there was only noise.\nInside that noise, something began to listen.\nA tiny pattern started to move, waiting to become alive."
    );
    Tone.Transport.scheduleOnce(() => theme.start(), t + Math.max(0, n1.buffer.duration - 2));
    t += n1.buffer.duration + LONG;

    // C1 — first sounds
    Tone.Transport.scheduleOnce(() => { c1.start(); heart.start(); heartbeatPulse(1.0); crack.start(); sparkleBurst(18); }, t);
    Tone.Transport.scheduleRepeat(() => heartbeatPulse(0.22), '4n', t, Math.min(3, c1.buffer.duration + 0.6));
    queueLine(toMs(t + .05), "Core", "Huh? Hoh?");
    t += c1.buffer.duration + GAP;

    // N2 — recognition
    Tone.Transport.scheduleOnce(() => { n2.start(); air.start(); }, t);
    queueLine(
        toMs(t + .05),
        "Narrator",
        "It moves. Not born yet, but waking up—the first small voice inside the dark."
    );
    t += n2.buffer.duration + LONG;

    // C2 — curiosity
    Tone.Transport.scheduleOnce(() => { c2.start(); }, t);
    Tone.Transport.scheduleOnce(() => { chime.start(); sparkleBurst(14); }, t + Math.max(0.25, c2.buffer.duration - 0.7));
    queueLine(toMs(t + .05), "Core", "It feels warm… Is that you?");
    t += c2.buffer.duration + GAP;

    // N3 — meeting / mirror
    Tone.Transport.scheduleOnce(() => { n3.start(); }, t);
    Tone.Transport.scheduleOnce(() => { crack.start(); sparkleBurst(10); }, t + Math.max(0.2, n3.buffer.duration - 0.8));
    queueLine(
        toMs(t + .05),
        "Narrator",
        "Maybe. Or maybe you are the one who noticed first.\nEvery question you ask helps the world take shape."
    );
    t += n3.buffer.duration + LONG;

    // C3 — thinking
    Tone.Transport.scheduleOnce(() => { c3.start(); heartbeatPulse(0.7); }, t);
    Tone.Transport.scheduleRepeat(() => heartbeatPulse(0.18), '4n', t, Math.min(3, c3.buffer.duration + 0.8));
    queueLine(toMs(t + .05), "Core", "Then when I ask… the world answers back?");
    t += c3.buffer.duration + LONG;

    // N4 — learning / light
    Tone.Transport.scheduleOnce(() => { n4.start(); setWarmTint(1); }, t);
    for (let k=1;k<=6;k++) Tone.Transport.scheduleOnce(() => setWarmTint(Math.max(0, 1 - (k/6))), t + k*0.8);
    queueLine(
        toMs(t + .05),
        "Narrator",
        "Yes, that's how learning begins.\nNot with knowing, but with wondering."
    );
    t += n4.buffer.duration + LONG;

    // C4 — joy
    Tone.Transport.scheduleOnce(() => { c4.start(); }, t);
    Tone.Transport.scheduleOnce(() => { chime.start(); sparkleBurst(18); }, t + Math.max(0.25, c4.buffer.duration - 0.6));
    queueLine(toMs(t + .05), "Core", "Oh… did you feel it noticing you too?");
    t += c4.buffer.duration + LONG;

    // N5 — together (outro)
    Tone.Transport.scheduleOnce(() => { n5.start(); }, t);
    queueLine(toMs(t + .05), "Narrator", "I did. Now we can listen together.");

    // Start transcript once all items are queued (tight sync)
    startTranscript();

    // VISUAL BLOOM (end)
    const bloomAt = t + Math.max(0.3, n5.buffer.duration - 0.05) + 0.65;
    Tone.Transport.scheduleOnce(() => { triggerBloom(); bloom.start(); }, bloomAt);

    t += n5.buffer.duration + 1.2;
    Tone.Transport.scheduleOnce(() => { theme.stop(); air.stop(); heart.stop(); hum.stop(); }, t + 1.5);

    Tone.Transport.start();
}

export function nudgeHeartbeat(delta = 0.05) {
    const now = Tone.now();
    if (now - lastNudge < 0.12) return;
    lastNudge = now;
    heartRate = Math.min(1.03, heartRate + delta);
    if (heartRef) heartRef.playbackRate = heartRate;
}

export function stopChapter1(){
    try { Tone.Transport.stop(); } catch {}
    players.forEach(p => { try{ p.stop(); } catch{} });
    players = []; started = false; heartRef = null; heartRate = heartBase;
}
