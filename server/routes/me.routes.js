/**
 * The signed-in user's own account.
 *
 * GET    /api/me         -> profile (created on first visit)
 * PUT    /api/me         -> update name, role, college, consents
 * POST   /api/me/import  -> copy sessions saved in this browser before accounts existed
 * DELETE /api/me         -> delete all of my data (the browser then deletes the sign-in account)
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const { pickProfile, pickAgileSession, pickChatSession, isSafeId } = require('../utils/sanitize');

const USER_DATA_COLLECTIONS = ['agile_sessions', 'chat_sessions', 'hierarchy_flows', 'quiz_history'];

function toProfile(user, doc) {
  const d = doc || {};
  const profile = {
    uid: user.uid,
    email: user.email || d.email || '',
    name: d.name || user.name || '',
    photoURL: user.picture || d.photoURL || '',
    role: d.role || '',
    college: d.college || '',
    ageConfirmed: Boolean(d.ageConfirmed),
    termsAccepted: Boolean(d.termsAccepted),
    recordingConsent: Boolean(d.recordingConsent),
    plan: d.plan || 'free',
    emailVerified: Boolean(user.emailVerified),
    provider: user.provider || '',
    local: Boolean(user.local),
    createdAt: d.createdAt || null,
    stored: Boolean(doc)
  };
  // Onboarding is done once the person confirmed their age and accepted the terms
  profile.onboarded = profile.ageConfirmed && profile.termsAccepted && Boolean(profile.name);
  return profile;
}

router.get('/', async (req, res) => {
  const db = getDB();
  if (!db) return res.json({ success: true, profile: toProfile(req.user, null), db: false });
  try {
    const users = db.collection('users');
    const doc = await users.findOneAndUpdate(
      { uid: req.user.uid },
      {
        $set: { email: req.user.email, photoURL: req.user.picture, lastSeenAt: new Date() },
        $setOnInsert: { uid: req.user.uid, name: req.user.name || '', plan: 'free', createdAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );
    res.json({ success: true, profile: toProfile(req.user, doc), db: true });
  } catch (err) {
    console.error('[Me] get:', err.message);
    res.status(500).json({ success: false, error: 'Could not load your profile.' });
  }
});

router.put('/', async (req, res) => {
  const fields = pickProfile(req.body);
  if (fields.name !== undefined && !fields.name) {
    return res.status(400).json({ success: false, error: 'Please enter your name.' });
  }
  const db = getDB();
  if (!db) return res.status(503).json({ success: false, error: 'DB not connected' });
  try {
    const consentStamps = {};
    if (fields.termsAccepted) consentStamps.termsAcceptedAt = new Date();
    if (fields.recordingConsent !== undefined) consentStamps.recordingConsentAt = new Date();

    const doc = await db.collection('users').findOneAndUpdate(
      { uid: req.user.uid },
      {
        $set: { ...fields, ...consentStamps, updatedAt: new Date() },
        $setOnInsert: { uid: req.user.uid, plan: 'free', createdAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );
    res.json({ success: true, profile: toProfile(req.user, doc) });
  } catch (err) {
    console.error('[Me] update:', err.message);
    res.status(500).json({ success: false, error: 'Could not save your profile.' });
  }
});

router.post('/import', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ success: false, error: 'DB not connected' });

  const agile = Array.isArray(req.body && req.body.agileSessions) ? req.body.agileSessions.slice(0, 200) : [];
  const chats = Array.isArray(req.body && req.body.chatSessions) ? req.body.chatSessions.slice(0, 100) : [];
  try {
    const now = new Date();
    const upserts = (items, pick) => items
      .filter(s => s && isSafeId(s.id))
      .map(s => ({
        updateOne: {
          filter: { userId: req.user.uid, id: s.id },
          update: {
            $setOnInsert: { ...pick(s), userId: req.user.uid, id: s.id, serverTimestamp: now, importedAt: now }
          },
          upsert: true
        }
      }));

    const agileOps = upserts(agile, pickAgileSession);
    const chatOps = upserts(chats, pickChatSession);
    if (agileOps.length) await db.collection('agile_sessions').bulkWrite(agileOps, { ordered: false });
    if (chatOps.length) await db.collection('chat_sessions').bulkWrite(chatOps, { ordered: false });
    res.json({ success: true, imported: { agileSessions: agileOps.length, chatSessions: chatOps.length } });
  } catch (err) {
    console.error('[Me] import:', err.message);
    res.status(500).json({ success: false, error: 'Could not import your sessions.' });
  }
});

router.delete('/', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ success: false, error: 'DB not connected' });
  try {
    const deleted = {};
    for (const name of USER_DATA_COLLECTIONS) {
      const r = await db.collection(name).deleteMany({ userId: req.user.uid });
      deleted[name] = r.deletedCount;
    }
    await db.collection('users').deleteOne({ uid: req.user.uid });
    console.log(`[Me] Deleted all data for user ${req.user.uid}`);
    res.json({ success: true, deleted });
  } catch (err) {
    console.error('[Me] delete:', err.message);
    res.status(500).json({ success: false, error: 'Could not delete your data.' });
  }
});

module.exports = router;
