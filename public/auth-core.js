/**
 * Shared sign-in helpers (ES module), used by the login, account and app pages.
 *
 * Loads Firebase Authentication from Google's CDN using the public config the
 * server hands out at /api/auth/config. When the server has no Firebase config
 * (local development), everything runs as one built-in local user.
 */

const FIREBASE_VERSION = '10.12.2';
const cdn = (file) => `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/${file}`;

let loaded = null;

/**
 * @returns {Promise<{mode:'firebase', auth, fb} | {mode:'local'} | {mode:'off'}>}
 */
export function loadAuth() {
  if (loaded) return loaded;
  loaded = (async () => {
    const res = await fetch('/api/auth/config');
    const config = await res.json();
    if (!config.enabled) return { mode: config.local ? 'local' : 'off' };

    const [{ initializeApp }, fb] = await Promise.all([
      import(cdn('firebase-app.js')),
      import(cdn('firebase-auth.js'))
    ]);
    const app = initializeApp(config.firebase);
    const auth = fb.getAuth(app);
    await fb.setPersistence(auth, fb.browserLocalPersistence);
    return { mode: 'firebase', auth, fb };
  })();
  return loaded;
}

/** Resolves with the signed-in Firebase user (or null) once Firebase knows. */
export function waitForUser(ctx) {
  if (ctx.mode !== 'firebase') return Promise.resolve(null);
  return new Promise((resolve) => {
    const stop = ctx.fb.onAuthStateChanged(ctx.auth, (user) => {
      stop();
      resolve(user);
    });
  });
}

export const LOCAL_UID = 'local-dev';

export function rememberUid(uid) {
  try { localStorage.setItem('rabbit_uid', uid); } catch (e) {}
}

export function forgetUid() {
  try { localStorage.removeItem('rabbit_uid'); } catch (e) {}
}

/** Where to go after signing in: the ?next= page if it is one of ours. */
export function nextPage(defaultPage = 'agile.html') {
  const next = new URLSearchParams(location.search).get('next') || '';
  return /^\/?[A-Za-z0-9_-]+\.html([?#].*)?$/.test(next) ? next : defaultPage;
}

export function loginUrl(extra = '') {
  const here = location.pathname.replace(/^\//, '') + location.search;
  return `login.html?next=${encodeURIComponent(here || 'agile.html')}${extra}`;
}

/** Profile fields saved in this browser when the database is not connected. */
export function localProfile(uid) {
  try { return JSON.parse(localStorage.getItem(`rabbit_profile::${uid}`) || '{}'); } catch (e) { return {}; }
}

export function saveLocalProfile(uid, fields) {
  try {
    localStorage.setItem(`rabbit_profile::${uid}`, JSON.stringify({ ...localProfile(uid), ...fields }));
  } catch (e) {}
}

/**
 * Loads the profile from the server, filling gaps from this browser when the
 * database is offline. Always resolves.
 */
export async function loadProfile(uid, fallbackUser) {
  let profile = null;
  let dbConnected = false;
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (data.success) {
      profile = data.profile;
      dbConnected = Boolean(data.db);
    }
  } catch (e) {}

  if (!profile) {
    profile = {
      uid,
      email: (fallbackUser && fallbackUser.email) || '',
      name: (fallbackUser && fallbackUser.displayName) || '',
      photoURL: (fallbackUser && fallbackUser.photoURL) || '',
      plan: 'free'
    };
  }
  if (!dbConnected) {
    profile = { ...profile, ...localProfile(uid) };
    profile.onboarded = Boolean(profile.name && profile.ageConfirmed && profile.termsAccepted);
  }
  profile.dbConnected = dbConnected;
  return profile;
}

/** Saves profile fields to the server, or to this browser when the database is offline. */
export async function saveProfile(uid, fields) {
  saveLocalProfile(uid, fields);
  try {
    const res = await fetch('/api/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) return { ok: true, profile: data.profile };
    if (res.status === 503) return { ok: true, offline: true };
    return { ok: false, error: data.error || 'Could not save. Please try again.' };
  } catch (e) {
    return { ok: true, offline: true };
  }
}

export function firstName(profile) {
  const name = (profile && profile.name) || '';
  return name.trim().split(/\s+/)[0] || '';
}

export function initials(profile) {
  const name = ((profile && (profile.name || profile.email)) || '').trim();
  if (!name) return 'R';
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0] || '')[0] + ((parts[1] || '')[0] || '')).toUpperCase();
}

/** Turns Firebase error codes into plain sentences. */
export function friendlyAuthError(err) {
  const code = (err && err.code) || '';
  const map = {
    'auth/invalid-credential': 'That email and password don’t match. Check them and try again.',
    'auth/wrong-password': 'That email and password don’t match. Check them and try again.',
    'auth/user-not-found': 'There’s no account with that email yet. Create one instead.',
    'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
    'auth/invalid-email': 'That doesn’t look like an email address.',
    'auth/weak-password': 'Use at least 8 characters for your password.',
    'auth/missing-password': 'Enter your password.',
    'auth/too-many-requests': 'Too many tries. Wait a minute, then try again.',
    'auth/network-request-failed': 'No connection. Check your internet and try again.',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site and try again.',
    'auth/requires-recent-login': 'For your safety, sign in again and then retry.',
    'auth/operation-not-allowed': 'This sign-in method is turned off in Firebase. Turn it on under Authentication > Sign-in method.',
    'auth/unauthorized-domain': 'This website address isn’t allowed in Firebase yet. Add it under Authentication > Settings > Authorized domains.'
  };
  return map[code] || 'Something went wrong. Please try again.';
}
