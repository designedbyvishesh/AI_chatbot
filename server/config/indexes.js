/**
 * Indexes so per-user queries stay fast as the data grows. Safe to run on
 * every start: MongoDB skips indexes that already exist.
 */
async function ensureIndexes(db) {
  if (!db) return;
  try {
    await Promise.all([
      db.collection('users').createIndex({ uid: 1 }, { unique: true }),
      db.collection('agile_sessions').createIndex({ userId: 1, id: 1 }),
      db.collection('agile_sessions').createIndex({ userId: 1, serverTimestamp: -1 }),
      db.collection('chat_sessions').createIndex({ userId: 1, id: 1 }),
      db.collection('chat_sessions').createIndex({ userId: 1, serverTimestamp: -1 }),
      db.collection('hierarchy_flows').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('quiz_history').createIndex({ userId: 1, completedAt: -1 })
    ]);
  } catch (err) {
    console.warn('[Indexes] Could not create indexes:', err.message);
  }
}

module.exports = { ensureIndexes };
