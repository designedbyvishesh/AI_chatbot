/**
 * Runs on every app page (Quiz, Agile, Account).
 *
 * - Sends signed-out visitors to the login page.
 * - Sends people who haven't finished the welcome step back to it.
 * - Shows the person's name, avatar menu and an offer to import sessions
 *   saved in this browser before accounts existed.
 */
import {
  loadAuth, waitForUser, rememberUid, forgetUid, loginUrl, loadProfile,
  firstName, initials, LOCAL_UID
} from './auth-core.js';

const R = window.RabbitAuth;

function reveal() {
  document.documentElement.classList.remove('rabbit-auth-pending');
}

async function start() {
  let ctx;
  try {
    ctx = await loadAuth();
  } catch (e) {
    console.error('[Auth] Could not start sign-in:', e);
    showFatal('Rabbit could not reach the sign-in service. Check your internet connection and reload.');
    return;
  }

  if (ctx.mode === 'off') {
    showFatal('Sign-in is not set up on this server yet.');
    return;
  }

  let uid = LOCAL_UID;
  let fbUser = null;

  if (ctx.mode === 'firebase') {
    fbUser = await waitForUser(ctx);
    if (!fbUser) {
      forgetUid();
      location.replace(loginUrl());
      return;
    }
    uid = fbUser.uid;
    R.user = fbUser;
    R.getToken = () => (ctx.auth.currentUser ? ctx.auth.currentUser.getIdToken() : Promise.resolve(null));
    R.signOut = async () => {
      forgetUid();
      await ctx.fb.signOut(ctx.auth);
      location.replace('login.html');
    };
    R.onUnauthorized = () => {
      if (R._redirecting) return;
      R._redirecting = true;
      location.replace(loginUrl());
    };
  } else {
    R.signOut = null; // nothing to sign out of in local mode
  }

  // A different person signed in on this browser: reload so storage keys match them
  if (R.cachedUid !== uid) {
    rememberUid(uid);
    location.reload();
    return;
  }

  R.mode = ctx.mode;
  R.ctx = ctx;
  R._resolveReady({ uid });

  const profile = await loadProfile(uid, fbUser);
  R.profile = profile;

  if (ctx.mode === 'firebase' && !profile.onboarded) {
    location.replace(loginUrl('#welcome'));
    return;
  }

  applyProfileToPage(profile);
  buildAvatarMenu(profile, ctx.mode);
  reveal();
  window.dispatchEvent(new CustomEvent('rabbit:profile', { detail: profile }));
  offerLegacyImport(uid);
}

/* ─── Name on the dashboard ─── */
function applyProfileToPage(profile) {
  const name = firstName(profile);
  document.querySelectorAll('[data-rabbit-greeting]').forEach((el) => {
    el.textContent = name ? `Hi ${name}` : 'Hi there';
  });
}

/* ─── Avatar + menu in the top bar ─── */
function avatarHtml(profile, size) {
  if (profile.photoURL) {
    return `<img class="rabbit-avatar__img" src="${escapeAttr(profile.photoURL)}" alt="" width="${size}" height="${size}" referrerpolicy="no-referrer" />`;
  }
  return `<span class="rabbit-avatar__initials">${escapeHtml(initials(profile))}</span>`;
}

function buildAvatarMenu(profile, mode) {
  const right = document.querySelector('.topbar__right');
  if (!right || right.querySelector('.rabbit-avatar-wrap')) return;

  // The "⋯" button on the Agile page has no menu of its own; the avatar replaces it
  const moreBtn = document.getElementById('more-btn');
  if (moreBtn && !document.getElementById('dropdown-menu')) moreBtn.style.display = 'none';

  const wrap = document.createElement('div');
  wrap.className = 'rabbit-avatar-wrap';
  wrap.innerHTML = `
    <button class="rabbit-avatar" id="rabbit-avatar-btn" aria-haspopup="menu" aria-expanded="false" title="Your account">
      ${avatarHtml(profile, 32)}
    </button>
    <div class="rabbit-menu" id="rabbit-avatar-menu" role="menu" hidden>
      <div class="rabbit-menu__head">
        <span class="rabbit-avatar rabbit-avatar--lg" aria-hidden="true">${avatarHtml(profile, 40)}</span>
        <span class="rabbit-menu__who">
          <span class="rabbit-menu__name">${escapeHtml(profile.name || 'Your account')}</span>
          <span class="rabbit-menu__email">${escapeHtml(profile.email || (mode === 'local' ? 'Local mode, no sign-in' : ''))}</span>
        </span>
      </div>
      <a class="rabbit-menu__item" role="menuitem" href="account.html">
        <span class="material-symbols-outlined">person</span>Account
      </a>
      ${mode === 'firebase' ? `
      <button class="rabbit-menu__item" role="menuitem" id="rabbit-signout-btn">
        <span class="material-symbols-outlined">logout</span>Sign out
      </button>` : ''}
    </div>`;
  right.appendChild(wrap);

  const btn = wrap.querySelector('#rabbit-avatar-btn');
  const menu = wrap.querySelector('#rabbit-avatar-menu');
  const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  const signOutBtn = wrap.querySelector('#rabbit-signout-btn');
  if (signOutBtn) signOutBtn.addEventListener('click', () => R.signOut && R.signOut());
}

/* ─── Sessions saved in this browser before accounts existed ─── */
const LEGACY_KEYS = { agile: 'AGILE_SAVED_SESSIONS', chat: 'design_chat_sessions' };

export function findLegacySessions() {
  const read = (key) => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v.filter((s) => s && typeof s.id === 'string') : [];
    } catch (e) { return []; }
  };
  return { agile: read(LEGACY_KEYS.agile), chat: read(LEGACY_KEYS.chat) };
}

export async function importLegacySessions() {
  const legacy = findLegacySessions();
  const merge = (base, items) => {
    const key = window.rabbitKey(base);
    let current = [];
    try { current = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
    const ids = new Set(current.map((s) => s.id));
    const merged = [...current, ...items.filter((s) => !ids.has(s.id))];
    localStorage.setItem(key, JSON.stringify(merged));
  };
  merge(LEGACY_KEYS.agile, legacy.agile);
  merge(LEGACY_KEYS.chat, legacy.chat);

  let savedToServer = false;
  try {
    const res = await fetch('/api/me/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agileSessions: legacy.agile, chatSessions: legacy.chat })
    });
    savedToServer = res.ok;
  } catch (e) {}

  // The copies now belong to this account, so the shared browser copy can go
  localStorage.removeItem(LEGACY_KEYS.agile);
  localStorage.removeItem(LEGACY_KEYS.chat);
  localStorage.removeItem('AGILE_TOTAL_SESSIONS_COMPLETED');
  return { count: legacy.agile.length + legacy.chat.length, savedToServer };
}

function offerLegacyImport(uid) {
  const legacy = findLegacySessions();
  const count = legacy.agile.length + legacy.chat.length;
  const dismissKey = `rabbit_import_dismissed::${uid}`;
  if (!count || localStorage.getItem(dismissKey) || location.pathname.endsWith('account.html')) return;

  const card = document.createElement('div');
  card.className = 'rabbit-toast';
  card.setAttribute('role', 'dialog');
  card.innerHTML = `
    <img src="assets/Bunny_Blink_animation.svg" alt="" class="rabbit-toast__bunny" />
    <div class="rabbit-toast__body">
      <div class="rabbit-toast__title">Bring your old sessions along?</div>
      <div class="rabbit-toast__text">This browser has ${count} session${count === 1 ? '' : 's'} saved from before you had an account.</div>
      <div class="rabbit-toast__actions">
        <button class="rabbit-btn rabbit-btn--primary rabbit-btn--sm" data-act="import">Import</button>
        <button class="rabbit-btn rabbit-btn--ghost rabbit-btn--sm" data-act="later">Not now</button>
      </div>
    </div>`;
  document.body.appendChild(card);

  card.addEventListener('click', async (e) => {
    const act = e.target && e.target.getAttribute('data-act');
    if (act === 'later') {
      localStorage.setItem(dismissKey, '1');
      card.remove();
    } else if (act === 'import') {
      e.target.disabled = true;
      e.target.textContent = 'Importing…';
      await importLegacySessions();
      location.reload();
    }
  });
}

/* ─── Helpers ─── */
function showFatal(message) {
  reveal();
  const box = document.createElement('div');
  box.className = 'rabbit-fatal';
  box.innerHTML = `<img src="assets/hidden_Bunny_SVG.svg" alt="" width="72" height="72" /><p>${escapeHtml(message)}</p>`;
  document.body.innerHTML = '';
  document.body.appendChild(box);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const escapeAttr = escapeHtml;

if (!window.__RABBIT_NO_GUARD__) start();
