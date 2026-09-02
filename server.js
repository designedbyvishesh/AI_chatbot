const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, getDB, closeDB } = require('./server/config/db');

const sessionsRoutes = require('./server/routes/sessions.routes');
const flowsRoutes = require('./server/routes/flows.routes');
const quizzesRoutes = require('./server/routes/quizzes.routes');
const chatRoutes = require('./server/routes/chat.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Connect Database
connectDB();

// ─── Health & Connection Check ───
app.get('/api/db-status', (req, res) => {
  const db = getDB();
  if (db) {
    res.json({ status: 'connected', database: 'design_system_ai', cluster: 'Cluster0' });
  } else {
    res.status(503).json({ status: 'disconnected', error: 'Database not initialized' });
  }
});

// ─── Modular Routes ───
app.use('/api/sessions', sessionsRoutes);
app.use('/api/flows', flowsRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/chat', chatRoutes);

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
