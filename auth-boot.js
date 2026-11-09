/**
 * Loaded first (plain script in <head>) on every app page.
 *
 * 1. Gives each signed-in person their own browser storage keys, so two
 *    people sharing a computer never see each other's sessions.
 * 2. Makes every /api/ request wait until sign-in is ready, then adds the
 *    sign-in token. Existing code keeps calling fetch() as before.
 * 3. Hides the page until we know who is signed in (no flash of someone
 *    else's data, no flash before a redirect to the login page).
 *
 * auth-guard.js finishes the job once Firebase has loaded.
 */
(function () {
  var cachedUid = null;
  try { cachedUid = localStorage.getItem('rabbit_uid'); } catch (e) {}

  var resolveReady;
  var ready = new Promise(function (resolve) { resolveReady = resolve; });

  var RabbitAuth = (window.RabbitAuth = {
    ready: ready,
    cachedUid: cachedUid,
    user: null,
    profile: null,
    getToken: function () { return Promise.resolve(null); },
    onUnauthorized: null,
    _resolveReady: function (value) { resolveReady(value); }
  });

  /** Storage key for the signed-in person, e.g. "AGILE_SAVED_SESSIONS::<uid>". */
  window.rabbitKey = function (base) {
    return base + '::' + (cachedUid || 'signed-out');
  };

  function isApiRequest(input) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    try {
      var u = new URL(url, window.location.href);
      return u.origin === window.location.origin && u.pathname.indexOf('/api/') === 0 && u.pathname !== '/api/auth/config';
    } catch (e) {
      return false;
    }
  }

  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    if (!isApiRequest(input)) return nativeFetch(input, init);
    return ready
      .then(function () { return RabbitAuth.getToken(); })
      .then(function (token) {
        var options = Object.assign({}, init);
        if (token) {
          var headers = new Headers(options.headers || (typeof input !== 'string' && input.headers) || undefined);
          headers.set('Authorization', 'Bearer ' + token);
          options.headers = headers;
        }
        return nativeFetch(input, options);
      })
      .then(function (res) {
        if (res.status === 401 && typeof RabbitAuth.onUnauthorized === 'function') RabbitAuth.onUnauthorized();
        return res;
      });
  };

  // Hide the app until auth-guard.js reveals it
  document.documentElement.classList.add('rabbit-auth-pending');
  var style = document.createElement('style');
  style.textContent =
    'html.rabbit-auth-pending .app-shell{visibility:hidden}' +
    'html.rabbit-auth-pending body{background:#000}';
  document.head.appendChild(style);
})();
