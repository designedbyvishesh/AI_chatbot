/**
 * Sign-in check for every API request (Firebase Authentication).
 *
 * The browser signs in with Firebase and sends its ID token as
 * "Authorization: Bearer <token>". We verify that token here and put the
 * signed-in user on req.user. Only the public project ID is needed to verify
 * tokens, so no service-account key has to live on the server.
 *
 * If Firebase is not configured yet (no FIREBASE_PROJECT_ID), the app runs in
 * "local mode" with one built-in user so development keeps working. Local mode
 * is refused when NODE_ENV=production, so a live site can never run without
 * sign-in by accident.
 */

const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
const AUTH_ENABLED = Boolean(projectId);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const LOCAL_USER = Object.freeze({
  uid: 'local-dev',
  email: '',
  name: '',
  picture: '',
  emailVerified: true,
  provider: 'local',
  local: true
});

if (AUTH_ENABLED) {
  if (!getApps().length) initializeApp({ projectId });
  console.log(`🔐 Sign-in enabled (Firebase project: ${projectId})`);
} else if (IS_PRODUCTION) {
  console.error('❌ FIREBASE_PROJECT_ID is not set. All API requests will be refused until sign-in is configured.');
} else {
  console.warn('⚠️  FIREBASE_PROJECT_ID is not set. Running in local mode with one built-in user (no sign-in).');
}

async function requireUser(req, res, next) {
  if (!AUTH_ENABLED) {
    if (IS_PRODUCTION) {
      return res.status(503).json({ success: false, error: 'Sign-in is not configured on this server.' });
    }
    req.user = LOCAL_USER;
    return next();
  }

  const match = (req.get('Authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ success: false, code: 'auth_required', error: 'Please sign in to continue.' });
  }

  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || '',
      picture: decoded.picture || '',
      emailVerified: Boolean(decoded.email_verified),
      provider: (decoded.firebase && decoded.firebase.sign_in_provider) || ''
    };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, code: 'auth_invalid', error: 'Your sign-in has expired. Please sign in again.' });
  }
}

/** The web config the browser needs to start Firebase. All of it is public by design. */
function publicAuthConfig() {
  if (!AUTH_ENABLED) return { enabled: false, local: !IS_PRODUCTION };
  return {
    enabled: true,
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId,
      appId: process.env.FIREBASE_APP_ID || ''
    }
  };
}

module.exports = { requireUser, publicAuthConfig, AUTH_ENABLED };
