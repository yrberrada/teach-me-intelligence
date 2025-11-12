// server/index.js
import 'dotenv/config';
import path from 'path';
import express from 'express';
import reply from './routes/reply.js';

const app = express();
const PORT = process.env.PORT || 5050;

app.get('/api/ping', (_req, res) => res.json({ ok: true })); // health

// serve generated TTS cache
app.use('/cache/tts', express.static(path.join(process.cwd(), 'cache', 'tts')));

// serve your site (index.html at project root)
app.use(express.static(process.cwd()));

// API
app.use(reply);

app.listen(PORT, () => {
    console.log(`✅ Server running → http://localhost:${PORT}`);
});
