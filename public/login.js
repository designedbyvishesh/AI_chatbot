/**
 * Login page: sign in, create an account, reset a password, and the
 * one-time welcome step.
 */
import {
  loadAuth, waitForUser, rememberUid, forgetUid, nextPage, loadProfile, saveProfile,
  friendlyAuthError
} from './auth-core.js';

const R = window.RabbitAuth;
const $ = (id) => document.getElementById(id);

let ctx = null;
let mode = location.hash === '#signup' ? 'signup' : 'signin';
let selectedRole = '';

/* ─── Views ─── */
function show(view) {
  ['auth', 'reset', 'welcome', 'local'].forEach((v) => { $(`view-${v}`).hidden = v !== view; });
  $('auth-loader').classList.add('is-hidden');
  const focusable = $(`view-${view}`).querySelector('input:not([type=checkbox]), .rabbit-btn--primary');
  if (focusable && view !== 'local') setTimeout(() => focusable.focus(), 50);
}

function setMode(next) {
  mode = next;
  const isSignup = mode === 'signup';
  document.querySelectorAll('[data-only]').forEach((el) => { el.hidden = el.dataset.only !== mode; });
  $('auth-sub').textContent = isSignup ? 'Create your account on' : 'Sign in to';
  $('email-submit').textContent = isSignup ? 'Create account' : 'Sign in';
  $('password-input').autocomplete = isSignup ? 'new-password' : 'current-password';
  $('switch-line').innerHTML = isSignup
    ? 'Already have an account? <button class="rabbit-link rabbit-link--green" type="button" data-switch="signin">Sign in</button>'
    : 'New to Rabbit? <button class="rabbit-link rabbit-link--green" type="button" data-switch="signup">Create an account</button>';
  hideError('auth');
  history.replaceState(null, '', location.pathname + location.search + (isSignup ? '#signup' : ''));
}

function showError(prefix, message) {
  $(`${prefix}-error-text`).textContent = message;
  $(`${prefix}-error`).hidden = false;
}
function hideError(prefix) {
  $(`${prefix}-error`).hidden = true;
}

function setBusy(button, busy, label) {
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="rabbit-spinner"></span>${label || ''}`;
  } else {
    button.disabled = false;
    if (button.dataset.label) button.innerHTML = button.dataset.label;
  }
}

/* ─── After any successful sign-in ─── */
async function afterSignIn(user, prefill = {}) {
  rememberUid(user.uid);
  R.cachedUid = user.uid;
  R.user = user;
  R.getToken = () => (ctx.auth.currentUser ? ctx.auth.currentUser.getIdToken() : Promise.resolve(null));
  R._resolveReady({ uid: user.uid });

  const profile = await loadProfile(user.uid, user);
  if (profile.onboarded) {
    location.replace(nextPage());
    return;
  }
  showWelcome(profile, prefill);
}

function showWelcome(profile, prefill) {
  $('welcome-name').value = prefill.name || profile.name || '';
  $('welcome-college').value = profile.college || '';
  selectRole(profile.role || '');
  $('welcome-age').checked = Boolean(profile.ageConfirmed);
  $('welcome-terms').checked = Boolean(profile.termsAccepted);
  if (profile.termsAccepted) $('welcome-recording').checked = Boolean(profile.recordingConsent);
  show('welcome');
}

function selectRole(role) {
  selectedRole = role;
  $('role-pills').querySelectorAll('.rabbit-pill').forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.role === role)));
}

/* ─── Handlers ─── */
async function onGoogle() {
  hideError('auth');
  const btn = $('google-btn');
  setBusy(btn, true, 'Opening Google…');
  try {
    const provider = new ctx.fb.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const { user } = await ctx.fb.signInWithPopup(ctx.auth, provider);
    await afterSignIn(user);
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
      showError('auth', friendlyAuthError(err));
    }
  } finally {
    setBusy(btn, false);
  }
}

async function onEmailSubmit(e) {
  e.preventDefault();
  hideError('auth');
  const email = $('email-input').value.trim();
  const password = $('password-input').value;
  const name = $('name-input').value.trim();

  if (mode === 'signup' && !name) return showError('auth', 'Enter your name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return showError('auth', 'Enter a valid email address.');
  if (mode === 'signup' && password.length < 8) return showError('auth', 'Use at least 8 characters for your password.');
  if (!password) return showError('auth', 'Enter your password.');

  const btn = $('email-submit');
  setBusy(btn, true, mode === 'signup' ? 'Creating account…' : 'Signing in…');
  try {
    if (mode === 'signup') {
      const { user } = await ctx.fb.createUserWithEmailAndPassword(ctx.auth, email, password);
      await ctx.fb.updateProfile(user, { displayName: name }).catch(() => {});
      ctx.fb.sendEmailVerification(user).catch(() => {});
      await afterSignIn(user, { name });
    } else {
      const { user } = await ctx.fb.signInWithEmailAndPassword(ctx.auth, email, password);
      await afterSignIn(user);
    }
  } catch (err) {
    showError('auth', friendlyAuthError(err));
  } finally {
    setBusy(btn, false);
  }
}

async function onResetSubmit(e) {
  e.preventDefault();
  hideError('reset');
  $('reset-done').hidden = true;
  const email = $('reset-email').value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return showError('reset', 'Enter a valid email address.');

  const btn = $('reset-submit');
  setBusy(btn, true, 'Sending…');
  try {
    await ctx.fb.sendPasswordResetEmail(ctx.auth, email);
    $('reset-done').hidden = false;
  } catch (err) {
    // Don't reveal whether an account exists; only show real problems
    if (err.code === 'auth/user-not-found') $('reset-done').hidden = false;
    else showError('reset', friendlyAuthError(err));
  } finally {
    setBusy(btn, false);
  }
}

async function onWelcomeSubmit(e) {
  e.preventDefault();
  hideError('welcome');
  const name = $('welcome-name').value.trim();
  if (!name) return showError('welcome', 'Tell Rabbit what to call you.');
  if (!$('welcome-age').checked) return showError('welcome', 'Rabbit is only for people 18 and older right now.');
  if (!$('welcome-terms').checked) return showError('welcome', 'Please accept the terms and privacy policy to continue.');

  const btn = $('welcome-submit');
  setBusy(btn, true, 'Saving…');
  const fields = {
    name,
    role: selectedRole || undefined,
    college: $('welcome-college').value.trim(),
    ageConfirmed: true,
    termsAccepted: true,
    recordingConsent: $('welcome-recording').checked
  };
  const result = await saveProfile(R.cachedUid, fields);
  if (!result.ok) {
    setBusy(btn, false);
    return showError('welcome', result.error);
  }
  location.replace(nextPage());
}

async function onSignOut() {
  forgetUid();
  if (ctx.mode === 'firebase') await ctx.fb.signOut(ctx.auth);
  setMode('signin');
  show('auth');
}

/* ─── Start ─── */
async function start() {
  try {
    ctx = await loadAuth();
  } catch (err) {
    console.error('[Login] Could not start sign-in:', err);
    $('auth-loader').classList.add('is-hidden');
    show('auth');
    showError('auth', 'Rabbit could not reach the sign-in service. Check your internet connection and reload.');
    return;
  }

  if (ctx.mode !== 'firebase') {
    R._resolveReady({ uid: 'local-dev' });
    show('local');
    return;
  }

  $('switch-line').addEventListener('click', (e) => { if (e.target.dataset.switch) setMode(e.target.dataset.switch); });
  $('google-btn').addEventListener('click', onGoogle);
  $('email-form').addEventListener('submit', onEmailSubmit);
  $('forgot-btn').addEventListener('click', () => {
    $('reset-email').value = $('email-input').value.trim();
    $('reset-done').hidden = true;
    hideError('reset');
    show('reset');
  });
  $('reset-back').addEventListener('click', () => show('auth'));
  $('reset-form').addEventListener('submit', onResetSubmit);
  $('role-pills').addEventListener('click', (e) => {
    const role = e.target.closest('.rabbit-pill');
    if (role) selectRole(role.dataset.role === selectedRole ? '' : role.dataset.role);
  });
  $('welcome-form').addEventListener('submit', onWelcomeSubmit);
  $('welcome-signout').addEventListener('click', onSignOut);
  $('password-toggle').addEventListener('click', () => {
    const input = $('password-input');
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    $('password-toggle').setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    $('password-toggle').querySelector('.material-symbols-outlined').textContent = showing ? 'visibility' : 'visibility_off';
  });

  setMode(mode);

  const user = await waitForUser(ctx);
  if (user) {
    await afterSignIn(user);
  } else {
    show('auth');
  }
}

start();
