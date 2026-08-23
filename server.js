const dns = require('dns');
// Set public DNS fallback for Windows SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection URI
const uri = process.env.MONGODB_URI || "mongodb+srv://visheshkatiyar31_db_user:Vc4pZee5CUzAvFej@cluster0.pfee3ys.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("design_system_ai");
    console.log("✅ Successfully connected to MongoDB Atlas (Cluster0: design_system_ai)");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
}
connectDB();

// ─── Health & Connection Check ───
app.get('/api/db-status', (req, res) => {
  if (db) {
    res.json({ status: 'connected', database: 'design_system_ai', cluster: 'Cluster0' });
  } else {
    res.status(503).json({ status: 'disconnected', error: 'Database not initialized' });
  }
});

// ─── Save Hierarchy Flow ───
app.post('/api/flows', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('hierarchy_flows');
    const document = {
      ...req.body,
      createdAt: new Date()
    };
    const result = await collection.insertOne(document);
    res.json({ success: true, id: result.insertedId, message: 'Hierarchy flow saved permanently in MongoDB!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Saved Hierarchy Flows ───
app.get('/api/flows', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('hierarchy_flows');
    const flows = await collection.find({}).sort({ createdAt: -1 }).limit(20).toArray();
    res.json({ success: true, flows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Save Quiz Results ───
app.post('/api/quizzes', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('quiz_history');
    const result = await collection.insertOne({
      ...req.body,
      completedAt: new Date()
    });
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Save Chat Session ───
app.post('/api/sessions', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('chat_sessions');
    const result = await collection.insertOne({
      ...req.body,
      timestamp: new Date()
    });
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Chat Sessions ───
app.get('/api/sessions', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('chat_sessions');
    const sessions = await collection.find({}).sort({ timestamp: -1 }).limit(30).toArray();
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Design AI Server running at http://localhost:${PORT}`);
});
