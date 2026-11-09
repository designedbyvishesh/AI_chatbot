/**
 * Account page: profile, sign-in options, importing old sessions, privacy and
 * deleting the account.
 */
import { saveProfile, initials, forgetUid, friendlyAuthError } from './auth-core.js';
import { findLegacySessions, importLegacySessions } from './auth-guard.js';

const R = window.RabbitAuth;
const $ = (id) => document.getElementById(id);
let profile = null;
let role = '';

window.addEventListener('rabbit:profile', (e) => {
  profile = e.detail;
  render();
  loadCounts();
  wire();
});

function render() {
  const avatar = $('acc-avatar');
  avatar.innerHTML = profile.photoURL
    ? `<img class="rabbit-avatar__img" src="${encodeURI(profile.photoURL)}" alt="" referrerpolicy="no-referrer" />`
    : `<span class="rabbit-avatar__initials"></span>`;
  if (!profile.photoURL) avatar.querySelector('.rabbit-avatar__initials').textContent = initials(profile);

  $('acc-name').textContent = profile.name || 'Your account';
  $('acc-email').textContent = profile.email || (R.mode === 'local' ? 'Local mode, no sign-in' : '');
  $('acc-plan').textContent = profile.plan === 'pro' ? 'Pro plan' : 'Free plan';
  if (profile.createdAt) {
    const since = new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    $('acc-since').textContent = `Member since ${since}`;
  }

  $('pf-name').value = profile.name || '';
  $('pf-college').value = profile.college || '';
  setRole(profile.role || '');
  $('recording-toggle').checked = profile.recordingConsent !== false;

  if (R.mode === 'firebase') {
    $('acc-signout').hidden = false;
    $('sec-signin').hidden = false;
    const isPassword = profile.provider === 'password';
    $('signin-method').textContent = isPassword
      ? `You sign in with your email and a password.`
      : `You sign in with your Google account${profile.email ? ` (${profile.email})` : ''}.`;
    $('password-row').hidden = !isPassword;
    $('verify-row').hidden = !isPassword || profile.emailVerified;
  }

  const legacy = findLegacySessions();
  const count = legacy.agile.length + legacy.chat.length;
  $('sec-import').hidden = count === 0;
  $('import-count').textContent = `${count} session${count === 1 ? '' : 's'} found`;
}

function setRole(next) {
  role = next;
  $('pf-roles').querySelectorAll('.rabbit-pill').forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.role === role)));
}

async function loadCounts() {
  const count = async (url, key, localBase) => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data[key])) return data[key].length;
      }
    } catch (e) {}
    try { return JSON.parse(localStorage.getItem(window.rabbitKey(localBase)) || '[]').length; } catch (e) { return 0; }
  };
  $('acc-agile-count').textContent = await count('/api/agile-sessions', 'sessions', 'AGILE_SAVED_SESSIONS');
  $('acc-quiz-count').textContent = await count('/api/sessions', 'sessions', 'design_chat_sessions');
}

function flashSaved() {
  const note = $('pf-saved');
  note.classList.add('is-visible');
  setTimeout(() => note.classList.remove('is-visible'), 2000);
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;

  $('pf-roles').addEventListener('click', (e) => {
    const pill = e.target.closest('.rabbit-pill');
    if (pill) setRole(pill.dataset.role === role ? '' : pill.dataset.role);
  });

  $('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('pf-error').hidden = true;
    const name = $('pf-name').value.trim();
    if (!name) {
      $('pf-error-text').textContent = 'Enter your name.';
      $('pf-error').hidden = false;
      return;
    }
    const btn = $('pf-save');
    btn.disabled = true;
    const result = await saveProfile(R.cachedUid, { name, role: role || undefined, college: $('pf-college').value.trim() });
    btn.disabled = false;
    if (!result.ok) {
      $('pf-error-text').textContent = result.error;
      $('pf-error').hidden = false;
      return;
    }
    profile = { ...profile, name, role, college: $('pf-college').value.trim() };
    $('acc-name').textContent = name;
    document.querySelectorAll('.rabbit-menu__name').forEach((el) => { el.textContent = name; });
    flashSaved();
  });

  $('recording-toggle').addEventListener('change', async (e) => {
    await saveProfile(R.cachedUid, { recordingConsent: e.target.checked });
  });

  $('import-btn').addEventListener('click', async () => {
    const btn = $('import-btn');
    btn.disabled = true;
    btn.textContent = 'Importing…';
    const { count } = await importLegacySessions();
    $('sec-import').hidden = true;
    loadCounts();
    btn.textContent = `Imported ${count}`;
  });

  $('acc-signout').addEventListener('click', () => R.signOut && R.signOut());

  $('password-btn').addEventListener('click', async () => {
    const btn = $('password-btn');
    btn.disabled = true;
    try {
      await R.ctx.fb.sendPasswordResetEmail(R.ctx.auth, profile.email);
      btn.textContent = 'Email sent';
    } catch (err) {
      btn.disabled = false;
      alert(friendlyAuthError(err));
    }
  });

  $('verify-btn').addEventListener('click', async () => {
    const btn = $('verify-btn');
    btn.disabled = true;
    try {
      await R.ctx.fb.sendEmailVerification(R.ctx.auth.currentUser);
      btn.textContent = 'Email sent';
    } catch (err) {
      btn.disabled = false;
      alert(friendlyAuthError(err));
    }
  });

  // ─── Delete account ───
  const modal = $('delete-modal');
  const input = $('delete-confirm-input');
  const confirmBtn = $('delete-confirm');
  const openModal = () => {
    input.value = '';
    confirmBtn.disabled = true;
    $('delete-error').hidden = true;
    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 50);
  };
  const closeModal = () => { modal.style.display = 'none'; };

  $('delete-btn').addEventListener('click', openModal);
  $('delete-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  input.addEventListener('input', () => { confirmBtn.disabled = input.value.trim().toUpperCase() !== 'DELETE'; });
  confirmBtn.addEventListener('click', deleteAccount);
}

async function deleteAccount() {
  const btn = $('delete-confirm');
  const showErr = (msg) => {
    $('delete-error-text').textContent = msg;
    $('delete-error').hidden = false;
    btn.disabled = false;
    btn.textContent = 'Delete';
  };
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  // 1. Firebase only deletes accounts that signed in recently, so confirm it's you first
  if (R.mode === 'firebase') {
    try {
      const { fb, auth } = R.ctx;
      const user = auth.currentUser;
      if (profile.provider === 'password') {
        const password = prompt('For your safety, enter your password to delete your account.');
        if (!password) return showErr('Account not deleted.');
        await fb.reauthenticateWithCredential(user, fb.EmailAuthProvider.credential(user.email, password));
      } else {
        await fb.reauthenticateWithPopup(user, new fb.GoogleAuthProvider());
      }
    } catch (err) {
      return showErr(friendlyAuthError(err));
    }
  }

  // 2. Delete everything on the server
  try {
    const res = await fetch('/api/me', { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return showErr(res.status === 503
        ? 'Rabbit can’t reach its database right now, so nothing was deleted. Try again in a few minutes.'
        : (data.error || 'Could not delete your data. Try again.'));
    }
  } catch (e) {
    return showErr('No connection. Check your internet and try again.');
  }

  // 3. Delete what this browser kept for this person
  await clearThisBrowser(R.cachedUid);

  // 4. Delete the sign-in itself
  if (R.mode === 'firebase') {
    try { await R.ctx.auth.currentUser.delete(); } catch (e) { await R.ctx.fb.signOut(R.ctx.auth).catch(() => {}); }
  }
  forgetUid();
  location.replace(R.mode === 'firebase' ? 'login.html' : 'agile.html');
}

async function clearThisBrowser(uid) {
  let sessionIds = [];
  try {
    sessionIds = JSON.parse(localStorage.getItem(`AGILE_SAVED_SESSIONS::${uid}`) || '[]').map((s) => s.id).filter(Boolean);
  } catch (e) {}

  ['AGILE_SAVED_SESSIONS', 'AGILE_TOTAL_SESSIONS_COMPLETED', 'design_chat_sessions', 'rabbit_profile', 'rabbit_import_dismissed']
    .forEach((base) => localStorage.removeItem(`${base}::${uid}`));

  if (!sessionIds.length || !window.indexedDB) return;
  await new Promise((resolve) => {
    const req = indexedDB.open('rabbit-agile-recordings', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('audio');
    req.onerror = () => resolve();
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('audio', 'readwrite');
      sessionIds.forEach((id) => tx.objectStore('audio').delete(id));
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    };
  });
}
