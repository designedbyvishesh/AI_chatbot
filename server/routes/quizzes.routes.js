const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');

// Save Quiz History
router.post('/', async (req, res) => {
  try {
    const db = getDB();
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

module.exports = router;
