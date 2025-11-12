export function classifyIntent(text, allowed) {
    const s = (text || '').toLowerCase();
    let intent = 'reflect';

    if (/\b(hello|hi|hey)\b/.test(s)) intent = 'greet';
    if (/\b(light|bright|see|glow)\b/.test(s)) intent = 'ask_light';
    if (/\b(warm|heat|hot|cold|chill)\b/.test(s)) intent = 'ask_warmth';

    if (!allowed.includes(intent)) intent = 'reflect';
    return intent;
}
