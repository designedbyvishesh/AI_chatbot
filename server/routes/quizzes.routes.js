const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const { cleanJson } = require('../utils/sanitize');

// Save Quiz History
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.status(503).json({ error: 'DB not connected' });
    const collection = db.collection('quiz_history');
    const result = await collection.insertOne({
      ...cleanJson(req.body || {}),
      userId: req.user.uid,
      completedAt: new Date()
    });
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
