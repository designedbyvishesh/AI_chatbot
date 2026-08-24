const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');

// Save Hierarchy Flow
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('hierarchy_flows');
    const document = {
      ...req.body,
      createdAt: new Date()
    };
    const result = await collection.insertOne(document);
    res.json({ success: true, id: result.insertedId, message: 'Hierarchy flow saved in MongoDB!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Saved Hierarchy Flows
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('hierarchy_flows');
    const flows = await collection.find({}).sort({ createdAt: -1 }).limit(20).toArray();
    res.json({ success: true, flows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
