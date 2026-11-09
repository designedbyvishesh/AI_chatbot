/**
 * Agile whiteboard sessions. Every route only sees the signed-in user's own
 * sessions (req.user.uid is set by requireUser in server.js).
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const { pickAgileSession, isSafeId } = require('../utils/sanitize');

const COLLECTION = 'agile_sessions';

function collectionOr503(res) {
  const db = getDB();
  if (!db) {
    res.status(503).json({ success: false, error: 'DB not connected' });
    return null;
  }
  return db.collection(COLLECTION);
}

const toClient = (doc) => {
  const { _id, userId, ...rest } = doc;
  return { ...rest, id: doc.id || _id.toString() };
};

// Create or update a session (the client sends the whole session on every save)
router.post('/', async (req, res) => {
  try {
    const collection = collectionOr503(res);
    if (!collection) return;

    const id = isSafeId(req.body && req.body.id) ? req.body.id : `agile-${Date.now()}`;
    const fields = pickAgileSession(req.body);

    await collection.updateOne(
      { userId: req.user.uid, id },
      {
        $set: { ...fields, serverTimestamp: new Date() },
        $setOnInsert: { userId: req.user.uid, id, createdAt: new Date() }
      },
      { upsert: true }
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error('[AgileSessions] save:', err.message);
    res.status(500).json({ success: false, error: 'Could not save the session.' });
  }
});

// List my sessions, newest first
router.get('/', async (req, res) => {
  try {
    const collection = collectionOr503(res);
    if (!collection) return;

    const raw = await collection
      .find({ userId: req.user.uid })
      .sort({ serverTimestamp: -1 })
      .limit(200)
      .toArray();
    res.json({ success: true, sessions: raw.map(toClient) });
  } catch (err) {
    console.error('[AgileSessions] list:', err.message);
    res.status(500).json({ success: false, error: 'Could not load sessions.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const collection = collectionOr503(res);
    if (!collection) return;

    const session = await collection.findOne({ userId: req.user.uid, id: req.params.id });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, session: toClient(session) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load the session.' });
  }
});

// Update some fields (title, notes, favourite, ...) of one of my sessions
router.put('/:id', async (req, res) => {
  try {
    const collection = collectionOr503(res);
    if (!collection) return;

    const fields = pickAgileSession(req.body);
    if (!Object.keys(fields).length) return res.status(400).json({ success: false, error: 'Nothing to update' });

    const result = await collection.updateOne(
      { userId: req.user.uid, id: req.params.id },
      { $set: { ...fields, updatedAt: new Date() } }
    );
    if (!result.matchedCount) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not update the session.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const collection = collectionOr503(res);
    if (!collection) return;

    await collection.deleteOne({ userId: req.user.uid, id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not delete the session.' });
  }
});

module.exports = router;
