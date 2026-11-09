/**
 * Quiz-mode chat sessions. Every route only sees the signed-in user's own data.
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const { pickChatSession, isSafeId } = require('../utils/sanitize');

const COLLECTION = 'chat_sessions';

function collectionOr503(res) {
  const db = getDB();
  if (!db) {
    res.status(503).json({ success: false, error: 'DB not connected' });
    return null;
  }
  return db.collection(COLLECTION);
}

// Save (create or update) a chat session
router.post('/', async (req, res) => {
  try {
    const collection = collectionOr503(res);
    if (!collection) return;

    const id = isSafeId(req.body && req.body.id) ? req.body.id : `session_${Date.now()}`;
    await collection.updateOne(
      { userId: req.user.uid, id },
      {
        $set: { ...pickChatSession(req.body), serverTimestamp: new Date() },
        $setOnInsert: { userId: req.user.uid, id }
      },
      { upsert: true }
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error('[ChatSessions] save:', err.message);
    res.status(500).json({ success: false, error: 'Could not save the chat.' });
  }
});

// List my chat sessions
router.get('/', async (req, res) => {
  try {
    const collection = collectionOr503(res);
    if (!collection) return;

    const raw = await collection.find({ userId: req.user.uid }).sort({ serverTimestamp: -1 }).limit(50).toArray();
    const sessions = raw.map(({ _id, userId, ...doc }) => ({ ...doc, id: doc.id || _id.toString() }));
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load chats.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const collection = collectionOr503(res);
    if (!collection) return;

    await collection.deleteOne({ userId: req.user.uid, id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not delete the chat.' });
  }
});

module.exports = router;
