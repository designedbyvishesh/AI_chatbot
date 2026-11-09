/**
 * One-time helper: give sessions saved before accounts existed (no userId)
 * to one account.
 *
 *   node scripts/claim-orphan-data.js <firebase-uid>
 *
 * Find your uid on the Account page (it is shown under "Your data") or in the
 * Firebase console under Authentication > Users.
 */
require('dotenv').config();
const { connectDB, closeDB } = require('../server/config/db');

(async () => {
  const uid = process.argv[2];
  if (!uid) {
    console.error('Usage: node scripts/claim-orphan-data.js <firebase-uid>');
    process.exit(1);
  }
  const db = await connectDB();
  if (!db) {
    console.error('Could not connect to MongoDB. Check MONGODB_URI in .env.');
    process.exit(1);
  }
  for (const name of ['agile_sessions', 'chat_sessions', 'hierarchy_flows', 'quiz_history']) {
    const r = await db.collection(name).updateMany({ userId: { $exists: false } }, { $set: { userId: uid } });
    console.log(`${name}: ${r.modifiedCount} record(s) assigned`);
  }
  await closeDB();
})();
