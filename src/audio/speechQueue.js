// src/audio/speechQueue.js
import { bus } from './sound.js';

class SpeechQueue {
    constructor() {
        this.queues = { core: [], narrator: [] };
        this.playing = { core: false, narrator: false };
        this.minGapMs = 650;
        this.lastEndedAt = { core: 0, narrator: 0 };
    }

    isBusy() {
        return this.playing.core || this.playing.narrator ||
            this.queues.core.length > 0 || this.queues.narrator.length > 0;
    }

    async _playOne(role, url, fadeIn = 0.05, fadeOut = 0.08) {
        const now = performance.now();
        const wait = Math.max(0, this.minGapMs - (now - this.lastEndedAt[role]));
        if (wait) await new Promise(r => setTimeout(r, wait));

        return new Promise((resolve, reject) => {
            try {
                this.playing[role] = true;
                const player = new Tone.Player({ url, fadeIn, fadeOut }).connect(bus.voice);

                // Fallback resolve in case onstop isn't called (rare)
                const finalize = () => {
                    this.lastEndedAt[role] = performance.now();
                    this.playing[role] = false;
                    resolve();
                };

                player.onstop = finalize;
                player.autostart = true;

                // Safety timeout based on buffer duration when ready
                player.onload = () => {
                    const dur = (player.buffer?.duration ?? 2.0) * 1000 / (player.playbackRate || 1);
                    setTimeout(() => finalize(), dur + 50);
                };
            } catch (e) { reject(e); }
        });
    }

    async _drain(role) {
        if (this.playing[role]) return; // already draining/playing
        // Note: this.playing[role] is set in _playOne when it actually starts
        while (this.queues[role].length) {
            const item = this.queues[role][0];
            await this._playOne(role, item.url);
            // resolve the promise returned by enqueue for THIS item
            this.queues[role].shift();
            try { item.resolve(); } catch {}
        }
    }

    // returns a Promise that resolves when THIS specific audio finishes
    enqueue(role, url) {
        return new Promise((resolve) => {
            this.queues[role].push({ url, resolve });
            this._drain(role);
        });
    }

    clear(role) {
        this.queues[role] = [];
    }

    clearAll() {
        this.clear('core'); this.clear('narrator');
    }
}

export const speechQueue = new SpeechQueue();
