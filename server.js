require('dotenv').config();

const express = require('express');
const path = require('path');
const { connectDB, getDB, closeDB } = require('./server/config/db');
const { ensureIndexes } = require('./server/config/indexes');
const { requireUser, publicAuthConfig } = require('./server/auth/firebaseAuth');
const { securityHeaders, corsPolicy, apiLimiter, aiLimiters } = require('./server/security');

const sessionsRoutes = require('./server/routes/sessions.routes');
const agileSessionsRoutes = require('./server/routes/agile-sessions.routes');
const flowsRoutes = require('./server/routes/flows.routes');
const quizzesRoutes = require('./server/routes/quizzes.routes');
const chatRoutes = require('./server/routes/chat.routes');
const agileChallengeRoutes = require('./server/routes/agile-challenge.routes');
const meRoutes = require('./server/routes/me.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Behind a hosting proxy (Render etc.) the visitor's real address is in X-Forwarded-For
if (process.env.NODE_ENV === 'production' || process.env.RENDER) app.set('trust proxy', 1);

app.use(securityHeaders());
app.use('/api', corsPolicy(), apiLimiter);
// Sessions carry canvas shapes and chat cards, so allow a little more than the 100 KB default
app.use(express.json({ limit: '2mb' }));
// Only the public/ folder is served, so server code, prompts and .env are never downloadable
// Agile is the start page while Quiz mode is being finished
app.get('/', (req, res) => res.redirect(302, '/agile.html'));
app.use(express.static(path.join(__dirname, 'public')));

// Connect Database
connectDB().then(ensureIndexes);

// ─── Health check for the hosting platform ───
app.get('/api/health', (req, res) => res.json({ ok: true, db: Boolean(getDB()) }));

// ─── Public: what the browser needs to start sign-in ───
app.get('/api/auth/config', (req, res) => res.json(publicAuthConfig()));

// ─── Health & Connection Check ───
app.get('/api/db-status', (req, res) => {
  const db = getDB();
  if (db) {
    res.json({ status: 'connected', database: 'design_system_ai', cluster: 'Cluster0' });
  } else {
    res.status(503).json({ status: 'disconnected', error: 'Database not initialized' });
  }
});

// ─── Modular Routes (all need a signed-in user) ───
app.use('/api/me', requireUser, meRoutes);
app.use('/api/sessions', requireUser, sessionsRoutes);
app.use('/api/agile-sessions', requireUser, agileSessionsRoutes);
app.use('/api/flows', requireUser, flowsRoutes);
app.use('/api/quizzes', requireUser, quizzesRoutes);
app.use('/api/chat', requireUser, ...aiLimiters, chatRoutes);
app.use('/api/agile', requireUser, ...aiLimiters, agileChallengeRoutes);

// Unknown API paths get JSON, not an HTML page
app.use('/api', (req, res) => res.status(404).json({ success: false, error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`Design AI Server running at http://localhost:${PORT}`);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});
