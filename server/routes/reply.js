// server/routes/reply.js
import express from 'express';
import Ajv from 'ajv';
import path from 'path';
import { classifyIntent } from '../../src/ai/intent.js';
import { pickLine } from '../../src/ai/templates.js';
import { speak } from '../tts.js';

const router = express.Router();
const ajv = new Ajv({ allErrors: true });

const schema = {
    type: 'object',
    properties: {
        intent: { enum: ['greet', 'ask_light', 'ask_warmth', 'reflect'] },
        text: { type: 'string', maxLength: 240 },
        audioUrl: { type: 'string' },
        role: { enum: ['core','narrator'] }
    },
    required: ['intent','text','audioUrl','role'],
    additionalProperties: false
};
const validate = ajv.compile(schema);

router.post('/api/reply', express.json(), async (req, res) => {
    try {
        const { userText, storyState, mood = 'curious' } = req.body || {};
        const allowed = storyState?.allowed_intents || ['greet','ask_light','ask_warmth','reflect'];

        const intent = classifyIntent(userText, allowed);

        // Narrator chance
        let role = 'core';
        if (intent === 'reflect') role = Math.random() < 0.6 ? 'narrator' : 'core';
        else if (Math.random() < 0.22) role = 'narrator';

        const flavor = role === 'narrator'
            ? (Math.random() < 0.5 ? 'guide' : 'reflective')
            : 'guide';

        const text = pickLine({ role, mood, flavor });

        // speak() returns a full filepath; we must expose only the filename
        const fileFullPath = await speak(text, { role });
        const fileName = path.basename(fileFullPath); // ✅ cross-platform

        const payload = {
            role,
            intent,
            text,
            audioUrl: '/cache/tts/' + fileName
        };

        if (!validate(payload)) {
            return res.status(400).json({ error: 'invalid_payload', details: validate.errors });
        }
        res.json(payload);
    } catch (e) {
        console.error('[reply] error:', e);
        res.status(500).json({ error: 'server_error' });
    }
});

export default router;
