import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

const ELEVEN_API_KEY   = process.env.ELEVEN_API_KEY;
const VOICE_ID_CORE    = process.env.VOICE_ID_CORE;
const VOICE_ID_NARRATOR = process.env.VOICE_ID_NARRATOR;
const CACHE_DIR = path.join(process.cwd(), 'cache', 'tts');

export async function speak(text, { role = 'core', settings = {} } = {}) {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    const voiceId = role === 'narrator' ? VOICE_ID_NARRATOR : VOICE_ID_CORE;
    const key = crypto.createHash('sha1')
        .update(JSON.stringify({ text, role, settings }))
        .digest('hex');

    const file = path.join(CACHE_DIR, key + '.mp3');

    // cache hit → skip API call
    try { await fs.access(file); return file; } catch {}

    const body = {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
            stability: settings.stability ?? (role === 'narrator' ? 0.8 : 0.55),
            similarity_boost: settings.similarity_boost ?? 0.78,
            style: settings.style ?? (role === 'core' ? 0.2 : 0.1),
            use_speaker_boost: true
        }
    };

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': ELEVEN_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!r.ok) throw new Error('TTS failed: ' + await r.text());

    const buf = Buffer.from(await r.arrayBuffer());
    await fs.writeFile(file, buf);
    return file;
}
