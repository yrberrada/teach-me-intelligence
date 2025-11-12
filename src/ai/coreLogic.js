// src/ai/coreLogic.js
import { askCore } from './client.js';
import { heartbeatPulse, sparkleBurst, setWarmTint } from '../visuals/coreVisual.js';
import { queueLine } from '../ui/transcript.js';
import { speechQueue } from '../audio/speechQueue.js';

export function createCoreLogic() {
    const state = {
        interactionCount: 0,
        mood: 'curious',          // curious → warm → reflective
        lastRole: null,           // 'core' | 'narrator'
        awaiting: false,          // lock while we fetch/speak one line
        minInputGapMs: 800,
        lastEventAt: 0
    };

    function updateMood() {
        const n = state.interactionCount;
        state.mood = n > 12 ? 'reflective' : n > 5 ? 'warm' : 'curious';
    }

    function reactTo(text) {
        const s = (text || '').toLowerCase();
        if (s.includes('warm') || s.includes('bright') || s.includes('glow')) {
            setWarmTint(1); setTimeout(() => setWarmTint(0.2), 800);
            sparkleBurst(12);
            heartbeatPulse(0.28);
        } else if (s.includes('silence') || s.includes('dark') || s.includes('quiet')) {
            setWarmTint(0.1);
            heartbeatPulse(0.16);
        } else {
            heartbeatPulse(0.22);
        }
    }

    function canAcceptInput() {
        const now = performance.now();
        if (now - state.lastEventAt < state.minInputGapMs) return false; // debounce
        if (state.awaiting) return false;             // wait while a request/line is in progress
        if (speechQueue.isBusy()) return false;       // wait while any voice is speaking/queued
        state.lastEventAt = now;
        return true;
    }

    async function speakFromAPI(userText) {
        updateMood();

        if (userText && userText !== '__click__') {
            queueLine(performance.now() + 20, 'You', userText);
        }

        state.awaiting = true;

        // Ask server ONCE per input
        const { role: rawRole, text, audioUrl } = await askCore(userText, state.mood);

        // Guard: don’t allow two narrators back-to-back
        const role = (rawRole === 'narrator' && state.lastRole === 'narrator') ? 'core' : rawRole;

        const who = role === 'narrator' ? 'Narrator' : 'Core';
        queueLine(performance.now() + 60, who, text);
        reactTo(text);

        // Enqueue this single line and WAIT for it to finish before unlocking
        await speechQueue.enqueue(role, audioUrl);

        state.interactionCount++;
        state.lastRole = role;
        state.awaiting = false;
    }

    return {
        async onClick(nx, ny) {
            if (!canAcceptInput()) return;
            await speakFromAPI('__click__');
        },
        async onUserText(text) {
            if (!canAcceptInput()) return;
            await speakFromAPI(text);
        },
        getState() { return { ...state }; }
    };
}
