const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');

// Create / Save New Agile Whiteboard Session
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('agile_sessions');

    const sessionData = {
      id: req.body.id || `agile-${Date.now()}`,
      title: req.body.title || 'W1',
      prompt: req.body.prompt || '',
      answers: req.body.answers || {},
      difficulty: req.body.difficulty || req.body.answers?.difficulty || 'Normal',
      category: req.body.category || req.body.answers?.category || 'Random',
      duration: req.body.duration || req.body.answers?.duration || '45 min',
      recordedTime: req.body.recordedTime || '- 45:00',
      notes: req.body.notes || [],
      chatHistory: req.body.chatHistory || [],
      audioUrl: req.body.audioUrl || '',
      serverTimestamp: new Date()
    };

    const result = await collection.insertOne(sessionData);
    res.json({ success: true, id: sessionData.id, mongoId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch All Agile Whiteboard Sessions (Sorted newest first)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('agile_sessions');

    const raw = await collection.find({}).sort({ serverTimestamp: -1 }).limit(100).toArray();
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

// Fetch Single Agile Session by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('agile_sessions');

    const session = await collection.findOne({ id: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json({ success: true, session: { ...session, id: session.id || session._id.toString(), _id: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Agile Session (Title, Notes, Chat History, or Time)
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('agile_sessions');

    const updateFields = {
      ...req.body,
      updatedAt: new Date()
    };
    delete updateFields._id;
    delete updateFields.id;

    await collection.updateOne(
      { id: req.params.id },
      { $set: updateFields }
    );

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Agile Session
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('agile_sessions');

    await collection.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
