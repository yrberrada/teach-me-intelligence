// src/ai/client.js
import storyState from '../story/state.js';

export async function askCore(userText, mood = 'curious') {
    const r = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userText, mood, storyState })
    });
    if (!r.ok) throw new Error('AI reply failed');
    return r.json(); // { role, intent, text, audioUrl }
}
