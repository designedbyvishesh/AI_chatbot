const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');

// Save Chat Session
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('chat_sessions');
    const result = await collection.insertOne({
      ...req.body,
      serverTimestamp: new Date()
    });
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Chat Sessions
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('chat_sessions');
    const raw = await collection.find({}).sort({ serverTimestamp: -1 }).limit(50).toArray();
    const sessions = raw.map(doc => ({
      ...doc,
      id: doc.id || doc._id.toString(),
      _id: undefined
    }));
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Chat Session
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('chat_sessions');
    await collection.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
