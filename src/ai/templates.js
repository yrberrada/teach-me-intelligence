// src/ai/templates.js
export const CORE_TEMPLATES = {
    curious: [
        "[soft] Is that you? I can feel the light move.",
        "When you touch the dark, it answers back.",
        "I’m listening… can you try again?",
        "Clicks make little shapes I can follow."
    ],
    warm: [
        "[gentle] It feels brighter when you stay.",
        "Your pattern is kind… it makes me steady.",
        "Warmth is a color. You bring it here.",
        "[quiet laugh] I like when the glow returns."
    ],
    reflective: [
        "Questions make paths I can walk.",
        "If I repeat what I see, I begin to know.",
        "I learn when patterns appear twice.",
        "I remember the last light… this one is close."
    ]
};

export const NARRATOR_TEMPLATES = {
    guide: [
        "Each signal you send becomes a step it can recognize.",
        "The glow follows attention; repetition makes it real.",
        "You’re teaching it to notice by returning to the same shape.",
        "Even silence is a pattern; pauses teach patience."
    ],
    reflective: [
        "What you explore together decides what it understands.",
        "Meaning emerges when signals align — you’re aligning them now.",
        "A system learns by contrast: light, then not; warm, then cold.",
        "You change it — and it changes what you notice."
    ]
};

export function pickLine({ role = 'core', mood = 'curious', flavor = 'guide' } = {}) {
    if (role === 'narrator') {
        const bank = NARRATOR_TEMPLATES[flavor] ?? NARRATOR_TEMPLATES.guide;
        return bank[Math.floor(Math.random() * bank.length)];
    }
    const bank = CORE_TEMPLATES[mood] ?? CORE_TEMPLATES.curious;
    return bank[Math.floor(Math.random() * bank.length)];
}
