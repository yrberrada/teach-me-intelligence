// server/warm-cache.js
import 'dotenv/config';
import { CORE_TEMPLATES, NARRATOR_TEMPLATES } from '../src/ai/templates.js';
import { speak } from './tts.js';

async function warm() {
    let count = 0;

    // Core (all moods)
    for (const mood of Object.keys(CORE_TEMPLATES)) {
        for (const line of CORE_TEMPLATES[mood]) {
            await speak(line, { role: 'core' });
            count++;
            console.log(`Core/${mood}: ${line}`);
        }
    }

    // Narrator (guide + reflective)
    for (const flavor of Object.keys(NARRATOR_TEMPLATES)) {
        for (const line of NARRATOR_TEMPLATES[flavor]) {
            await speak(line, { role: 'narrator' });
            count++;
            console.log(`Narrator/${flavor}: ${line}`);
        }
    }

    console.log(`✅ Warmed ${count} lines into cache/tts`);
}

warm().catch(e => { console.error(e); process.exit(1); });
